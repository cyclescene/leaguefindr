-- Supabase seed script
-- This script runs after migrations to populate the database with test data
-- NOTE: Users must be created in Clerk first, then referenced by their Clerk ID here

-- Insert test sports
INSERT INTO sports (id, name)
VALUES
  (1, 'Basketball'),
  (2, 'Soccer'),
  (3, 'Football'),
  (4, 'Baseball'),
  (5, 'Tennis'),
  (6, 'Hockey'),
  (7, 'Volleyball'),
  (8, 'Badminton')
ON CONFLICT DO NOTHING;

-- Insert test venues
INSERT INTO venues (id, name, address)
VALUES
  (1, 'Central Park', '123 Main St'),
  (2, 'Downtown Arena', '456 Park Ave'),
  (3, 'Riverside Stadium', '789 River Rd'),
  (4, 'Lakeside Courts', '321 Lake Ave'),
  (5, 'Mountain Resort', '654 Peak Ln'),
  (6, 'Beachside Complex', '987 Beach Blvd'),
  (7, 'City Center Hall', '147 Center St'),
  (8, 'Suburban Fields', '258 Suburb Ave')
ON CONFLICT DO NOTHING;

-- Insert test organizations
INSERT INTO organizations (id, org_name, org_email, org_phone_number)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Test Organization', 'org@test.com', '555-0001'),
  ('a0000000-0000-0000-0000-000000000002', 'Demo Sports Club', 'demo@test.com', '555-0002'),
  ('a0000000-0000-0000-0000-000000000003', 'Community League', 'community@test.com', '555-0003')
ON CONFLICT DO NOTHING;

-- Insert test leagues (will use Clerk user ID in real scenario)
-- These are placeholder leagues for testing
INSERT INTO leagues (id, league_name, sport_id, venue_id, org_id, status, season_start_date)
VALUES
  (1, 'Test Basketball League', (SELECT id FROM sports WHERE name = 'Basketball'), (SELECT id FROM venues WHERE name = 'Central Park'), 'a0000000-0000-0000-0000-000000000001', 'approved', CURRENT_DATE),
  (2, 'Test Soccer League', (SELECT id FROM sports WHERE name = 'Soccer'), (SELECT id FROM venues WHERE name = 'Downtown Arena'), 'a0000000-0000-0000-0000-000000000001', 'pending', CURRENT_DATE),
  (3, 'Test Football League', (SELECT id FROM sports WHERE name = 'Football'), (SELECT id FROM venues WHERE name = 'Riverside Stadium'), 'a0000000-0000-0000-0000-000000000002', 'approved', CURRENT_DATE),
  (4, 'Test Tennis League', (SELECT id FROM sports WHERE name = 'Tennis'), (SELECT id FROM venues WHERE name = 'Lakeside Courts'), 'a0000000-0000-0000-0000-000000000002', 'rejected', CURRENT_DATE),
  (5, 'Test Volleyball League', (SELECT id FROM sports WHERE name = 'Volleyball'), (SELECT id FROM venues WHERE name = 'Beachside Complex'), 'a0000000-0000-0000-0000-000000000003', 'approved', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Insert game occurrences for test leagues
INSERT INTO game_occurrences (league_id, day, start_time, end_time)
SELECT
  (SELECT id FROM leagues WHERE league_name = 'Test Basketball League' LIMIT 1),
  'Monday',
  '18:00',
  '20:00'
WHERE NOT EXISTS (SELECT 1 FROM game_occurrences WHERE day = 'Monday' AND start_time = '18:00');

INSERT INTO game_occurrences (league_id, day, start_time, end_time)
SELECT
  (SELECT id FROM leagues WHERE league_name = 'Test Basketball League' LIMIT 1),
  'Wednesday',
  '19:00',
  '21:00'
WHERE NOT EXISTS (SELECT 1 FROM game_occurrences WHERE day = 'Wednesday' AND start_time = '19:00');

INSERT INTO game_occurrences (league_id, day, start_time, end_time)
SELECT
  (SELECT id FROM leagues WHERE league_name = 'Test Soccer League' LIMIT 1),
  'Tuesday',
  '18:30',
  '20:30'
WHERE NOT EXISTS (SELECT 1 FROM game_occurrences WHERE day = 'Tuesday' AND start_time = '18:30');

INSERT INTO game_occurrences (league_id, day, start_time, end_time)
SELECT
  (SELECT id FROM leagues WHERE league_name = 'Test Soccer League' LIMIT 1),
  'Thursday',
  '19:30',
  '21:30'
WHERE NOT EXISTS (SELECT 1 FROM game_occurrences WHERE day = 'Thursday' AND start_time = '19:30');
