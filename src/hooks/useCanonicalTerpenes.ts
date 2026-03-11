import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CanonicalTerpene {
  id: string;
  canonical_name: string;
  short_name: string | null;
  aroma_tags: string[];
  flavor_tags: string[];
  potential_effect_tags: string[];
  chemical_family: string | null;
  boiling_point_c: number | null;
  research_summary: string | null;
  evidence_level: number;
  is_active: boolean;
}

export function useCanonicalTerpenes(activeOnly = true) {
  return useQuery({
    queryKey: ["canonical-terpenes", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("terpenes_canonical" as any)
        .select("*")
        .order("canonical_name");

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as CanonicalTerpene[];
    },
    staleTime: 30 * 60 * 1000,
  });
}
