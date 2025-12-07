-- Create computed column functions for case-insensitive sorting
-- These functions enable proper case-insensitive ordering across the application

-- ===== JSONB form_data field functions (leagues table) =====
DROP FUNCTION IF EXISTS lower_league_sport_name(leagues);
CREATE FUNCTION lower_league_sport_name(leagues)
RETURNS text AS $$
  SELECT COALESCE(lower($1.form_data->>'sport_name'), '');
$$ LANGUAGE SQL IMMUTABLE;

DROP FUNCTION IF EXISTS lower_league_venue_name(leagues);
CREATE FUNCTION lower_league_venue_name(leagues)
RETURNS text AS $$
  SELECT COALESCE(lower($1.form_data->>'venue_name'), '');
$$ LANGUAGE SQL IMMUTABLE;

DROP FUNCTION IF EXISTS lower_league_organization_name(leagues);
CREATE FUNCTION lower_league_organization_name(leagues)
RETURNS text AS $$
  SELECT COALESCE(lower($1.form_data->>'organization_name'), '');
$$ LANGUAGE SQL IMMUTABLE;

DROP FUNCTION IF EXISTS lower_league_gender(leagues);
CREATE FUNCTION lower_league_gender(leagues)
RETURNS text AS $$
  SELECT COALESCE(lower($1.gender), '');
$$ LANGUAGE SQL IMMUTABLE;

-- ===== JSONB form_data field functions (leagues_drafts table) =====
DROP FUNCTION IF EXISTS lower_draft_sport_name(leagues_drafts);
CREATE FUNCTION lower_draft_sport_name(leagues_drafts)
RETURNS text AS $$
  SELECT COALESCE(lower($1.form_data->>'sport_name'), '');
$$ LANGUAGE SQL IMMUTABLE;

DROP FUNCTION IF EXISTS lower_draft_venue_name(leagues_drafts);
CREATE FUNCTION lower_draft_venue_name(leagues_drafts)
RETURNS text AS $$
  SELECT COALESCE(lower($1.form_data->>'venue_name'), '');
$$ LANGUAGE SQL IMMUTABLE;

-- ===== Regular database column functions =====
-- leagues table
DROP FUNCTION IF EXISTS lower_league_name(leagues);
CREATE FUNCTION lower_league_name(leagues)
RETURNS text AS $$
  SELECT lower($1.league_name);
$$ LANGUAGE SQL IMMUTABLE;

DROP FUNCTION IF EXISTS lower_league_status(leagues);
CREATE FUNCTION lower_league_status(leagues)
RETURNS text AS $$
  SELECT lower($1.status::text);
$$ LANGUAGE SQL IMMUTABLE;

-- organizations table
DROP FUNCTION IF EXISTS lower_org_name(organizations);
CREATE FUNCTION lower_org_name(organizations)
RETURNS text AS $$
  SELECT lower($1.org_name);
$$ LANGUAGE SQL IMMUTABLE;

-- sports table
DROP FUNCTION IF EXISTS lower_sport_name(sports);
CREATE FUNCTION lower_sport_name(sports)
RETURNS text AS $$
  SELECT lower($1.name);
$$ LANGUAGE SQL IMMUTABLE;

-- venues table
DROP FUNCTION IF EXISTS lower_venue_name(venues);
CREATE FUNCTION lower_venue_name(venues)
RETURNS text AS $$
  SELECT lower($1.name);
$$ LANGUAGE SQL IMMUTABLE;

-- leagues_drafts table
DROP FUNCTION IF EXISTS lower_draft_name(leagues_drafts);
CREATE FUNCTION lower_draft_name(leagues_drafts)
RETURNS text AS $$
  SELECT lower($1.name);
$$ LANGUAGE SQL IMMUTABLE;

DROP FUNCTION IF EXISTS lower_draft_type(leagues_drafts);
CREATE FUNCTION lower_draft_type(leagues_drafts)
RETURNS text AS $$
  SELECT lower($1.type);
$$ LANGUAGE SQL IMMUTABLE;
