import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface AdminDraft {
  id: number
  org_id: string
  type: 'draft' | 'template'
  name?: string
  form_data: Record<string, any>
  created_at: string
  updated_at: string
  created_by?: string
}

/**
 * Hook to fetch all drafts and templates for admin view with pagination, filtering, and sorting
 */
export function useAdminDrafts(
  limit: number = 20,
  offset: number = 0,
  filters?: { name?: string; type?: 'draft' | 'template'; sport?: string },
  sortBy?: 'name' | 'date',
  sortOrder?: 'asc' | 'desc'
) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as AdminDraft[] | null,
    total: 0,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return

    try {
      let query = supabase
        .from('leagues_drafts')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.sport) {
        // Filter by sport in form_data (JSON)
        query = query.ilike('form_data->>sport_name', `%${filters.sport}%`)
      }

      // Apply sorting
      let sortColumn: string
      if (sortBy === 'name') {
        sortColumn = 'name'
      } else {
        sortColumn = 'updated_at'
      }
      const ascending = sortOrder === 'asc'
      query = query.order(sortColumn, { ascending })

      // Apply pagination
      const { data, count, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      setState({
        data: (data || []) as AdminDraft[],
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
  }, [supabase, offset, limit, filters?.name, filters?.type, filters?.sport, sortBy, sortOrder])

  useEffect(() => {
    if (!isLoaded) return
    fetch()
  }, [isLoaded, fetch])

  return { ...state, refetch: fetch }
}
