# Quick Start Guide - Edwin's Feeding Tracker

## Prerequisites

1. **Google OAuth Setup** (Required before running!)
   - Go to https://console.cloud.google.com/
   - Create a new project
   - Enable "Google+ API" 
   - Go to Credentials → Create OAuth 2.0 Client ID
   - Add authorized origins:
     - `http://localhost:5173` (for development)
   - Copy your **Client ID**

## Step 1: Configure Backend

```bash
cd backend

# Create .env file from example
cp .env.example .env

# Edit .env and set:
# - GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
# - JWT_SECRET=any-random-secret-string-here
nano .env  # or use your favorite editor
```

## Step 2: Configure Frontend

```bash
cd ../frontend

# Create .env file from example
cp .env.example .env

# Edit .env and set:
# - VITE_GOOGLE_CLIENT_ID=same-client-id-as-backend
# - VITE_API_URL=http://localhost:3001/api
nano .env  # or use your favorite editor
```

## Step 3: Start Backend

```bash
cd ../backend
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📊 Health check: http://localhost:3001/health
🔐 Auth endpoint: http://localhost:3001/api/auth
📝 Entries endpoint: http://localhost:3001/api/entries
Database initialized successfully
```

## Step 4: Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE vX.X.X  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 5: Open the App

1. Open browser to http://localhost:5173
2. Click "Sign in with Google"
3. Authorize with your Google account
4. Start tracking Edwin's feeding!

## Quick Test

1. Click on "🍼 Milk" button
2. Click a quick amount (e.g., "120 ml")
3. Entry should appear in the history below
4. Try going offline (disconnect wifi) and add another entry
5. Reconnect - it should auto-sync!

## Features to Try

- **Quick Entry**: Tap Milk or Food → tap a quick amount
- **Custom Entry**: Tap Milk/Food → enter custom amount with notes
- **View History**: Filter by Today/Week/All
- **See Trends**: Check the chart showing daily intake
- **Offline Mode**: Works without internet, syncs when reconnected
- **Multi-device**: Login from phone and tablet - data syncs across both

## Troubleshooting

**"Login failed"**
- Make sure GOOGLE_CLIENT_ID is correct in both .env files
- Check that localhost:5173 is in Google Console authorized origins

**"Network error"**
- Backend must be running on port 3001
- Check VITE_API_URL in frontend/.env

**"Database error"**
- Make sure backend/data directory exists
- Check file permissions

## Next Steps

1. **Deploy to Coolify**: See README.md for deployment instructions
2. **Customize**: Adjust colors in tailwind.config.js
3. **Add features**: Check backend/src/routes for API endpoints

## File Structure

```
edwin-situmorang-com/
├── backend/           # API server (port 3001)
│   ├── .env          # Backend config (you create this)
│   ├── src/          # Source code
│   └── data/         # SQLite database
├── frontend/         # Web app (port 5173)
│   ├── .env          # Frontend config (you create this)
│   └── src/          # Source code
└── README.md         # Full documentation
```

Enjoy tracking Edwin's feeding! 🍼
