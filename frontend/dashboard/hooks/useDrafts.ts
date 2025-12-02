import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

export interface Draft {
  id: number
  org_id: string
  type: 'draft' | 'template'
  name?: string
  form_data: Record<string, any>
  created_at: string
  updated_at: string
  created_by?: string
}

export function useDrafts(orgId: string) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as Draft[] | null,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase || !orgId) return

    try {
      const { data, error } = await supabase
        .from('leagues_drafts')
        .select('*')
        .eq('org_id', orgId)
        .eq('type', 'draft')
        .order('updated_at', { ascending: false })

      if (error) {
        // Handle 416 gracefully
        if (error.code === 'PGRST116') {
          setState({
            data: [],
            isLoading: false,
            error: null,
          })
          return
        }
        throw error
      }

      setState({
        data: (data || []) as Draft[],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useDrafts - Error:', errorMessage)
      setState({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase, orgId])

  useEffect(() => {
    if (!isLoaded || !supabase || !orgId) return

    // Initial fetch
    fetch()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`leagues_drafts:org_id=eq.${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues_drafts',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          setState((prevState) => {
            if (!prevState.data) return prevState

            // Handle INSERT
            if (payload.eventType === 'INSERT') {
              const newDraft = payload.new as Draft
              if (newDraft.type === 'draft') {
                return {
                  ...prevState,
                  data: [newDraft, ...prevState.data].sort(
                    (a, b) =>
                      new Date(b.updated_at).getTime() -
                      new Date(a.updated_at).getTime()
                  ),
                }
              }
              return prevState
            }

            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              const updatedDraft = payload.new as Draft
              if (updatedDraft.type === 'draft') {
                return {
                  ...prevState,
                  data: prevState.data
                    .map((draft) =>
                      draft.id === updatedDraft.id ? updatedDraft : draft
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.updated_at).getTime() -
                        new Date(a.updated_at).getTime()
                    ),
                }
              }
              return prevState
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              const deletedDraft = payload.old as Draft
              if (deletedDraft.type === 'draft') {
                return {
                  ...prevState,
                  data: prevState.data.filter(
                    (draft) => draft.id !== deletedDraft.id
                  ),
                }
              }
              return prevState
            }

            return prevState
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isLoaded, supabase, orgId, fetch])

  return {
    drafts: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}

export function useTemplates(orgId: string) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as Draft[] | null,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase || !orgId) return

    try {
      const { data, error } = await supabase
        .from('leagues_drafts')
        .select('*')
        .eq('org_id', orgId)
        .eq('type', 'template')
        .order('updated_at', { ascending: false })

      if (error) {
        // Handle 416 gracefully
        if (error.code === 'PGRST116') {
          setState({
            data: [],
            isLoading: false,
            error: null,
          })
          return
        }
        throw error
      }

      setState({
        data: (data || []) as Draft[],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useTemplates - Error:', errorMessage)
      setState({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase, orgId])

  useEffect(() => {
    if (!isLoaded || !supabase || !orgId) return

    // Initial fetch
    fetch()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`leagues_templates:org_id=eq.${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues_drafts',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          setState((prevState) => {
            if (!prevState.data) return prevState

            // Handle INSERT
            if (payload.eventType === 'INSERT') {
              const newTemplate = payload.new as Draft
              if (newTemplate.type === 'template') {
                return {
                  ...prevState,
                  data: [newTemplate, ...prevState.data].sort(
                    (a, b) =>
                      new Date(b.updated_at).getTime() -
                      new Date(a.updated_at).getTime()
                  ),
                }
              }
              return prevState
            }

            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              const updatedTemplate = payload.new as Draft
              if (updatedTemplate.type === 'template') {
                return {
                  ...prevState,
                  data: prevState.data
                    .map((template) =>
                      template.id === updatedTemplate.id ? updatedTemplate : template
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.updated_at).getTime() -
                        new Date(a.updated_at).getTime()
                    ),
                }
              }
              return prevState
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              const deletedTemplate = payload.old as Draft
              if (deletedTemplate.type === 'template') {
                return {
                  ...prevState,
                  data: prevState.data.filter(
                    (template) => template.id !== deletedTemplate.id
                  ),
                }
              }
              return prevState
            }

            return prevState
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isLoaded, supabase, orgId, fetch])

  return {
    templates: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}

export function useDraftsAndTemplates(orgId: string) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as Draft[] | null,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase || !orgId) return

    try {
      const { data, error } = await supabase
        .from('leagues_drafts')
        .select('*')
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false })

      if (error) {
        // Handle 416 gracefully
        if (error.code === 'PGRST116') {
          setState({
            data: [],
            isLoading: false,
            error: null,
          })
          return
        }
        throw error
      }

      setState({
        data: (data || []) as Draft[],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useDraftsAndTemplates - Error:', errorMessage)
      setState({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase, orgId])

  useEffect(() => {
    if (!isLoaded || !supabase || !orgId) return

    // Initial fetch
    fetch()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`leagues_drafts_templates:org_id=eq.${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues_drafts',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          setState((prevState) => {
            if (!prevState.data) return prevState

            // Handle INSERT
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as Draft
              return {
                ...prevState,
                data: [newItem, ...prevState.data].sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime()
                ),
              }
            }

            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              const updatedItem = payload.new as Draft
              return {
                ...prevState,
                data: prevState.data
                  .map((item) =>
                    item.id === updatedItem.id ? updatedItem : item
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.updated_at).getTime() -
                      new Date(a.updated_at).getTime()
                  ),
              }
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              const deletedItem = payload.old as Draft
              return {
                ...prevState,
                data: prevState.data.filter(
                  (item) => item.id !== deletedItem.id
                ),
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
  }, [isLoaded, supabase, orgId, fetch])

  return {
    draftsAndTemplates: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}

export interface SubmittedLeague {
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
    organization_name?: string
    sport_name?: string
    venue_name?: string
    [key: string]: any
  }
}

export function useLeagues(orgId: string) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as SubmittedLeague[] | null,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase || !orgId) return

    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === 'PGRST116') {
          setState({
            data: [],
            isLoading: false,
            error: null,
          })
          return
        }
        throw error
      }

      setState({
        data: (data || []) as SubmittedLeague[],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useLeagues - Error:', errorMessage)
      setState({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [supabase, orgId])

  useEffect(() => {
    if (!isLoaded || !supabase || !orgId) return

    // Initial fetch
    fetch()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`leagues:org_id=eq.${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          setState((prevState) => {
            if (!prevState.data) return prevState

            // Handle INSERT
            if (payload.eventType === 'INSERT') {
              const newLeague = payload.new as SubmittedLeague
              return {
                ...prevState,
                data: [newLeague, ...prevState.data].sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                ),
              }
            }

            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              const updatedLeague = payload.new as SubmittedLeague
              return {
                ...prevState,
                data: prevState.data
                  .map((league) =>
                    league.id === updatedLeague.id ? updatedLeague : league
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  ),
              }
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              const deletedLeague = payload.old as SubmittedLeague
              return {
                ...prevState,
                data: prevState.data.filter(
                  (league) => league.id !== deletedLeague.id
                ),
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
  }, [isLoaded, supabase, orgId, fetch])

  return {
    leagues: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}
