-- Supabase seed script
-- This script runs after migrations to populate the database with test data
-- NOTE: Users referenced here by Clerk ID should already exist in Clerk
-- Test users for development:
--   - user_35iIVMkUqxuqPTDHYexjBwqh7Ah (admin role)
--   - user_35iIZO05zFhiy51Zsj4QLTYxpzQ (organizer role)

-- Insert test users (admin and organizer)
INSERT INTO "public"."users" ("id", "email", "role", "last_login", "login_count", "created_at", "updated_at", "is_active")
VALUES
  ('user_35iIVMkUqxuqPTDHYexjBwqh7Ah', 'test@test.com', 'admin', null, '0', '2025-11-19 21:08:08.57761', '2025-11-19 21:08:08.57761', 'true'),
  ('user_35iIZO05zFhiy51Zsj4QLTYxpzQ', 'test2@test.com', 'organizer', null, '0', '2025-11-19 21:08:40.576894', '2025-11-19 21:08:40.576894', 'true')
ON CONFLICT (id) DO NOTHING;

-- Insert test sports (auto-increment ID)
INSERT INTO sports (name)
VALUES
  ('Basketball'),
  ('Soccer'),
  ('Football'),
  ('Baseball'),
  ('Tennis'),
  ('Hockey'),
  ('Volleyball'),
  ('Badminton')
ON CONFLICT (name) DO NOTHING;

-- Insert test venues (auto-increment ID)
INSERT INTO venues (name, address)
VALUES
  ('Central Park', '123 Main St'),
  ('Downtown Arena', '456 Park Ave'),
  ('Riverside Stadium', '789 River Rd'),
  ('Lakeside Courts', '321 Lake Ave'),
  ('Mountain Resort', '654 Peak Ln'),
  ('Beachside Complex', '987 Beach Blvd'),
  ('City Center Hall', '147 Center St'),
  ('Suburban Fields', '258 Suburb Ave')
ON CONFLICT (name) DO NOTHING;

-- Insert test organizations
INSERT INTO organizations (id, org_name, org_email, org_phone_number)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Test Organization', 'org@test.com', '555-0001'),
  ('a0000000-0000-0000-0000-000000000002', 'Demo Sports Club', 'demo@test.com', '555-0002'),
  ('a0000000-0000-0000-0000-000000000003', 'Community League', 'community@test.com', '555-0003')
ON CONFLICT DO NOTHING;

-- Insert test leagues (auto-generate UUID ID)
-- These are placeholder leagues for testing
INSERT INTO leagues (league_name, sport_id, venue_id, org_id, status, season_start_date, created_by, pricing_strategy, pricing_amount)
VALUES
  ('Test Basketball League', (SELECT id FROM sports WHERE name = 'Basketball'), (SELECT id FROM venues WHERE name = 'Central Park'), 'a0000000-0000-0000-0000-000000000001', 'approved', CURRENT_DATE, 'user_35iIVMkUqxuqPTDHYexjBwqh7Ah', 'per_team', 500.00),
  ('Test Soccer League', (SELECT id FROM sports WHERE name = 'Soccer'), (SELECT id FROM venues WHERE name = 'Downtown Arena'), 'a0000000-0000-0000-0000-000000000001', 'pending', CURRENT_DATE, 'user_35iIZO05zFhiy51Zsj4QLTYxpzQ', 'per_team', 450.00),
  ('Test Football League', (SELECT id FROM sports WHERE name = 'Football'), (SELECT id FROM venues WHERE name = 'Riverside Stadium'), 'a0000000-0000-0000-0000-000000000002', 'approved', CURRENT_DATE, 'user_35iIVMkUqxuqPTDHYexjBwqh7Ah', 'per_person', 75.00),
  ('Test Tennis League', (SELECT id FROM sports WHERE name = 'Tennis'), (SELECT id FROM venues WHERE name = 'Lakeside Courts'), 'a0000000-0000-0000-0000-000000000002', 'rejected', CURRENT_DATE, 'user_35iIZO05zFhiy51Zsj4QLTYxpzQ', 'per_team', 300.00),
  ('Test Volleyball League', (SELECT id FROM sports WHERE name = 'Volleyball'), (SELECT id FROM venues WHERE name = 'Beachside Complex'), 'a0000000-0000-0000-0000-000000000003', 'approved', CURRENT_DATE, 'user_35iIVMkUqxuqPTDHYexjBwqh7Ah', 'per_person', 50.00)
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

-- Insert test league drafts and templates
INSERT INTO leagues_drafts (org_id, type, name, form_data, created_by)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'draft', 'Basketball Draft', '{"league_name": "Future Basketball", "sport_name": "Basketball"}', 'user_35iIZO05zFhiy51Zsj4QLTYxpzQ'),
  ('a0000000-0000-0000-0000-000000000001', 'template', 'Basketball Template', '{"league_name": "Basketball Template", "sport_name": "Basketball", "pricing_strategy": "per_team", "pricing_amount": 500}', 'user_35iIVMkUqxuqPTDHYexjBwqh7Ah'),
  ('a0000000-0000-0000-0000-000000000002', 'draft', 'Soccer Draft', '{"league_name": "Future Soccer", "sport_name": "Soccer"}', 'user_35iIVMkUqxuqPTDHYexjBwqh7Ah'),
  ('a0000000-0000-0000-0000-000000000003', 'template', 'Tennis Template', '{"league_name": "Tennis Template", "sport_name": "Tennis"}', 'user_35iIZO05zFhiy51Zsj4QLTYxpzQ')
ON CONFLICT (org_id, type) DO NOTHING;

-- Add test users to organizations
INSERT INTO user_organizations (user_id, org_id, role_in_org, is_active)
VALUES
  ('user_35iIVMkUqxuqPTDHYexjBwqh7Ah', 'a0000000-0000-0000-0000-000000000001', 'owner', true),
  ('user_35iIZO05zFhiy51Zsj4QLTYxpzQ', 'a0000000-0000-0000-0000-000000000001', 'member', true),
  ('user_35iIVMkUqxuqPTDHYexjBwqh7Ah', 'a0000000-0000-0000-0000-000000000002', 'owner', true),
  ('user_35iIZO05zFhiy51Zsj4QLTYxpzQ', 'a0000000-0000-0000-0000-000000000002', 'member', true),
  ('user_35iIVMkUqxuqPTDHYexjBwqh7Ah', 'a0000000-0000-0000-0000-000000000003', 'member', true),
  ('user_35iIZO05zFhiy51Zsj4QLTYxpzQ', 'a0000000-0000-0000-0000-000000000003', 'owner', true)
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Add notification preferences for test users
INSERT INTO notification_preferences (user_id, league_approved, league_rejected, league_submitted, draft_saved, template_saved)
VALUES
  ('user_35iIVMkUqxuqPTDHYexjBwqh7Ah', true, true, true, true, true),
  ('user_35iIZO05zFhiy51Zsj4QLTYxpzQ', true, true, true, true, true)
ON CONFLICT (user_id) DO NOTHING;
