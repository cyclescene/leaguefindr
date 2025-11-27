import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface AdminVenue {
  id: number
  venue_name: string
  venue_address?: string
  venue_phone?: string
  venue_email?: string
  venue_capacity?: number
  venue_url?: string
  created_at: string
  updated_at: string
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
  const { supabase, isLoaded } = useSupabase()
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
        query = query.ilike('venue_name', `%${filters.name}%`)
      }

      // Apply sorting (default by name)
      const ascending = sortOrder === 'asc'
      query = query.order('venue_name', { ascending })

      // Apply pagination
      const { data, count, error } = await query.range(offset, offset + limit - 1)

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
  }, [supabase, offset, limit, filters?.name, sortOrder])

  useEffect(() => {
    if (!isLoaded) return
    fetch()
  }, [isLoaded, fetch])

  return { ...state, refetch: fetch }
}
