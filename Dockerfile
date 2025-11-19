# Combined Dockerfile for Edwin's Feeding Tracker
# Frontend (SvelteKit) + Backend (Express) in one container

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./

# Build arguments for environment variables
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL=/api

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Production - Backend + Nginx + Frontend
FROM node:20-alpine

# Install nginx, supervisor, and curl for healthcheck
RUN apk add --no-cache nginx supervisor curl

# Setup Backend
WORKDIR /app/backend
COPY backend/package*.json ./

# Install build dependencies for sqlite3
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    && npm install --only=production \
    && apk del .build-deps

COPY backend/src ./src

# Create data directory for SQLite database with proper permissions
RUN mkdir -p /app/backend/data && chmod 777 /app/backend/data

# Copy Frontend build
COPY --from=frontend-builder /frontend/build /usr/share/nginx/html

# Nginx configuration
RUN echo 'user nginx; \
worker_processes auto; \
error_log /var/log/nginx/error.log warn; \
pid /run/nginx.pid; \
\
events { \
    worker_connections 1024; \
} \
\
http { \
    include /etc/nginx/mime.types; \
    default_type application/octet-stream; \
    \
    log_format main "$remote_addr - $remote_user [$time_local] \"$request\" " \
                    "$status $body_bytes_sent \"$http_referer\" " \
                    "\"$http_user_agent\" \"$http_x_forwarded_for\""; \
    \
    access_log /var/log/nginx/access.log main; \
    sendfile on; \
    keepalive_timeout 65; \
    gzip on; \
    \
    server { \
        listen 80; \
        server_name _; \
        root /usr/share/nginx/html; \
        index index.html; \
        \
        # Frontend - SPA fallback \
        location / { \
            try_files $uri $uri/ /index.html; \
        } \
        \
        # Backend API proxy \
        location /api { \
            proxy_pass http://127.0.0.1:3001; \
            proxy_http_version 1.1; \
            proxy_set_header Upgrade $http_upgrade; \
            proxy_set_header Connection "upgrade"; \
            proxy_set_header Host $host; \
            proxy_set_header X-Real-IP $remote_addr; \
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
            proxy_set_header X-Forwarded-Proto $scheme; \
        } \
        \
        # Health check \
        location /health { \
            proxy_pass http://127.0.0.1:3001/health; \
        } \
        \
        # Cache static assets \
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
            expires 1y; \
            add_header Cache-Control "public, immutable"; \
        } \
    } \
}' > /etc/nginx/nginx.conf

# Supervisor configuration to run both nginx and backend
RUN printf '[supervisord]\n\
nodaemon=true\n\
logfile=/var/log/supervisord.log\n\
pidfile=/var/run/supervisord.pid\n\
\n\
[program:nginx]\n\
command=nginx -g "daemon off;"\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
\n\
[program:backend]\n\
command=node /app/backend/src/index.js\n\
directory=/app/backend\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n' > /etc/supervisord.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:80/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
