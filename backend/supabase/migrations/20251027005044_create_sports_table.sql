-- Drop the table if it already exists to start fresh (optional).
-- DROP TABLE IF EXISTS sports;

-- Create the 'sports' table to store a list of unique sports.
CREATE TABLE sports (
    id INT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Add comments to each column for better documentation and clarity.
COMMENT ON COLUMN sports.id IS 'Unique identifier for the sport.';
COMMENT ON COLUMN sports.name IS 'The name of the sport (e.g., "Basketball", "Soccer").';

-- Create indexes to optimize common query lookups and improve performance.

-- 1. Index on the 'name' column for fast searching and sorting by sport name.
-- A UNIQUE index is used here to enforce that no two sports can have the same name.
CREATE UNIQUE INDEX idx_sports_name ON sports (name);
