import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface PendingLeague {
  id: number
  org_id: string
  sport_id?: number | null
  league_name: string
  division: string
  registration_deadline: string
  season_start_date: string
  season_end_date?: string | null
  game_occurrences: Array<{ day: string; startTime: string; endTime: string }>
  pricing_strategy: string
  pricing_amount: number
  pricing_per_player?: number | null
  venue_id?: number | null
  gender: string
  season_details?: string | null
  registration_url: string
  duration: number
  minimum_team_players: number
  per_game_fee?: number | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  created_by?: string
  rejection_reason?: string | null
  form_data?: {
    sport_name?: string
    venue_name?: string
    organization_name?: string
    [key: string]: any
  }
}

/**
 * Hook to fetch pending leagues that need admin review with pagination support
 */
export function usePendingLeagues(limit: number = 20, offset: number = 0, searchQuery?: string) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as PendingLeague[] | null,
    total: 0,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return

    try {
      let query = supabase
        .from('leagues')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')

      // Apply multi-column search across league_name, sport, venue, and organization
      if (searchQuery) {
        query = query.or(
          `league_name.ilike.%${searchQuery}%,` +
          `form_data->>sport_name.ilike.%${searchQuery}%,` +
          `form_data->>venue_name.ilike.%${searchQuery}%,` +
          `form_data->>organization_name.ilike.%${searchQuery}%`
        )
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        // Handle 416 (Range Not Satisfiable) gracefully - just means no data at this offset
        if (error.code === 'PGRST116') {
          setState({
            data: [],
            total: 0,
            isLoading: false,
            error: null,
          })
          return
        }
        throw error
      }

      setState({
        data: (data || []) as PendingLeague[],
        total: count || 0,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('usePendingLeagues - Error:', errorMessage)
      setState({
        data: null,
        total: 0,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase, offset, limit, searchQuery])

  useEffect(() => {
    if (!isLoaded || !supabase) return

    // Initial fetch
    fetch()

    // Subscribe to realtime updates for pending leagues
    const subscription = supabase
      .channel(`leagues:status=eq.pending`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues',
          filter: `status=eq.pending`,
        },
        (payload) => {
          setState((prevState) => {
            if (!prevState.data) return prevState

            // Handle INSERT
            if (payload.eventType === 'INSERT') {
              const newLeague = payload.new as PendingLeague
              return {
                ...prevState,
                data: [newLeague, ...prevState.data],
                total: prevState.total + 1,
              }
            }

            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              const updatedLeague = payload.new as PendingLeague
              // If status changed away from pending, remove it
              if (updatedLeague.status !== 'pending') {
                return {
                  ...prevState,
                  data: prevState.data.filter(
                    (league) => league.id !== updatedLeague.id
                  ),
                  total: Math.max(0, prevState.total - 1),
                }
              }
              return {
                ...prevState,
                data: prevState.data.map((league) =>
                  league.id === updatedLeague.id ? updatedLeague : league
                ),
              }
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              const deletedLeague = payload.old as PendingLeague
              return {
                ...prevState,
                data: prevState.data.filter(
                  (league) => league.id !== deletedLeague.id
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
  }, [isLoaded, supabase, fetch])

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

/**
 * Hook to fetch all leagues (all statuses) for admin view with pagination and filtering
 */
export function useAllLeagues(limit: number = 20, offset: number = 0, status?: 'pending' | 'approved' | 'rejected', searchQuery?: string) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as PendingLeague[] | null,
    total: 0,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return

    try {
      let query = supabase
        .from('leagues')
        .select('*', { count: 'exact' })

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status)
      }

      // Apply multi-column search across league_name, sport, venue, and organization
      if (searchQuery) {
        query = query.or(
          `league_name.ilike.%${searchQuery}%,` +
          `form_data->>sport_name.ilike.%${searchQuery}%,` +
          `form_data->>venue_name.ilike.%${searchQuery}%,` +
          `form_data->>organization_name.ilike.%${searchQuery}%`
        )
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      setState({
        data: (data || []) as PendingLeague[],
        total: count || 0,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useAllLeagues - Error:', errorMessage)
      setState({
        data: null,
        total: 0,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase, offset, limit, status, searchQuery])

  useEffect(() => {
    if (!isLoaded || !supabase) return

    // Initial fetch
    fetch()

    // Build filter for realtime subscription
    const filter = status ? `status=eq.${status}` : undefined

    // Subscribe to realtime updates for all leagues
    const subscription = supabase
      .channel(`leagues:all`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues',
          ...(filter && { filter }),
        },
        (payload) => {
          setState((prevState) => {
            if (!prevState.data) return prevState

            // Handle INSERT
            if (payload.eventType === 'INSERT') {
              const newLeague = payload.new as PendingLeague
              // Only add if matches status filter or no filter
              if (!status || newLeague.status === status) {
                return {
                  ...prevState,
                  data: [newLeague, ...prevState.data],
                  total: prevState.total + 1,
                }
              }
              return prevState
            }

            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              const updatedLeague = payload.new as PendingLeague
              // If status filter is set and status changed, remove it
              if (status && updatedLeague.status !== status) {
                return {
                  ...prevState,
                  data: prevState.data.filter(
                    (league) => league.id !== updatedLeague.id
                  ),
                  total: Math.max(0, prevState.total - 1),
                }
              }
              // If no status filter or status matches, update
              if (!status || updatedLeague.status === status) {
                return {
                  ...prevState,
                  data: prevState.data.map((league) =>
                    league.id === updatedLeague.id ? updatedLeague : league
                  ),
                }
              }
              return prevState
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              const deletedLeague = payload.old as PendingLeague
              return {
                ...prevState,
                data: prevState.data.filter(
                  (league) => league.id !== deletedLeague.id
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
  }, [isLoaded, supabase, fetch, status])

  return {
    allLeagues: state.data || [],
    total: state.total,
    limit,
    offset,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}

/**
 * Hook to fetch a specific league by ID
 */
export function useLeague(leagueId: number | null) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as PendingLeague | null,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase || !leagueId) return

    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single()

      if (error) throw error

      setState({
        data: (data || null) as PendingLeague | null,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useLeague - Error:', errorMessage)
      setState({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase, leagueId])

  useEffect(() => {
    if (!isLoaded || !supabase || !leagueId) return

    // Initial fetch
    fetch()

    // Subscribe to realtime updates for this specific league
    const subscription = supabase
      .channel(`leagues:id=eq.${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues',
          filter: `id=eq.${leagueId}`,
        },
        (payload) => {
          setState((prevState) => {
            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              return {
                ...prevState,
                data: payload.new as PendingLeague,
              }
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              return {
                ...prevState,
                data: null,
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
  }, [isLoaded, supabase, leagueId, fetch])

  return {
    league: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}

/**
 * Hook providing admin operations for leagues
 */
export function useAdminLeagueOperations() {
  const { getToken } = useAuth()

  const approveLeague = async (leagueId: number): Promise<void> => {
    const token = await getToken()
    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/${leagueId}/approve`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to approve league')
    }

    return await response.json()
  }

  const rejectLeague = async (leagueId: number, rejectionReason: string): Promise<void> => {
    const token = await getToken()
    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/${leagueId}/reject`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reject league')
    }

    return await response.json()
  }

  return {
    approveLeague,
    rejectLeague,
  }
}

/**
 * Hook to fetch all drafts across all organizations (admin only)
 */
export function useAllDrafts() {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as any[] | null,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('leagues_drafts')
        .select('*')
        .eq('type', 'draft')
        .order('updated_at', { ascending: false })

      if (error) throw error

      setState({
        data: (data || []) as any[],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useAllDrafts - Error:', errorMessage)
      setState({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase])

  useEffect(() => {
    if (isLoaded && supabase) {
      fetch()
    }
  }, [isLoaded, supabase, fetch])

  return {
    drafts: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}

/**
 * Hook providing admin operations for drafts
 */
export function useAdminDraftOperations() {
  const { getToken } = useAuth()

  const deleteDraft = async (draftId: number, orgId: string): Promise<void> => {
    const token = await getToken()
    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts/org/${orgId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ draft_id: draftId }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete draft')
    }

    return await response.json()
  }

  return {
    deleteDraft,
  }
}
