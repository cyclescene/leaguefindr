import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface AdminDraft {
  id: number
  org_id: string
  type: string
  name?: string
  form_data: Record<string, any>
  created_at: string
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
  sortOrder?: 'asc' | 'desc',
  userId?: string
) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as AdminDraft[] | null,
    total: 0,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase || !userId) return

    try {
      let query = supabase
        .from('leagues_drafts')
        .select('*', { count: 'exact' })
        .eq('created_by', userId)

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
  }, [supabase, offset, limit, filters?.name, filters?.type, filters?.sport, sortBy, sortOrder, userId])

  useEffect(() => {
    if (!isLoaded || !supabase || !userId) return

    // Initial fetch
    fetch()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`leagues_drafts:created_by=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues_drafts',
          filter: `created_by=eq.${userId}`,
        },
        (payload) => {
          setState((prevState) => {
            if (!prevState.data) return prevState

            // Handle INSERT
            if (payload.eventType === 'INSERT') {
              const newDraft = payload.new as AdminDraft
              return {
                ...prevState,
                data: [newDraft, ...prevState.data],
                total: prevState.total + 1,
              }
            }

            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              const updatedDraft = payload.new as AdminDraft
              return {
                ...prevState,
                data: prevState.data.map((draft) =>
                  draft.id === updatedDraft.id ? updatedDraft : draft
                ),
              }
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              const deletedDraft = payload.old as AdminDraft
              return {
                ...prevState,
                data: prevState.data.filter(
                  (draft) => draft.id !== deletedDraft.id
                ),
                total: Math.max(0, prevState.total - 1),
              }
            }

            return prevState
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isLoaded, supabase, userId, fetch])

  return { ...state, refetch: fetch }
}
