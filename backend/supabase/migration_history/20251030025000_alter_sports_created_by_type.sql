-- Change created_by column from UUID to TEXT to accommodate Clerk user IDs
-- Clerk user IDs have format like "user_34ircvrVcSR9cxBEJxPUMZlxxEQ" which are not valid UUIDs

-- Fix sports table
ALTER TABLE sports
ALTER COLUMN created_by TYPE TEXT;

COMMENT ON COLUMN sports.created_by IS 'Clerk user ID of the user who submitted the sport.';

-- Fix venues table
ALTER TABLE venues
ALTER COLUMN created_by TYPE TEXT;

COMMENT ON COLUMN venues.created_by IS 'Clerk user ID of the user who submitted the venue.';
