import useSWR from 'swr'
import { useAuth } from '@clerk/nextjs'
import { fetcher } from '@/lib/api'

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
}

/**
 * Hook to fetch pending leagues that need admin review
 */
export function usePendingLeagues() {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/admin/leagues/pending`,
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
    pendingLeagues: (data?.leagues || []) as PendingLeague[],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch a specific pending league for review
 */
export function usePendingLeague(leagueId: number | null) {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    leagueId ? `${process.env.NEXT_PUBLIC_API_URL}/v1/admin/leagues/${leagueId}` : null,
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
    league: data?.league as PendingLeague | undefined,
    isLoading,
    error,
    mutate,
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
      `${process.env.NEXT_PUBLIC_API_URL}/v1/admin/leagues/${leagueId}/approve`,
      {
        method: 'POST',
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
      `${process.env.NEXT_PUBLIC_API_URL}/v1/admin/leagues/${leagueId}/reject`,
      {
        method: 'POST',
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
