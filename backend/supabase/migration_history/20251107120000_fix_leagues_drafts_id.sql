-- Fix leagues_drafts id column to use SERIAL (auto-increment)
-- First, create sequence
CREATE SEQUENCE IF NOT EXISTS leagues_drafts_id_seq
START WITH 1
INCREMENT BY 1;

-- Drop the primary key constraint
ALTER TABLE leagues_drafts
DROP CONSTRAINT leagues_drafts_pkey;

-- Alter the id column to use the sequence as default
ALTER TABLE leagues_drafts
ALTER COLUMN id SET DEFAULT nextval('leagues_drafts_id_seq'::regclass);

-- Set the id column as primary key again
ALTER TABLE leagues_drafts
ADD PRIMARY KEY (id);

-- Update the sequence to start after the highest existing id (if any)
SELECT setval('leagues_drafts_id_seq', COALESCE((SELECT MAX(id) FROM leagues_drafts), 0) + 1);
