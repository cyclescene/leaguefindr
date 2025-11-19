# Frontend API Audit Results

**Date:** 2025-11-18
**Branch:** `feat/frontend-supabase-client`
**Audit Scope:** All backend API calls in frontend codebase

---

## Executive Summary

- **Total API Endpoints Found:** 20+ unique endpoints
- **Files with API Calls:** 16 files
- **Read Operations:** 13 endpoints → **CAN migrate to Supabase**
- **Write Operations:** 7 endpoints → **KEEP on backend API**
- **Already Using Supabase:** ~15 queries in `useReadOnlyData.ts`

### Migration Impact
- **High Priority (Admin Panel):** 6 hooks need updates
- **Medium Priority (Organizer):** 3 hooks need updates
- **Low Priority (Search/Reference):** 2 hooks can stay on backend
- **Components Affected:** ~10 components will need minor updates

---

## Detailed Endpoint Classification

### 1. READ OPERATIONS → Migrate to Supabase Client

#### Admin Leagues (HIGH PRIORITY)
| Endpoint | Method | Current Location | Components | Migration Path |
|----------|--------|------------------|------------|-----------------|
| `GET /v1/leagues/admin/pending?limit=X&offset=Y` | GET | `useAdminLeagues.ts:44-52` | AdminPendingLeaguesTable | `.from('leagues').select().eq('status', 'pending').range()` |
| `GET /v1/leagues/admin/all?limit=X&offset=Y` | GET | `useAdminLeagues.ts:76-84` | AdminAllLeaguesTable | `.from('leagues').select().range()` |
| `GET /v1/leagues/admin/{leagueId}` | GET | `useAdminLeagues.ts:108-116` | AdminLeagueDetail | `.from('leagues').select().eq('id', leagueId).single()` |
| `GET /v1/leagues/admin/drafts/all` | GET | `useAdminLeagues.ts:200-208` | AdminDraftsTable | `.from('leagues_drafts').select().eq('type', 'draft')` |

#### Organization Leagues (MEDIUM PRIORITY)
| Endpoint | Method | Current Location | Components | Migration Path |
|----------|--------|------------------|------------|-----------------|
| `GET /v1/leagues/org/{orgId}` | GET | `useDrafts.ts:104-112` | OrgLeaguesTable | `.from('leagues').select().eq('organization_id', orgId)` |
| `GET /v1/leagues/drafts/{orgId}` | GET | `useDrafts.ts:19-27` | DraftsTable | `.from('leagues_drafts').select().eq('org_id', orgId).eq('type', 'draft')` |
| `GET /v1/leagues/templates/{orgId}` | GET | `useDrafts.ts:45-53` | TemplatesTable | `.from('leagues_drafts').select().eq('org_id', orgId).eq('type', 'template')` |

#### Organizations (MEDIUM PRIORITY)
| Endpoint | Method | Current Location | Components | Migration Path |
|----------|--------|------------------|------------|-----------------|
| `GET /v1/organizations/user` | GET | `useOrganizations.ts:17-25` | OrgSelector, OrgMenu | `.from('organizations').select().eq('user_id', userId)` |
| `GET /v1/organizations/{orgId}` | GET | `useOrganizations.ts:43-51` | OrgDetail, OrgSettings | `.from('organizations').select().eq('id', orgId).single()` |
| `GET /v1/organizations/admin` | GET | `useOrganizationSearch.ts:17-25` | AdminOrgSearch | `.from('organizations').select()` |

#### Reference Data (LOW PRIORITY - Already Working Well)
| Endpoint | Method | Current Location | Status | Notes |
|----------|--------|------------------|--------|-------|
| `GET /v1/sports/` | GET | `useSportSearch.ts:19-25` | Can migrate | Static reference data, cached well |
| `GET /v1/venues/` | GET | `useVenueSearch.ts:22-28` | Can migrate | Static reference data, cached well |
| `GET /v1/sports/exists?name=X` | GET | `useSportExistenceCheck.ts:22-30` | Keep backend | Custom validation logic |

---

### 2. WRITE OPERATIONS → Keep on Backend API

#### Leagues
| Endpoint | Method | Current Location | Reason | Components |
|----------|--------|------------------|--------|------------|
| `PUT /v1/leagues/admin/{leagueId}/approve` | PUT | `useAdminLeagues.ts:143-152` | Admin action, backend validation | AdminPendingLeaguesTable |
| `PUT /v1/leagues/admin/{leagueId}/reject` | PUT | `useAdminLeagues.ts:168-178` | Admin action, backend validation | AdminPendingLeaguesTable |
| `DELETE /v1/leagues/drafts/org/{orgId}` | DELETE | `useAdminLeagues.ts:235-245` + `[orgId]/leagues/page.tsx:148-160` | Requires org validation | LeaguesPage |
| `DELETE /v1/leagues/templates/{templateId}` | DELETE | `[orgId]/leagues/page.tsx:184-192` | Requires org validation | LeaguesPage |

#### Organizations
| Endpoint | Method | Current Location | Reason | Components |
|----------|--------|------------------|--------|------------|
| `POST /v1/organizations` | POST | `CreateOrganizationForm.tsx:68-81` | Create, requires backend processing | CreateOrganizationForm |
| `PUT /v1/organizations/{orgId}` | PUT | `CreateOrganizationForm.tsx:68-81` | Update, requires backend processing | CreateOrganizationForm |
| `DELETE /v1/organizations/{orgId}` | DELETE | `DeleteOrganizationDialog.tsx:48-57` | Delete, requires org validation | DeleteOrganizationDialog |
| `POST /v1/organizations/join` | POST | `JoinOrganizationForm.tsx:49-61` | Join, requires backend processing | JoinOrganizationForm |

#### Auth
| Endpoint | Method | Current Location | Reason | Notes |
|----------|--------|------------------|--------|-------|
| `POST /v1/auth/login` | POST | `api/auth/route.ts:17-21` | Authentication | Backend proxy |
| `POST /v1/auth/register` | POST | `api/auth/route.ts:17-21` | Authentication | Backend proxy |
| `GET /v1/auth/user/{sessionId}` | GET | `api/auth/route.ts:30` | Session management | Backend proxy |

---

## Already Using Supabase Client ✅

The following are **already migrated** and working correctly:

### `hooks/useReadOnlyData.ts`
- `useSports()` - Sports reference data
- `useVenues()` - Venues reference data
- `useLeaguesReadOnly()` - All leagues with relationships
- `useApprovedLeagues()` - Public leagues
- `useLeagueById()` - Single league detail
- `useUserOrganizations()` - User's orgs
- `useAllOrganizations()` - All orgs (admin/public)
- `useGameOccurrences()` - Game occurrences
- `useLeagueDrafts()` - User's drafts
- `useLeagueTemplates()` - User's templates
- `useDraftById()` - Single draft/template

### `hooks/useNotificationSubscription.ts`
- Real-time notification subscriptions
- Notification updates/deletes
- Already using Supabase client correctly

---

## Components Requiring Updates

### TIER 1: Admin Panel Components (6 components)

#### 1. **AdminPendingLeaguesTable** (useAdminLeagues.ts hooks)
- **Currently Uses:** `usePendingLeagues()` (backend API)
- **Will Use:** Migrated `usePendingLeagues()` (Supabase client)
- **Changes Needed:**
  - Hook will return same interface (no component changes needed)
  - Verify pagination still works
  - Check error handling

#### 2. **AdminAllLeaguesTable** (useAdminLeagues.ts hooks)
- **Currently Uses:** `useAllLeagues()` (backend API)
- **Will Use:** Migrated `useAllLeagues()` (Supabase client)
- **Changes Needed:**
  - Hook will return same interface (no component changes needed)
  - Verify pagination still works
  - Check error handling

#### 3. **AdminLeagueDetail** (useAdminLeagues.ts hooks)
- **Currently Uses:** `useLeague()` (backend API)
- **Will Use:** Migrated `useLeague()` (Supabase client)
- **Changes Needed:**
  - Hook will return same interface (no component changes needed)
  - Verify data relationships load correctly

#### 4. **AdminDraftsTable** (useAdminLeagues.ts hooks)
- **Currently Uses:** `useAllDrafts()` (backend API)
- **Will Use:** Migrated `useAllDrafts()` (Supabase client)
- **Changes Needed:**
  - Hook will return same interface (no component changes needed)
  - Verify list displays correctly

#### 5. **AdminLeagueActions** (useAdminLeagues.ts)
- **Currently Uses:** `useAdminLeagueOperations()` (backend API)
- **Will Use:** KEEP as-is (write operations)
- **Changes Needed:** None

#### 6. **AdminDraftActions** (useAdminLeagues.ts)
- **Currently Uses:** `useAdminDraftOperations()` (backend API)
- **Will Use:** KEEP as-is (write operations)
- **Changes Needed:** None

---

### TIER 2: Organizer Components (3 components)

#### 7. **DraftsTable** (useDrafts.ts hooks)
- **Currently Uses:** `useOrgDrafts()` (backend API)
- **Will Use:** Migrated `useOrgDrafts()` (Supabase client)
- **Changes Needed:**
  - Hook will return same interface
  - Verify list displays correctly
  - Delete draft still uses backend (write operation)

#### 8. **TemplatesTable** (useDrafts.ts hooks)
- **Currently Uses:** `useOrgTemplates()` (backend API)
- **Will Use:** Migrated `useOrgTemplates()` (Supabase client)
- **Changes Needed:**
  - Hook will return same interface
  - Verify list displays correctly
  - Delete template still uses backend (write operation)

#### 9. **OrgLeaguesTable** (useDrafts.ts hooks)
- **Currently Uses:** `useOrgLeagues()` (backend API)
- **Will Use:** Migrated `useOrgLeagues()` (Supabase client)
- **Changes Needed:**
  - Hook will return same interface
  - Verify list displays correctly

---

### TIER 3: Organization Management Components (3 components)

#### 10. **OrgSelector/OrgMenu** (useOrganizations.ts)
- **Currently Uses:** `useUserOrganizations()` (backend API)
- **Will Use:** Migrated `useUserOrganizations()` (Supabase client)
- **Changes Needed:** None (hook return same interface)

#### 11. **OrgDetail/OrgSettings** (useOrganizations.ts)
- **Currently Uses:** `useOrganization()` (backend API)
- **Will Use:** Migrated `useOrganization()` (Supabase client)
- **Changes Needed:** None (hook return same interface)

#### 12. **AdminOrgSearch** (useOrganizationSearch.ts)
- **Currently Uses:** `useAllOrganizations()` (backend API)
- **Will Use:** Migrated `useAllOrganizations()` (Supabase client)
- **Changes Needed:** None (hook return same interface)

---

### TIER 4: Reference Data (Can optimize later)

#### 13. **SportAutocomplete** (useSportSearch.ts)
- **Status:** Can migrate to Supabase OR keep backend
- **Current:** Works well with SWR caching
- **Recommendation:** Migrate after Tier 1-3 complete

#### 14. **VenueAutocomplete** (useVenueSearch.ts)
- **Status:** Can migrate to Supabase OR keep backend
- **Current:** Works well with SWR caching
- **Recommendation:** Migrate after Tier 1-3 complete

#### 15. **SportExistenceCheck** (useSportExistenceCheck.ts)
- **Status:** Keep on backend
- **Reason:** Custom validation logic (checks request count, rejection reason)
- **No Migration Needed**

---

## Migration Strategy

### Phase 1: Audit ✅ COMPLETE
- [x] Identified all API endpoints
- [x] Categorized as read/write
- [x] Mapped components affected
- [x] Created this document

### Phase 2: Migrate Admin Hooks (NEXT - HIGH PRIORITY)
1. Migrate `usePendingLeagues()` in `useAdminLeagues.ts`
2. Migrate `useAllLeagues()` in `useAdminLeagues.ts`
3. Migrate `useLeague()` in `useAdminLeagues.ts`
4. Migrate `useAllDrafts()` in `useAdminLeagues.ts`
5. **Test:** AdminPendingLeaguesTable, AdminAllLeaguesTable, AdminLeagueDetail, AdminDraftsTable

### Phase 3: Migrate Organizer Hooks (MEDIUM PRIORITY)
1. Migrate `useOrgDrafts()` in `useDrafts.ts`
2. Migrate `useOrgTemplates()` in `useDrafts.ts`
3. Migrate `useOrgLeagues()` in `useDrafts.ts`
4. **Test:** DraftsTable, TemplatesTable, OrgLeaguesTable

### Phase 4: Migrate Organization Hooks (MEDIUM PRIORITY)
1. Migrate `useUserOrganizations()` in `useOrganizations.ts`
2. Migrate `useOrganization()` in `useOrganizations.ts`
3. Migrate `useAllOrganizations()` in `useOrganizationSearch.ts`
4. **Test:** OrgSelector, OrgDetail, AdminOrgSearch

### Phase 5: Cleanup (LOW PRIORITY)
1. Migrate `useSportSearch()` (optional - works well now)
2. Migrate `useVenueSearch()` (optional - works well now)
3. Remove unused backend API endpoints from router
4. Update API documentation

---

## Code Patterns Reference

### Read Hook Pattern (Migrate to Supabase)

**Before (Backend API with SWR):**
```typescript
export function usePendingLeagues(limit = 20, offset = 0) {
  const { getToken } = useAuth()

  const { data, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/pending?limit=${limit}&offset=${offset}`,
    async (url) => {
      const token = await getToken()
      return fetcher(url, token)
    }
  )

  return {
    pendingLeagues: data?.leagues || [],
    total: data?.total || 0,
    isLoading,
    error,
  }
}
```

**After (Supabase Client):**
```typescript
export function usePendingLeagues(limit = 20, offset = 0) {
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
        .eq('status', 'pending')
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
    pendingLeagues: state.data || [],
    total: count || 0,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}
```

### Write Hook Pattern (Keep on Backend API)

```typescript
export function useAdminLeagueOperations() {
  const { getToken } = useAuth()

  const approveLeague = async (leagueId: number) => {
    const token = await getToken()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/${leagueId}/approve`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    if (!response.ok) throw new Error('Failed to approve league')
    return response.json()
  }

  return { approveLeague }
}
```

---

## Key Considerations

### Return Value Compatibility
- **Current Backend Response:** `{ leagues: [...], total: 100, limit: 20, offset: 0 }`
- **Supabase Response:** `{ data: [...], count: 100, error }`
- **Solution:** Adapt hook return values to match current interface (no component changes)

### Pagination Math
- **Formula:** `.range(offset, offset + limit - 1)`
- **Example:** `limit=20, offset=0` → `.range(0, 19)`
- **Count Mode:** Use `.select('*', { count: 'exact' })` for accurate pagination

### Error Handling
- Import `stringifyError()` from existing utilities
- Replace `error.message` with `stringifyError(error)`
- Maintain same error interface for components

### RLS Enforcement
- Admin users see all leagues (RLS policy allows)
- Regular users see only approved + their own (RLS enforces)
- No need for manual role checks - database handles it

---

## Testing Checklist

### Admin Panel
- [ ] Pending leagues table loads and paginates
- [ ] All leagues table loads and paginates
- [ ] League detail page loads
- [ ] Draft list loads
- [ ] Approve/reject actions still work
- [ ] Delete draft still works

### Organizer
- [ ] Drafts table loads
- [ ] Templates table loads
- [ ] Leagues table loads
- [ ] Delete draft still works
- [ ] Delete template still works

### Organizations
- [ ] Org selector shows user's organizations
- [ ] Org detail page loads
- [ ] Admin org search works

---

## Risk Assessment

### Low Risk ✅
- Read-only operations have no side effects
- RLS policies ensure data access control
- Components only expect data format changes (handled by hooks)
- Rollback is easy (revert hooks to use backend API)

### Mitigation
- Test each hook individually first
- Test each component after hook migration
- Keep old hooks in place with `_Old` suffix during testing
- Complete rollback plan ready if issues arise

---

## Summary Table

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| Read endpoints (migrate) | 13 | High | Ready for Phase 2 |
| Write endpoints (keep) | 7 | N/A | No changes |
| Components affected | 15 | Varies | Identified |
| Already migrated | 20+ queries | Complete | ✅ Working |
| Hooks to refactor | 10 | High/Medium | Ready |

---

## Files to Modify (Phase 2-4)

```
frontend/dashboard/hooks/
├── useAdminLeagues.ts          ← PRIMARY (4 functions)
├── useDrafts.ts                ← (3 functions)
├── useOrganizations.ts         ← (2 functions)
├── useOrganizationSearch.ts    ← (1 function)
├── useSportSearch.ts           ← (optional)
└── useVenueSearch.ts           ← (optional)
```

**Total hooks to migrate:** 10 hooks across 6 files

---

**Next Step:** Begin Phase 2 - Migrate admin hooks in `useAdminLeagues.ts`
