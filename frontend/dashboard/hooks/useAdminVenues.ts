import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface AdminVenue {
  id: number
  name: string
  address?: string
}

/**
 * Hook to fetch all venues for admin view with pagination, filtering, and sorting
 */
export function useAdminVenues(
  limit: number = 20,
  offset: number = 0,
  filters?: { name?: string },
  sortBy?: 'name',
  sortOrder?: 'asc' | 'desc'
) {
  const { supabase, isLoaded, executeWithRetry } = useSupabase()
  const [state, setState] = useState({
    data: null as AdminVenue[] | null,
    total: 0,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return

    try {
      let query = supabase
        .from('venues')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`)
      }

      // Apply sorting with case-insensitive collation
      const sortColumn = sortBy === 'name' ? 'lower_venue_name' : 'lower_venue_name'
      const ascending = sortOrder === 'asc'
      query = query.order(sortColumn, {
        ascending,
        nullsFirst: false,
      })

      // Apply pagination with automatic token refresh on auth errors
      const { data, count, error } = await executeWithRetry(
        async () => {
          return await query.range(offset, offset + limit - 1)
        },
        'useAdminVenues'
      )

      if (error) {
        throw error
      }

      setState({
        data: (data || []) as AdminVenue[],
        total: count || 0,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(stringifyError(error)),
      }))
    }
  }, [supabase, offset, limit, filters?.name, sortBy, sortOrder, executeWithRetry])

  useEffect(() => {
    if (!isLoaded) return
    fetch()
  }, [isLoaded, fetch])

  return { ...state, refetch: fetch }
}
