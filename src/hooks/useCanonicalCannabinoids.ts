import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CanonicalCannabinoid {
  id: string;
  canonical_name: string;
  short_name: string;
  psychoactive_level: string;
  potential_effect_tags: string[];
  medical_interest_tags: string[];
  boiling_point_c: number | null;
  research_summary: string | null;
  evidence_level: number;
  is_active: boolean;
}

export function useCanonicalCannabinoids(activeOnly = true) {
  return useQuery({
    queryKey: ["canonical-cannabinoids", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("cannabinoids_canonical" as any)
        .select("*")
        .order("canonical_name");

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as CanonicalCannabinoid[];
    },
    staleTime: 30 * 60 * 1000,
  });
}
