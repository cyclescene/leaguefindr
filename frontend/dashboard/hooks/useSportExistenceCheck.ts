import useSWR from "swr";

export interface CheckSportExistsResponse {
  exists: boolean;
  status?: "approved" | "pending" | "rejected";
  rejection_reason?: string;
  request_count?: number;
}

/**
 * Hook to check if a sport exists (including pending/rejected)
 * Only fetches if sport name is 2+ chars and no sport is currently selected
 */
export function useSportExistenceCheck(
  debouncedSportName: string,
  isSelected: boolean
) {
  const { data: sportCheckData, isLoading: isCheckingExistence } =
    useSWR<CheckSportExistsResponse>(
      debouncedSportName && debouncedSportName.length >= 2 && !isSelected
        ? `${process.env.NEXT_PUBLIC_API_URL}/v1/sports/exists?name=${encodeURIComponent(debouncedSportName)}`
        : null,
      async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to check sport");
        return response.json();
      },
      {
        revalidateOnFocus: false,
        dedupingInterval: 1000,
      }
    );

  return { sportCheckData, isCheckingExistence };
}
