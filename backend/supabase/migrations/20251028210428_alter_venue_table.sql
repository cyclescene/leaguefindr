-- Add status enum type for venues
DO $$ BEGIN
    CREATE TYPE venue_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to venues table for status and audit tracking
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS status venue_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Auto-approve all existing venues that were already in the system
-- These venues were pre-approved, so mark them as such
UPDATE venues
SET status = 'approved'
WHERE id IS NOT NULL;

-- Add comments to new columns
COMMENT ON COLUMN venues.status IS 'Status of the venue submission: pending, approved, or rejected.';
COMMENT ON COLUMN venues.created_at IS 'Timestamp when the venue was created.';
COMMENT ON COLUMN venues.updated_at IS 'Timestamp when the venue was last updated.';
COMMENT ON COLUMN venues.created_by IS 'UUID of the user who submitted the venue.';
COMMENT ON COLUMN venues.rejection_reason IS 'Reason for rejection if status is rejected.';

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues (status);

-- Create index on created_by for filtering venues by submitter
CREATE INDEX IF NOT EXISTS idx_venues_created_by ON venues (created_by);

-- Create index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_venues_created_at ON venues (created_at);
