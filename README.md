# Edwin's Feeding Tracker

A modern, mobile-first web application to track baby Edwin's food and milk intake with offline support and automatic sync.

## Features

- **Mobile-First Design**: Optimized for phone and tablet use with glassmorphism UI
- **Offline-First**: Works offline with automatic sync when connection is restored
- **Google Authentication**: Secure login with Google OAuth to track who fed Edwin
- **Quick Entry**: Fast buttons for common amounts (60ml, 90ml, 120ml, 150ml for milk)
- **Custom Entries**: Add custom amounts with date/time and notes
- **Historical Data**: View feeding history with filters (today, week, all)
- **Trends & Charts**: Visualize feeding patterns over time
- **Real-time Sync**: Background sync across multiple devices

## Tech Stack

### Frontend
- **SvelteKit** with static adapter (SSG)
- **TailwindCSS** for styling with custom glassmorphism theme
- **Chart.js** for data visualization
- **IndexedDB** for offline storage (via idb library)
- **Service Workers** for offline functionality

### Backend
- **Node.js** with Express
- **SQLite3** (better-sqlite3) for database
- **Google OAuth 2.0** for authentication
- **JWT** for session management

### Deployment
- **Docker** containers
- **Coolify** on Hostinger

## Project Structure

```
edwin-situmorang-com/
├── frontend/              # SvelteKit application
│   ├── src/
│   │   ├── routes/       # Pages (dashboard, login)
│   │   ├── lib/
│   │   │   ├── components/    # Svelte components
│   │   │   ├── stores/        # State management
│   │   │   └── utils/         # Utilities (API, sync, IndexedDB)
│   │   ├── app.css       # Global styles
│   │   └── service-worker.ts
│   └── static/           # Static assets
│
├── backend/              # Express API server
│   ├── src/
│   │   ├── db/           # Database setup
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth middleware
│   │   └── index.js      # Server entry
│   └── data/             # SQLite database file
│
└── docker-compose.yml    # Deployment configuration
```

## Setup Instructions

### Prerequisites
- Node.js 20+
- npm or yarn
- Google Cloud Console project for OAuth

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-domain.com` (production)
7. Copy the **Client ID**

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your credentials:
# - GOOGLE_CLIENT_ID
# - JWT_SECRET (generate random string)
# - FRONTEND_URL

# Start backend
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add:
# - VITE_GOOGLE_CLIENT_ID (same as backend)
# - VITE_API_URL=http://localhost:3001/api

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the App

Open `http://localhost:5173` in your browser and sign in with Google!

## Deployment to Coolify

### 1. Prepare Environment Variables

In Coolify, set these environment variables:

**Backend:**
- `PORT=3001`
- `NODE_ENV=production`
- `FRONTEND_URL=https://your-frontend-domain.com`
- `GOOGLE_CLIENT_ID=your-client-id`
- `JWT_SECRET=your-secret-key`

**Frontend:**
- `VITE_GOOGLE_CLIENT_ID=your-client-id`
- `VITE_API_URL=https://your-backend-domain.com/api`

### 2. Deploy Backend

```bash
cd backend
docker build -t edwin-tracker-backend .
docker run -p 3001:3001 --env-file .env -v ./data:/app/data edwin-tracker-backend
```

Or use docker-compose:
```bash
docker-compose up -d
```

### 3. Deploy Frontend

```bash
cd frontend
npm install
npm run build
```

Upload the `build/` directory to your static hosting or use Coolify's static site deployment.

### 4. Update Google OAuth

Add your production domains to Google OAuth authorized origins:
- `https://your-domain.com`
- `https://api.your-domain.com`

## Database

The SQLite database is stored at `backend/data/edwin.db`

**Schema:**

**users table:**
- `id` - User ID
- `google_id` - Google OAuth ID
- `email` - User email
- `name` - User name
- `picture` - Profile picture URL
- `created_at` - Account creation timestamp

**feeding_entries table:**
- `id` - Entry ID
- `user_id` - Foreign key to users
- `type` - 'food' or 'milk'
- `quantity_ml` - Amount in milliliters
- `fed_at` - Feeding datetime
- `notes` - Optional notes
- `created_at` - Entry creation timestamp
- `updated_at` - Last update timestamp

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login

### Entries (require authentication)
- `GET /api/entries` - Get all entries
- `GET /api/entries/filter` - Get filtered entries
- `GET /api/entries/stats` - Get statistics
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

## Offline Functionality

The app uses **IndexedDB** for local storage and **Service Workers** for offline caching:

1. When offline, entries are stored in IndexedDB
2. A sync queue tracks unsynced entries
3. When connection is restored, pending entries automatically sync to server
4. Background sync ensures data consistency across devices

## Development

### Frontend Development
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev          # Start with auto-reload
npm start            # Production start
```

## Troubleshooting

### Google Sign-In not working
- Check that `VITE_GOOGLE_CLIENT_ID` matches your Google Console Client ID
- Verify authorized origins in Google Console
- Check browser console for errors

### Offline sync not working
- Ensure Service Worker is registered (check DevTools → Application)
- Check IndexedDB in DevTools → Application → IndexedDB
- Verify network requests in DevTools → Network

### Database errors
- Ensure `backend/data` directory exists
- Check file permissions on `edwin.db`
- Verify SQLite3 is installed correctly

## License

Private project for personal use.

## Support

For issues or questions, contact the developer.
