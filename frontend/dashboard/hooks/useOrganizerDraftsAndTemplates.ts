'use client'

import { useDraftsAndTemplates } from './useDrafts'
import { useOrganizerTable } from '@/context/OrganizerTableContext'
import { useMemo } from 'react'

/**
 * Hook that wraps useDraftsAndTemplates with OrganizerTableContext sorting
 * Automatically applies the current sort state from the context
 */
export function useOrganizerDraftsAndTemplates(orgId: string, searchQuery?: string) {
  const { state } = useOrganizerTable('drafts-templates')

  // Map context sortBy to hook sortBy
  // Use useMemo to ensure stable values for hook dependencies
  const { hookSortBy, sortOrder } = useMemo(() => {
    const sortBy = state.sortBy === 'name' || state.sortBy === 'sport' ? 'name' : state.sortBy
    return {
      hookSortBy: sortBy as 'name' | 'created' | 'type',
      sortOrder: state.sortOrder
    }
  }, [state.sortBy, state.sortOrder])

  return useDraftsAndTemplates(orgId, searchQuery, hookSortBy, sortOrder)
}
