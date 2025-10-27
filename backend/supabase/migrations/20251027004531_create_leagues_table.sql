-- Drop the table if it already exists to start fresh (optional)
-- DROP TABLE IF EXISTS leagues;

-- Create the main 'leagues' table to store sports league information.
CREATE TABLE leagues (
    id INT PRIMARY KEY,
    org_id INT,
    sport_id INT,
    division TEXT,
    registration_deadline DATE,
    season_start_date DATE,
    season_end_date DATE,
    game_days TEXT,
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

-- Add comments to each column for better documentation and clarity.
COMMENT ON COLUMN leagues.id IS 'Unique identifier for each league.';
COMMENT ON COLUMN leagues.org_id IS 'Identifier for the organizing body.';
COMMENT ON COLUMN leagues.sport_id IS 'Identifier for the sport.';
COMMENT ON COLUMN leagues.division IS 'Skill level or division of the league (e.g., "Casual, Intermediate").';
COMMENT ON COLUMN leagues.registration_deadline IS 'The final date for teams or players to register.';
COMMENT ON COLUMN leagues.season_start_date IS 'The official start date of the league season.';
COMMENT ON COLUMN leagues.season_end_date IS 'The official end date of the league season.';
COMMENT ON COLUMN leagues.game_days IS 'The days of the week on which games are played.';
COMMENT ON COLUMN leagues.game_start_time IS 'The typical start time for games.';
COMMENT ON COLUMN leagues.game_end_time IS 'The typical end time for games.';
COMMENT ON COLUMN leagues.season_fee IS 'The total fee for the entire season per player or team.';
COMMENT ON COLUMN leagues.per_game_fee IS 'Any additional fee required per game.';
COMMENT ON COLUMN leagues.venue_id IS 'Identifier for the location where games are played.';
COMMENT ON COLUMN leagues.age_group IS 'The age category for the league (e.g., Adult, Youth).';
COMMENT ON COLUMN leagues.gender IS 'The gender specification for the league (e.g., Male, Female, Co-ed).';
COMMENT ON COLUMN leagues.season_details IS 'A detailed description of the league season and format.';
COMMENT ON COLUMN leagues.registration_url IS 'The direct URL for league registration.';
COMMENT ON COLUMN leagues.duration IS 'The duration of the league, often in weeks.';
COMMENT ON COLUMN leagues.minimum_team_players IS 'The minimum number of players required for a team.';

-- Create indexes to optimize common query lookups and improve performance.

-- 1. Index on sport_id for quickly filtering by a specific sport.
CREATE INDEX idx_leagues_sport_id ON leagues (sport_id);

-- 2. Composite index on age_group and gender for efficient demographic-based searches.
CREATE INDEX idx_leagues_age_group_gender ON leagues (age_group, gender);

-- 3. Composite index on season dates to speed up queries for leagues within a specific timeframe.
CREATE INDEX idx_leagues_season_dates ON leagues (season_start_date, season_end_date);

-- 4. Index on venue_id for fast lookups of leagues at a particular location.
CREATE INDEX idx_leagues_venue_id ON leagues (venue_id);

-- 5. Index on season_fee to optimize filtering and sorting by price.
CREATE INDEX idx_leagues_season_fee ON leagues (season_fee);
