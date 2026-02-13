import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommunityStrainStat {
  id: string;
  strain_id: string;
  strain_name: string;
  strain_type: string;
  intent: string;
  top_effects: string[];
  outcome_positive_pct: number | null;
  outcome_neutral_pct: number | null;
  outcome_avoid_pct: number | null;
  sample_size: number;
  last_updated: string;
}

export function useCommunityStrainStats(intent?: string) {
  return useQuery({
    queryKey: ["community-strain-stats", intent],
    queryFn: async () => {
      let query = supabase
        .from("community_strain_stats")
        .select("*")
        .order("sample_size", { ascending: false });

      if (intent) {
        query = query.eq("intent", intent);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CommunityStrainStat[];
    },
  });
}
