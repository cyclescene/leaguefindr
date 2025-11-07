import useSWR from 'swr'
import { useUser } from '@clerk/nextjs'
import { fetcher } from '@/lib/api'

interface Organization {
  id: string
  org_name: string
  org_email?: string
  org_phone?: string
  org_url?: string
  org_address?: string
}

export function useUserOrganizations() {
  const { user } = useUser()

  const { data, error, isLoading, mutate } = useSWR(
    user ? `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/user` : null,
    async (url) => {
      const token = await user?.getIdToken?.()
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
    organizations: data as Organization[] | undefined,
    isLoading,
    error,
    mutate,
  }
}

export function useOrganization(orgId: string) {
  const { user } = useUser()

  const { data, error, isLoading } = useSWR(
    user && orgId ? `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/${orgId}` : null,
    async (url) => {
      const token = await user?.getIdToken?.()
      if (!token) {
        throw new Error('No authentication token available')
      }
      return fetcher(url, token)
    },
    {
      revalidateOnFocus: false,
    }
  )

  return {
    organization: data as Organization | undefined,
    isLoading,
    error,
  }
}
