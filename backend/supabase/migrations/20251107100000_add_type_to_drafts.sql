-- Add type column to leagues_drafts table to distinguish between drafts and templates
ALTER TABLE leagues_drafts
ADD COLUMN type VARCHAR(20) DEFAULT 'draft' CHECK (type IN ('draft', 'template'));

-- Add name column for templates (optional, can be null for drafts)
ALTER TABLE leagues_drafts
ADD COLUMN name VARCHAR(255);

-- Create index on org_id and type for efficient filtering
CREATE INDEX idx_leagues_drafts_org_id_type ON leagues_drafts(org_id, type);
