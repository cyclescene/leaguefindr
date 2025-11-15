-- Populate draft_data for existing leagues from individual columns
-- This reconstructs the form submission data from the individual fields

UPDATE leagues
SET draft_data = jsonb_build_object(
  'sport_id', sport_id,
  'sport_name', (SELECT COALESCE(name, '') FROM sports WHERE sports.id = leagues.sport_id),
  'league_name', league_name,
  'division', division,
  'registration_deadline', registration_deadline::text,
  'season_start_date', season_start_date::text,
  'season_end_date', season_end_date::text,
  'game_occurrences', COALESCE(game_occurrences, '[]'::jsonb),
  'pricing_strategy', pricing_strategy,
  'pricing_amount', pricing_amount,
  'venue_id', venue_id,
  'venue_name', (SELECT COALESCE(name, '') FROM venues WHERE venues.id = leagues.venue_id),
  'venue_address', (SELECT COALESCE(address, '') FROM venues WHERE venues.id = leagues.venue_id),
  'venue_lat', (SELECT lat FROM venues WHERE venues.id = leagues.venue_id),
  'venue_lng', (SELECT lng FROM venues WHERE venues.id = leagues.venue_id),
  'gender', gender,
  'season_details', season_details,
  'registration_url', registration_url,
  'duration', duration,
  'minimum_team_players', minimum_team_players,
  'per_game_fee', per_game_fee,
  'org_id', org_id,
  'organization_name', ''
)
WHERE draft_data IS NULL;
