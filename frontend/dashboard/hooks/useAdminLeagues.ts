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
export function usePendingLeagues(limit: number = 20, offset: number = 0) {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/pending?limit=${limit}&offset=${offset}`,
    async (url: string) => {
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
    total: data?.total || 0,
    limit: data?.limit || limit,
    offset: data?.offset || offset,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch all leagues (all statuses) for admin view with pagination
 */
export function useAllLeagues(limit: number = 20, offset: number = 0) {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/all?limit=${limit}&offset=${offset}`,
    async (url: string) => {
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
    allLeagues: (data?.leagues || []) as PendingLeague[],
    total: data?.total || 0,
    limit: data?.limit || limit,
    offset: data?.offset || offset,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch a specific league by ID
 */
export function useLeague(leagueId: number | null) {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    leagueId ? `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/${leagueId}` : null,
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
    league: data as PendingLeague | undefined,
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
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/admin/drafts/all`,
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
    drafts: (data?.drafts || []) as any[], // TODO: Add proper Draft type
    isLoading,
    error,
    mutate,
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
