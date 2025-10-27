-- Drop the table if it already exists to start fresh (optional).
-- DROP TABLE IF EXISTS venues;

-- Create the main 'venues' table to store information about locations.
CREATE TABLE venues (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    lng NUMERIC(9, 6),
    lat NUMERIC(9, 6)
);

-- Add comments to each column for better documentation and clarity.
COMMENT ON COLUMN venues.id IS 'Unique identifier for the venue.';
COMMENT ON COLUMN venues.name IS 'The name of the venue or location.';
COMMENT ON COLUMN venues.address IS 'The physical street address of the venue.';
COMMENT ON COLUMN venues.lng IS 'The longitude coordinate of the venue.';
COMMENT ON COLUMN venues.lat IS 'The latitude coordinate of the venue.';

-- === Standard Indexes ===

-- 1. Index on the 'name' column for fast searching by the venue's name.
CREATE INDEX idx_venues_name ON venues (name);

-- === Advanced Spatial Index ===
-- The following steps will enable PostGIS and create a spatial index for fast location-based queries
-- (e.g., "find all venues within 5 miles of a user's location").

-- 1. **ENABLE POSTGIS EXTENSION** (This is the new, required step)
-- This command activates the geographic data types (like 'geography') and functions.
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Add a new column to store the location data in the efficient 'geography' format.
ALTER TABLE venues ADD COLUMN location geography(Point, 4326);

-- 3. Populate the new 'location' column using the existing 'lat' and 'lng' data.
UPDATE venues SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;

-- 4. Create a GIST (Generalized Search Tree) index on the new 'location' column.
-- This is the special index that makes spatial queries extremely fast.
CREATE INDEX idx_venues_location ON venues USING GIST (location);
