-- Fix leagues table schema to match backend expectations
-- Migrate existing data from old schema to new schema

-- Step 1: Migrate game time data to game_occurrences JSONB
-- If game_days, game_start_time, game_end_time exist, combine them into game_occurrences
UPDATE leagues
SET game_occurrences = CASE
  WHEN game_days IS NOT NULL THEN
    jsonb_build_array(
      jsonb_build_object(
        'day', game_days,
        'startTime', to_char(game_start_time, 'HH24:MI'),
        'endTime', to_char(game_end_time, 'HH24:MI')
      )
    )
  ELSE game_occurrences
END
WHERE game_days IS NOT NULL
  AND game_start_time IS NOT NULL
  AND game_end_time IS NOT NULL
  AND (game_occurrences IS NULL OR game_occurrences = '[]'::jsonb);

-- Step 2: Migrate season_fee to pricing_strategy and pricing_amount
-- Assume season_fee was per_team pricing
UPDATE leagues
SET pricing_strategy = 'per_team',
    pricing_amount = season_fee
WHERE season_fee IS NOT NULL
  AND pricing_strategy IS NULL;

-- Step 3: Change created_by column type from uuid to text
-- This allows storing Clerk user IDs like "user_35CgrlnmPbdOXMcrCoSIzHjMEMC"
ALTER TABLE leagues
ALTER COLUMN created_by TYPE text USING created_by::text;

-- Step 4: Remove columns that are no longer needed
ALTER TABLE leagues
DROP COLUMN IF EXISTS age_group,
DROP COLUMN IF EXISTS game_days,
DROP COLUMN IF EXISTS game_start_time,
DROP COLUMN IF EXISTS game_end_time,
DROP COLUMN IF EXISTS season_fee;

-- Step 5: Add comments for clarity
COMMENT ON COLUMN leagues.created_by IS 'Clerk user ID of the user who created the league submission';
COMMENT ON COLUMN leagues.game_occurrences IS 'JSON array of game occurrences: [{day: string, startTime: HH:MM, endTime: HH:MM}]';
