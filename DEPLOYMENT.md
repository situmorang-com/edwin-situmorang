# Deployment Guide for Coolify on Hostinger

## Pre-Deployment Checklist

### 1. Update Google OAuth Settings

Before deploying, add your production domains to Google Console:

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to Credentials → Your OAuth 2.0 Client
4. Under "Authorized JavaScript origins", add:
   - `https://your-domain.com` (your frontend domain)
   - `https://api.your-domain.com` (your backend domain)
5. Save changes

### 2. Prepare Environment Variables

**Backend Environment Variables** (set in Coolify):
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=generate-a-strong-random-secret-here
```

**Frontend Environment Variables** (set in Coolify):
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=https://api.your-domain.com/api
```

**To generate a strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Steps

### Option 1: Deploy with Docker Compose (Recommended)

1. **Push code to Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **In Coolify:**
   - Create new project
   - Select "Docker Compose"
   - Connect your Git repository
   - Set environment variables
   - Deploy!

3. **Configure persistent volume for database:**
   - In Coolify, add volume mapping:
   - Source: `/var/lib/coolify/data/edwin-db`
   - Destination: `/app/data`

### Option 2: Separate Backend and Frontend Deployment

#### Deploy Backend

1. **In Coolify, create new service:**
   - Type: Docker
   - Repository: Your Git repo
   - Build directory: `backend`
   - Dockerfile path: `Dockerfile`

2. **Set environment variables** (listed above)

3. **Configure:**
   - Port: 3001
   - Health check path: `/health`
   - Volume: Map `./data` for database persistence

4. **Deploy**

#### Deploy Frontend

1. **Build frontend locally:**
   ```bash
   cd frontend
   npm run build
   ```

2. **In Coolify, create new service:**
   - Type: Static Site
   - Upload the `build/` directory
   - OR connect Git repo and set build command: `cd frontend && npm install && npm run build`
   - Build directory: `frontend/build`

3. **Set environment variables** (listed above)

4. **Deploy**

### Option 3: Manual Docker Deployment

**Backend:**
```bash
cd backend
docker build -t edwin-tracker-backend .
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://your-domain.com \
  -e GOOGLE_CLIENT_ID=your-client-id \
  -e JWT_SECRET=your-secret \
  --name edwin-backend \
  edwin-tracker-backend
```

**Frontend:**
```bash
cd frontend
npm run build
# Upload build/ directory to static hosting
```

## Post-Deployment

### 1. Test the Application

1. Visit your frontend URL
2. Try logging in with Google
3. Add a test entry
4. Check that it saves and appears in history

### 2. Test Offline Mode

1. Open DevTools → Network
2. Set to "Offline"
3. Add an entry (should work)
4. Set back to "Online"
5. Entry should sync to server

### 3. Test Multi-Device

1. Login from your phone
2. Login from your tablet
3. Add entry on phone
4. Check it appears on tablet

## Monitoring

### Health Checks

Backend health endpoint: `https://api.your-domain.com/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Database Backups

**Backup SQLite database:**
```bash
# On server
cd /path/to/backend/data
sqlite3 edwin.db ".backup edwin-backup-$(date +%Y%m%d).db"
```

**Automated backup script** (add to cron):
```bash
#!/bin/bash
cd /var/lib/coolify/data/edwin-db
sqlite3 edwin.db ".backup edwin-backup-$(date +%Y%m%d).db"
# Keep only last 30 days
find . -name "edwin-backup-*.db" -mtime +30 -delete
```

### Logs

**Backend logs:**
```bash
docker logs edwin-backend
```

**Coolify:**
- Check logs in Coolify dashboard

## Troubleshooting

### Login Issues

**Symptom:** "Authentication failed"
- Check GOOGLE_CLIENT_ID matches in both frontend and backend
- Verify production domains are in Google Console
- Check browser console for errors

### Database Issues

**Symptom:** "Database locked" or "unable to open database"
- Check file permissions on data directory
- Ensure volume is correctly mounted
- Restart backend container

### Sync Issues

**Symptom:** Offline entries not syncing
- Check Service Worker is installed (DevTools → Application)
- Verify VITE_API_URL is correct
- Check network requests in DevTools

### CORS Errors

**Symptom:** "CORS policy" errors in console
- Ensure FRONTEND_URL in backend .env matches actual frontend URL
- Check backend CORS configuration allows your frontend domain

## Updating

### Update Backend

```bash
git pull
cd backend
docker build -t edwin-tracker-backend .
docker stop edwin-backend
docker rm edwin-backend
# Run docker run command again
```

### Update Frontend

```bash
git pull
cd frontend
npm install
npm run build
# Upload new build/ directory
```

## Security Checklist

- [ ] JWT_SECRET is a strong random string
- [ ] Environment variables are set in Coolify (not in code)
- [ ] Google OAuth is configured with correct domains
- [ ] HTTPS is enabled on both frontend and backend
- [ ] Database backups are automated
- [ ] No sensitive data in Git repository

## Performance Optimization

1. **Enable Gzip/Brotli** compression on static files
2. **Set cache headers** for static assets
3. **Configure CDN** if needed (Cloudflare, etc.)
4. **Monitor database size** - SQLite works well up to ~100GB

## Support

For issues:
1. Check logs in Coolify dashboard
2. Test locally first to isolate the issue
3. Verify all environment variables are set correctly
4. Check Google OAuth configuration

---

Your baby feeding tracker is now live! 🎉🍼
