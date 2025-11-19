import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'
import { stringifyError } from '@/hooks/useReadOnlyData'

interface Organization {
  id: string
  org_name: string
  org_email?: string
  org_phone?: string
  org_url?: string
  org_address?: string
}

export function useOrganizationSearch() {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as Organization[] | null,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('org_name', { ascending: true })

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
        data: (data || []) as Organization[],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useOrganizationSearch - Error:', errorMessage)
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
    organizations: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}
