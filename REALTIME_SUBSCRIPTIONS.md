# Real-time Subscriptions for Read Operations

**Status:** Post-Phase 2 enhancement (not required for initial migration)
**Priority:** Medium (would significantly improve UX)

---

## Overview

Once we migrate to Supabase client, we can enable **real-time subscriptions** to automatically update UI when data changes in the database.

### What This Enables

- Admin sees new pending leagues instantly without refreshing
- Drafts update when another user creates one in same org
- Templates sync across devices in real-time
- No more manual "refetch" clicks needed

---

## Implementation Pattern

### 1. Basic Subscription (Simple Pattern)

```typescript
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export function usePendingLeaguesRealtime() {
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
  }, [supabase])

  useEffect(() => {
    if (!isLoaded || !supabase) return

    // Initial fetch
    fetch()

    // Set up real-time subscription
    const channel = supabase
      .channel('pending-leagues')
      .on(
        'postgres_changes',
        {
          event: '*',  // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'leagues',
          filter: 'status=eq.pending',  // Only pending leagues
        },
        (payload) => {
          console.log('League change:', payload)
          // Refetch when changes occur
          fetch()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoaded, supabase, fetch])

  return {
    pendingLeagues: state.data || [],
    total: state.total,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}
```

### 2. With Pagination Support

For paginated queries, there are two approaches:

#### Option A: Refetch Current Page on Changes
```typescript
export function usePendingLeagues(limit: number = 20, offset: number = 0) {
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
      setState({
        data: null,
        total: 0,
        isLoading: false,
        error: new Error(stringifyError(error)),
      })
    }
  }, [supabase, offset, limit])

  useEffect(() => {
    if (!isLoaded || !supabase) return

    // Initial fetch
    fetch()

    // Subscribe to changes (refetch current page)
    const channel = supabase
      .channel(`pending-leagues-${offset}`)  // Unique channel per page
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues',
          filter: 'status=eq.pending',
        },
        (payload) => {
          // Refetch current page when changes occur
          fetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoaded, supabase, fetch, offset])

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

#### Option B: Reset to Page 1 on New Items (Better UX)
```typescript
// In page.tsx or component using the hook
const { pendingLeagues, total, isLoading } = usePendingLeagues(ITEMS_PER_PAGE, page)

// If total changed and we're not on first page, go back to first page
useEffect(() => {
  if (total > prevTotal && page > 0) {
    setPage(0)  // Go to first page to see new items
  }
  setPrevTotal(total)
}, [total])
```

---

## Tables to Enable Realtime

### 1. Leagues Table

```typescript
// Subscribe to status changes (pending, approved, rejected)
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'leagues',
    filter: 'status=eq.pending',  // Filter for specific status
  },
  (payload) => {
    console.log('League changed:', payload)
    refetch()
  }
)
```

### 2. Leagues_Drafts Table

```typescript
// Subscribe to draft changes
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'leagues_drafts',
    filter: 'type=eq.draft',  // Or 'type=eq.template'
  },
  (payload) => {
    console.log('Draft changed:', payload)
    refetch()
  }
)
```

**Note:** To filter by `org_id` in real-time:
```typescript
.filter(`type=eq.draft&org_id=eq.${orgId}`)
```

### 3. Organizations Table

```typescript
// Subscribe to all org changes (admin) or filtered (user)
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'organizations',
  },
  (payload) => {
    console.log('Org changed:', payload)
    refetch()
  }
)
```

---

## RLS Considerations

**Important:** Realtime subscriptions **respect RLS policies**!

- Admin user subscribed to leagues will see all leagues
- Regular user subscribed to leagues will see only approved + their own (RLS filters)
- Both get real-time updates automatically

No additional security code needed - RLS handles it.

---

## Performance Considerations

### Good Use Cases
- ✅ Admin pending leagues (small table, critical)
- ✅ User's own drafts (small scope, personal)
- ✅ Templates (small table, shared org)
- ✅ Organization data (small table)

### Less Ideal Use Cases
- ❌ All leagues without filter (could be massive, refetch expensive)
- ❌ User subscriptions on large public data

### Optimization Tips

1. **Always filter subscriptions** - Never subscribe to entire table
2. **Pagination:** Refetch current page only, don't refetch all pages
3. **Debounce multiple updates** - If getting multiple changes, batch them:

```typescript
const timeoutRef = useRef<NodeJS.Timeout>()

.on('postgres_changes', {...}, (payload) => {
  // Clear previous timeout
  if (timeoutRef.current) clearTimeout(timeoutRef.current)

  // Debounce refetch by 500ms
  timeoutRef.current = setTimeout(() => {
    fetch()
  }, 500)
})
```

4. **Consider disabling on mobile** - Can save bandwidth:

```typescript
const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768

if (isDesktop) {
  // Enable subscriptions
}
```

---

## Implementation Roadmap

### Phase 2 (Current Migration)
- Migrate hooks to Supabase client
- Don't add subscriptions yet
- Use `.refetch()` for updates

### Phase 2+ (If Time)
- Add basic subscriptions to admin hooks
- Test with multiple browser tabs
- Verify RLS works correctly

### Phase 3+ (Later Enhancement)
- Add subscriptions to organizer hooks
- Add subscriptions to organization hooks
- Implement debouncing for performance

---

## Example: Admin Pending Leagues with Realtime

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export function usePendingLeagues(limit: number = 20, offset: number = 0) {
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
      setState({
        data: null,
        total: 0,
        isLoading: false,
        error: new Error(stringifyError(error)),
      })
    }
  }, [supabase, offset, limit])

  useEffect(() => {
    if (!isLoaded || !supabase) return

    // Initial fetch
    fetch()

    // Subscribe to pending league changes
    const channel = supabase
      .channel(`pending-leagues-${offset}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues',
          filter: 'status=eq.pending',
        },
        (payload) => {
          console.log('Pending league changed:', payload.eventType, payload.new)
          // Refetch to get updated data with correct count
          fetch()
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoaded, supabase, fetch, offset])

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

## Testing Realtime Locally

To test without another user:

1. Open admin page in Tab A
2. Open Supabase dashboard in Tab B
3. Manually insert/update league record in DB
4. Tab A updates instantly!

Or use browser DevTools:

```javascript
// In console of Tab A
const { data, error } = await supabase
  .from('leagues')
  .insert([{
    league_name: 'Test League',
    status: 'pending',
    // ... other fields
  }])

// Watch Tab A update instantly!
```

---

## Disabling Subscriptions for Testing

If realtime causes issues, easily disable:

```typescript
const ENABLE_REALTIME = process.env.NEXT_PUBLIC_REALTIME === 'true'

useEffect(() => {
  if (!isLoaded || !supabase || !ENABLE_REALTIME) return

  // Subscribe...
}, [isLoaded, supabase])
```

Set env var:
```bash
NEXT_PUBLIC_REALTIME=false  # Disable in development
NEXT_PUBLIC_REALTIME=true   # Enable in production
```

---

## Summary

- ✅ Realtime subscriptions available after Supabase migration
- ✅ RLS policies automatically enforced
- ✅ Good for smaller tables with real-time needs
- ✅ Implement after basic migration is stable
- ⚠️ Performance considerations for large tables

**Not required for Phase 2, but excellent enhancement for Phase 3+**
