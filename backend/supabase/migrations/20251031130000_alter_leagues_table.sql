-- Add league_status enum type
DO $$ BEGIN
    CREATE TYPE league_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add pricing_strategy enum type
DO $$ BEGIN
    CREATE TYPE pricing_strategy AS ENUM ('per_team', 'per_person');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to leagues table for status, pricing, and audit info
ALTER TABLE leagues
ADD COLUMN IF NOT EXISTS league_name TEXT,
ADD COLUMN IF NOT EXISTS game_occurrences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pricing_strategy pricing_strategy DEFAULT 'per_team',
ADD COLUMN IF NOT EXISTS pricing_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS pricing_per_player NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS status league_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comments to new columns
COMMENT ON COLUMN leagues.league_name IS 'Name of the league (captured but not displayed on platform).';
COMMENT ON COLUMN leagues.game_occurrences IS 'JSONB array of game occurrences: [{day: "Monday", startTime: "19:00", endTime: "21:00"}, ...]';
COMMENT ON COLUMN leagues.pricing_strategy IS 'Pricing model: per_team or per_person.';
COMMENT ON COLUMN leagues.pricing_amount IS 'Amount entered by organizer based on pricing strategy.';
COMMENT ON COLUMN leagues.pricing_per_player IS 'Calculated per-player price displayed to users.';
COMMENT ON COLUMN leagues.status IS 'Status of the league submission: pending, approved, or rejected.';
COMMENT ON COLUMN leagues.created_at IS 'Timestamp when the league was created.';
COMMENT ON COLUMN leagues.updated_at IS 'Timestamp when the league was last updated.';
COMMENT ON COLUMN leagues.created_by IS 'UUID of the user who submitted the league.';
COMMENT ON COLUMN leagues.rejection_reason IS 'Reason for rejection if status is rejected.';

-- Create indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues (status);
CREATE INDEX IF NOT EXISTS idx_leagues_created_by ON leagues (created_by);
CREATE INDEX IF NOT EXISTS idx_leagues_created_at ON leagues (created_at);
CREATE INDEX IF NOT EXISTS idx_leagues_org_id ON leagues (org_id);
CREATE INDEX IF NOT EXISTS idx_leagues_sport_id ON leagues (sport_id);

-- Create leagues_drafts table for storing draft submissions
CREATE TABLE IF NOT EXISTS leagues_drafts (
    id INT PRIMARY KEY,
    org_id INT NOT NULL UNIQUE,
    draft_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Add comments to leagues_drafts table
COMMENT ON TABLE leagues_drafts IS 'Stores draft league submissions for each organization. One draft per organization.';
COMMENT ON COLUMN leagues_drafts.id IS 'Unique identifier for the draft.';
COMMENT ON COLUMN leagues_drafts.org_id IS 'Organization that owns this draft (unique per org).';
COMMENT ON COLUMN leagues_drafts.draft_data IS 'JSONB containing all draft league data.';
COMMENT ON COLUMN leagues_drafts.created_at IS 'Timestamp when the draft was first created.';
COMMENT ON COLUMN leagues_drafts.updated_at IS 'Timestamp when the draft was last updated.';
COMMENT ON COLUMN leagues_drafts.created_by IS 'UUID of the user who created/last updated the draft.';

-- Create indexes for drafts
CREATE INDEX IF NOT EXISTS idx_leagues_drafts_org_id ON leagues_drafts (org_id);
CREATE INDEX IF NOT EXISTS idx_leagues_drafts_created_by ON leagues_drafts (created_by);
