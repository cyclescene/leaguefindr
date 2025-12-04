-- Update organizations RLS policy to hide soft-deleted organizations from non-admin users
-- Active orgs visible to everyone
-- Soft-deleted (is_active=false) orgs visible only to admins

-- First, drop the existing permissive policy
DROP POLICY IF EXISTS "Everyone can view organizations" ON organizations;

-- Create new policy:
-- - Active organizations (is_active = true) visible to everyone
-- - Soft-deleted organizations (is_active = false) visible only to admins
CREATE POLICY "View organizations based on active status"
ON organizations FOR SELECT
USING (
  is_active = true
  OR ((SELECT auth.jwt()))->>'appRole' = 'admin'
);

-- Keep other policies unchanged for update/delete on organizations
