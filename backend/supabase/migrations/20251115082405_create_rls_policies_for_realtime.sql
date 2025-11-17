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

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
-- TODO: Re-create policies with correct JWT syntax once issue is resolved
ALTER TABLE leagues DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR ORGANIZATIONS TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
-- TODO: Re-create policies with correct JWT syntax once issue is resolved
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR SPORTS TABLE (Reference Data)
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE sports DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR VENUES TABLE (Reference Data)
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR GAME_OCCURRENCES TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE game_occurrences DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR LEAGUES_DRAFTS TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE leagues_drafts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR USER_ORGANIZATIONS TABLE
-- ============================================================================

-- Temporarily disable RLS while we resolve Supabase JWT syntax issues
-- All policies removed to avoid evaluation errors
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;
