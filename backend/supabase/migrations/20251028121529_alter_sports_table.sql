-- Add status column with enum type
DO $$ BEGIN
    CREATE TYPE sport_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to sports table
-- Default status to 'pending' for new submissions, but we'll override for existing sports below
ALTER TABLE sports
ADD COLUMN IF NOT EXISTS status sport_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Auto-approve all existing sports that were already in the system
-- These sports were pre-approved, so mark them as such
UPDATE sports
SET status = 'approved'
WHERE id IS NOT NULL;

-- Add comments to new columns
COMMENT ON COLUMN sports.status IS 'Status of the sport submission: pending, approved, or rejected.';
COMMENT ON COLUMN sports.created_at IS 'Timestamp when the sport was created.';
COMMENT ON COLUMN sports.updated_at IS 'Timestamp when the sport was last updated.';
COMMENT ON COLUMN sports.created_by IS 'UUID of the user who submitted the sport.';
COMMENT ON COLUMN sports.rejection_reason IS 'Reason for rejection if status is rejected.';

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_sports_status ON sports (status);

-- Create index on created_by for filtering sports by submitter
CREATE INDEX IF NOT EXISTS idx_sports_created_by ON sports (created_by);
