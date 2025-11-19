# Next Session - Frontend Refactor Setup

## Current Status

✅ **Backend Refactoring Complete**
- All backend modules migrated from pgx to PostgREST
- Two-client architecture implemented (publishable + secret keys)
- Count support added to all paginated endpoints
- RLS enforcement working at database layer

✅ **Git Management**
- Feature branch `feat/supabase-data-queries` merged to `dev`
- New branch `feat/frontend-supabase-client` created and ready

✅ **Frontend Analysis Complete**
- Discovered that `hooks/useReadOnlyData.ts` already uses Supabase client for most read operations
- Identified that `hooks/useAdminLeagues.ts` still uses backend API for admin reads
- Mapped out all frontend hooks needing review

✅ **Comprehensive Plan Created**
- 4-phase migration plan documented in `FRONTEND_REFACTOR_PLAN.md`
- Code patterns established for read vs write operations
- Testing strategy outlined

---

## What to Do Next Session

### Phase 1: Comprehensive Audit (Start Here)

**Objective:** Identify all backend API calls in frontend and categorize them

**Files to Search:**
```
frontend/dashboard/
├── hooks/
│   ├── useAdminLeagues.ts           ← PRIMARY FOCUS
│   ├── useDrafts.ts                 ← NEEDS REVIEW
│   ├── useOrganizations.ts          ← NEEDS REVIEW
│   ├── useSportSearch.ts            ← CHECK
│   ├── useVenueSearch.ts            ← CHECK
│   ├── useOrganizationSearch.ts     ← CHECK
│   ├── useSportExistenceCheck.ts    ← CHECK
│   └── useAutocompleteLogic.ts      ← CHECK
├── components/
│   ├── organizer/                   ← CHECK TABLE COMPONENTS
│   ├── organizations/               ← CHECK FORM COMPONENTS
│   └── forms/                       ← CHECK FORM SUBMISSIONS
└── lib/
    ├── api.ts                       ← REVIEW FETCHER
    └── rlsTest.ts                   ← CHECK RLS TESTS
```

**Audit Checklist:**
```
For Each File:
- [ ] Find all fetch() calls
- [ ] Find all useSWR() calls
- [ ] List each API endpoint called
- [ ] Categorize as: Read / Write / Unknown
- [ ] Note any complex logic or joins
- [ ] Note error handling patterns

Endpoints Currently Using Backend API:
- GET /v1/leagues/admin/pending - Read (MIGRATE)
- GET /v1/leagues/admin/all - Read (MIGRATE)
- GET /v1/leagues/admin/{id} - Read (MIGRATE)
- GET /v1/leagues/admin/drafts/all - Read (MIGRATE)
- DELETE /v1/leagues/drafts/org/{orgId} - Write (KEEP)
- PUT /v1/leagues/admin/{id}/approve - Write (KEEP)
- PUT /v1/leagues/admin/{id}/reject - Write (KEEP)
- [Document others you find]
```

**Output:** Create `FRONTEND_AUDIT_RESULTS.md` with:
- All API endpoints categorized
- Detailed breakdown per hook
- Migration priority list
- Any unexpected patterns found

---

## Key Insights from Backend Refactoring

### Backend Now Uses Two-Client Pattern

```go
// Publishable key (user-facing with RLS)
postgrestClient := postgrest.NewClient(
  cfg.SupabaseURL+"/rest/v1",
  "public",
  map[string]string{"apikey": cfg.SupabaseAnonKey},
)

// Secret key (backend admin operations)
postgrestServiceClient := postgrest.NewClient(
  cfg.SupabaseURL+"/rest/v1",
  "public",
  map[string]string{"apikey": cfg.SupabaseSecretKey},
)
```

### Frontend Should Use Similar Pattern

Frontend doesn't need two clients (no secret key in browser), but:
- ✅ Read operations: Supabase client with Clerk JWT
- ✅ Write operations: Backend API (already has proper auth)

### RLS Policies Are Working

From backend testing:
- Admin users can see all leagues
- Regular users see only approved + their own
- Non-members can't access organization data
- Clerk JWT enforces authentication

### Count Pagination Pattern

Backend uses: `.Select("*", "exact", false)` for accurate pagination count

Frontend equivalent: `.select('*', { count: 'exact' })`

---

## Helpful Code References

### Supabase Client Already Working Well
File: `hooks/useReadOnlyData.ts` - This is your template!

Look at how these hooks work:
- `useSports()` - Simple table select
- `useVenues()` - Simple table select
- `useLeaguesReadOnly()` - With joins and ordering
- `useApprovedLeagues()` - With filtering (eq)
- `useDraftById()` - Single row with .single()

### Key Patterns to Reuse
```typescript
// 1. Get Supabase client from context
const { supabase, isLoaded } = useSupabase()

// 2. Use useCallback for fetch logic
const fetch = useCallback(async () => {
  if (!supabase) return
  const { data, count, error } = await supabase
    .from('table')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)

  setState({ data, isLoading: false, error })
}, [supabase, offset, limit])

// 3. Call in useEffect
useEffect(() => {
  if (isLoaded && supabase) fetch()
}, [isLoaded, supabase, fetch])
```

### Admin Hooks Still Using Backend (To Migrate)
File: `hooks/useAdminLeagues.ts` - This needs refactoring

Current pattern (wrong):
```typescript
const { getToken } = useAuth()
const { data, error, isLoading } = useSWR(
  `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/pending`,
  async (url) => {
    const token = await getToken()
    return fetcher(url, token)  // ← Backend API call
  }
)
```

New pattern (correct):
```typescript
const { supabase, isLoaded } = useSupabase()
// Use Supabase client directly, RLS handles filtering
```

---

## Important Notes for Next Session

1. **Don't Change Write Operations Yet**
   - Keep using backend API for CREATE/UPDATE/DELETE
   - Backend handles write authorization properly
   - Only migrate READ operations in Phase 1

2. **RLS Will Handle Permission Filtering**
   - Don't add manual role checks in frontend
   - Trust the RLS policies in database
   - Admin sees all, users see only theirs

3. **Response Format May Differ**
   - Backend: `{ leagues: [...], total: 100, limit: 20, offset: 0 }`
   - Supabase: `{ data: [...], count: 100, error: null }`
   - May need adapter function to match old format

4. **Count Parameter is Important**
   - Use `.select('*', { count: 'exact' })` for pagination
   - `exact` mode scans all matching rows (accurate but slower)
   - Better than `estimated` which uses table stats

5. **Pagination Math**
   - Frontend offset/limit: 0-indexed
   - Supabase `.range(offset, offset + limit - 1)` formula
   - Example: limit=20, offset=0 → .range(0, 19)

---

## Commands for Next Session

```bash
# Make sure you're on the right branch
git branch

# Should show: * feat/frontend-supabase-client

# If not:
git checkout feat/frontend-supabase-client

# View the plan
cat FRONTEND_REFACTOR_PLAN.md

# Start auditing by searching for API calls
grep -r "NEXT_PUBLIC_API_URL" frontend/dashboard/hooks/
grep -r "useSWR" frontend/dashboard/hooks/
grep -r "fetch(" frontend/dashboard/hooks/
```

---

## Success Criteria for Phase 1

✅ Complete when:
1. All backend API calls in frontend identified
2. Each categorized as Read/Write/Unknown
3. Migration priority list created
4. `FRONTEND_AUDIT_RESULTS.md` completed
5. No surprises in the codebase

⏱️ Estimated time: 1-2 hours

---

## Files You'll Need

- **To Read:** `FRONTEND_REFACTOR_PLAN.md` (you just created this!)
- **To Review:** `frontend/dashboard/lib/supabase.ts` (how Supabase is initialized)
- **To Study:** `frontend/dashboard/hooks/useReadOnlyData.ts` (working examples)
- **To Understand:** `backend/cmd/api/router.go` (what endpoints exist)

---

## Quick Reference: Architecture After Refactor

### Read Operations (Direct from Supabase)
```
Frontend Hook
  ↓
useSupabase() context
  ↓
supabase.from('table').select()
  ↓ (Clerk JWT in headers)
Supabase API
  ↓
RLS Policies (filter data)
  ↓
Database
```

### Write Operations (Backend API)
```
Frontend Hook
  ↓
useAuth() for token
  ↓
fetch() to backend API
  ↓
Backend service (context-aware PostgREST)
  ↓
Supabase API
  ↓
Database
```

---

## You're All Set! 🚀

Everything is documented and ready. Just:
1. Read the plan
2. Audit the frontend code
3. Document your findings
4. Come back and execute Phase 2 (migration)

Good luck with the refactoring!
