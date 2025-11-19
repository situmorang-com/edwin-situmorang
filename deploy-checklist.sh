#!/bin/bash

echo "🚀 Edwin's Feeding Tracker - Deployment Checklist"
echo "=================================================="
echo ""

# Check if .env files exist
echo "✓ Checking environment files..."
if [ ! -f backend/.env ]; then
    echo "❌ backend/.env not found!"
    exit 1
fi

if [ ! -f frontend/.env ]; then
    echo "❌ frontend/.env not found!"
    exit 1
fi

echo "✅ Environment files exist"
echo ""

# Check if Git is initialized
echo "✓ Checking Git repository..."
if [ ! -d .git ]; then
    echo "⚠️  Git not initialized. Initializing now..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository exists"
fi

echo ""
echo "📋 Pre-deployment Checklist:"
echo ""
echo "1. ✅ Code is ready"
echo "2. [ ] Update Google OAuth with production domains"
echo "    - Go to: https://console.cloud.google.com/apis/credentials"
echo "    - Add: https://your-domain.com to authorized origins"
echo ""
echo "3. [ ] Prepare production domains:"
echo "    - Frontend: edwin.yourdomain.com"
echo "    - Backend: api.edwin.yourdomain.com"
echo ""
echo "4. [ ] Create Git repository (GitHub/GitLab)"
echo ""
echo "5. [ ] Update environment variables for production:"
echo "    Backend:"
echo "      - FRONTEND_URL=https://edwin.yourdomain.com"
echo "      - GOOGLE_CLIENT_ID=(your client ID)"
echo "      - JWT_SECRET=(generate new secret)"
echo ""
echo "    Frontend:"
echo "      - VITE_GOOGLE_CLIENT_ID=(same as backend)"
echo "      - VITE_API_URL=https://api.edwin.yourdomain.com/api"
echo ""
echo "6. [ ] Configure Coolify with these settings"
echo ""
echo "Ready to commit? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Creating Git commit..."
    git add .
    git commit -m "Deploy Edwin's Feeding Tracker to Coolify"
    echo "✅ Commit created"
    echo ""
    echo "Next steps:"
    echo "1. Create repository on GitHub/GitLab"
    echo "2. Run: git remote add origin YOUR_REPO_URL"
    echo "3. Run: git push -u origin main"
    echo "4. Configure Coolify following COOLIFY_SETUP.md"
else
    echo "Cancelled. Run this script again when ready to commit."
fi
