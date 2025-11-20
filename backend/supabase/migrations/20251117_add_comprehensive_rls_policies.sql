-- Comprehensive Row-Level Security (RLS) Policies
-- Consolidated RLS policies for all tables using Clerk JWT claims
-- Uses appRole claim for admin checks and sub claim for user identification

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_id_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues_staging ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users see their own profile, admins see all
CREATE POLICY "Users see their own profile"
ON users FOR SELECT
USING (
  (((SELECT auth.jwt()))->>'sub')::text = id
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- Users update their own profile, admins can update anyone
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (
  (((SELECT auth.jwt()))->>'sub')::text = id
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
)
WITH CHECK (
  (((SELECT auth.jwt()))->>'sub')::text = id
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- Only admins can delete users
CREATE POLICY "Only admins can delete users"
ON users FOR DELETE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- ============================================================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================================================

-- Everyone can view all organizations
CREATE POLICY "Everyone can view organizations"
ON organizations FOR SELECT
USING (true);

-- Admins and organizers can create organizations
CREATE POLICY "Admins and organizers can create organizations"
ON organizations FOR INSERT
WITH CHECK (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
  OR ((SELECT auth.jwt()))->>'appRole' = 'organizer'
);

-- Admins and org members can update organizations
CREATE POLICY "Admins and org members can update organizations"
ON organizations FOR UPDATE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
  OR (((SELECT auth.jwt()))->>'sub')::text IN (
    SELECT user_id FROM user_organizations
    WHERE org_id = organizations.id AND is_active = true
  )
);

-- Admins and org members can delete organizations
CREATE POLICY "Admins and org members can delete organizations"
ON organizations FOR DELETE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
  OR (((SELECT auth.jwt()))->>'sub')::text IN (
    SELECT user_id FROM user_organizations
    WHERE org_id = organizations.id AND is_active = true
  )
);

-- ============================================================================
-- USER_ORGANIZATIONS TABLE POLICIES
-- ============================================================================

-- Users see their own memberships, admins see all
CREATE POLICY "Users see their organization memberships"
ON user_organizations FOR SELECT
USING (
  (SELECT ((SELECT auth.jwt()))->>'sub')::text = user_id
  OR (SELECT ((SELECT auth.jwt()))->>'appRole') = 'admin'
);

-- Only organizers and admins can be added to user_organizations
CREATE POLICY "Only organizers and admins can join organizations"
ON user_organizations FOR INSERT
WITH CHECK (
  (SELECT ((SELECT auth.jwt()))->>'appRole') = 'admin'
  OR (
    (SELECT ((SELECT auth.jwt()))->>'sub')::text = user_id
    AND ((SELECT ((SELECT auth.jwt()))->>'appRole') = 'organizer' OR (SELECT ((SELECT auth.jwt()))->>'appRole') = 'admin')
  )
);

-- Users can update their own membership, admins can update any
CREATE POLICY "Users can update their own org memberships"
ON user_organizations FOR UPDATE
USING (
  (SELECT ((SELECT auth.jwt()))->>'sub')::text = user_id
  OR (SELECT ((SELECT auth.jwt()))->>'appRole') = 'admin'
);

-- Users can leave organizations themselves, admins can remove anyone
CREATE POLICY "Users can leave organizations"
ON user_organizations FOR DELETE
USING (
  (SELECT ((SELECT auth.jwt()))->>'sub')::text = user_id
  OR (SELECT ((SELECT auth.jwt()))->>'appRole') = 'admin'
);

-- ============================================================================
-- SPORTS TABLE POLICIES
-- ============================================================================

-- Everyone can view sports
CREATE POLICY "Everyone can view sports"
ON sports FOR SELECT
USING (true);

-- Only admins can create sports
CREATE POLICY "Only admins can create sports"
ON sports FOR INSERT
WITH CHECK (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- Only admins can update sports
CREATE POLICY "Only admins can update sports"
ON sports FOR UPDATE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- Only admins can delete sports
CREATE POLICY "Only admins can delete sports"
ON sports FOR DELETE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- ============================================================================
-- VENUES TABLE POLICIES
-- ============================================================================

-- Everyone can view venues
CREATE POLICY "Everyone can view venues"
ON venues FOR SELECT
USING (true);

-- Only admins can create venues
CREATE POLICY "Only admins can create venues"
ON venues FOR INSERT
WITH CHECK (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- Only admins can update venues
CREATE POLICY "Only admins can update venues"
ON venues FOR UPDATE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- Only admins can delete venues
CREATE POLICY "Only admins can delete venues"
ON venues FOR DELETE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- ============================================================================
-- LEAGUES TABLE POLICIES
-- ============================================================================

-- SELECT: Everyone sees approved leagues, org members see their org's leagues, admins see all
CREATE POLICY "Users see approved and their org leagues"
ON leagues FOR SELECT
USING (
  status = 'approved'
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
  OR (((SELECT auth.jwt()))->>'sub')::text IN (
    SELECT user_id FROM user_organizations
    WHERE org_id = leagues.org_id AND is_active = true
  )
);

-- INSERT: Org members and admins can create leagues
CREATE POLICY "Org members and admins can create leagues"
ON leagues FOR INSERT
WITH CHECK (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
  OR EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = (((SELECT auth.jwt()))->>'sub')::text
    AND user_organizations.org_id = leagues.org_id
    AND is_active = true
  )
);

-- UPDATE: Org members, creators, and admins can update
CREATE POLICY "Org members and admins can update leagues"
ON leagues FOR UPDATE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
  OR (((SELECT auth.jwt()))->>'sub')::text IN (
    SELECT user_id FROM user_organizations
    WHERE org_id = leagues.org_id AND is_active = true
  )
  OR (((SELECT auth.jwt()))->>'sub')::text = created_by
);

-- DELETE: Org members, creators, and admins can delete
CREATE POLICY "Org members and admins can delete leagues"
ON leagues FOR DELETE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
  OR (((SELECT auth.jwt()))->>'sub')::text IN (
    SELECT user_id FROM user_organizations
    WHERE org_id = leagues.org_id AND is_active = true
  )
  OR (((SELECT auth.jwt()))->>'sub')::text = created_by
);

-- ============================================================================
-- LEAGUES_DRAFTS TABLE POLICIES
-- Note: This table stores both drafts (type='draft') and templates (type='template')
-- ============================================================================

-- SELECT: Owners and org members can view drafts/templates
CREATE POLICY "Users see their own and org drafts"
ON leagues_drafts FOR SELECT
USING (
  (((SELECT auth.jwt()))->>'sub')::text = created_by
  OR (((SELECT auth.jwt()))->>'sub')::text IN (
    SELECT user_id FROM user_organizations
    WHERE org_id = leagues_drafts.org_id AND is_active = true
  )
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- INSERT: Organizers and admins can create drafts/templates
CREATE POLICY "Organizers and admins can create drafts"
ON leagues_drafts FOR INSERT
WITH CHECK (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
  OR ((SELECT auth.jwt()))->>'appRole' = 'organizer'
);

-- UPDATE: Owners and org members can update drafts/templates
CREATE POLICY "Users and org members can update drafts"
ON leagues_drafts FOR UPDATE
USING (
  (((SELECT auth.jwt()))->>'sub')::text = created_by
  OR (((SELECT auth.jwt()))->>'sub')::text IN (
    SELECT user_id FROM user_organizations
    WHERE org_id = leagues_drafts.org_id AND is_active = true
  )
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- DELETE: Owners and org members can delete drafts/templates
CREATE POLICY "Users can delete their own drafts"
ON leagues_drafts FOR DELETE
USING (
  (((SELECT auth.jwt()))->>'sub')::text = created_by
  OR (((SELECT auth.jwt()))->>'sub')::text IN (
    SELECT user_id FROM user_organizations
    WHERE org_id = leagues_drafts.org_id AND is_active = true
  )
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- ============================================================================
-- GAME_OCCURRENCES TABLE POLICIES
-- ============================================================================

-- SELECT: Everyone can view game occurrences
CREATE POLICY "Everyone can view game occurrences"
ON game_occurrences FOR SELECT
USING (true);

-- INSERT: Only admins can create game occurrences
CREATE POLICY "Only admins can create game occurrences"
ON game_occurrences FOR INSERT
WITH CHECK (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- UPDATE: Only admins can update game occurrences
CREATE POLICY "Only admins can update game occurrences"
ON game_occurrences FOR UPDATE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- DELETE: Only admins can delete game occurrences
CREATE POLICY "Only admins can delete game occurrences"
ON game_occurrences FOR DELETE
USING (
  ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- SELECT: Users see their own notifications, admins see all
-- Note: Filter by notification type (league_submitted, league_approved, etc.) in application layer
CREATE POLICY "Users see their own notifications"
ON notifications FOR SELECT
USING (
  (((SELECT auth.jwt()))->>'sub')::text = user_id
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- INSERT: System/backend creates notifications (trusted)
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- UPDATE: Users can update their own, admins can update any
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (
  (((SELECT auth.jwt()))->>'sub')::text = user_id
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- DELETE: Users delete their own, admins can delete any
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (
  (((SELECT auth.jwt()))->>'sub')::text = user_id
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- ============================================================================
-- NOTIFICATION_PREFERENCES TABLE POLICIES
-- ============================================================================

-- SELECT: Users see their own, admins see all
CREATE POLICY "Users see their own notification preferences"
ON notification_preferences FOR SELECT
USING (
  (SELECT ((SELECT auth.jwt()))->>'sub')::text = user_id
  OR (SELECT ((SELECT auth.jwt()))->>'appRole') = 'admin'
);

-- INSERT: Users create their own preferences
CREATE POLICY "Users can create their own notification preferences"
ON notification_preferences FOR INSERT
WITH CHECK (
  (SELECT ((SELECT auth.jwt()))->>'sub')::text = user_id
);

-- UPDATE: Users update their own, admins can update any
CREATE POLICY "Users can update their own notification preferences"
ON notification_preferences FOR UPDATE
USING (
  (SELECT ((SELECT auth.jwt()))->>'sub')::text = user_id
  OR (SELECT ((SELECT auth.jwt()))->>'appRole') = 'admin'
);

-- DELETE: Users delete their own, admins can delete any
CREATE POLICY "Users can delete their own notification preferences"
ON notification_preferences FOR DELETE
USING (
  (SELECT ((SELECT auth.jwt()))->>'sub')::text = user_id
  OR (SELECT ((SELECT auth.jwt()))->>'appRole') = 'admin'
);

-- ============================================================================
-- STAGING AND MAPPING TABLES - BACKEND ONLY
-- ============================================================================
-- These tables are internal to backend processes and should NOT be accessible
-- to frontend clients. All operations are restricted to backend service role.

-- ============================================================================
-- ORG_ID_MAPPING TABLE POLICIES
-- ============================================================================
-- Deny all client access - backend only via service role

CREATE POLICY "Deny all SELECT on org_id_mapping"
ON org_id_mapping FOR SELECT
USING (false);

CREATE POLICY "Deny all INSERT on org_id_mapping"
ON org_id_mapping FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny all UPDATE on org_id_mapping"
ON org_id_mapping FOR UPDATE
USING (false);

CREATE POLICY "Deny all DELETE on org_id_mapping"
ON org_id_mapping FOR DELETE
USING (false);

-- ============================================================================
-- ORGANIZATIONS_STAGING TABLE POLICIES
-- ============================================================================
-- Deny all client access - backend only via service role

CREATE POLICY "Deny all SELECT on organizations_staging"
ON organizations_staging FOR SELECT
USING (false);

CREATE POLICY "Deny all INSERT on organizations_staging"
ON organizations_staging FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny all UPDATE on organizations_staging"
ON organizations_staging FOR UPDATE
USING (false);

CREATE POLICY "Deny all DELETE on organizations_staging"
ON organizations_staging FOR DELETE
USING (false);

-- ============================================================================
-- LEAGUES_STAGING TABLE POLICIES
-- ============================================================================
-- Deny all client access - backend only via service role

CREATE POLICY "Deny all SELECT on leagues_staging"
ON leagues_staging FOR SELECT
USING (false);

CREATE POLICY "Deny all INSERT on leagues_staging"
ON leagues_staging FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny all UPDATE on leagues_staging"
ON leagues_staging FOR UPDATE
USING (false);

CREATE POLICY "Deny all DELETE on leagues_staging"
ON leagues_staging FOR DELETE
USING (false);
