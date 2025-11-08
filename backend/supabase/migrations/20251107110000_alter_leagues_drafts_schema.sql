-- Update leagues_drafts table schema to support UUID org_id and string user IDs
-- Drop the old foreign key and unique constraint
ALTER TABLE leagues_drafts
DROP CONSTRAINT IF EXISTS leagues_drafts_org_id_fkey;

ALTER TABLE leagues_drafts
DROP CONSTRAINT IF EXISTS leagues_drafts_org_id_key;

-- Alter org_id column from INT to UUID
ALTER TABLE leagues_drafts
ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;

-- Alter created_by from UUID to TEXT (for Clerk user IDs)
ALTER TABLE leagues_drafts
ALTER COLUMN created_by TYPE TEXT;

-- Make org_id NOT NULL and add UNIQUE constraint with type for drafts
ALTER TABLE leagues_drafts
ALTER COLUMN org_id SET NOT NULL;

-- Add back the foreign key constraint
ALTER TABLE leagues_drafts
ADD CONSTRAINT leagues_drafts_org_id_fkey
FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Create unique constraint for drafts (org_id, type) where type='draft'
-- This allows multiple templates per org but only one draft
CREATE UNIQUE INDEX IF NOT EXISTS idx_leagues_drafts_org_id_draft
ON leagues_drafts(org_id, type)
WHERE type = 'draft';
