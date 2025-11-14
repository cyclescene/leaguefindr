# Future Features

This document tracks features and improvements that have been discussed but are not currently prioritized for immediate implementation.

## 1. Notification System

### Overview
Implement a comprehensive notification system to keep users informed of important events and status changes.

### Key Features
- **Real-time notifications** for admins when new leagues are submitted
- **Email notifications** for organizers when leagues are approved/rejected
- **In-app notification center** showing recent activity
- **Notification preferences** allowing users to customize what they receive

### Potential Implementation
- Use Supabase Realtime for in-app notifications
- Email service (SendGrid, AWS SES, or similar) for email notifications
- Notification table in database to track read/unread status
- Toast notifications for immediate feedback

### Use Cases
- Admin: "New league submitted by [Organization Name]"
- Organizer: "Your league '[League Name]' has been approved!"
- Organizer: "Your league '[League Name]' was rejected. Reason: [...]"
- System: "Draft auto-saved successfully"

---

## 2. Supabase Realtime Integration

### Current Architecture
- All data operations go through the Go backend API
- Frontend uses SWR for data fetching and caching
- No real-time updates - requires manual refresh or polling

### Proposed Enhancement
Use a hybrid approach combining the Go backend with Supabase client for read operations:

**Benefits:**
- Real-time dashboard updates via Supabase subscriptions
- Reduced backend load for read operations
- Leverage Supabase's built-in features (RLS, real-time, auth extensions)
- Powers the notification system with real-time events

**Implementation Approach:**
1. Backend issues Supabase-compatible JWTs to authenticated users
2. Frontend uses Supabase client for reads (with RLS policies)
3. All mutations (create, update, delete) continue through Go API
4. Real-time subscriptions for dashboard updates (e.g., new league submissions)

**Security Considerations:**
- Row-Level Security (RLS) policies enforce data access
- Backend validates all mutations
- Supabase JWTs have same claims as Clerk tokens
- Short-lived tokens with refresh mechanism

**Why Deferred:**
- Current polling/SWR approach works adequately
- Adds complexity to auth flow
- Can be added incrementally without breaking changes

---

## 3. Password Management

### Current State
- Authentication handled entirely by Clerk
- No custom password change functionality in dashboard

### Proposed Feature
Integrate Clerk's password management:
- Add "Change Password" option in user settings
- Use Clerk's `<UserProfile />` component or custom implementation
- Leverage Clerk's password reset flow
- Add to user settings/profile page in dashboard

**Why Deferred:**
- Clerk provides this out of the box
- Low priority compared to core league management features
- Can be added as a settings page enhancement

---

## 4. Public Website Integration

### Overview
Integrate the dashboard with the public-facing LeagueFindr website to display approved leagues.

### Key Features
- **Public league listings** showing all approved leagues
- **Search and filtering** by sport, location, date, gender, etc.
- **League detail pages** with registration links
- **Organization profiles** showing their approved leagues
- **SEO optimization** for league discovery

### Integration Points
- Use existing public API endpoint: `GET /v1/leagues/approved`
- Individual league endpoint: `GET /v1/leagues/approved/{id}`
- Share design system/components between dashboard and public site
- Separate frontend deployment for public site

### Potential Features
- Map view showing league venues
- Calendar view of league start dates
- Email alerts for new leagues in user's area
- Social sharing for league pages
- Registration tracking/waitlists

**Why Deferred:**
- Dashboard and admin functionality takes priority
- Requires frontend for public site
- Need sufficient approved league data for meaningful public listing
- Can be built once admin workflow is stable

---

## Implementation Priority

Based on impact and dependencies:

1. **Notification System** - High impact for user engagement and admin efficiency
2. **Public Website Integration** - Critical for end-user value proposition
3. **Supabase Realtime** - Enhances notification system and user experience
4. **Password Management** - Nice-to-have, low complexity

---

## Notes
- These features can be implemented independently (except Realtime + Notifications work well together)
- All enhance user experience but aren't blocking for core functionality
- Prioritize based on user feedback and usage patterns
- Notification system pairs well with Supabase Realtime for best UX
