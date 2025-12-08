-- Migration: Make org_url UNIQUE and NOT NULL
-- Purpose: Prevent duplicate organizations by enforcing unique website URLs
-- Date: 2025-11-27

-- Step 1: Update organizations_staging table to match production schema
ALTER TABLE organizations_staging
ALTER COLUMN org_url SET NOT NULL;

-- Step 2: Handle NULL org_url values in organizations table
-- Generate unique URLs for any organizations with NULL org_url
-- Using UUID to ensure uniqueness for orphaned records
UPDATE organizations
SET org_url = 'https://example-' || SUBSTRING(id::text, 1, 8) || '.local'
WHERE org_url IS NULL;

-- Step 3: Handle duplicate org_url values
-- For any duplicate URLs, keep the first one and update others with a unique variant
-- This assumes duplicates are rare and likely created during testing
WITH ranked_orgs AS (
  SELECT
    id,
    org_url,
    ROW_NUMBER() OVER (PARTITION BY org_url ORDER BY created_at ASC) AS rn
  FROM organizations
  WHERE org_url IS NOT NULL
)
UPDATE organizations o
SET org_url = o.org_url || '-' || SUBSTRING(o.id::text, 1, 8)
FROM ranked_orgs r
WHERE o.id = r.id
AND r.rn > 1;

-- Step 4: Add NOT NULL constraint to org_url
ALTER TABLE organizations
ALTER COLUMN org_url SET NOT NULL;

-- Step 5: Add UNIQUE constraint to org_url (if it doesn't already exist)
-- Using DO block to conditionally add constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_org_url' AND table_name = 'organizations'
  ) THEN
    ALTER TABLE organizations
    ADD CONSTRAINT unique_org_url UNIQUE(org_url);
  END IF;
END
$$;

-- Step 6: Create an index on org_url for performance
-- This is automatically created with UNIQUE constraint but explicitly stated for clarity
CREATE INDEX IF NOT EXISTS idx_organizations_org_url ON organizations(org_url);

-- Step 7: Handle duplicate org_url values in staging table
-- For any duplicate URLs in staging, keep the first one and delete others
-- This is a staging table used for CSV imports, so we can safely remove duplicates
DELETE FROM organizations_staging
WHERE id NOT IN (
  SELECT MIN(id)
  FROM organizations_staging
  WHERE org_url IS NOT NULL
  GROUP BY org_url
);

-- Step 8: Remove any remaining NULL values from staging table
-- Staging table should not have NULL URLs as they won't import correctly
DELETE FROM organizations_staging
WHERE org_url IS NULL;

-- Step 9: Remove uniqueness constraint from organizations_staging table
-- The staging table can now accept duplicate URLs - the trigger will handle them intelligently
-- by reusing existing organizations instead of creating duplicates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_staging_org_url' AND table_name = 'organizations_staging'
  ) THEN
    ALTER TABLE organizations_staging
    DROP CONSTRAINT unique_staging_org_url;
  END IF;
END
$$;

-- Step 10: Add comment documenting the change
COMMENT ON CONSTRAINT unique_org_url ON organizations IS 'Ensures each organization has a unique website URL to prevent duplicates';
