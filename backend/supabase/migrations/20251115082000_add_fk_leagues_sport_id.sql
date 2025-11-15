-- Add foreign key constraint from leagues to sports
-- This ensures referential integrity: a league can only reference a sport that exists

-- Step 1: Check for orphaned records (optional - for data quality audit)
-- Leagues with sport_id values that don't exist in sports table
-- SELECT leagues.id, leagues.sport_id FROM leagues
-- LEFT JOIN sports ON leagues.sport_id = sports.id
-- WHERE leagues.sport_id IS NOT NULL AND sports.id IS NULL;

-- Step 2: Add the foreign key constraint
ALTER TABLE leagues
ADD CONSTRAINT fk_leagues_sport_id FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL;

-- Step 3: Add comment for documentation
COMMENT ON CONSTRAINT fk_leagues_sport_id ON leagues IS 'Foreign key to sports table. If a sport is deleted, the reference is set to NULL.';
