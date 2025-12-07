'use client'

import { useLeagues } from './useDrafts'
import { useOrganizerTable } from '@/context/OrganizerTableContext'
import { useMemo } from 'react'

/**
 * Hook that wraps useLeagues with OrganizerTableContext sorting
 * Automatically applies the current sort state from the context
 */
export function useOrganizerLeagues(orgId: string, searchQuery?: string) {
  const { state } = useOrganizerTable('leagues')

  // Map context sortBy to league hook sortBy
  // Use useMemo to ensure stable values for hook dependencies
  const { hookSortBy, sortOrder } = useMemo(() => {
    const sortBy = state.sortBy === 'name' || state.sortBy === 'sport' ? 'date' : state.sortBy
    return {
      hookSortBy: sortBy as 'name' | 'sport' | 'status' | 'date',
      sortOrder: state.sortOrder
    }
  }, [state.sortBy, state.sortOrder])

  return useLeagues(orgId, searchQuery, hookSortBy, sortOrder)
}
