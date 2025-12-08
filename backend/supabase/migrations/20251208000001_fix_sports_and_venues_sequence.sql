-- Fix auto-increment sequences for sports and venues tables
-- CSV imports didn't reset the BIGSERIAL sequences, causing new records to reuse existing IDs
-- This migration resets both sequences to the next available ID after the highest existing record

-- Fix sports table sequence
SELECT setval('sports_id_seq', (SELECT MAX(id) FROM sports), true);

-- Fix venues table sequence
SELECT setval('venues_id_seq', (SELECT MAX(id) FROM venues), true);
