-- Create notifications table and notification_preferences table
-- Notifications are published to Supabase Realtime via broadcast
-- Preferences control what notifications users receive

-- ============================================================================
-- NOTIFICATION_PREFERENCES TABLE
-- ============================================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  league_approved BOOLEAN DEFAULT true,
  league_rejected BOOLEAN DEFAULT true,
  league_submitted BOOLEAN DEFAULT true,
  draft_saved BOOLEAN DEFAULT true,
  template_saved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS 'User notification preferences controlling what types of notifications they receive. Defaults allow all notification types.';
COMMENT ON COLUMN notification_preferences.user_id IS 'Clerk user ID';
COMMENT ON COLUMN notification_preferences.league_approved IS 'Receive notifications when league is approved';
COMMENT ON COLUMN notification_preferences.league_rejected IS 'Receive notifications when league is rejected';
COMMENT ON COLUMN notification_preferences.league_submitted IS 'Admins receive notifications when new league is submitted';
COMMENT ON COLUMN notification_preferences.draft_saved IS 'Receive notifications when draft is auto-saved';
COMMENT ON COLUMN notification_preferences.template_saved IS 'Receive notifications when template is saved';

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'league_approved', 'league_rejected', 'league_submitted', 'draft_saved', 'template_saved'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  related_league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
  related_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

COMMENT ON TABLE notifications IS 'Notification records for audit trail and read status tracking. Published to Realtime via broadcast before being persisted here.';
COMMENT ON COLUMN notifications.type IS 'Notification type: league_approved, league_rejected, league_submitted, draft_saved';
COMMENT ON COLUMN notifications.read IS 'Whether the user has read this notification';
COMMENT ON COLUMN notifications.related_league_id IS 'Reference to related league if applicable';
COMMENT ON COLUMN notifications.related_org_id IS 'Reference to related organization if applicable';

-- ============================================================================
-- FUNCTION TO CREATE DEFAULT NOTIFICATION PREFERENCES
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires AFTER INSERT on auth.users
CREATE TRIGGER trg_create_notification_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

COMMENT ON FUNCTION create_default_notification_preferences() IS 'Automatically creates notification preferences with defaults when a new user is created.';
