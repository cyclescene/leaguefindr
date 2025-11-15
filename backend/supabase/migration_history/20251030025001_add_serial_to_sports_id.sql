-- Fix the sports table ID column to auto-increment
-- Change from INT PRIMARY KEY to use SERIAL for auto-incrementing IDs

-- First, create a sequence for the id column
CREATE SEQUENCE IF NOT EXISTS sports_id_seq START 1;

-- Set the default for the id column to use the sequence
ALTER TABLE sports
ALTER COLUMN id SET DEFAULT nextval('sports_id_seq');

-- Update the sequence to continue from the highest existing ID
SELECT setval('sports_id_seq', (SELECT COALESCE(MAX(id), 0) FROM sports) + 1);
