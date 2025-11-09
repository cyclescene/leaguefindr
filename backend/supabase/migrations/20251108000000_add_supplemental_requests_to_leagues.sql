-- Add supplemental_requests JSONB column to leagues table
-- Stores submitted sport/venue data if they don't exist in the DB
-- When admin approves the league, missing records are created using this data
ALTER TABLE leagues
ADD COLUMN IF NOT EXISTS supplemental_requests JSONB;

-- Add comment
COMMENT ON COLUMN leagues.supplemental_requests IS 'JSONB object with submitted sport/venue data if they don''t exist in DB: {sport: {name: string}, venue: {name: string, address: string, lat: number, lng: number}}. Populated during league submission if records don''t exist. Used during admin approval to create missing records and set foreign keys.';

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_leagues_supplemental_requests ON leagues USING GIN (supplemental_requests);
