-- Fix the leagues table ID column to auto-increment
-- Change from INT PRIMARY KEY to use SERIAL for auto-incrementing IDs

-- First, create a sequence for the id column
CREATE SEQUENCE IF NOT EXISTS leagues_id_seq START 1;

-- Set the default for the id column to use the sequence
ALTER TABLE leagues
ALTER COLUMN id SET DEFAULT nextval('leagues_id_seq');

-- Update the sequence to continue from the highest existing ID
SELECT setval('leagues_id_seq', (SELECT COALESCE(MAX(id), 0) FROM leagues) + 1);
