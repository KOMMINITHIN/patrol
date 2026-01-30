# Road Patrol - Deployment Guide

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- Vercel/Netlify account (for frontend hosting)

## 🏗️ Project Structure

```
hack/
├── frontend/          # React + Vite PWA
│   ├── dist/          # Built production files
│   ├── src/           # Source code
│   └── public/        # Static assets & PWA icons
└── backend/           # Supabase migrations
    ├── migrations/    # SQL migration files
    └── seed/          # Sample data
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/road-patrol.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure:
     - **Framework**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   
3. **Add Environment Variables in Vercel**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_DEFAULT_LAT=12.9716
   VITE_DEFAULT_LNG=77.5946
   VITE_DEFAULT_ZOOM=13
   ```

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Netlify

1. **Build locally**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag & drop the `frontend/dist` folder
   - Or connect GitHub repository

3. **Configure Netlify**
   - Create `netlify.toml` in frontend root:
   ```toml
   [build]
     base = "frontend"
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

4. **Add Environment Variables**
   - Go to Site settings → Build & Deploy → Environment
   - Add the same variables as Vercel

### Option 3: Static Hosting (Firebase, GitHub Pages, etc.)

1. **Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the `dist` folder** to any static hosting service

3. **Important**: Configure SPA redirects (all routes → index.html)

## 🗄️ Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database provisioning

### 2. Run Migrations

Execute these SQL files in order via Supabase SQL Editor:

```bash
backend/migrations/
├── 001_enable_extensions.sql    # Enable PostGIS
├── 002_create_tables.sql        # Create tables
├── 003_create_functions.sql     # Database functions
├── 004_create_policies.sql      # Row Level Security
├── 005_create_storage.sql       # Storage bucket
├── 006_create_triggers.sql      # Triggers
```

**Run each file in the Supabase SQL Editor (Dashboard → SQL Editor)**

### 3. Enable Storage

1. Go to Storage in Supabase Dashboard
2. Create a bucket called `report-photos`
3. Make it public (for serving images)

### 4. Enable Authentication

1. Go to Authentication → Providers
2. Enable Google OAuth:
   - Create OAuth credentials in Google Cloud Console
   - Add Client ID and Secret to Supabase
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 5. Get API Keys

1. Go to Settings → API
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 🔧 Environment Variables

Create `.env` file in `frontend/`:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx

# Map defaults (optional)
VITE_DEFAULT_LAT=12.9716
VITE_DEFAULT_LNG=77.5946
VITE_DEFAULT_ZOOM=13
```

## 📱 PWA Configuration

The app is configured as a Progressive Web App:

- **Offline support**: Service worker caches assets
- **Installable**: Users can install on mobile/desktop
- **Icons**: Located in `public/icons/`
  - icon-192x192.png
  - icon-512x512.png

To test PWA:
1. Deploy to HTTPS
2. Open in Chrome
3. Click install prompt or use Chrome menu → "Install Road Patrol"

## 🔒 Security Checklist

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Supabase anon key is public-safe (read-only operations)
- [ ] Service role key is NEVER exposed to frontend
- [ ] CORS configured for your domain
- [ ] Rate limiting configured in Supabase

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
rm -rf dist
npm run build
```

### Map Not Loading

- Check if Leaflet CSS is loaded
- Verify location permissions

### Auth Not Working

- Check Google OAuth redirect URLs
- Verify Supabase URL/keys are correct
- Check browser console for errors

### Images Not Loading

- Verify storage bucket is public
- Check RLS policies on storage

## 📊 Performance Tips

1. **Enable gzip/brotli** on your hosting provider
2. **Use CDN** for static assets
3. **Configure cache headers**:
   ```
   Cache-Control: public, max-age=31536000 (for assets)
   Cache-Control: no-cache (for index.html)
   ```

## 🔄 CI/CD Pipeline (Optional)

Example GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install & Build
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Support

- **Issues**: Create a GitHub issue
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev/

---

**Built with ❤️ using React, Vite, Supabase, and Tailwind CSS**
