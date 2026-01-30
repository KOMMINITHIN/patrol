-- =====================================================
-- Road Patrol - Sample Data
-- Run this AFTER all migrations to add test data
-- =====================================================

-- Sample reports (San Francisco area)
INSERT INTO reports (title, description, category, priority, latitude, longitude, address, photo_url, status, device_id, vote_count, view_count)
VALUES
  (
    'Large pothole on Market Street',
    'Deep pothole near the intersection with 5th Street. Multiple cars have reported damage. This needs immediate attention.',
    'pothole',
    'urgent',
    37.7839,
    -122.4074,
    'Market St & 5th St, San Francisco, CA',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
    'open',
    'demo-device-001',
    23,
    127
  ),
  (
    'Overflowing trash bins at Mission Dolores Park',
    'The trash bins near the playground have been overflowing for 3 days. Attracting pests.',
    'trash',
    'high',
    37.7598,
    -122.4269,
    'Mission Dolores Park, San Francisco, CA',
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
    'open',
    'demo-device-002',
    15,
    89
  ),
  (
    'Broken streetlight on Valencia Street',
    'Streetlight has been out for a week. The area is very dark at night, creating safety concerns.',
    'streetlight',
    'medium',
    37.7583,
    -122.4212,
    '18th St & Valencia St, San Francisco, CA',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'in_progress',
    'demo-device-003',
    8,
    45
  ),
  (
    'Road damage after water main break',
    'The road surface has buckled after the recent water main repair. Causing vehicles to swerve.',
    'road_damage',
    'high',
    37.7749,
    -122.4194,
    'Hayes St, San Francisco, CA',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
    'open',
    'demo-device-004',
    19,
    156
  ),
  (
    'Graffiti on public library wall',
    'Offensive graffiti appeared overnight on the side of the branch library.',
    'graffiti',
    'low',
    37.7852,
    -122.4086,
    'Main Library, San Francisco, CA',
    'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=800',
    'resolved',
    'demo-device-005',
    5,
    32
  );

-- Note: Sample votes and comments would require actual user IDs
-- For demo purposes, the vote_count is pre-set in the reports
