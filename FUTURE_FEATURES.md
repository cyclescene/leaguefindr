# Future Features

## 1. Real-time Notifications with Supabase Client

### Overview
Implement a hybrid architecture using Supabase client for read operations and real-time updates while keeping all mutations in the Go backend.

### Implementation Plan
- **Backend:** Create endpoint to issue Supabase JWTs with custom claims (user_id, org_ids, is_admin)
- **Frontend:** Set up Supabase client with JWT authentication
- **Real-time:** Subscribe to PostgreSQL changes via Supabase Realtime (WebSocket)
- **RLS Policies:** Implement Row-Level Security for read-only access
- **Write Operations:** Keep all mutations (create, update, delete) through Go API

### Benefits
- Instant dashboard updates when leagues are submitted/approved (no polling)
- Reduced backend load for read-heavy operations
- WebSocket connection managed by Supabase (no custom implementation needed)
- Single source of truth for authentication (Go backend controls access via JWT claims)

### Technical Details
- Exchange Clerk JWT for Supabase JWT via Go endpoint
- RLS policies enforce read permissions based on JWT claims
- All writes still validated through Go API (transactions, business logic, email notifications)
- Dashboard queries bypass Go API, read directly from Supabase

---

## 2. Password Change Functionality

### Overview
Allow users to change their passwords through Clerk's built-in password management.

### Implementation Details
- Users table only stores `user_id` - all auth data (email, password) managed by Clerk
- Use Clerk's built-in password change functionality
- Frontend integrates with Clerk's `<UserProfile />` component or custom form with Clerk API

### Tasks
- [ ] Add password change section to user settings page
- [ ] Integrate Clerk's password change API/component
- [ ] Clerk automatically handles email notifications and security
- [ ] No backend changes needed (Clerk manages everything)
