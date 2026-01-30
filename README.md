# 🚗 Road Patrol

> A Progressive Web App for civic issue reporting - empowering citizens to improve their communities.

![Road Patrol Banner](https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&h=400&fit=crop)

## 🌟 Overview

Road Patrol is a community-driven platform that enables citizens to report, track, and discuss civic road issues like potholes, broken streetlights, damaged signs, and more. Built with modern web technologies, it provides a seamless experience across all devices.

## ✨ Key Features

- 🗺️ **Interactive Map** - Explore issues on an OpenStreetMap-powered interface
- 📸 **Photo Reports** - Capture and geo-tag issues instantly
- 🗳️ **Community Voting** - Prioritize issues through upvotes
- 💬 **Real-time Discussion** - Collaborate on issue threads
- 📱 **PWA Support** - Install on any device, works offline
- 🔔 **Status Tracking** - Follow issues from report to resolution

## 🏗️ Project Structure

```
road-patrol/
├── backend/                 # Supabase backend
│   ├── migrations/          # SQL migration files
│   └── seeds/               # Sample data
├── frontend/                # React PWA
│   ├── public/              # Static assets
│   └── src/                 # Source code
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Google Cloud Console project (for OAuth)

### 1. Clone & Setup

```bash
git clone <repository-url>
cd road-patrol
```

### 2. Backend Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order (see `backend/README.md`)
3. Configure Google OAuth in Supabase dashboard

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 4. Open in Browser

Navigate to `http://localhost:5173`

## 🛠️ Tech Stack

### Frontend
- ⚛️ React 18 with Vite
- 🎨 Tailwind CSS
- 🗺️ React-Leaflet
- 🎬 GSAP Animations
- 📦 Zustand State Management

### Backend
- 🔥 Supabase (PostgreSQL + PostGIS)
- 🔐 Supabase Auth (Google OAuth)
- 📁 Supabase Storage
- ⚡ Supabase Realtime

## 📱 PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline-First**: Works without internet connection
- **Background Sync**: Uploads reports when online
- **Push Notifications**: Status update alerts

## 🔐 Authentication

- Google OAuth for secure sign-in
- Anonymous browsing and voting
- Device fingerprinting for vote limits

## 🗄️ Database Schema

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   profiles  │    │   reports   │    │    votes    │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id          │◄───│ user_id     │    │ report_id   │
│ display_name│    │ title       │◄───│ device_id   │
│ avatar_url  │    │ location    │    │ user_id     │
└─────────────┘    │ photo_url   │    └─────────────┘
                   └─────────────┘
                         │
                         ▼
                   ┌─────────────┐
                   │  comments   │
                   ├─────────────┤
                   │ report_id   │
                   │ user_id     │
                   │ content     │
                   └─────────────┘
```

## 🌐 API Endpoints

The app uses Supabase's auto-generated REST API:

| Endpoint | Description |
|----------|-------------|
| `/profiles` | User profiles |
| `/reports` | Issue reports |
| `/votes` | Report votes |
| `/comments` | Report comments |
| `/rpc/nearby_reports` | Find nearby reports |

## 📸 Screenshots

### Home Map View
View and filter civic issues on an interactive map.

### Report Creation
Multi-step wizard for submitting new issues.

### Report Details
Full issue view with voting and real-time discussion.

### User Profile
Personal dashboard with report statistics.

## 🔧 Configuration

### Environment Variables

```env
# Frontend (.env)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Configuration

1. Enable PostGIS extension
2. Configure Google OAuth provider
3. Create storage bucket for photos
4. Set up Row Level Security policies

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel
```

### Frontend (Netlify)

```bash
cd frontend
npm run build
# Deploy dist/ folder
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guide for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Supabase for backend infrastructure
- Leaflet for map library
- GSAP for animations

---

<p align="center">
  Made with ❤️ for better communities
</p>
