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

export function useUserOrganizations() {
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
        .from('user_organizations')
        .select('organizations(*)')
        .order('organizations(org_name)', { ascending: true })

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

      // Extract organizations from org_members records
      const organizations = (data || [])
        .map((record: any) => record.organizations)
        .filter(Boolean) as Organization[]

      setState({
        data: organizations,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useUserOrganizations - Error:', errorMessage)
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

export function useOrganization(orgId: string) {
  const { supabase, isLoaded } = useSupabase()
  const [state, setState] = useState({
    data: null as Organization | null,
    isLoading: true,
    error: null as Error | null,
  })

  const fetch = useCallback(async () => {
    if (!supabase || !orgId) return

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setState({
            data: null,
            isLoading: false,
            error: null,
          })
          return
        }
        throw error
      }

      setState({
        data: (data || null) as Organization | null,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = stringifyError(error)
      console.error('useOrganization - Error:', errorMessage)
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
    organization: state.data || undefined,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetch,
  }
}
