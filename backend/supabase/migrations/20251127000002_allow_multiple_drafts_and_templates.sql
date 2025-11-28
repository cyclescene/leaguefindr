-- Allow multiple drafts and templates per organization (not just one of each)
-- Change the unique constraint from (org_id, type) to (org_id, type, name)

ALTER TABLE leagues_drafts DROP CONSTRAINT unique_org_type;
ALTER TABLE leagues_drafts ADD CONSTRAINT unique_org_type_name UNIQUE (org_id, type, name);
