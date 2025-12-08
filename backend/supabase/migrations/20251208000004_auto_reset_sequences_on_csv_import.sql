-- Auto-reset sequences after CSV imports
-- This creates triggers that automatically fix sequences when data is inserted into staging tables

-- ============================================================================
-- FUNCTION: Reset sports sequence after import
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_sports_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- After insert into staging, reset the sports sequence to avoid overwrites
  -- This ensures new sports get IDs after the imported data
  PERFORM setval('sports_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM sports) + 1, 1), false);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Reset venues sequence after import
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_venues_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- After insert into staging, reset the venues sequence to avoid overwrites
  -- This ensures new venues get IDs after the imported data
  PERFORM setval('venues_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM venues) + 1, 1), false);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-reset on CSV import
-- ============================================================================

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS trg_reset_sports_sequence ON organizations_staging CASCADE;
DROP TRIGGER IF EXISTS trg_reset_venues_sequence ON organizations_staging CASCADE;

-- Create trigger for sports - fires AFTER each row insert to organizations_staging
-- This assumes organizations_staging import might also trigger sports data
CREATE TRIGGER trg_reset_sports_sequence
AFTER INSERT ON organizations_staging
FOR EACH ROW
EXECUTE FUNCTION reset_sports_sequence();

-- Create trigger for venues - fires AFTER each row insert to organizations_staging
CREATE TRIGGER trg_reset_venues_sequence
AFTER INSERT ON organizations_staging
FOR EACH ROW
EXECUTE FUNCTION reset_venues_sequence();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION reset_sports_sequence() IS 'Automatically resets sports_id_seq after CSV import to prevent ID overwrites. Ensures new sports get IDs after existing data.';
COMMENT ON FUNCTION reset_venues_sequence() IS 'Automatically resets venues_id_seq after CSV import to prevent ID overwrites. Ensures new venues get IDs after existing data.';
