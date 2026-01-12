import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StrainCommunityStats {
  strain_id: string;
  total_sessions: number;
  avg_sleepiness: number;
  avg_relaxation: number;
  avg_anxiety: number;
  avg_focus: number;
  avg_pain_relief: number;
  avg_euphoria: number;
  percent_positive_outcome: number;
}

const MIN_SESSIONS_FOR_DISPLAY = 10;

export function useStrainCommunityStats(strainId: string) {
  return useQuery({
    queryKey: ["strain-community-stats", strainId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strain_community_stats")
        .select("*")
        .eq("strain_id", strainId)
        .maybeSingle();

      if (error) throw error;
      return data as StrainCommunityStats | null;
    },
    enabled: !!strainId,
  });
}

export function hasEnoughData(stats: StrainCommunityStats | null): boolean {
  return stats !== null && stats.total_sessions >= MIN_SESSIONS_FOR_DISPLAY;
}

export { MIN_SESSIONS_FOR_DISPLAY };
