-- Fix the venues table ID column to auto-increment
-- Change from INT PRIMARY KEY to use SERIAL for auto-incrementing IDs

-- First, create a sequence for the id column
CREATE SEQUENCE IF NOT EXISTS venues_id_seq START 1;

-- Set the default for the id column to use the sequence
ALTER TABLE venues
ALTER COLUMN id SET DEFAULT nextval('venues_id_seq');

-- Update the sequence to continue from the highest existing ID
SELECT setval('venues_id_seq', (SELECT COALESCE(MAX(id), 0) FROM venues) + 1);
