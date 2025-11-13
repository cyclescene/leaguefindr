import useSWR from 'swr'
import { useAuth } from '@clerk/nextjs'
import { fetcher } from '@/lib/api'

interface Organization {
  id: string
  org_name: string
  org_email?: string
  org_phone?: string
  org_url?: string
  org_address?: string
}

export function useOrganizationSearch() {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/admin`,
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
    organizations: (data as Organization[] | undefined) || [],
    isLoading,
    error,
    mutate,
  }
}
