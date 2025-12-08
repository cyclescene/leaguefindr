-- Auto-reset sequences after insert operations
-- Creates triggers on sports and venues tables that automatically fix sequences
-- after any insert (CSV import, API, manual SQL, etc.)

-- ============================================================================
-- FUNCTION: Reset sports sequence after insert
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_sports_sequence_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- After any insert into sports, reset the sequence to MAX(id) + 1
  -- This ensures the next new sport gets a unique ID and doesn't overwrite existing data
  PERFORM setval('sports_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM sports) + 1, 1), false);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Reset venues sequence after insert
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_venues_sequence_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- After any insert into venues, reset the sequence to MAX(id) + 1
  -- This ensures the next new venue gets a unique ID and doesn't overwrite existing data
  PERFORM setval('venues_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM venues) + 1, 1), false);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-reset on any insert
-- ============================================================================

-- Create trigger for sports - fires AFTER INSERT on sports table
-- FOR EACH STATEMENT: runs once per INSERT statement (more efficient than FOR EACH ROW)
CREATE TRIGGER trg_reset_sports_sequence_after_insert
AFTER INSERT ON sports
FOR EACH STATEMENT
EXECUTE FUNCTION reset_sports_sequence_after_insert();

-- Create trigger for venues - fires AFTER INSERT on venues table
-- FOR EACH STATEMENT: runs once per INSERT statement (more efficient than FOR EACH ROW)
CREATE TRIGGER trg_reset_venues_sequence_after_insert
AFTER INSERT ON venues
FOR EACH STATEMENT
EXECUTE FUNCTION reset_venues_sequence_after_insert();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION reset_sports_sequence_after_insert() IS 'Automatically resets sports_id_seq after any insert to prevent ID overwrites. Works with CSV imports, API inserts, and manual SQL operations.';
COMMENT ON FUNCTION reset_venues_sequence_after_insert() IS 'Automatically resets venues_id_seq after any insert to prevent ID overwrites. Works with CSV imports, API inserts, and manual SQL operations.';
