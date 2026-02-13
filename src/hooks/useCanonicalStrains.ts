import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CanonicalStrain {
  id: string;
  canonical_name: string;
  strain_type: string | null;
  description: string | null;
  is_verified: boolean;
  created_at: string;
  matchedAlias?: string;
}

export function useCanonicalStrains(search?: string) {
  return useQuery({
    queryKey: ["canonical-strains", search],
    queryFn: async () => {
      const { data: strains, error } = await supabase
        .from("strains_canonical")
        .select("*")
        .order("canonical_name");

      if (error) throw error;

      if (!search) {
        return (strains as CanonicalStrain[]).map(s => ({ ...s, matchedAlias: undefined }));
      }

      const searchLower = search.toLowerCase();

      // Get aliases that match
      const { data: aliases, error: aliasError } = await supabase
        .from("strain_aliases_canonical")
        .select("*")
        .ilike("alias_name", `%${search}%`);

      if (aliasError) throw aliasError;

      const aliasMap = new Map<string, string>();
      (aliases || []).forEach((a: any) => {
        if (!aliasMap.has(a.strain_id)) {
          aliasMap.set(a.strain_id, a.alias_name);
        }
      });

      const results: CanonicalStrain[] = [];
      for (const strain of strains as CanonicalStrain[]) {
        const nameMatch = strain.canonical_name.toLowerCase().includes(searchLower);
        const aliasMatch = aliasMap.get(strain.id);
        if (nameMatch || aliasMatch) {
          results.push({ ...strain, matchedAlias: nameMatch ? undefined : aliasMatch });
        }
      }

      return results;
    },
  });
}
