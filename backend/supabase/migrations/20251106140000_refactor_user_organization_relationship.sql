-- Refactor user/organization relationship to support multiple organizations per user
-- and use UUIDs for organization IDs to prevent enumeration attacks
-- This migration:
-- 1. Converts organizations.id from INT to UUID
-- 2. Removes organization_name from users (users table should be lean)
-- 3. Enhances organizations table with created_by and timestamps
-- 4. Creates user_organizations junction table for many-to-many relationship
-- 5. Sets up proper foreign keys and indexes

-- Step 1: Add UUID column to organizations and populate existing rows
ALTER TABLE organizations
ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();

-- Make sure all existing rows have UUIDs (in case there are any without)
UPDATE organizations SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- Step 2: Add created_by and timestamps to organizations table
ALTER TABLE organizations
ADD COLUMN created_by TEXT,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Drop foreign key constraints from dependent tables first
-- (We need to do this before dropping the primary key on organizations)
ALTER TABLE IF EXISTS leagues DROP CONSTRAINT IF EXISTS leagues_org_id_fkey;
ALTER TABLE IF EXISTS leagues_drafts DROP CONSTRAINT IF EXISTS leagues_drafts_org_id_fkey;

-- Step 4: Drop indexes that reference the old id column
DROP INDEX IF EXISTS idx_organizations_org_name;

-- Step 5: Create a mapping table to preserve organization data during ID migration
CREATE TABLE org_id_mapping AS
SELECT id::TEXT as old_id, id_uuid as new_id FROM organizations;

-- Step 6: Convert org_id columns in dependent tables from INT to UUID
-- First, add new UUID columns
ALTER TABLE IF EXISTS leagues ADD COLUMN org_id_uuid UUID;
ALTER TABLE IF EXISTS leagues_drafts ADD COLUMN org_id_uuid UUID;

-- Step 7: Populate new UUID columns using the mapping
UPDATE leagues l SET org_id_uuid = (SELECT new_id FROM org_id_mapping WHERE old_id = l.org_id::TEXT);
UPDATE leagues_drafts ld SET org_id_uuid = (SELECT new_id FROM org_id_mapping WHERE old_id = ld.org_id::TEXT);

-- Step 8: Drop old INT org_id columns and foreign keys if they exist
ALTER TABLE IF EXISTS leagues DROP CONSTRAINT IF EXISTS leagues_org_id_fkey;
ALTER TABLE IF EXISTS leagues_drafts DROP CONSTRAINT IF EXISTS leagues_drafts_org_id_fkey;
ALTER TABLE leagues DROP COLUMN org_id;
ALTER TABLE leagues_drafts DROP COLUMN org_id;

-- Step 9: Rename UUID columns to org_id
ALTER TABLE leagues RENAME COLUMN org_id_uuid TO org_id;
ALTER TABLE leagues_drafts RENAME COLUMN org_id_uuid TO org_id;

-- Step 10: Drop the mapping table
DROP TABLE org_id_mapping;

-- Step 11: Drop old INT primary key from organizations and rename UUID column to id
ALTER TABLE organizations DROP CONSTRAINT organizations_pkey;
ALTER TABLE organizations DROP COLUMN id;
ALTER TABLE organizations RENAME COLUMN id_uuid TO id;
ALTER TABLE organizations ADD PRIMARY KEY (id);

-- Step 12: Recreate foreign keys in dependent tables with UUID references
-- These will reference the UUID id column we just created
ALTER TABLE leagues ADD CONSTRAINT leagues_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE leagues_drafts ADD CONSTRAINT leagues_drafts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 7: Add created_by foreign key
ALTER TABLE organizations
ADD CONSTRAINT fk_org_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 8: Create user_organizations junction table with UUID org_id
CREATE TABLE user_organizations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id UUID NOT NULL,
  role_in_org VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_id FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint to prevent duplicate user-org relationships
  CONSTRAINT unique_user_org UNIQUE(user_id, org_id)
);

-- Create indexes for common queries
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(org_id);
CREATE INDEX idx_user_organizations_active ON user_organizations(is_active);
CREATE INDEX idx_user_organizations_role ON user_organizations(role_in_org);

-- Recreate index on organizations
CREATE INDEX idx_organizations_org_name ON organizations(org_name);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);

-- Step 9: Add currently_logged_in tracking to users
ALTER TABLE users
ADD COLUMN currently_logged_in BOOLEAN DEFAULT false;

-- Step 10: Remove organization_name from users
-- First, drop the unique constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_organization_name_key;

-- Then drop the column
ALTER TABLE users DROP COLUMN IF EXISTS organization_name;

-- Add comment to explain the user_organizations table
COMMENT ON TABLE user_organizations IS 'Junction table mapping users to organizations. A user can belong to multiple organizations with different roles. Uses UUID org_id to prevent enumeration attacks.';
COMMENT ON COLUMN user_organizations.user_id IS 'Reference to the user (Clerk user ID)';
COMMENT ON COLUMN user_organizations.org_id IS 'Reference to the organization (UUID)';
COMMENT ON COLUMN user_organizations.role_in_org IS 'User role within the organization: owner, admin, or member';
COMMENT ON COLUMN user_organizations.is_active IS 'Whether the user is active in this organization';
COMMENT ON COLUMN organizations.id IS 'Unique UUID identifier - prevents enumeration attacks vs sequential IDs';
