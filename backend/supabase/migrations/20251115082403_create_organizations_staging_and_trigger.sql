-- Create organizations_staging table and trigger for CSV imports
-- This allows bulk import of organizations from CSV while mapping old INT IDs to new UUIDs

-- ============================================================================
-- ORGANIZATIONS_STAGING TABLE (CSV format)
-- ============================================================================

CREATE TABLE organizations_staging (
  id INT PRIMARY KEY,
  org_name TEXT NOT NULL,
  org_url TEXT,
  org_phone_number TEXT,
  org_email TEXT,
  org_address TEXT
);

COMMENT ON TABLE organizations_staging IS 'Staging table for CSV imports of organizations data. Data is automatically transformed and inserted into organizations table via trigger.';
COMMENT ON COLUMN organizations_staging.id IS 'Original INT organization ID from CSV - will be mapped to UUID in org_id_mapping';

-- ============================================================================
-- TRIGGER FUNCTION FOR ORGANIZATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_organizations_staging()
RETURNS TRIGGER AS $$
DECLARE
  v_new_org_id UUID;
BEGIN
  -- Create new organization with UUID
  INSERT INTO organizations (org_name, org_url, org_phone_number, org_email, org_address)
  VALUES (NEW.org_name, NEW.org_url, NEW.org_phone_number, NEW.org_email, NEW.org_address)
  RETURNING id INTO v_new_org_id;

  -- Create mapping entry for this organization
  INSERT INTO org_id_mapping (old_id, new_id, org_name)
  VALUES (NEW.id, v_new_org_id, NEW.org_name)
  ON CONFLICT (old_id) DO UPDATE SET
    new_id = EXCLUDED.new_id,
    org_name = EXCLUDED.org_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Create trigger that fires BEFORE INSERT on organizations_staging
CREATE TRIGGER trg_organizations_staging
BEFORE INSERT ON organizations_staging
FOR EACH ROW
EXECUTE FUNCTION trigger_organizations_staging();

COMMENT ON FUNCTION trigger_organizations_staging() IS 'Transforms organizations CSV staging data to new schema: creates new organization with UUID, creates mapping entry from old INT ID to new UUID.';
