# Frontend Supabase Client Refactor Plan

**Branch:** `feat/frontend-supabase-client`
**Base:** `dev` (includes all backend PostgREST refactoring)

## Overview

Refactor the frontend to use the Supabase JavaScript client directly for **read operations** instead of going through the backend API. Write operations and protected routes continue using the backend.

### Why This Matters

**Current Issue:**
- Frontend read operations go through backend API (slow, extra hop)
- Read operations should use RLS directly from Supabase
- Backend should only handle write operations (create, update, delete)

**After Refactoring:**
- ✅ Frontend reads directly from Supabase (faster, real-time support)
- ✅ RLS enforced at database level with JWT from Clerk
- ✅ Backend focuses on write operations only
- ✅ All read operations leverage Supabase client capabilities

---

## Architecture Pattern

### Read Operations (Frontend → Supabase Direct)
```
Frontend Hook (useReadOnlyData.ts)
  ↓
Supabase Client (lib/supabase.ts)
  ↓ (includes Clerk JWT in headers)
  ↓
Supabase API (with RLS enforcement)
  ↓
Database (RLS policies filter results)
```

### Write Operations (Frontend → Backend → Supabase)
```
Frontend Component
  ↓
Backend Handler API (POST/PUT/DELETE)
  ↓
Backend Service (context-aware PostgREST client)
  ↓
Supabase API (with backend JWT)
  ↓
Database
```

---

## Current State Analysis

### Read Operations (Already Using Supabase)
✅ `hooks/useReadOnlyData.ts` - Already uses Supabase client directly
  - `useSports()` - Sports reference data
  - `useVenues()` - Venues reference data
  - `useLeaguesReadOnly()` - Leagues with RLS filtering
  - `useApprovedLeagues()` - Public approved leagues
  - `useLeagueById()` - Single league by ID
  - `useUserOrganizations()` - User's organizations
  - `useAllOrganizations()` - All organizations (RLS filtered)
  - `useGameOccurrences()` - Game occurrences for a league
  - `useLeagueDrafts()` - User's drafts
  - `useLeagueTemplates()` - User's templates
  - `useDraftById()` - Single draft/template by ID

### Read Operations (Still Using Backend API)
❌ `hooks/useAdminLeagues.ts` - Admin operations still go through backend
  - `usePendingLeagues()` - Uses backend API
  - `useAllLeagues()` - Uses backend API
  - `useLeague()` - Uses backend API (single league for admin)

### Write Operations (Using Backend API - Keep As Is)
✅ `hooks/useAdminLeagues.ts` - Write operations
  - `useAdminLeagueOperations()` - approve/reject leagues (backend only)
  - `useAdminDraftOperations()` - delete drafts (backend only)

### Other Hooks Analysis
- `useDrafts.ts` - Needs review for read vs write operations
- `useOrganizations.ts` - Needs review
- Other custom hooks - Need to audit for API usage

---

## Refactoring Phases

### Phase 1: Audit All Frontend API Calls
**Goal:** Identify all backend API calls and categorize as read or write

**Tasks:**
1. Search for all `fetch()` calls to backend API
2. Search for all `useSWR` calls to backend API
3. Categorize each as:
   - ✅ Read operations (migrate to Supabase client)
   - ❌ Write operations (keep backend API)
   - ⚠️ Mixed (split into separate hooks)
4. Document findings in `AUDIT_RESULTS.md`

**Files to Check:**
```
hooks/
├── useAdminLeagues.ts        (pending/all leagues)
├── useDrafts.ts              (draft operations)
├── useOrganizations.ts       (org operations)
├── useSportSearch.ts
├── useVenueSearch.ts
├── useOrganizationSearch.ts
├── useSportExistenceCheck.ts
└── useAutocompleteLogic.ts

components/
├── organizer/                (league/draft tables)
├── organizations/            (org forms)
└── forms/                    (form submissions)

lib/
├── api.ts                    (fetcher function)
└── rlsTest.ts               (RLS testing)
```

---

### Phase 2: Migrate Read Operations to Supabase Client
**Goal:** Move all read operations from backend API to Supabase client

**For Each Read Hook:**

1. **Identify Query Logic**
   - What table does it query?
   - What filters are applied?
   - What ordering/sorting?
   - Does it need joins?

2. **Translate to Supabase Client**
   - Backend: `GET /v1/leagues/admin/pending?limit=20&offset=0`
   - Frontend:
   ```typescript
   supabase
     .from('leagues')
     .select('*')
     .eq('status', 'pending')
     .range(0, 19)
   ```

3. **Add Pagination Support**
   - Use `.range(offset, offset + limit - 1)` instead of query params
   - Get count using `.select('*', { count: 'exact' })`

4. **Handle RLS Filtering**
   - Admin users see everything (RLS policy allows it)
   - Regular users see only their data (RLS policy enforces it)
   - No need to add extra filters - RLS handles it automatically

5. **Update Return Types**
   - Match backend response format if needed
   - Return Supabase data directly if possible

**Example - Migrate `usePendingLeagues`:**

Before (Backend API):
```typescript
const { data, error, isLoading } = useSWR(
  `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/pending?limit=${limit}&offset=${offset}`,
  async (url) => {
    const token = await getToken()
    return fetcher(url, token)
  }
)
```

After (Supabase Client):
```typescript
const { supabase, isLoaded } = useSupabase()
const [state, setState] = useState(...)

useEffect(() => {
  if (!isLoaded || !supabase) return

  supabase
    .from('leagues')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })
    .then(({ data, count, error }) => {
      setState({
        pendingLeagues: data || [],
        total: count || 0,
        isLoading: false,
        error: error
      })
    })
}, [isLoaded, supabase, limit, offset])
```

---

### Phase 3: Update Components Using Migrated Hooks
**Goal:** Ensure components work with updated hooks

**Tasks:**
1. Update admin dashboard components
2. Update organizer tables
3. Fix any response format mismatches
4. Test pagination, filtering, sorting

---

### Phase 4: Cleanup and Optimization
**Goal:** Remove unused code and optimize performance

**Tasks:**
1. Remove unused backend API routes (mark for deprecation)
2. Remove unused hook code
3. Add data caching/SWR to Supabase hooks where needed
4. Add real-time subscriptions for key tables
5. Document which operations still use backend API

---

## Hooks to Migrate

### High Priority (Admin Features)
```
1. usePendingLeagues()
   - Current: GET /v1/leagues/admin/pending
   - Migrate to: supabase.from('leagues').select().eq('status', 'pending')
   - Keep pagination + count

2. useAllLeagues()
   - Current: GET /v1/leagues/admin/all
   - Migrate to: supabase.from('leagues').select()
   - Keep pagination + count

3. useLeague() (admin single league)
   - Current: GET /v1/leagues/admin/{id}
   - Migrate to: supabase.from('leagues').select().eq('id', id).single()

4. useAllDrafts()
   - Current: GET /v1/leagues/admin/drafts/all
   - Migrate to: supabase.from('leagues_drafts').select().eq('type', 'draft')

5. useAdminDraftOperations() - DELETE
   - Keep on backend: DELETE operations require write access
```

### Medium Priority (Organizer Features)
```
6. useDrafts() in useDrafts.ts
   - Review what's backend vs Supabase
   - Migrate read operations

7. useOrganizations() in useOrganizations.ts
   - Review what's backend vs Supabase
   - Migrate read operations
```

### Lower Priority (Search/Autocomplete)
```
8. useSportSearch()
   - Likely read-only already
   - Review implementation

9. useVenueSearch()
   - Likely read-only already
   - Review implementation

10. useOrganizationSearch()
    - Likely read-only already
    - Review implementation
```

---

## Code Patterns to Apply

### Pattern 1: Simple Read with Pagination
```typescript
export function useLeaguesWithPagination(limit = 20, offset = 0) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return
    try {
      const { data, count, error } = await supabase
        .from('leagues')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) throw error

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: new Error(stringifyError(error)),
      })
    }
  }, [supabase, offset, limit])

  useEffect(() => {
    if (isLoaded && supabase) fetch()
  }, [isLoaded, supabase, fetch])

  return {
    data: state.data,
    count: data?.count,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}
```

### Pattern 2: Read with Filters
```typescript
export function usePendingLeagues(limit = 20, offset = 0) {
  const { supabase, isLoaded } = useSupabase()
  // Similar to Pattern 1, but add:
  .eq('status', 'pending')
}
```

### Pattern 3: Keep Write Operations on Backend
```typescript
export function useAdminLeagueOperations() {
  const { getToken } = useAuth()

  const approveLeague = async (leagueId: number) => {
    const token = await getToken()
    // Keep using backend API for mutations
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/${leagueId}/approve`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
    )
    return response.json()
  }

  return { approveLeague }
}
```

---

## Testing Strategy

### Unit Tests
- Test each migrated hook with mock Supabase client
- Test pagination logic
- Test error handling

### Integration Tests
- Test admin pending leagues page
- Test admin all leagues page
- Test organizer league tables
- Test pagination controls

### RLS Tests
- Admin should see all leagues
- Regular users should see approved + their own
- Non-members shouldn't see organization data

---

## Key Considerations

### Count Parameter in Supabase
The backend used `"exact"` count mode:
```typescript
Select("*", "exact", false)  // Backend PostgREST
```

Frontend equivalent:
```typescript
.select('*', { count: 'exact' })  // JS client
```

### Pagination Offset/Limit
Backend used: `Range(offset, offset+limit-1, "")`
Frontend equivalent: `.range(offset, offset + limit - 1)`

### Response Format
- Backend returns: `{ leagues: [...], total: 100, limit: 20, offset: 0 }`
- Supabase JS client returns: `{ data: [...], error, count }`
- May need adapter to match backend format if components depend on it

### Real-Time Subscriptions (Future)
Once migration complete, can add real-time subscriptions:
```typescript
supabase
  .from('leagues')
  .on('*', payload => {
    // Update UI in real-time
  })
  .subscribe()
```

---

## Rollback Plan

If a migration breaks something:
1. Keep old hook in place with `_Old` suffix
2. Revert component to use old hook temporarily
3. Fix the issue in new migration
4. Delete old hook when new one is stable

---

## Session Management

### Session 1 (Current - Planning)
- ✅ Analyzed backend refactoring
- ✅ Explored frontend structure
- ✅ Created this plan
- ✅ Created new branch `feat/frontend-supabase-client`

### Session 2 (Next - Phase 1)
- Audit all backend API calls in frontend
- Document findings
- Create migration checklist

### Session 3+ (Subsequent)
- Execute Phase 2: Migrate hooks one by one
- Execute Phase 3: Update components
- Execute Phase 4: Cleanup

---

## Summary

| Phase | Goal | Time | Status |
|-------|------|------|--------|
| 1 | Audit API calls | 1 session | ⏳ Pending |
| 2 | Migrate read hooks | 3-4 sessions | ⏳ Pending |
| 3 | Update components | 2 sessions | ⏳ Pending |
| 4 | Cleanup & optimize | 1 session | ⏳ Pending |

**Total Estimated Time:** 7-9 sessions

---

## Related Documentation

- Backend refactoring: See `backend/REFACTORING_COMPLETE.md` (from git history)
- RLS policies: See `backend/supabase/migrations/20251117_add_comprehensive_rls_policies.sql`
- Supabase client: See `frontend/dashboard/lib/supabase.ts`
- Clerk context: See `frontend/dashboard/context/SupabaseContext.tsx`
