-- Enable realtime for essential tables
-- This migration enables PostgreSQL logical replication (Supabase Realtime) for the following tables:
-- - leagues: For real-time updates to league submissions
-- - leagues_drafts: For real-time updates to drafts and templates
-- - sports: For real-time updates to sports
-- - venues: For real-time updates to venues
-- - organizations: For real-time updates to organizations
-- - users: For real-time updates to user data

BEGIN;

-- Enable realtime for leagues table
-- Using DO block to catch any errors if already enabled
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE leagues;
EXCEPTION WHEN duplicate_object THEN
  -- Table already published, ignore
  NULL;
END
$$;

-- Enable realtime for leagues_drafts table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE leagues_drafts;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

-- Enable realtime for sports table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sports;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

-- Enable realtime for venues table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE venues;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

-- Enable realtime for organizations table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

-- Enable realtime for users table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE users;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

COMMIT;
