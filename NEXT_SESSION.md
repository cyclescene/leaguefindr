# Next Session Plan - Supabase Cloud Migration

**Date of Last Session:** November 16, 2025

## 🎯 Current Status

**The Problem:** Local Supabase cannot integrate with Clerk (cloud service). Clerk can't reach `localhost`, causing 401 errors and JWT validation failures.

**The Solution:** Move Supabase to the cloud (Supabase.com free tier).

### ✅ What's Working
- Frontend Supabase client (cached, no duplicate instances)
- Error logging in all hooks (detailed error objects)
- Backend JWT validation and token generation
- Auth middleware properly extracting user IDs
- Test user seeded with admin role
- RLS disabled on all tables (temporary workaround)

### ❌ What's Blocking
- Local Supabase can't validate JWTs from cloud Clerk
- 401 Unauthorized errors on all Supabase queries
- Clerk third-party auth integration requires internet-accessible instance

---

## 📋 Steps for Next Session

### Step 1: Create Supabase Cloud Project (15 min)
```bash
# 1. Go to https://supabase.com
# 2. Sign up / Login
# 3. Create a new project (free tier)
# 4. Save these details:
#    - Project URL (https://xxxxx.supabase.co)
#    - Anon Key (from API settings)
#    - JWT Secret (from Project Settings → JWT Secret)
#    - Service Role Key (optional, for backend operations)
```

### Step 2: Update Environment Variables (10 min)

**Frontend (`frontend/dashboard/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Backend (`.env` or system environment):**
```bash
# Must match cloud JWT secret exactly!
export SUPABASE_JWT_SECRET="your-cloud-jwt-secret"
export SUPABASE_URL="https://xxxxx.supabase.co"
```

### Step 3: Migrate Schema to Cloud (15 min)
```bash
# Option A: Using Supabase CLI (if configured)
supabase link --project-ref your-project-ref
supabase push

# Option B: Manual migration
# 1. Go to Supabase Cloud console → SQL Editor
# 2. Copy migrations from backend/supabase/migrations/ in order:
#    - 20251115082400_create_clean_schema.sql
#    - 20251115082401_create_game_occurrences_table.sql
#    - 20251115082402_create_leagues_staging_and_trigger.sql
#    - 20251115082403_create_organizations_staging_and_trigger.sql
#    - 20251115082404_create_notifications_and_preferences.sql
#    - 20251115082405_create_rls_policies_for_realtime.sql
# 3. Run each migration in order in the SQL Editor
# 4. Run seed.sql to create test data
```

### Step 4: Verify & Test (20 min)
```bash
# 1. Stop local supabase
supabase stop

# 2. Restart backend with new env vars
go run ./cmd/api

# 3. Reload frontend (hard refresh)
# Ctrl+Shift+R or Cmd+Shift+R

# 4. Check browser console for:
#    - "RLS: User role claim = admin" (good token)
#    - useSports - no errors (queries working)
#    - useLeaguesReadOnly - returns data
#    - No 401 errors

# 5. Check backend logs for:
#    - "JWTMiddleware: token verified successfully"
#    - "Creating Supabase token claims" with role=admin
#    - No token verification failures
```

---

## 🔧 Technical Details

### JWT Token Flow (What Should Happen)
```
1. User signs in via Clerk in browser
2. Frontend calls: fetch('/v1/auth/supabase-token')
   └─ Header: Authorization: Bearer {CLERK_JWT}
3. Backend JWTMiddleware:
   └─ Validates Clerk JWT with Clerk SDK
   └─ Extracts user ID
   └─ Sets X-Clerk-User-ID header
4. Backend GetSupabaseToken handler:
   └─ Gets user role from database
   └─ Creates Supabase JWT with:
      • role: "admin" (from database)
      • sub: "user_35aLezBPrIKwG8UHGKU2Cy5g9Ba" (user ID)
      • email: "test@test.com"
   └─ Signs with SUPABASE_JWT_SECRET
   └─ Returns token to frontend
5. Frontend stores token and uses in Supabase client:
   └─ All queries include: Authorization: Bearer {SUPABASE_JWT}
6. Supabase Cloud validates JWT:
   └─ Verifies signature with cloud JWT_SECRET
   └─ Grants access if valid
```

### Critical: JWT Secret Must Match
- Local `config.toml`: `jwt_secret = "super-secret-jwt-token-with-at-least-32-characters-long"`
- Cloud: Find in Project Settings → JWT Secret
- Backend env var: `SUPABASE_JWT_SECRET` must match cloud secret exactly
- If they don't match → 401 Unauthorized errors

### Test User Details
- **ID:** `user_35aLezBPrIKwG8UHGKU2Cy5g9Ba`
- **Email:** `test@test.com`
- **Role:** `admin`
- **Organizations:** Assigned to all 3 test organizations
- Created by seed.sql automatically

---

## 📁 Key Files

### Frontend
- `lib/supabase.ts` - Supabase client initialization (cached)
- `hooks/useSupabaseToken.ts` - Token fetch and refresh logic
- `hooks/useReadOnlyData.ts` - All data queries with error handling
- `.env.local` - Environment variables (needs updating)

### Backend
- `internal/auth/handler.go` - Token endpoint (`/v1/auth/supabase-token`)
- `internal/auth/middleware.go` - JWT validation from Clerk
- `internal/auth/supabase.go` - Supabase token generation with claims
- `cmd/api/main.go` - Backend entry point

### Database (Local)
- `backend/supabase/config.toml` - Will stop using after cloud migration
- `backend/supabase/seed.sql` - Test data (will run on cloud)
- `backend/supabase/migrations/` - All 6 schema migrations

---

## 🚀 Expected Outcome After Cloud Migration

✅ Frontend can authenticate via Clerk
✅ Backend generates valid Supabase JWTs
✅ Supabase Cloud validates tokens
✅ All data queries work without errors
✅ Admin user sees all leagues
✅ Real-time features (if implemented later) work
✅ RLS can be re-enabled and tested one table at a time

---

## 📝 Recent Commits (For Reference)

```
0647b9a - debug: Add detailed logging to JWT auth flow
1f435f7 - feat: Add test user to seed.sql with admin role
6735f7f - fix: Explicitly drop all RLS policies in migrations
c0a0e66 - fix: Remove all RLS policies to resolve JWT evaluation errors
4bd4d7c - fix: Improve error stringification to handle non-serializable Supabase errors
8f0b4b3 - feat: Add proper error stringification to all Supabase hooks
3455faf - fix: Prevent multiple GoTrueClient instances by caching Supabase client
```

---

## ⚠️ Potential Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | JWT secret mismatch | Verify `SUPABASE_JWT_SECRET` matches cloud JWT secret exactly |
| "role \"admin\" does not exist" | RLS policies still evaluating | RLS is disabled, but if re-enabled check policy syntax |
| Queries return empty | Token not being sent | Check Authorization header in Supabase client |
| Stale data after reset | Seed.sql not run on cloud | Run seed.sql in Supabase SQL Editor after migrations |

---

## 🎯 After Cloud Migration (Future Work)

Once cloud migration is working:
1. Re-enable RLS policies (one table at a time)
2. Test RLS filtering (admin sees all, users see filtered)
3. Implement real-time subscriptions with Supabase Realtime
4. Set up production deployment (Vercel + Supabase)
5. Configure authentication in production

Good luck! The hard part is done - just need to move to cloud now. 🚀
