/**
 * Fetcher function for use with SWR
 * Handles authentication headers and error responses
 */
export async function fetcher(url: string, token: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const error = new Error(`API error: ${res.status}`)
    throw error
  }

  return res.json()
}
