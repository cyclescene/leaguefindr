# Phase 2: Start Migrating Admin Hooks

**Current Status:** Phase 1 Complete ✅
**Ready for:** Phase 2 Implementation
**Time Estimate:** 1 focused session

---

## Quick Overview

You're migrating read operations from backend API to Supabase client. The key insight:

**`form_data` field contains all display values:**
- Organization name (user-entered)
- Sport name (user-entered)
- Venue name (user-entered)

No joins needed - just `.select('*')` to get everything!

---

## The One Critical Change

Replace `mutate` with `refetch` in all hooks:

```typescript
// OLD
return {
  pendingLeagues,
  mutate,  // ← SWR function
}

// NEW
return {
  pendingLeagues,
  refetch: fetch,  // ← Our manual refetch function
}
```

Then update `page.tsx` (3 locations):
- Line ~88: Change `mutate: mutatePendingLeagues` → `refetch: refetchPendingLeagues`
- Line ~89: Change `mutate: mutateAllLeagues` → `refetch: refetchAllLeagues`
- Lines ~111-115, ~125-129: Update all `.mutate()` calls to `.refetch()`

---

## Template for Each Hook

All admin hooks follow the same pattern. Here's the template:

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'  // Import this!

// Define response shape
interface PendingLeaguesResponse {
  pendingLeagues: any[]
  total: number
  limit: number
  offset: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function usePendingLeagues(limit: number = 20, offset: number = 0): PendingLeaguesResponse {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as any[] | null,
    total: 0,
    isLoading: true,
    error: null as Error | null,
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
      const errorMessage = stringifyError(error)
      setState({
        data: null,
        total: 0,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase, offset, limit])

  useEffect(() => {
    if (isLoaded && supabase) {
      fetch()
    }
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

---

## Hooks to Migrate in This Session

### In `useAdminLeagues.ts`:

1. **`usePendingLeagues(limit, offset)`**
   - Current: `GET /v1/leagues/admin/pending?limit=X&offset=Y`
   - New: `.from('leagues').select('*').eq('status', 'pending').range(offset, ...)`
   - Return: Same shape (pendingLeagues, total, limit, offset, isLoading, error, **refetch**)

2. **`useAllLeagues(limit, offset)`**
   - Current: `GET /v1/leagues/admin/all?limit=X&offset=Y`
   - New: `.from('leagues').select('*').range(offset, ...)`
   - Return: Same shape (allLeagues, total, limit, offset, isLoading, error, **refetch**)

3. **`useLeague(leagueId)`**
   - Current: `GET /v1/leagues/admin/{leagueId}`
   - New: `.from('leagues').select('*').eq('id', leagueId).single()`
   - Return: Same shape (league, isLoading, error, **refetch**)
   - Note: Use conditional check - skip if leagueId is null/falsy

4. **`useAllDrafts()`**
   - Current: `GET /v1/leagues/admin/drafts/all`
   - New: `.from('leagues_drafts').select('*').eq('type', 'draft')`
   - Return: Same shape (drafts, isLoading, error, **refetch**)

### KEEP As-Is (write operations):
- `useAdminLeagueOperations()` - No changes
- `useAdminDraftOperations()` - No changes

---

## Queries Reference

### usePendingLeagues
```typescript
const { data, count, error } = await supabase
  .from('leagues')
  .select('*', { count: 'exact' })
  .eq('status', 'pending')
  .range(offset, offset + limit - 1)
  .order('created_at', { ascending: false })
```

### useAllLeagues
```typescript
const { data, count, error } = await supabase
  .from('leagues')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .order('created_at', { ascending: false })
```

### useLeague (single)
```typescript
const { data, error } = await supabase
  .from('leagues')
  .select('*')
  .eq('id', leagueId)
  .single()
```

### useAllDrafts
```typescript
const { data, error } = await supabase
  .from('leagues_drafts')
  .select('*')
  .eq('type', 'draft')
  .order('updated_at', { ascending: false })
```

---

## Files to Modify

**Primary:**
- `/frontend/dashboard/hooks/useAdminLeagues.ts` - Migrate 4 read functions

**Secondary (component updates):**
- `/frontend/dashboard/app/(admin)/admin/page.tsx` - Update 3 locations for mutate→refetch

---

## Testing Checklist

After migrating:

- [ ] Admin page loads without errors
- [ ] Pending leagues tab shows data
- [ ] All leagues tab shows data
- [ ] Pagination works (prev/next/page numbers)
- [ ] Click league to open review modal
- [ ] Approve league button triggers refetch
- [ ] Reject league button triggers refetch
- [ ] Count updates after approve/reject

---

## If Something Goes Wrong

### Data is undefined/empty
- Check: `useSupabase()` is returning valid supabase client
- Check: Clerk JWT is in headers (SupabaseContext)
- Check: RLS policies allow your user to see data
- Test: Run in browser DevTools - `supabase.from('leagues').select('*').single()`

### Permission denied error
- Check: RLS policies in database
- Test: Are you logged in as admin?
- Verify: `X-Clerk-User-ID` header is present

### Count is always 0
- Remember: `.select('*', { count: 'exact' })` syntax
- Exact mode is slower but accurate

### Component still expects `.mutate()`
- Search for `.mutate()` calls
- Replace with `.refetch()`
- Check return value - make sure you're calling the right function

---

## One Command to Check Your Work

After editing `useAdminLeagues.ts`, verify syntax:
```bash
cd /home/jd/personal/leaguefindr/frontend/dashboard
npm run build
```

Should compile without errors.

---

## Ready to Start?

1. Read `useReadOnlyData.ts` to understand pattern (5 min)
2. Edit `useAdminLeagues.ts` - migrate 4 functions (30 min)
3. Edit `page.tsx` - update mutate to refetch calls (10 min)
4. Test in browser (15 min)
5. Done!

**Estimated time: 1 hour**

---

## Success Criteria for Phase 2

✅ When complete, you should have:
- All 4 read functions migrated in `useAdminLeagues.ts`
- All `.mutate()` calls updated to `.refetch()` in `page.tsx`
- Admin page loading and displaying data from Supabase
- Pagination working
- Approve/reject actions refetching data
- No TypeScript errors on build

After this is working, Phase 3 will migrate the remaining hooks (drafts, organizations, etc.) using the same pattern.
