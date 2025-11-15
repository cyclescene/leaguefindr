-- Add request_count column to track how many users have requested a sport
-- This helps handle the unique constraint on sport names while allowing
-- multiple users to request the same sport
ALTER TABLE sports
ADD COLUMN IF NOT EXISTS request_count INT DEFAULT 0;

-- Set all existing sports to have request_count = 1
-- and ensure they are all marked as approved
UPDATE sports
SET status = 'approved', request_count = 1
WHERE id IS NOT NULL;

-- Add comment to new column
COMMENT ON COLUMN sports.request_count IS 'Number of users who have requested this sport. Used to track demand for pending/rejected sports.';

-- Create index on request_count for sorting by demand
CREATE INDEX IF NOT EXISTS idx_sports_request_count ON sports (request_count DESC);
