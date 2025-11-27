import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface AdminOrganization {
  id: string
  org_name: string
  org_email?: string
  org_phone?: string
  org_url?: string
  org_address?: string
  created_at: string
  updated_at: string
}

/**
 * Hook to fetch all organizations for admin view with pagination, filtering, and sorting
 */
export function useAdminOrganizations(
  limit: number = 20,
  offset: number = 0,
  filters?: { name?: string },
  sortBy?: 'name' | 'created_at',
  sortOrder?: 'asc' | 'desc'
) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as AdminOrganization[] | null,
    total: 0,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return

    try {
      let query = supabase
        .from('organizations')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters?.name) {
        query = query.ilike('org_name', `%${filters.name}%`)
      }

      // Apply sorting
      const sortColumn = sortBy === 'created_at' ? 'created_at' : 'org_name'
      const ascending = sortOrder === 'asc'
      query = query.order(sortColumn, { ascending })

      // Apply pagination
      const { data, count, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      setState({
        data: (data || []) as AdminOrganization[],
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
  }, [supabase, offset, limit, filters?.name, sortBy, sortOrder])

  useEffect(() => {
    if (!isLoaded) return
    fetch()
  }, [isLoaded, fetch])

  return { ...state, refetch: fetch }
}
