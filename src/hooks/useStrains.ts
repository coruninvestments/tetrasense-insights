import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Strain {
  id: string;
  name: string;
  type: string;
  thc_range: string | null;
  cbd_range: string | null;
  common_effects: string[];
  common_negatives: string[];
  description: string | null;
  created_at: string;
}

export function useStrains(search?: string, type?: string | null) {
  return useQuery({
    queryKey: ["strains", search, type],
    queryFn: async () => {
      let query = supabase
        .from("strains")
        .select("*")
        .order("name");

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Strain[];
    },
  });
}

export function useStrain(id: string) {
  return useQuery({
    queryKey: ["strain", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strains")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Strain | null;
    },
    enabled: !!id,
  });
}
