-- =====================================================
-- Road Patrol - Database Migration 001
-- Enable Required Extensions
-- =====================================================

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search (future use)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
