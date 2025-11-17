-- Create RLS policies for read-only tables accessed via Supabase client
-- RLS is disabled on all tables while we resolve JWT syntax issues with Supabase

-- ============================================================================
-- RLS POLICIES FOR LEAGUES TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
-- TODO: Re-create policies with correct JWT syntax once issue is resolved
ALTER TABLE leagues DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies (in case they were created in previous migrations)
DROP POLICY IF EXISTS leagues_select_admin ON leagues;
DROP POLICY IF EXISTS leagues_select_user ON leagues;

-- ============================================================================
-- RLS POLICIES FOR ORGANIZATIONS TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
-- TODO: Re-create policies with correct JWT syntax once issue is resolved
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS organizations_select_admin ON organizations;
DROP POLICY IF EXISTS organizations_select_user ON organizations;

-- ============================================================================
-- RLS POLICIES FOR SPORTS TABLE (Reference Data)
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE sports DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS sports_select_all ON sports;

-- ============================================================================
-- RLS POLICIES FOR VENUES TABLE (Reference Data)
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS venues_select_all ON venues;

-- ============================================================================
-- RLS POLICIES FOR GAME_OCCURRENCES TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE game_occurrences DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS game_occurrences_select_all ON game_occurrences;

-- ============================================================================
-- RLS POLICIES FOR LEAGUES_DRAFTS TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE leagues_drafts DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS leagues_drafts_select_admin ON leagues_drafts;
DROP POLICY IF EXISTS leagues_drafts_select_user ON leagues_drafts;
DROP POLICY IF EXISTS leagues_drafts_update_user ON leagues_drafts;
DROP POLICY IF EXISTS leagues_drafts_update_admin ON leagues_drafts;

-- ============================================================================
-- RLS POLICIES FOR USER_ORGANIZATIONS TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS user_organizations_select_admin ON user_organizations;
DROP POLICY IF EXISTS user_organizations_select_user ON user_organizations;
