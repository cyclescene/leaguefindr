-- Drop the table if it already exists to start fresh (optional).
-- DROP TABLE IF EXISTS organizations;

-- Create the 'organizations' table to store details about each sports organization.
CREATE TABLE organizations (
    id INT PRIMARY KEY,
    org_name TEXT NOT NULL,
    org_url TEXT,
    org_phone_number TEXT,
    org_email TEXT,
    org_address TEXT
);

-- Add comments to each column for better documentation and clarity.
COMMENT ON COLUMN organizations.id IS 'Unique identifier for the organization.';
COMMENT ON COLUMN organizations.org_name IS 'The official name of the sports organization.';
COMMENT ON COLUMN organizations.org_url IS 'The official website URL of the organization.';
COMMENT ON COLUMN organizations.org_phone_number IS 'Contact phone number for the organization.';
COMMENT ON COLUMN organizations.org_email IS 'Contact email address for the organization.';
COMMENT ON COLUMN organizations.org_address IS 'Physical or mailing address of the organization.';

-- Create indexes to optimize common query lookups and improve performance.

-- 1. Index on org_name for fast searching and filtering by the organization's name.
-- This is crucial for search bars or autocomplete features.
CREATE INDEX idx_organizations_org_name ON organizations (org_name);
