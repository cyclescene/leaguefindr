-- Create RLS policies for read-only tables accessed via Supabase client
-- These policies allow users and admins to access data based on their roles and relationships
-- Admins have access to all data, regular users have scoped access
--
-- Authentication: Clerk is configured as a third-party auth provider in Supabase
-- User context is available via auth.jwt() which contains:
-- - role: 'admin', 'organizer', or 'user'
-- - sub: Clerk user ID
-- - email: User email

-- ============================================================================
-- RLS POLICIES FOR LEAGUES TABLE
-- ============================================================================

-- Enable RLS on leagues table
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Admins can read all leagues (all statuses)
CREATE POLICY leagues_select_admin ON leagues
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Regular users and organizers can read based on status and membership
CREATE POLICY leagues_select_user ON leagues
  FOR SELECT
  USING (
    -- Admins always have access
    (auth.jwt() ->> 'role') = 'admin'
    -- Published/approved leagues anyone can see
    OR status = 'approved'
    -- User can see their own submissions regardless of status
    OR created_by = (auth.jwt() ->> 'sub')
    -- Organizers can see leagues from their organizations
    OR org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = (auth.jwt() ->> 'sub') AND is_active = true
    )
  );

COMMENT ON POLICY leagues_select_admin ON leagues IS 'Admins can view all leagues';
COMMENT ON POLICY leagues_select_user ON leagues IS 'Users can view approved leagues and their own submissions';

-- ============================================================================
-- RLS POLICIES FOR ORGANIZATIONS TABLE
-- ============================================================================

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Admins can read all organizations
CREATE POLICY organizations_select_admin ON organizations
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Regular users can read organizations they are members of
CREATE POLICY organizations_select_user ON organizations
  FOR SELECT
  USING (
    -- Admins always have access
    (auth.jwt() ->> 'role') = 'admin'
    -- Users can see organizations they belong to
    OR id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = (auth.jwt() ->> 'sub') AND is_active = true
    )
  );

COMMENT ON POLICY organizations_select_admin ON organizations IS 'Admins can view all organizations';
COMMENT ON POLICY organizations_select_user ON organizations IS 'Users can view organizations they belong to';

-- ============================================================================
-- RLS POLICIES FOR SPORTS TABLE (Reference Data)
-- ============================================================================

-- Enable RLS on sports table
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

-- Everyone can read sports (reference data)
CREATE POLICY sports_select_all ON sports
  FOR SELECT
  USING (true);

COMMENT ON POLICY sports_select_all ON sports IS 'All authenticated users can view sports reference data';

-- ============================================================================
-- RLS POLICIES FOR VENUES TABLE (Reference Data)
-- ============================================================================

-- Enable RLS on venues table
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Everyone can read venues (reference data)
CREATE POLICY venues_select_all ON venues
  FOR SELECT
  USING (true);

COMMENT ON POLICY venues_select_all ON venues IS 'All authenticated users can view venues reference data';

-- ============================================================================
-- RLS POLICIES FOR GAME_OCCURRENCES TABLE
-- ============================================================================

-- Enable RLS on game_occurrences table
ALTER TABLE game_occurrences ENABLE ROW LEVEL SECURITY;

-- Users can read game occurrences for leagues they have access to
CREATE POLICY game_occurrences_select_all ON game_occurrences
  FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues
      WHERE
        -- Admins can see all
        (auth.jwt() ->> 'role') = 'admin'
        -- Users can see approved leagues
        OR status = 'approved'
        -- Users can see their own org's leagues
        OR org_id IN (
          SELECT org_id FROM user_organizations
          WHERE user_id = (auth.jwt() ->> 'sub') AND is_active = true
        )
    )
  );

COMMENT ON POLICY game_occurrences_select_all ON game_occurrences IS 'Users can read game occurrences for leagues they have access to';

-- ============================================================================
-- RLS POLICIES FOR LEAGUES_DRAFTS TABLE
-- ============================================================================

-- Enable RLS on leagues_drafts table
ALTER TABLE leagues_drafts ENABLE ROW LEVEL SECURITY;

-- Admins can read all drafts
CREATE POLICY leagues_drafts_select_admin ON leagues_drafts
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Users can only read their own org's drafts
CREATE POLICY leagues_drafts_select_user ON leagues_drafts
  FOR SELECT
  USING (
    -- Admins always have access
    (auth.jwt() ->> 'role') = 'admin'
    -- Users can see their org's drafts
    OR org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = (auth.jwt() ->> 'sub') AND is_active = true
    )
  );

-- Users can update their own org's drafts
CREATE POLICY leagues_drafts_update_user ON leagues_drafts
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = (auth.jwt() ->> 'sub') AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = (auth.jwt() ->> 'sub') AND is_active = true
    )
  );

-- Admins can update all drafts
CREATE POLICY leagues_drafts_update_admin ON leagues_drafts
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
  );

COMMENT ON POLICY leagues_drafts_select_admin ON leagues_drafts IS 'Admins can view all drafts';
COMMENT ON POLICY leagues_drafts_select_user ON leagues_drafts IS 'Users can view their organization drafts';
COMMENT ON POLICY leagues_drafts_update_user ON leagues_drafts IS 'Users can update their organization drafts';
COMMENT ON POLICY leagues_drafts_update_admin ON leagues_drafts IS 'Admins can update all drafts';

-- ============================================================================
-- RLS POLICIES FOR USER_ORGANIZATIONS TABLE
-- ============================================================================

-- Enable RLS on user_organizations table
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Admins can read all relationships
CREATE POLICY user_organizations_select_admin ON user_organizations
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Users can read their own relationships
CREATE POLICY user_organizations_select_user ON user_organizations
  FOR SELECT
  USING (
    user_id = (auth.jwt() ->> 'sub')
  );

COMMENT ON POLICY user_organizations_select_admin ON user_organizations IS 'Admins can view all user-organization relationships';
COMMENT ON POLICY user_organizations_select_user ON user_organizations IS 'Users can view their own organization memberships';
