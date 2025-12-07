import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface AdminOrganization {
  id: string
  org_name: string
  org_email?: string
  org_phone_number?: string
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
  const { supabase, isLoaded, executeWithRetry } = useSupabase()
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
        .eq('is_active', true)

      // Apply filters
      if (filters?.name) {
        query = query.ilike('org_name', `%${filters.name}%`)
      }

      // Apply sorting with case-insensitive collation
      const sortColumn = sortBy === 'created_at' ? 'created_at' : 'lower_org_name'
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
        'useAdminOrganizations'
      )

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
  }, [supabase, offset, limit, filters?.name, sortBy, sortOrder, executeWithRetry])

  useEffect(() => {
    if (!isLoaded) return
    fetch()
  }, [isLoaded, fetch])

  return { ...state, refetch: fetch }
}
