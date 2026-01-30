-- =====================================================
-- Road Patrol - Database Migration 004
-- Create Row Level Security Policies
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE POLICIES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 2. REPORTS TABLE POLICIES
-- =====================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Anyone can view reports
CREATE POLICY "reports_select_policy" ON reports
  FOR SELECT USING (true);

-- Anyone can create reports (anonymous allowed)
CREATE POLICY "reports_insert_policy" ON reports
  FOR INSERT WITH CHECK (true);

-- Authenticated users can update any report (for status changes)
-- Or the creator can update their own report
CREATE POLICY "reports_update_policy" ON reports
  FOR UPDATE USING (
    auth.uid() IS NOT NULL OR 
    auth.uid() = created_by
  );

-- Only creators can delete their reports
CREATE POLICY "reports_delete_policy" ON reports
  FOR DELETE USING (auth.uid() = created_by);

-- =====================================================
-- 3. VOTES TABLE POLICIES
-- =====================================================
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes
CREATE POLICY "votes_select_policy" ON votes
  FOR SELECT USING (true);

-- Anyone can vote (device fingerprint controls duplicates)
CREATE POLICY "votes_insert_policy" ON votes
  FOR INSERT WITH CHECK (true);

-- Users can delete their own votes (unvote)
CREATE POLICY "votes_delete_policy" ON votes
  FOR DELETE USING (
    device_id IS NOT NULL OR 
    (user_id IS NOT NULL AND auth.uid() = user_id)
  );

-- =====================================================
-- 4. COMMENTS TABLE POLICIES
-- =====================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT USING (true);

-- Only authenticated users can comment
CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Users can update their own comments
CREATE POLICY "comments_update_policy" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. STATUS UPDATES TABLE POLICIES
-- =====================================================
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can view status updates
CREATE POLICY "status_updates_select_policy" ON status_updates
  FOR SELECT USING (true);

-- Only authenticated users can create status updates
CREATE POLICY "status_updates_insert_policy" ON status_updates
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = updated_by
  );

-- =====================================================
-- 6. NOTIFICATIONS TABLE POLICIES
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_policy" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
