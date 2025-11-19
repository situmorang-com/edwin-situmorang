# Coolify Setup on Hostinger - Complete Guide

## Part 1: Get Your Hostinger Server Ready

### Step 1: Access Your Hostinger Server

1. Go to https://hpanel.hostinger.com/
2. Login with your Hostinger credentials
3. Go to **VPS** or **Cloud** section
4. Select your server
5. Click **"SSH Access"** or **"Server Management"**

### Step 2: Get SSH Credentials

You need:
- **Host/IP Address** (e.g., `123.456.789.012`)
- **Port** (usually `22`)
- **Username** (usually `root`)
- **Password** (you set this) or **Private Key**

Save these for later!

### Step 3: Connect via SSH

From your Mac terminal:

```bash
ssh root@YOUR_SERVER_IP
# Replace YOUR_SERVER_IP with your actual IP from Hostinger

# Enter password when prompted
```

Once connected, you should see a prompt like:
```
root@your-server:~#
```

---

## Part 2: Install Coolify on Hostinger

### Step 1: Update Server

```bash
apt update && apt upgrade -y
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify Docker is installed
docker --version
```

### Step 3: Install Coolify

```bash
# Create directory for Coolify
mkdir -p /root/coolify
cd /root/coolify

# Download and run Coolify installation
curl -fsSL https://get.coollabs.io/docker-compose.yml -o docker-compose.yml

# Start Coolify
docker compose up -d

# Check if it's running
docker compose ps
```

### Step 4: Get Coolify Initial Setup

```bash
# Get the initial setup URL and token
docker compose logs coolify
```

Look for a line like:
```
coolify | Navigate to: http://YOUR_SERVER_IP:3000
```

---

## Part 3: Setup Coolify Dashboard

### Step 1: Access Coolify

1. Open browser: `http://YOUR_SERVER_IP:3000`
   - Replace `YOUR_SERVER_IP` with your actual server IP
2. You'll see Coolify setup page

### Step 2: Create Admin Account

1. Create username and password
2. Click **"Let's go!"**

### Step 3: Connect Docker

1. Coolify will ask about Docker
2. Select **"Docker Socket"** (local)
3. Click **"Continue"**

### Step 4: Setup Domain for Coolify

1. Coolify will ask for a domain
2. You can use: `coolify.youromain.com`
3. Or just use your server IP for now

---

## Part 4: Setup Reverse Proxy (Caddy)

Coolify uses Caddy automatically, but you need to configure ports.

### Step 1: Open Firewall Ports

```bash
# Allow necessary ports
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw enable
```

### Step 2: Configure Caddy (Auto-managed by Coolify)

Coolify automatically manages Caddy. When you add a domain in Coolify, it:
1. ✅ Creates Caddy config
2. ✅ Gets SSL certificate (Let's Encrypt)
3. ✅ Forwards traffic to your app

---

## Part 5: Configure DNS on Hostinger

### Step 1: Get Your Server IP

From Hostinger dashboard or SSH terminal:
```bash
hostname -I
```

This shows your server's IP address.

### Step 2: Add DNS Records in Hostinger

1. Go to https://hpanel.hostinger.com/
2. Select your domain
3. Go to **DNS Settings**
4. Add these A records:

```
Type: A
Name: edwin
Points to: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: api.edwin
Points to: YOUR_SERVER_IP
TTL: 3600
```

**Example:**
```
edwin.situmorang.com → 123.456.789.012
api.edwin.situmorang.com → 123.456.789.012
```

Wait 5-10 minutes for DNS to propagate.

### Step 3: Verify DNS

```bash
# From your Mac terminal
nslookup edwin.situmorang.com
nslookup api.edwin.situmorang.com

# Should show your server IP
```

---

## Part 6: Connect GitHub to Coolify

### Step 1: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Classic"**
3. Name: `Coolify`
4. Scopes: Check **"repo"**
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)

### Step 2: Connect in Coolify

1. In Coolify dashboard: **"Integrations"** or **"Settings"**
2. Look for **"Git"** or **"GitHub"**
3. Paste your GitHub token
4. Click **"Connect"**

---

## Part 7: Deploy Backend

### Step 1: Create New Application in Coolify

1. In Coolify dashboard: **"+ New Resource"**
2. Select **"Application"**
3. Choose **"Git Repository"**
4. Select your GitHub repository: `edwin-feeding-tracker`

### Step 2: Configure Backend

```
Repository: https://github.com/YOUR_USERNAME/edwin-feeding-tracker
Branch: main
Build Pack: Docker
Base Directory: backend
Port: 3001
```

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://edwin.situmorang.com
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
JWT_SECRET=generate-random-secret
```

**Generate JWT_SECRET:**
```bash
# Run this in terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Add Persistent Storage

Click **"Persistent Storage"** and add:
```
Name: app-data
Source: /data/edwin-db
Destination: /app/data
```

### Step 5: Set Domain

Click **"Domains"** and add:
```
Domain: api.edwin.situmorang.com
Port: 3001
```

### Step 6: Deploy

Click **"Deploy"** button and wait for build to complete.

Check logs to verify:
```
🚀 Server running on port 3001
Database initialized successfully
```

---

## Part 8: Deploy Frontend

### Step 1: Create Frontend Docker Image

Create `frontend/Dockerfile.prod` (already done):

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

### Step 2: Create New Application in Coolify

1. **"+ New Resource"** → **"Application"**
2. **"Git Repository"** → same repo
3. Configure:

```
Repository: https://github.com/YOUR_USERNAME/edwin-feeding-tracker
Branch: main
Build Pack: Docker
Base Directory: frontend
Dockerfile Path: Dockerfile.prod
Port: 80
```

### Step 3: Add Build Arguments (not env variables!)

In **"Advanced"** → **"Docker"** → **"Custom Build Arguments"**:

```
--build-arg VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
--build-arg VITE_API_URL=https://api.edwin.situmorang.com/api
```

### Step 4: Set Domain

```
Domain: edwin.situmorang.com
Port: 80
```

### Step 5: Deploy

Click **"Deploy"** and wait for build.

---

## Part 9: Test Your Deployment

### Test Backend API

```bash
curl https://api.edwin.situmorang.com/health
```

Expected response:
```json
{"status":"healthy","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Test Frontend

1. Open `https://edwin.situmorang.com`
2. Should see login page
3. Click "Sign in with Google"
4. Add a test feeding entry
5. Verify it saves

---

## Part 10: Enable Auto-Deployments

### In Coolify

For both backend and frontend:

1. Click the app
2. Go to **"Advanced"**
3. Enable **"Auto Deploy on Push"**

Now when you push to GitHub:
```bash
git add .
git commit -m "New feature"
git push
```

Coolify automatically rebuilds and deploys! 🚀

---

## Troubleshooting

### Can't connect to server
```bash
# Check SSH connection
ssh root@YOUR_SERVER_IP

# If SSH fails, check Hostinger firewall settings
```

### Coolify not accessible
```bash
# Check if Docker is running
docker ps

# Restart Coolify
cd /root/coolify
docker compose restart
```

### Domain not working
- Wait 10-15 minutes for DNS propagation
- Check DNS records in Hostinger
- Verify firewall allows ports 80 and 443

### Backend deployment fails
- Check logs in Coolify → App → Logs
- Verify environment variables are set
- Check Docker build context is `backend`

### Frontend not loading
- Check browser console for errors
- Verify VITE_API_URL points to correct backend
- Check Nginx logs in Coolify

---

## Quick Reference

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# View Coolify logs
cd /root/coolify && docker compose logs -f

# Check Docker containers
docker ps

# Stop everything
cd /root/coolify && docker compose down

# Restart everything
cd /root/coolify && docker compose up -d
```

---

Done! Your Edwin's Feeding Tracker is now live on your Hostinger server! 🎉🍼
