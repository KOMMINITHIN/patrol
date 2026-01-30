-- =====================================================
-- Road Patrol - Database Migration 006
-- Create Triggers
-- =====================================================

-- =====================================================
-- 1. LOCATION TRIGGER
-- Auto-populate PostGIS geography column
-- =====================================================
DROP TRIGGER IF EXISTS update_reports_location ON reports;
CREATE TRIGGER update_reports_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_location_column();

-- =====================================================
-- 2. UPDATED_AT TRIGGERS
-- Auto-update timestamp on record changes
-- =====================================================

-- Profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Reports updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. NEW USER TRIGGER
-- Auto-create profile when user signs up
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 4. USER STATS TRIGGER
-- Update user report count on new report
-- =====================================================
DROP TRIGGER IF EXISTS update_user_stats_on_report ON reports;
CREATE TRIGGER update_user_stats_on_report
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_user_report_count();

-- =====================================================
-- 5. REALTIME SUBSCRIPTIONS
-- Enable realtime for key tables
-- =====================================================

-- Enable realtime for reports
ALTER PUBLICATION supabase_realtime ADD TABLE reports;

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Enable realtime for votes
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Enable realtime for status_updates
ALTER PUBLICATION supabase_realtime ADD TABLE status_updates;
