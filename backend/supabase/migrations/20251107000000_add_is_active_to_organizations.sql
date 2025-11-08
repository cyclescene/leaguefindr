-- Add soft delete columns to organizations table
-- This allows admins to soft delete organizations without deleting data

ALTER TABLE organizations
ADD COLUMN is_deleted BOOLEAN DEFAULT false,
ADD COLUMN deleted_at TIMESTAMP;

-- Create indexes for filtering active organizations
CREATE INDEX idx_organizations_is_deleted ON organizations(is_deleted);
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at);

-- Add comments
COMMENT ON COLUMN organizations.is_deleted IS 'Soft delete flag - true means organization is deleted and not accessible';
COMMENT ON COLUMN organizations.deleted_at IS 'Timestamp when the organization was soft deleted';
