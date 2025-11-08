import useSWR from "swr";

interface Venue {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: "approved" | "pending" | "rejected";
  request_count: number;
}

interface VenuesResponse {
  venues: Venue[];
}

/**
 * Hook to fetch all approved venues for venue selection
 * Caches for 1 minute to avoid excessive API calls
 */
export function useVenueSearch() {
  const { data: allVenues } = useSWR<VenuesResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/venues/`,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch venues");
      return response.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  const approvedVenues = allVenues?.venues || [];

  return { approvedVenues };
}
