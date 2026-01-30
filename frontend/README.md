# Road Patrol - Frontend

A Progressive Web App (PWA) for civic issue reporting built with React, Vite, and Tailwind CSS.

## UI Overview

The app features a **map-centric design** with:
- **Full-screen map** as the main view (always visible)
- **Hidden glassmorphic sidebar** that appears on left-edge hover
- **Three navigation icons:**
  1. 📋 **Reports** - Create reports + Community feed
  2. 💬 **Chat** - Global community chat (real-time)
  3. 👤 **Profile** - Account settings & your reports
- **Smooth slide-in panels** with glass-like transparent styling
- **Real-time updates** for reports and chat messages

## Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool with PWA plugin
- **Tailwind CSS 3** - Utility-first styling
- **GSAP 3** - Animations
- **React-Leaflet** - Map integration
- **Zustand** - State management
- **Supabase** - Backend services (real-time subscriptions)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project (see backend folder)

### Installation

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your Supabase credentials
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── public/
│   ├── icons/              # PWA icons
│   ├── favicon.svg         # App icon
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/
│   │   ├── common/         # Shared components
│   │   ├── layout/         # Layout components
│   │   ├── map/            # Map components
│   │   └── reports/        # Report components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── services/           # API & Supabase services
│   ├── stores/             # Zustand stores
│   ├── utils/              # Utility functions
│   ├── App.jsx             # App component with routing
│   ├── index.css           # Global styles
│   └── main.jsx            # Entry point
├── .env.example            # Environment template
├── index.html              # HTML template
├── package.json            # Dependencies
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind config
└── vite.config.js          # Vite config
```

## Features

### Core Features

- 📍 **Map-Based Exploration** - View issues on an interactive map
- 📸 **Photo Reporting** - Capture and upload issue photos
- 🗳️ **Voting System** - Device-limited upvoting
- 💬 **Real-time Chat** - Discussion threads on reports
- 🔔 **Status Updates** - Track issue resolution

### PWA Features

- 📱 **Installable** - Add to home screen
- 🔄 **Offline Support** - Works without internet
- 🚀 **Fast Loading** - Cached assets
- 📲 **Push Notifications** - Status update alerts

### Technical Features

- 🎨 **GSAP Animations** - Smooth UI transitions
- 🗺️ **Leaflet Maps** - OpenStreetMap integration
- 🔐 **Google OAuth** - Secure authentication
- 📱 **Responsive Design** - Mobile-first approach

## Key Components

### Pages

- `Home` - Map view with report markers and filtering
- `CreateReport` - Multi-step report creation wizard
- `ReportDetails` - Full report view with voting and comments
- `Profile` - User profile and settings
- `Login` - Google OAuth sign-in

### Services

- `supabase.js` - Supabase client initialization
- `auth.js` - Authentication operations
- `reports.js` - Report CRUD and queries
- `votes.js` - Voting with device fingerprinting
- `comments.js` - Real-time comments
- `geolocation.js` - GPS and geocoding

### Stores (Zustand)

- `authStore.js` - User authentication state
- `reportStore.js` - Reports and filters

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## PWA Configuration

The app uses `vite-plugin-pwa` for service worker generation:

- **Cache Strategy**: StaleWhileRevalidate for API calls
- **Precache**: All static assets
- **Offline**: Fallback to cached data

### Generating Icons

See `public/icons/README.md` for icon generation instructions.

## Styling

Tailwind CSS with custom configuration:

- Custom colors (primary, success, warning, danger)
- Custom shadows and border-radius
- Animation utilities
- Responsive breakpoints

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build
npm run lint         # Run ESLint
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build command
npm run build

# Publish directory
dist
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
