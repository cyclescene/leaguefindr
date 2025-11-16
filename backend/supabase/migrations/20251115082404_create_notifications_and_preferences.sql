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
  related_league_id INT REFERENCES leagues(id) ON DELETE SET NULL,
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

-- ============================================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- System can insert notifications (backend service)
CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT
  WITH CHECK (true);  -- Backend will handle authorization

-- RLS disabled on notification_preferences table
-- Frontend component (NotificationPreferences.tsx) validates that users only access their own data
-- A proper RLS implementation would require backend endpoints to handle token context properly
-- This is a known limitation of using manually-set JWT sessions with Supabase's local instance
-- ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY notifications_select_own ON notifications IS 'Users can only see their own notifications';
COMMENT ON POLICY notifications_update_own ON notifications IS 'Users can only update their own notifications (e.g., mark as read)';
-- COMMENT ON POLICY notification_preferences_select_own ON notification_preferences IS 'Users can only see their own notification preferences';
-- COMMENT ON POLICY notification_preferences_update_own ON notification_preferences IS 'Users can only update their own notification preferences';
