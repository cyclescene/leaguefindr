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
    if (isLoaded && supabase && orgId) {
      fetch()
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
    if (isLoaded && supabase && orgId) {
      fetch()
    }
  }, [isLoaded, supabase, orgId, fetch])

  return {
    templates: state.data || [],
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
    if (isLoaded && supabase && orgId) {
      fetch()
    }
  }, [isLoaded, supabase, orgId, fetch])

  return {
    leagues: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}
