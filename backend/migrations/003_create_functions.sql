-- =====================================================
-- Road Patrol - Database Migration 003
-- Create Functions
-- =====================================================

-- =====================================================
-- 1. UPDATE LOCATION COLUMN FUNCTION
-- Automatically populate PostGIS geography from lat/lng
-- =====================================================
CREATE OR REPLACE FUNCTION update_location_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. UPDATE TIMESTAMP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. NEARBY REPORTS FUNCTION (Duplicate Detection)
-- Find reports within specified radius
-- =====================================================
CREATE OR REPLACE FUNCTION nearby_reports(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 50,
  p_category TEXT DEFAULT NULL,
  exclude_resolved BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  photo_url TEXT,
  vote_count INTEGER,
  distance DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.category,
    r.priority,
    r.status,
    r.photo_url,
    r.vote_count,
    ST_Distance(
      r.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) as distance,
    r.created_at
  FROM reports r
  WHERE 
    (NOT exclude_resolved OR r.status != 'resolved')
    AND (p_category IS NULL OR r.category = p_category)
    AND ST_DWithin(
      r.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 4. INCREMENT VOTE COUNT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION increment_vote_count(p_report_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reports
  SET 
    vote_count = vote_count + 1,
    updated_at = NOW()
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. DECREMENT VOTE COUNT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION decrement_vote_count(p_report_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reports
  SET 
    vote_count = GREATEST(0, vote_count - 1),
    updated_at = NOW()
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. INCREMENT VIEW COUNT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION increment_view_count(p_report_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reports
  SET view_count = view_count + 1
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. GET REPORTS IN BOUNDS FUNCTION (Map Viewport)
-- =====================================================
CREATE OR REPLACE FUNCTION get_reports_in_bounds(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION,
  p_status TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 500
)
RETURNS SETOF reports AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM reports
  WHERE 
    latitude BETWEEN min_lat AND max_lat
    AND longitude BETWEEN min_lng AND max_lng
    AND (p_status IS NULL OR status = p_status)
    AND (p_category IS NULL OR category = p_category)
  ORDER BY vote_count DESC, created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 8. CHECK IF DEVICE HAS VOTED FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION has_device_voted(p_report_id UUID, p_device_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM votes 
    WHERE report_id = p_report_id AND device_id = p_device_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 9. GET REPORT STATISTICS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_report_statistics()
RETURNS TABLE (
  total_reports BIGINT,
  open_reports BIGINT,
  in_progress_reports BIGINT,
  resolved_reports BIGINT,
  urgent_reports BIGINT,
  total_votes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_reports,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_reports,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_reports,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_reports,
    COUNT(*) FILTER (WHERE priority = 'urgent')::BIGINT as urgent_reports,
    COALESCE(SUM(vote_count), 0)::BIGINT as total_votes
  FROM reports;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 10. HANDLE NEW USER FUNCTION (Create profile on signup)
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. UPDATE USER STATS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.created_by IS NOT NULL THEN
    UPDATE profiles 
    SET reports_created = reports_created + 1
    WHERE id = NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
