-- Add foreign key constraint from leagues to venues
-- This ensures referential integrity: a league can only reference a venue that exists

-- Step 1: Check for orphaned records (optional - for data quality audit)
-- Leagues with venue_id values that don't exist in venues table
-- SELECT leagues.id, leagues.venue_id FROM leagues
-- LEFT JOIN venues ON leagues.venue_id = venues.id
-- WHERE leagues.venue_id IS NOT NULL AND venues.id IS NULL;

-- Step 2: Add the foreign key constraint
ALTER TABLE leagues
ADD CONSTRAINT fk_leagues_venue_id FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;

-- Step 3: Add comment for documentation
COMMENT ON CONSTRAINT fk_leagues_venue_id ON leagues IS 'Foreign key to venues table. If a venue is deleted, the reference is set to NULL.';
