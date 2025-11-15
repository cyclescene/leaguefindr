-- Add request_count column to venues table
-- This tracks how many users have requested/shown interest in a venue
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS request_count INT DEFAULT 1;

-- Add comment to the new column
COMMENT ON COLUMN venues.request_count IS 'Number of users who have requested this venue';

-- Create index on request_count for faster filtering
CREATE INDEX IF NOT EXISTS idx_venues_request_count ON venues (request_count DESC);

-- Create index on address for fast lookup by address
CREATE INDEX IF NOT EXISTS idx_venues_address ON venues (LOWER(address));
