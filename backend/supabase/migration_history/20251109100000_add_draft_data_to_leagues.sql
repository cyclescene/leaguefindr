-- Add draft_data column to leagues table to store complete form submission data
-- This allows us to view/restore the full form data when viewing submitted leagues

ALTER TABLE leagues
ADD COLUMN draft_data JSONB;

-- Add comment for clarity
COMMENT ON COLUMN leagues.draft_data IS 'Complete form submission data stored as JSONB for viewing/restoring league details';
