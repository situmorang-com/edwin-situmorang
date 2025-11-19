# Coolify Deployment Guide - Edwin's Feeding Tracker

## Prerequisites

1. ✅ Coolify installed on Hostinger server
2. ✅ Domain names ready:
   - Frontend: `edwin.yourdomain.com`
   - Backend: `api.edwin.yourdomain.com`
3. ✅ Google OAuth configured with production domains

## Part 1: Update Google OAuth for Production

### Step 1: Add Production Domains to Google Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **"Authorized JavaScript origins"**, add:
   - `https://edwin.yourdomain.com` (replace with your actual domain)
4. Click **"SAVE"**
5. Wait 5-10 minutes for changes to propagate

## Part 2: Push Code to Git Repository

### Step 1: Initialize Git (if not done)

```bash
cd /Users/edmundsitumorang/DEV/edwin-situmorang-com

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Edwin's Feeding Tracker"
```

### Step 2: Create GitHub/GitLab Repository

**Option A: GitHub**
1. Go to https://github.com/new
2. Repository name: `edwin-feeding-tracker`
3. Privacy: Private (recommended)
4. Click "Create repository"

**Option B: GitLab**
1. Go to https://gitlab.com/projects/new
2. Project name: `edwin-feeding-tracker`
3. Visibility: Private
4. Click "Create project"

### Step 3: Push to Repository

```bash
# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/edwin-feeding-tracker.git

# Push code
git push -u origin main
```

If it says branch is "master" instead of "main":
```bash
git branch -M main
git push -u origin main
```

## Part 3: Deploy Backend to Coolify

### Step 1: Create New Resource in Coolify

1. Login to your Coolify dashboard
2. Click **"+ New Resource"**
3. Select **"Application"**
4. Choose **"Docker Image"** or **"Git Repository"**

### Step 2: Configure Git Repository (if using Git)

1. Select your Git provider (GitHub/GitLab)
2. Authorize Coolify to access your repository
3. Select `edwin-feeding-tracker` repository
4. Branch: `main`
5. Build pack: **Dockerfile**
6. Dockerfile location: `backend/Dockerfile`
7. Build context: `backend`

### Step 3: Set Environment Variables

In Coolify, add these environment variables:

```bash
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://edwin.yourdomain.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=generate-random-secret-here
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Configure Persistent Storage

1. In Coolify, go to **"Storages"** tab
2. Add new storage:
   - Name: `database`
   - Source: `/var/lib/docker/volumes/edwin-db`
   - Destination: `/app/data`
   - This ensures database persists across deployments

### Step 5: Configure Domain

1. In **"Domains"** tab
2. Add domain: `api.edwin.yourdomain.com`
3. Enable **"Generate SSL certificate"**
4. Port: `3001`

### Step 6: Deploy Backend

1. Click **"Deploy"**
2. Wait for build to complete
3. Check logs for: "🚀 Server running on port 3001"
4. Test health endpoint: `https://api.edwin.yourdomain.com/health`

## Part 4: Deploy Frontend to Coolify

### Step 1: Create Frontend Environment File

Before building, create production .env:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=https://api.edwin.yourdomain.com/api
```

### Step 2: Build Frontend Locally

```bash
cd frontend

# Create production .env
cat > .env << EOF
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=https://api.edwin.yourdomain.com/api
EOF

# Build
npm run build
```

This creates a `frontend/build/` directory with static files.

### Step 3: Deploy Frontend in Coolify

**Option A: Static Site (Recommended)**

1. In Coolify, create **"+ New Resource"**
2. Select **"Static Site"**
3. Choose deployment method:
   - **Git Repository**: Point to your repo, build command: `cd frontend && npm install && npm run build`, publish directory: `frontend/build`
   - **Manual Upload**: Upload the `frontend/build/` directory

4. Set environment variables:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id
   VITE_API_URL=https://api.edwin.yourdomain.com/api
   ```

5. Configure domain:
   - Domain: `edwin.yourdomain.com`
   - Enable SSL

6. Deploy

**Option B: Docker with Nginx**

Create `frontend/Dockerfile.prod`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Part 5: Configure DNS

### In Your Domain Registrar (Hostinger DNS):

Add these A records:
```
A    edwin              -> Your-Server-IP
A    api.edwin          -> Your-Server-IP
```

Or CNAME records if Coolify provides a domain:
```
CNAME    edwin         -> your-coolify-domain.com
CNAME    api.edwin     -> your-coolify-domain.com
```

## Part 6: Test Deployment

### Test Backend:
```bash
curl https://api.edwin.yourdomain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Frontend:
1. Open `https://edwin.yourdomain.com`
2. Should see login page
3. Click "Sign in with Google"
4. Should login successfully
5. Add a test entry
6. Check it saves and appears in history

## Part 7: Setup Automatic Deployments

### In Coolify:

1. Enable **"Auto Deploy"** in both backend and frontend
2. Now when you push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```
3. Coolify automatically rebuilds and deploys!

## Part 8: Database Backup

### Setup Automatic Backups:

Create backup script on server:

```bash
#!/bin/bash
# /root/backup-edwin.sh

BACKUP_DIR="/root/backups/edwin"
DB_PATH="/var/lib/docker/volumes/edwin-db/_data/edwin.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/edwin-$DATE.db'"

# Keep only last 30 days
find $BACKUP_DIR -name "edwin-*.db" -mtime +30 -delete

echo "Backup completed: edwin-$DATE.db"
```

Make it executable:
```bash
chmod +x /root/backup-edwin.sh
```

Add to crontab (daily at 2 AM):
```bash
crontab -e

# Add this line:
0 2 * * * /root/backup-edwin.sh >> /var/log/edwin-backup.log 2>&1
```

## Troubleshooting

### Backend Issues

**Check logs:**
```bash
# In Coolify, click on backend → "Logs" tab
```

**Common issues:**
- Database not persisting: Check volume is mounted correctly
- CORS errors: Verify FRONTEND_URL matches your actual frontend domain
- Auth failing: Check GOOGLE_CLIENT_ID is correct

### Frontend Issues

**Build fails:**
- Check environment variables are set
- Verify `npm run build` works locally first

**Login not working:**
- Check Google Console has production domain
- Verify VITE_API_URL points to correct backend
- Check browser console for errors

### SSL Certificate Issues

- Coolify auto-generates Let's Encrypt certificates
- Make sure DNS is pointing correctly first
- Wait a few minutes for certificate generation

## Summary

Your deployment should now have:

✅ Backend API: `https://api.edwin.yourdomain.com`
✅ Frontend App: `https://edwin.yourdomain.com`
✅ Database: Persistent storage with backups
✅ SSL: Automatic HTTPS
✅ Auto-deploy: Push to Git = automatic deployment

Enjoy tracking Edwin's feeding! 🍼
