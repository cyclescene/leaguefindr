-- Create leagues_staging table, org_id mapping table, and trigger for CSV imports
-- This is a fallback mechanism for importing leagues via CSV
-- The primary flow is through the dashboard API, but CSV provides a backup option

-- ============================================================================
-- ORG_ID MAPPING TABLE
-- ============================================================================

CREATE TABLE org_id_mapping (
  old_id INT PRIMARY KEY,
  new_id UUID NOT NULL,
  org_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_org_id_mapping FOREIGN KEY (new_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_org_id_mapping_new_id ON org_id_mapping(new_id);
CREATE INDEX idx_org_id_mapping_org_name ON org_id_mapping(org_name);

COMMENT ON TABLE org_id_mapping IS 'Maps old INT organization IDs (from CSV) to new UUID organization IDs. Provides audit trail of which organization each league belongs to.';
COMMENT ON COLUMN org_id_mapping.old_id IS 'Original INT organization ID from CSV';
COMMENT ON COLUMN org_id_mapping.new_id IS 'New UUID organization ID in the organizations table';
COMMENT ON COLUMN org_id_mapping.org_name IS 'Organization name for reference and debugging';

-- ============================================================================
-- LEAGUES_STAGING TABLE (CSV format)
-- ============================================================================

CREATE TABLE leagues_staging (
  id INT PRIMARY KEY,
  org_id INT,
  sport_id INT,
  division TEXT,
  registration_deadline DATE,
  season_start_date DATE,
  season_end_date DATE,
  game_days TEXT,                               -- PostgreSQL array syntax: {Monday,Tuesday}
  game_start_time TIME,
  game_end_time TIME,
  season_fee NUMERIC(10, 2),
  per_game_fee NUMERIC(10, 2),
  venue_id INT,
  age_group TEXT,
  gender TEXT,
  season_details TEXT,
  registration_url TEXT,
  duration INT,
  minimum_team_players INT
);

COMMENT ON TABLE leagues_staging IS 'Staging table for CSV imports of leagues data. Data is automatically transformed and inserted into leagues table via trigger. This is a fallback mechanism - primary flow is through the dashboard API.';

-- ============================================================================
-- TRIGGER FUNCTION FOR LEAGUES
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_leagues_staging()
RETURNS TRIGGER AS $$
DECLARE
  v_org_uuid UUID;
  v_org_name TEXT;
  v_sport_name TEXT;
  v_venue_name TEXT;
  v_venue_address TEXT;
  v_venue_lat NUMERIC;
  v_venue_lng NUMERIC;
  v_game_days_array TEXT[];
  v_day TEXT;
  v_game_occurrences_array JSONB[];
  v_form_data JSONB;
BEGIN
  -- Map the CSV org_id to the new UUID org_id using the mapping table
  SELECT new_id, org_name INTO v_org_uuid, v_org_name FROM org_id_mapping WHERE old_id = NEW.org_id;

  -- If mapping not found, use the first organization or create a default
  IF v_org_uuid IS NULL THEN
    SELECT id, org_name INTO v_org_uuid, v_org_name FROM organizations ORDER BY created_at LIMIT 1;

    IF v_org_uuid IS NULL THEN
      -- Create a default organization if none exist
      v_org_name := 'Imported Leagues Organization';
      INSERT INTO organizations (org_name, is_active)
      VALUES (v_org_name, true)
      RETURNING id INTO v_org_uuid;

      -- Also create a mapping entry for this new organization
      INSERT INTO org_id_mapping (old_id, new_id, org_name)
      VALUES (NEW.org_id, v_org_uuid, v_org_name);
    END IF;
  END IF;

  -- Fetch sport name if sport_id is provided
  IF NEW.sport_id IS NOT NULL THEN
    SELECT name INTO v_sport_name FROM sports WHERE id = NEW.sport_id;
  END IF;

  -- Fetch venue details if venue_id is provided
  IF NEW.venue_id IS NOT NULL THEN
    SELECT name, address, lat, lng INTO v_venue_name, v_venue_address, v_venue_lat, v_venue_lng
    FROM venues WHERE id = NEW.venue_id;
  END IF;

  -- Parse game_days array from PostgreSQL array format {Monday,Tuesday} to array
  v_game_days_array := CASE
    WHEN NEW.game_days IS NOT NULL
    THEN string_to_array(trim(NEW.game_days, '{}'), ',')
    ELSE ARRAY[]::TEXT[]
  END;

  -- Build game_occurrences array with day, start_time, and end_time for form restoration
  v_game_occurrences_array := ARRAY[]::JSONB[];
  IF NEW.game_days IS NOT NULL AND array_length(v_game_days_array, 1) > 0 THEN
    FOREACH v_day IN ARRAY v_game_days_array
    LOOP
      v_day := trim(v_day);
      IF v_day != '' THEN
        v_game_occurrences_array := v_game_occurrences_array ||
          jsonb_build_object(
            'day', v_day,
            'start_time', COALESCE(NEW.game_start_time::text, '00:00'),
            'end_time', COALESCE(NEW.game_end_time::text, '00:00')
          )::JSONB;
      END IF;
    END LOOP;
  END IF;

  -- Build form_data JSONB for complete form submission data with sport/venue/org names and game occurrences
  v_form_data := jsonb_build_object(
    'division', NEW.division,
    'registration_deadline', NEW.registration_deadline::text,
    'season_start_date', NEW.season_start_date::text,
    'season_end_date', NEW.season_end_date::text,
    'gender', NEW.gender,
    'season_details', NEW.season_details,
    'registration_url', NEW.registration_url,
    'duration', NEW.duration,
    'minimum_team_players', NEW.minimum_team_players,
    'per_game_fee', NEW.per_game_fee,
    'season_fee', NEW.season_fee,
    'age_group', NEW.age_group,
    'game_days', NEW.game_days,
    'game_start_time', COALESCE(NEW.game_start_time::text, '00:00'),
    'game_end_time', COALESCE(NEW.game_end_time::text, '00:00'),
    'game_occurrences', v_game_occurrences_array,
    'sport_id', NEW.sport_id,
    'sport_name', v_sport_name,
    'venue_id', NEW.venue_id,
    'venue_name', v_venue_name,
    'venue_address', v_venue_address,
    'venue_lat', v_venue_lat,
    'venue_lng', v_venue_lng,
    'organization_name', v_org_name,
    'import_source', 'csv'
  );

  -- Insert league with status = 'approved' (CSV imports are pre-vetted)
  -- Use ON CONFLICT to handle re-imports of the same league IDs
  INSERT INTO leagues (
    id, org_id, sport_id, division,
    registration_deadline, season_start_date, season_end_date,
    venue_id, gender, season_details, registration_url,
    duration, minimum_team_players, per_game_fee,
    pricing_strategy, pricing_amount, pricing_per_player,
    status, form_data, created_at, updated_at
  ) VALUES (
    NEW.id,
    v_org_uuid,
    NEW.sport_id,
    NEW.division,
    NEW.registration_deadline,
    NEW.season_start_date,
    NEW.season_end_date,
    NEW.venue_id,
    NEW.gender,
    NEW.season_details,
    NEW.registration_url,
    NEW.duration,
    NEW.minimum_team_players,
    NEW.per_game_fee,
    'per_team',  -- Assume season_fee is per_team pricing
    NEW.season_fee,
    CASE WHEN NEW.season_fee IS NOT NULL AND NEW.minimum_team_players > 0
      THEN CEIL(NEW.season_fee::numeric / NEW.minimum_team_players)
      ELSE NULL
    END,
    'approved',  -- CSV imports are pre-approved (pre-vetted data)
    v_form_data,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    org_id = EXCLUDED.org_id,
    sport_id = EXCLUDED.sport_id,
    division = EXCLUDED.division,
    registration_deadline = EXCLUDED.registration_deadline,
    season_start_date = EXCLUDED.season_start_date,
    season_end_date = EXCLUDED.season_end_date,
    venue_id = EXCLUDED.venue_id,
    gender = EXCLUDED.gender,
    season_details = EXCLUDED.season_details,
    registration_url = EXCLUDED.registration_url,
    duration = EXCLUDED.duration,
    minimum_team_players = EXCLUDED.minimum_team_players,
    per_game_fee = EXCLUDED.per_game_fee,
    pricing_strategy = EXCLUDED.pricing_strategy,
    pricing_amount = EXCLUDED.pricing_amount,
    pricing_per_player = EXCLUDED.pricing_per_player,
    form_data = EXCLUDED.form_data,
    updated_at = CURRENT_TIMESTAMP;

  -- Insert game occurrences for each day
  -- Parse the game_days array and create entries for each day
  IF NEW.game_days IS NOT NULL AND array_length(v_game_days_array, 1) > 0 THEN
    FOREACH v_day IN ARRAY v_game_days_array
    LOOP
      v_day := trim(v_day);  -- Remove whitespace
      IF v_day != '' THEN  -- Skip empty strings
        INSERT INTO game_occurrences (league_id, day, start_time, end_time)
        VALUES (
          NEW.id,
          v_day,
          COALESCE(NEW.game_start_time, '00:00'::TIME),  -- Default to 00:00 if NULL
          COALESCE(NEW.game_end_time, '00:00'::TIME)     -- Default to 00:00 if NULL
        )
        ON CONFLICT (league_id, day) DO UPDATE SET
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires BEFORE INSERT OR UPDATE on leagues_staging
-- This allows re-importing the same league IDs without constraint violations
CREATE TRIGGER trg_leagues_staging
BEFORE INSERT OR UPDATE ON leagues_staging
FOR EACH ROW
EXECUTE FUNCTION trigger_leagues_staging();

COMMENT ON FUNCTION trigger_leagues_staging() IS 'Transforms leagues CSV staging data to new schema: uses org_id_mapping to resolve org_id, fetches and populates sport/venue/org names in form_data, builds game_occurrences array with day/time data for form restoration, parses game_days array, converts season_fee to pricing_strategy, sets status to approved, creates game_occurrences table entries.';

-- ============================================================================
-- HELPER PROCEDURE FOR CLEARING STAGING TABLE BEFORE RE-IMPORTS
-- ============================================================================

CREATE OR REPLACE FUNCTION clear_leagues_staging()
RETURNS TABLE (
  deleted_count BIGINT,
  message TEXT
) AS $$
DECLARE
  v_deleted_count BIGINT;
BEGIN
  -- Delete all records from leagues_staging
  DELETE FROM leagues_staging;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_count, 'Cleared ' || v_deleted_count || ' records from leagues_staging. Ready for re-import.';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clear_leagues_staging() IS 'Clears all records from the leagues_staging table to prepare for a fresh CSV import. Call this before uploading a new CSV file if re-importing the same league IDs.';

-- ============================================================================
-- FIX TEXT COLUMN TYPES (remove any VARCHAR length restrictions)
-- ============================================================================

-- Ensure all TEXT columns are TEXT type (unlimited length) to handle long data
-- This fixes issues where season_details or other fields exceed VARCHAR limits
ALTER TABLE IF EXISTS leagues
ALTER COLUMN season_details TYPE TEXT USING season_details::TEXT,
ALTER COLUMN registration_url TYPE TEXT USING registration_url::TEXT,
ALTER COLUMN division TYPE TEXT USING division::TEXT,
ALTER COLUMN gender TYPE TEXT USING gender::TEXT;

ALTER TABLE IF EXISTS leagues_staging
ALTER COLUMN season_details TYPE TEXT USING season_details::TEXT,
ALTER COLUMN registration_url TYPE TEXT USING registration_url::TEXT,
ALTER COLUMN division TYPE TEXT USING division::TEXT,
ALTER COLUMN gender TYPE TEXT USING gender::TEXT,
ALTER COLUMN game_days TYPE TEXT USING game_days::TEXT,
ALTER COLUMN age_group TYPE TEXT USING age_group::TEXT;
