-- Consolidated schema migration: Create clean base schema for leaguefindr
-- This creates all core tables with finalized columns

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('user', 'admin', 'organizer');
CREATE TYPE league_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE pricing_strategy AS ENUM ('per_team', 'per_person');

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
  id TEXT PRIMARY KEY,                           -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  last_login TIMESTAMP,                          -- Track engagement
  login_count INTEGER DEFAULT 0,                 -- Track engagement
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS 'User accounts with authentication via Clerk';
COMMENT ON COLUMN users.id IS 'Clerk user ID';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp - used to track engagement';
COMMENT ON COLUMN users.login_count IS 'Total login count - used to measure platform adoption';

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  org_url TEXT,
  org_phone_number TEXT,
  org_email TEXT,
  org_address TEXT,
  created_by TEXT,                               -- Clerk user ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT fk_org_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_organizations_org_name ON organizations(org_name);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);

COMMENT ON TABLE organizations IS 'Sports organizations that create and manage leagues';
COMMENT ON COLUMN organizations.id IS 'UUID prevents enumeration attacks vs sequential IDs';
COMMENT ON COLUMN organizations.created_by IS 'Clerk user ID of organization creator';

-- ============================================================================
-- USER_ORGANIZATIONS TABLE (Many-to-Many Junction)
-- ============================================================================

CREATE TABLE user_organizations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id UUID NOT NULL,
  role_in_org VARCHAR(50) DEFAULT 'member',     -- owner, admin, member
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_id FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_org UNIQUE(user_id, org_id)
);

CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(org_id);
CREATE INDEX idx_user_organizations_active ON user_organizations(is_active);
CREATE INDEX idx_user_organizations_role ON user_organizations(role_in_org);

COMMENT ON TABLE user_organizations IS 'Maps users to organizations with their roles. One user can belong to multiple organizations.';

-- ============================================================================
-- SPORTS TABLE
-- ============================================================================

CREATE TABLE sports (
  id INT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE UNIQUE INDEX idx_sports_name ON sports(name);

COMMENT ON TABLE sports IS 'Reference data: Available sports (Basketball, Soccer, Volleyball, etc.)';
COMMENT ON COLUMN sports.name IS 'Sport name - must be unique';

-- ============================================================================
-- VENUES TABLE
-- ============================================================================

-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

CREATE TABLE venues (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  lng NUMERIC(9, 6),
  lat NUMERIC(9, 6),
  location geography(Point, 4326)               -- PostGIS spatial column
);

CREATE INDEX idx_venues_name ON venues(name);
CREATE INDEX idx_venues_location ON venues USING GIST (location);

COMMENT ON TABLE venues IS 'Reference data: Sports venues/locations';
COMMENT ON COLUMN venues.location IS 'PostGIS geography point for spatial queries (find venues within X miles)';

-- ============================================================================
-- LEAGUES TABLE
-- ============================================================================

CREATE TABLE leagues (
  id INT PRIMARY KEY,
  org_id UUID NOT NULL,
  sport_id INT,
  league_name TEXT,
  division TEXT,
  registration_deadline DATE,
  season_start_date DATE,
  season_end_date DATE,
  venue_id INT,
  gender TEXT,
  season_details TEXT,
  registration_url TEXT,
  duration INT,
  minimum_team_players INT,
  per_game_fee NUMERIC(10, 2),
  pricing_strategy pricing_strategy DEFAULT 'per_team',
  pricing_amount NUMERIC(10, 2),
  pricing_per_player NUMERIC(10, 2),           -- Calculated per-player price
  status league_status DEFAULT 'pending',
  form_data JSONB,                              -- Complete form submission data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,                              -- Clerk user ID
  rejection_reason TEXT,
  CONSTRAINT fk_leagues_org_id FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_leagues_sport_id FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL,
  CONSTRAINT fk_leagues_venue_id FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL
);

CREATE INDEX idx_leagues_status ON leagues(status);
CREATE INDEX idx_leagues_created_by ON leagues(created_by);
CREATE INDEX idx_leagues_created_at ON leagues(created_at);
CREATE INDEX idx_leagues_org_id ON leagues(org_id);
CREATE INDEX idx_leagues_sport_id ON leagues(sport_id);

COMMENT ON TABLE leagues IS 'Sports leagues. Status: pending (awaiting approval), approved (active), rejected (denied).';
COMMENT ON COLUMN leagues.pricing_per_player IS 'Calculated price per player - derived from pricing_amount and minimum_team_players';
COMMENT ON COLUMN leagues.form_data IS 'Complete form submission data for restoration in drafts/templates';
COMMENT ON COLUMN leagues.created_by IS 'Clerk user ID of the user who created/submitted the league';

-- ============================================================================
-- LEAGUES_DRAFTS TABLE
-- ============================================================================

CREATE TABLE leagues_drafts (
  id INT PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE,
  type TEXT,                                    -- 'draft' or 'template'
  form_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,                              -- Clerk user ID
  CONSTRAINT fk_leagues_drafts_org_id FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_leagues_drafts_org_id ON leagues_drafts(org_id);
CREATE INDEX idx_leagues_drafts_created_by ON leagues_drafts(created_by);

COMMENT ON TABLE leagues_drafts IS 'Draft and template league submissions. One per organization, can be in draft or template mode.';
COMMENT ON COLUMN leagues_drafts.type IS 'Type of saved data: draft (work in progress) or template (reusable)';
COMMENT ON COLUMN leagues_drafts.form_data IS 'Complete form data that can be restored or submitted as a league';
COMMENT ON COLUMN leagues_drafts.created_by IS 'Clerk user ID of the user who created/updated the draft';
