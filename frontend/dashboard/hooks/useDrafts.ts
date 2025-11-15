import useSWR from 'swr'
import { useAuth } from '@clerk/nextjs'
import { fetcher } from '@/lib/api'

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
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    orgId ? `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts/${orgId}` : null,
    async (url) => {
      const token = await getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetcher(url, token)
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    drafts: (data?.drafts || []) as Draft[],
    isLoading,
    error,
    mutate,
  }
}

export function useTemplates(orgId: string) {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    orgId ? `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/templates/${orgId}` : null,
    async (url) => {
      const token = await getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetcher(url, token)
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    templates: (data?.templates || []) as Draft[],
    isLoading,
    error,
    mutate,
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
}

export function useLeagues(orgId: string) {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    orgId ? `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/org/${orgId}` : null,
    async (url) => {
      const token = await getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetcher(url, token)
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    leagues: (data?.leagues || []) as SubmittedLeague[],
    isLoading,
    error,
    mutate,
  }
}
