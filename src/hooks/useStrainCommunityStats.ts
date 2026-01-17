import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Community statistics for a strain, aggregated from all user sessions
 * 
 * PRIVACY NOTE: Averages and percentages are only populated when total_sessions >= 10
 * to prevent inference attacks and protect individual user privacy.
 * Below this threshold, aggregate fields will be null.
 */
export interface StrainCommunityStats {
  strain_id: string;
  total_sessions: number;
  // These are nullable - only populated when total_sessions >= MIN_SESSIONS_FOR_DISPLAY
  avg_sleepiness: number | null;
  avg_relaxation: number | null;
  avg_anxiety: number | null;
  avg_focus: number | null;
  avg_pain_relief: number | null;
  avg_euphoria: number | null;
  percent_positive_outcome: number | null;
}

/**
 * Minimum sessions required before showing aggregated community data
 * This threshold exists for privacy protection - small sample sizes
 * could allow identification of individual users
 */
export const MIN_SESSIONS_FOR_DISPLAY = 10;

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

/**
 * Check if we have enough sessions to display community stats
 * Returns true only when stats exist AND meet the privacy threshold
 */
export function hasEnoughData(stats: StrainCommunityStats | null): boolean {
  return stats !== null && stats.total_sessions >= MIN_SESSIONS_FOR_DISPLAY;
}

/**
 * Check if community stats have aggregated averages available
 * (They may be null even if stats exist, when below privacy threshold)
 */
export function hasAggregateData(stats: StrainCommunityStats | null): boolean {
  if (!stats) return false;
  // Check if any aggregate field is populated (they're all set together)
  return stats.avg_relaxation !== null;
}
