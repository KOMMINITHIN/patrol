# Road Patrol - Backend Setup

## Supabase Backend Configuration

This folder contains all the database migrations, functions, and policies needed for the Road Patrol application.

## Setup Instructions

### 1. Create a Supabase Project
If you haven't already, your Supabase project is ready at:
- **URL:** `https://cynhljusxwihzeyrtcvm.supabase.co`

### 2. Run Database Migrations

Go to your Supabase Dashboard → SQL Editor and run the migration files in order:

1. `migrations/001_enable_extensions.sql` - Enable PostGIS
2. `migrations/002_create_tables.sql` - Create all tables
3. `migrations/003_create_functions.sql` - Create database functions
4. `migrations/004_create_policies.sql` - Set up RLS policies
5. `migrations/005_create_storage.sql` - Configure storage buckets
6. `migrations/006_create_triggers.sql` - Set up triggers

### 3. Configure Authentication

1. Go to Authentication → Providers
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add redirect URLs:
   - `http://localhost:5173` (development)
   - Your production URL

### 4. Storage Configuration

Storage buckets are created automatically via migration. Ensure:
- `report-photos` bucket exists and is **public**

## File Structure

```
backend/
├── migrations/
│   ├── 001_enable_extensions.sql
│   ├── 002_create_tables.sql
│   ├── 003_create_functions.sql
│   ├── 004_create_policies.sql
│   ├── 005_create_storage.sql
│   └── 006_create_triggers.sql
├── seed/
│   └── sample_data.sql
└── README.md
```
