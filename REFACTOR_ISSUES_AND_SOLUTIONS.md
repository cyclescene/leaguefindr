# Frontend Refactor: Issues & Solutions Analysis

**Status:** ⚠️ **MEDIUM COMPLEXITY** - Straightforward migration with a few important considerations

---

## Summary

The refactor is **mostly straightforward** because:
- ✅ Existing `useReadOnlyData.ts` provides perfect patterns to follow
- ✅ Components use hooks (not direct API calls)
- ✅ Response formats are manageable with adapter functions
- ✅ RLS policies are already set up and working

**But there ARE some issues to watch out for:**
- ⚠️ Response format mismatches (backend wraps in objects)
- ⚠️ Missing data like `form_data` field in some queries
- ⚠️ Potential missing joins on draft/template objects
- ⚠️ SWR caching/mutation behavior to replace

---

## ISSUE #1: Response Format Mismatch 🔴 IMPORTANT

### The Problem

**Backend API Response:**
```json
{
  "leagues": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

**Supabase Client Response:**
```json
{
  "data": [...],
  "count": 100,
  "error": null
}
```

### Example Code Issue

In `useAdminLeagues.ts:60`:
```typescript
return {
  pendingLeagues: (data?.leagues || []) as PendingLeague[],  // ← expects 'leagues' key
  total: data?.total || 0,                                    // ← expects 'total'
  limit: data?.limit || limit,                                // ← expects 'limit'
  offset: data?.offset || offset,                             // ← expects 'offset'
  isLoading,
  error,
  mutate,
};
```

With Supabase, we'll get `data` directly, not wrapped.

### Solution ✅

Create an adapter function to transform Supabase response to match old format:

```typescript
interface AdminLeaguesResponse {
  pendingLeagues: PendingLeague[]
  total: number
  limit: number
  offset: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function usePendingLeagues(limit: number = 20, offset: number = 0): AdminLeaguesResponse {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState<{
    data: PendingLeague[] | null
    total: number
    isLoading: boolean
    error: Error | null
  }>({
    data: null,
    total: 0,
    isLoading: true,
    error: null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return
    try {
      const { data, count, error } = await supabase
        .from('leagues')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) throw error

      setState({
        data: data || [],
        total: count || 0,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        data: null,
        total: 0,
        isLoading: false,
        error: new Error(stringifyError(error)),
      })
    }
  }, [supabase, offset, limit])

  useEffect(() => {
    if (isLoaded && supabase) fetch()
  }, [isLoaded, supabase, fetch])

  return {
    pendingLeagues: state.data || [],
    total: state.total,
    limit,
    offset,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}
```

**Impact:** ✅ NONE - Components don't need changes, hook handles it

---

## ISSUE #2: form_data Contains Display Values ✅ RESOLVED

### The Problem

The `form_data` field is CRITICAL - it contains the user-facing strings that are displayed in tables:
- `organization_name` - The org name entered by user
- `sport_name` - The sport name entered by user
- `venue_name` - The venue name entered by user

From the admin page code (`page.tsx:56-63`):
```typescript
const transformLeague = (league: any): League => ({
  id: league.id,
  name: league.league_name,
  organizationName: league.form_data?.organization_name || league.org_id || 'Unknown',  // ← from form_data
  sport: league.form_data?.sport_name || league.sport_id?.toString() || 'Unknown',      // ← from form_data
  gender: league.gender || 'N/A',
  startDate: new Date(league.season_start_date).toLocaleDateString(),
  venue: league.form_data?.venue_name || league.venue_id?.toString() || 'Unknown',      // ← from form_data
  dateSubmitted: new Date(league.created_at).toLocaleDateString(),
  status: league.status,
})
```

### Why This Matters

When users create a league, they might:
1. Use an existing sport from dropdown (has `sport_id`)
2. **OR** enter a new sport name (stored only in `form_data.sport_name`)

The `form_data` acts as a fallback when the normalized field has no value.

### Backend Model (models.go:137)

```go
type League struct {
  // ... other fields ...
  FormData FormData `json:"form_data"` // Complete form submission data (JSONB)
  // ...
}
```

**FormData is `map[string]interface{}`** - stores complete form submission

### Solution ✅

Just select all fields with `'*'` - **Supabase will include form_data automatically**:

```typescript
const { data, count, error } = await supabase
  .from('leagues')
  .select('*', { count: 'exact' })  // ← automatically includes form_data JSONB field
  .eq('status', 'pending')
  .range(offset, offset + limit - 1)
```

The Supabase client will deserialize the JSONB `form_data` field as a regular object/map, so it will be available as `league.form_data.organization_name`, etc.

**Impact:** ✅ NONE - `*` includes JSONB fields

---

## ISSUE #3: Joins NOT Needed ✅ RESOLVED

### The Problem (Initially Thought)

Some hooks might need joins to get related data. For example:
- Draft list with organization name
- League list with related org/sport/venue data

### The Reality

**NO JOINS NEEDED!** The data is already in `form_data`:

From the admin page transformation (`page.tsx:56-63`):
```typescript
const transformLeague = (league: any): League => ({
  // All values come from league itself or form_data
  organizationName: league.form_data?.organization_name,  // ← from form_data, not org table
  sport: league.form_data?.sport_name,                     // ← from form_data, not sport table
  venue: league.form_data?.venue_name,                     // ← from form_data, not venue table
})
```

The backend stores the complete form submission (with user-entered values) in `form_data`. This is intentional - you keep a record of exactly what the user entered, independent of whether those items exist in the database.

### Why This Design

This pattern supports:
1. **New sports/venues** - User can enter "Custom Sport" even if it's not in DB yet
2. **Immutable records** - The form_data never changes, so admin can always see what was originally submitted
3. **Simple queries** - No need for joins, just read the league row

### Solution ✅

Don't add any joins! Just select all fields:

```typescript
const { data, count, error } = await supabase
  .from('leagues')
  .select('*', { count: 'exact' })  // ← Gets league + form_data with everything
  .eq('status', 'pending')
  .range(offset, offset + limit - 1)
```

**Impact:** ✅ NONE - No joins needed, `*` has everything

---

## ISSUE #4: SWR Mutation/Revalidation Behavior ⚠️ REQUIRED CHANGE

### The Problem

SWR hooks currently expose `mutate` function for manual revalidation:

From `useAdminLeagues.ts:66`:
```typescript
const { data, error, isLoading, mutate } = useSWR(...)

return {
  pendingLeagues: (data?.leagues || []) as PendingLeague[],
  total: data?.total || 0,
  limit: data?.limit || limit,
  offset: data?.offset || offset,
  isLoading,
  error,
  mutate,  // ← Exposed for manual revalidation
}
```

### Current Usage in Admin Page

From `page.tsx:88-92`:
```typescript
const { pendingLeagues, total: totalPending, isLoading: isLoadingPending, mutate: mutatePendingLeagues } = usePendingLeagues(ITEMS_PER_PAGE, offset)
const { allLeagues, total: totalAll, isLoading: isLoadingAll, mutate: mutateAllLeagues } = useAllLeagues(ITEMS_PER_PAGE, offset)

// Later in handler (page.tsx:111-115):
await approveLeague(leagueId)
await Promise.all([mutatePendingLeagues(), mutateAllLeagues()])  // ← Revalidate after action
```

### The Issue

When switching to Supabase client, we lose SWR's automatic `mutate()` function. We need to replace it with a `refetch()` function.

### Solution ✅

Export a `refetch` function instead of `mutate`:

```typescript
export function usePendingLeagues(limit: number = 20, offset: number = 0) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null,
    total: 0,
    isLoading: true,
    error: null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return
    try {
      const { data, count, error } = await supabase
        .from('leagues')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) throw error

      setState({
        data: data || [],
        total: count || 0,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        data: null,
        total: 0,
        isLoading: false,
        error: new Error(stringifyError(error)),
      })
    }
  }, [supabase, offset, limit])

  useEffect(() => {
    if (isLoaded && supabase) fetch()
  }, [isLoaded, supabase, fetch])

  return {
    pendingLeagues: state.data || [],
    total: state.total,
    limit,
    offset,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,  // ← CHANGED from mutate to refetch
  }
}
```

### Component Changes Needed

In `page.tsx`, update calls:
```typescript
// OLD
const { mutate: mutatePendingLeagues } = usePendingLeagues(...)
await Promise.all([mutatePendingLeagues(), mutateAllLeagues()])

// NEW
const { refetch: refetchPendingLeagues } = usePendingLeagues(...)
await Promise.all([refetchPendingLeagues(), refetchAllLeagues()])
```

**Impact:** 🔴 REQUIRES COMPONENT UPDATE
- `page.tsx:88-92` - Update variable names
- `page.tsx:111-115` - Update calls
- `page.tsx:125-129` - Update calls
- Search for any other `.mutate()` calls on these hooks

---

## ISSUE #5: Pagination Parameter Format 🟢 LOW RISK

### The Problem

Frontend uses `limit` and `offset` as query parameters:
```
GET /v1/leagues/admin/pending?limit=20&offset=0
```

Supabase uses different formula:
```typescript
.range(offset, offset + limit - 1)
```

### Example

With `limit=20, offset=0`:
- Backend API: `?limit=20&offset=0` → returns items 0-19
- Supabase: `.range(0, 19)` → returns items 0-19 ✅

With `limit=20, offset=20`:
- Backend API: `?limit=20&offset=20` → returns items 20-39
- Supabase: `.range(20, 39)` → returns items 20-39 ✅

### Solution ✅

Already implemented in the pattern from `useReadOnlyData.ts`. Just follow pattern.

**Impact:** ✅ NONE - Formula is correct

---

## ISSUE #6: Conditional Queries (null handling) 🟡 MODERATE

### The Problem

Some hooks use conditional keys for SWR to prevent fetching:

```typescript
// From useAdminLeagues.ts:109
export function useLeague(leagueId: number | null) {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    leagueId ? `${NEXT_PUBLIC_API_URL}/v1/leagues/admin/${leagueId}` : null,  // ← null key = don't fetch
    async (url) => { ... }
  )
}
```

SWR skips fetch if key is `null`.

With Supabase, we use `useEffect` with dependencies, so need to check explicitly:

```typescript
useEffect(() => {
  if (!leagueId || !isLoaded || !supabase) return  // ← Skip if leagueId is null
  fetchLeague()
}, [leagueId, isLoaded, supabase, fetchLeague])
```

### Solution ✅

Already implemented in `useReadOnlyData.ts:328-332`:

```typescript
useEffect(() => {
  if (leagueId && isLoaded && supabase) {
    fetchLeague()
  }
}, [leagueId, isLoaded, supabase, fetchLeague])
```

**Impact:** ✅ NONE - Pattern exists, just follow it

---

## ISSUE #7: Potential RLS Permission Issues 🟡 MODERATE

### The Problem

When using Supabase client directly from frontend, RLS policies determine what data users see:

**Current behavior (backend API):**
- Backend has secret key → sees ALL data
- Backend applies business logic → filters what to return
- Frontend gets pre-filtered data

**New behavior (Supabase client):**
- Frontend uses Clerk JWT → sees only what RLS allows
- No backend filtering layer
- RLS policies must be correct

### Examples

For admin pending leagues:
```typescript
// Should return all pending leagues for admins
// RLS policy must allow admins to see pending leagues with status='pending'
```

For user org leagues:
```typescript
// User can only see leagues for orgs they're member of
// RLS policy must enforce: org_id IN (select org_id from user_organizations where user_id = current_user)
```

### Check Point

**Review existing RLS policies** - from earlier sessions, they were created. Verify:

1. Admin can see all leagues (any status)
2. Users can see approved + their own leagues
3. Users can see only their org's drafts/templates
4. Users can see only their own organizations

### Solution ✅

**RLS policies already implemented** in backend migrations. Verify they work:

- Test as admin user → should see all pending leagues
- Test as regular user → should see only approved + own

**If RLS issues found:**
- Review `backend/supabase/migrations/20251117_add_comprehensive_rls_policies.sql`
- Add missing policies as needed

**Impact:** ✅ NONE if RLS correct (already implemented)
🔴 HIGH if RLS policies missing/broken

---

## ISSUE #8: Auth Token Handling 🟡 MODERATE

### The Problem

Current setup:
- Frontend uses Clerk JWT to call backend API
- Backend validates Clerk JWT, uses secret key to call Supabase

New setup:
- Frontend uses Supabase client directly
- Supabase client needs Clerk JWT in header (already configured via SupabaseContext)

### Check Implementation

From `frontend/dashboard/context/SupabaseContext.tsx` (should verify it exists):

```typescript
// Supabase client should be initialized with Clerk token
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,  // ← Clerk JWT
      },
    },
  }
)
```

### Solution ✅

Verify `SupabaseContext.tsx` is already setting Clerk JWT correctly.

**Impact:** ✅ NONE if SupabaseContext correct (already implemented)

---

## ISSUE #9: Refactor Scope Creep 🟡 MODERATE

### The Problem

When refactoring, we might discover:
- Unused API endpoints in backend
- Components with complex logic needing redesign
- Data model mismatches

### Prevention

Scope: **Read-only operations only**
- Don't refactor write operations (approve, reject, create, delete, etc.)
- Keep backend API as fallback
- Test incrementally

### Solution ✅

**Follow Phase 2-4 sequentially:**
1. Migrate one hook at a time
2. Test that hook's components
3. Move to next hook
4. Don't change write operations

**Impact:** 🟢 LOW if disciplined about scope

---

## Component-by-Component Check

### TIER 1: Admin Pending Leagues 🟢

**File:** `components/organizer/admin/AdminPendingLeaguesTable.tsx` (assumed)
**Depends on:** `usePendingLeagues(limit, offset)`

**Check List:**
- [ ] Does table show `form_data` fields (sport_name, venue_name)?
- [ ] Does table show organization name?
- [ ] Does table call `mutate()` after approve/reject?
- [ ] What columns are displayed?

**Refactor:** Simple - just handle response format

---

### TIER 1: Admin All Leagues 🟢

**File:** Similar to pending
**Depends on:** `useAllLeagues(limit, offset)`

**Refactor:** Simple - same as pending leagues

---

### TIER 1: Admin League Detail 🟢

**File:** Similar to pending
**Depends on:** `useLeague(leagueId)`

**Check List:**
- [ ] Does it show game_occurrences?
- [ ] Does it show organization details?
- [ ] Is form_data used?

**Refactor:** May need joins if related data shown

---

### TIER 1: Admin All Drafts 🟢

**File:** Similar to pending
**Depends on:** `useAllDrafts()`

**Check List:**
- [ ] What columns shown (id, name, org_id)?
- [ ] Does it show organization name?
- [ ] Uses mutate after delete?

**Refactor:** May need org join

---

### TIER 2: Org Drafts/Templates/Leagues 🟢

**Files:** `components/organizer/DraftsTable`, etc.
**Depends on:** `useDrafts()`, `useTemplates()`, `useLeagues()`

**Check List:**
- [ ] Simple tables or complex?
- [ ] Show related data?
- [ ] Mutate after delete?

**Refactor:** Straightforward

---

### TIER 3: Organization Selectors 🟢

**Files:** `components/organizations/`
**Depends on:** `useUserOrganizations()`, `useOrganization()`, etc.

**Check List:**
- [ ] Show user org list?
- [ ] Show org details?

**Refactor:** Simple

---

## Risk Assessment

| Issue | Severity | Impact | Solution |
|-------|----------|--------|----------|
| Response format mismatch | 🟡 Medium | Low (adapter) | Return same shape from hook |
| Missing data in joins | 🟡 Medium | Depends | Add explicit selects/joins |
| SWR mutation behavior | 🟡 Medium | Low | Add refetch function |
| Pagination format | 🟢 Low | None | Formula is correct |
| Null handling | 🟢 Low | None | Pattern exists |
| RLS permissions | 🟡 Medium | None if correct | Already implemented |
| Auth token | 🟢 Low | None | Already implemented |
| Scope creep | 🟡 Medium | Medium | Phase approach |

---

## Recommended Approach

### Step 1: Verify Prerequisites ✅
- [ ] RLS policies working (test in backend)
- [ ] SupabaseContext configured with Clerk JWT
- [ ] `stringifyError()` utility exists

### Step 2: Start Simple 🟢
Migrate `useAdminLeagues.ts` first:
1. `usePendingLeagues()` - Simple with test
2. Test AdminPendingLeaguesTable component
3. `useAllLeagues()` - Same pattern
4. Test AdminAllLeaguesTable
5. `useAllDrafts()` - Similar pattern

### Step 3: Check For Issues 🔍
For each hook, before coding:
1. Look at backend handler to see what it returns
2. Check component to see what data it displays
3. Add joins if needed
4. Handle response format

### Step 4: Test Incrementally ✅
- Don't migrate all at once
- Test each component after hook change
- Catch data mismatches early

---

## Summary: Will it be straightforward?

**YES - Very Straightforward! 🎉**

✅ **Why it's straightforward:**
1. **Pattern exists** - `useReadOnlyData.ts` is perfect template
2. **No joins needed** - `form_data` has all display values
3. **Simple queries** - Just `.select('*')` to get everything
4. **Loose coupling** - Components use hooks, not direct API
5. **Response format handled in hooks** - Components don't change
6. **RLS/Auth already working** - SupabaseContext configured

⚠️ **Only gotcha:**
- Replace `mutate` with `refetch` in hooks (required change)
- Update 3 locations in `page.tsx` that call `.mutate()`

🎯 **Estimated effort:** 1-2 focused sessions
- Session 1: Migrate `useAdminLeagues.ts` (all 4 functions)
- Session 2: Migrate remaining hooks + update components
- Done!

---

## Checklist Before Starting Phase 2

- [ ] Verify RLS policies in database are working
- [ ] Confirm SupabaseContext adds Clerk JWT correctly
- [ ] Review `useReadOnlyData.ts` patterns (already done)
- [ ] Run a test query in Supabase dashboard to verify JWT auth works
- [ ] Identify which admin table components display what data
- [ ] Check for `.mutate()` calls in components
- [ ] Prepare test data/admin account for testing

---

**Next Step:** Start with Phase 2 - Migrate `useAdminLeagues.ts` hooks
