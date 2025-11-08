import useSWR from 'swr'
import { useAuth } from '@clerk/nextjs'
import { fetcher } from '@/lib/api'

export interface Draft {
  id: number
  org_id: string
  type: 'draft' | 'template'
  name?: string
  draft_data: Record<string, any>
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
    drafts: data as Draft[] | undefined,
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
    templates: data as Draft[] | undefined,
    isLoading,
    error,
    mutate,
  }
}
