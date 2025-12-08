-- Fix sequences after CSV imports
-- CSV imports can reset sequences to low values, causing new records to overwrite existing ones
-- This migration forcefully resets both sequences to ensure they start after all existing data

-- Set sports sequence: setval with is_called=true means "this is the last used value"
-- so the NEXT call will return MAX(id) + 1
-- If no data exists, start at 1 (minimum for sequences)
SELECT setval('sports_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM sports), 0), 1), true);

-- Set venues sequence: setval with is_called=true means "this is the last used value"
-- so the NEXT call will return MAX(id) + 1
-- If no data exists, start at 1 (minimum for sequences)
SELECT setval('venues_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM venues), 0), 1), true);

-- Verify the sequences are correctly set by checking next values
-- New sports should get ID = MAX(sports.id) + 1
-- New venues should get ID = MAX(venues.id) + 1
