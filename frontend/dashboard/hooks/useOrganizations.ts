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
  const shouldFetch = !!user

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch
      ? [
          `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/user`,
          async () => {
            const token = await user.getIdToken?.()
            return token
          },
        ]
      : null,
    async (key, tokenFn) => {
      const token = await tokenFn()
      return fetcher(key, token)
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
  const shouldFetch = !!user && !!orgId

  const { data, error, isLoading } = useSWR(
    shouldFetch
      ? [
          `${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/${orgId}`,
          async () => {
            const token = await user.getIdToken?.()
            return token
          },
        ]
      : null,
    async (key, tokenFn) => {
      const token = await tokenFn()
      return fetcher(key, token)
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
