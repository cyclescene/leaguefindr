import useSWR from "swr";

interface Sport {
  id: number;
  name: string;
  status: "approved" | "pending" | "rejected";
  request_count: number;
}

interface SportsResponse {
  sports: Sport[];
}

/**
 * Hook to fetch all approved sports for autocomplete
 * Caches for 1 minute to avoid excessive API calls
 */
export function useSportSearch() {
  const { data: allSports } = useSWR<SportsResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/sports/`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch sports");
      return response.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  const approvedSports = allSports?.sports || [];

  return { approvedSports };
}
