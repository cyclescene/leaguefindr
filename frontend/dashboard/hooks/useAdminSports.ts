import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface AdminSport {
  id: number
  name: string
}

/**
 * Hook to fetch all sports for admin view with pagination, filtering, and sorting
 */
export function useAdminSports(
  limit: number = 20,
  offset: number = 0,
  filters?: { name?: string },
  sortBy?: 'name',
  sortOrder?: 'asc' | 'desc'
) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as AdminSport[] | null,
    total: 0,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return

    try {
      let query = supabase
        .from('sports')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`)
      }

      // Apply sorting (default by name)
      const ascending = sortOrder === 'asc'
      query = query.order('name', { ascending })

      // Apply pagination
      const { data, count, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      setState({
        data: (data || []) as AdminSport[],
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
