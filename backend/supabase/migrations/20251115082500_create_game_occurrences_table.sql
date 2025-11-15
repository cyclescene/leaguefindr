-- Create game_occurrences table for storing individual game times
-- This allows:
-- - Each league to have multiple games on different days
-- - Different start/end times for each day
-- - Efficient querying by day of week, time, etc.
-- - Proper normalization vs JSONB

CREATE TABLE game_occurrences (
  id SERIAL PRIMARY KEY,
  league_id INT NOT NULL,
  day VARCHAR(20) NOT NULL,                     -- e.g., "Monday", "Tuesday", "Wednesday"
  start_time TIME NOT NULL,                     -- e.g., "19:00"
  end_time TIME NOT NULL,                       -- e.g., "22:00"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_game_occurrences_league_id FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
  CONSTRAINT unique_league_day UNIQUE(league_id, day)  -- One occurrence per day per league
);

CREATE INDEX idx_game_occurrences_league_id ON game_occurrences(league_id);
CREATE INDEX idx_game_occurrences_day ON game_occurrences(day);
CREATE INDEX idx_game_occurrences_start_time ON game_occurrences(start_time);

COMMENT ON TABLE game_occurrences IS 'Individual game occurrences for each league. Each row represents one day a league plays with its start/end times.';
COMMENT ON COLUMN game_occurrences.league_id IS 'Foreign key to leagues table';
COMMENT ON COLUMN game_occurrences.day IS 'Day of week (e.g., Monday, Tuesday, Wednesday)';
COMMENT ON COLUMN game_occurrences.start_time IS 'Game start time (e.g., 19:00)';
COMMENT ON COLUMN game_occurrences.end_time IS 'Game end time (e.g., 22:00)';
