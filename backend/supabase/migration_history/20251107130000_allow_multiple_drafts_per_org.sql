-- Allow multiple drafts per organization
-- Remove the unique constraint that limited one draft per org
DROP INDEX IF EXISTS idx_leagues_drafts_org_id_draft;

-- Now users can have multiple drafts per organization
-- Each draft save will create a new entry instead of updating an existing one
