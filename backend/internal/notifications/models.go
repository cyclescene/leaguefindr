package notifications

// NotificationType represents the types of notifications
type NotificationType string

const (
	NotificationLeagueApproved  NotificationType = "league_approved"
	NotificationLeagueRejected  NotificationType = "league_rejected"
	NotificationLeagueSubmitted NotificationType = "league_submitted"
	NotificationDraftSaved      NotificationType = "draft_saved"
	NotificationTemplateSaved   NotificationType = "template_saved"
)

// String returns the string representation of the notification type
func (n NotificationType) String() string {
	return string(n)
}

// MarkNotificationAsReadRequest represents a request to mark a notification as read
type MarkNotificationAsReadRequest struct {
	NotificationID int `json:"notificationID" validate:"required"`
}

// GetNotificationsRequest represents a request to get notifications with pagination
type GetNotificationsRequest struct {
	Limit  int `query:"limit" validate:"omitempty,min=1,max=100" default:"20"`
	Offset int `query:"offset" validate:"omitempty,min=0" default:"0"`
}
