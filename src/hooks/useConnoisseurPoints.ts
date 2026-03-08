import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { computeConnoisseurPoints, type ConnoisseurPointsResult } from "@/lib/connoisseurPoints";

export function useConnoisseurPoints() {
  const { user } = useAuth();

  return useQuery<ConnoisseurPointsResult | null>({
    queryKey: ["connoisseur-points", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return computeConnoisseurPoints(user.id);
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
