-- Supabase seed script
-- This script runs after migrations to populate the database with test data
-- NOTE: Users referenced here by Clerk ID should already exist in Clerk
-- Test users for development:
--   - user_35rWIpvZ2f8i6CxUIzmn8T5lK6h (admin@leaguefindr.com - admin role)
--   - user_35raGAhxPuvzHrjFhbD93pChpLV (organizer@leaguefindr.com - organizer role)

-- Insert test users (admin and organizer)
INSERT INTO "public"."users" ("id", "email", "role", "last_login", "login_count", "created_at", "updated_at", "is_active")
VALUES
  ('user_35rWIpvZ2f8i6CxUIzmn8T5lK6h', 'admin@leaguefindr.com', 'admin', '2025-12-08 01:19:46.508098', 73, '2025-11-23 03:32:12.877504', '2025-11-23 03:32:12.877504', true),
  ('user_35raGAhxPuvzHrjFhbD93pChpLV', 'organizer@leaguefindr.com', 'organizer', '2025-12-07 22:24:15.177395', 36, '2025-11-23 04:03:40.721979', '2025-11-23 04:03:40.721979', true)
ON CONFLICT (id) DO NOTHING;
