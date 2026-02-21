import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Strain {
  id: string;
  name: string;
  type: string;
  thc_min: number | null;
  thc_max: number | null;
  cbd_min: number | null;
  cbd_max: number | null;
  thc_range: string | null;
  cbd_range: string | null;
  common_effects: string[];
  common_negatives: string[];
  description: string | null;
  is_pending: boolean;
  submitted_by: string | null;
  created_at: string;
}

export interface StrainAlias {
  id: string;
  strain_id: string;
  alias_name: string;
  created_at: string;
}

export interface StrainWithMatch extends Strain {
  matchedAlias?: string;
}

export function useStrains(search?: string, type?: string | null) {
  return useQuery({
    queryKey: ["strains", search, type],
    queryFn: async () => {
      // First get strains matching name
      let query = supabase
        .from("strains")
        .select("*")
        .order("name");

      if (type) {
        query = query.eq("type", type);
      }

      const { data: strains, error } = await query;
      if (error) throw error;

      // Sanitize search input
      const sanitized = search?.trim().slice(0, 50).replace(/[%_\\]/g, "") || "";
      
      if (!sanitized) {
        return (strains as Strain[]).map(s => ({ ...s, matchedAlias: undefined })) as StrainWithMatch[];
      }

      const searchLower = sanitized.toLowerCase();
      
      // Get aliases that match search (wildcards escaped above)
      const { data: aliases, error: aliasError } = await supabase
        .from("strain_aliases")
        .select("*")
        .ilike("alias_name", `%${sanitized}%`);
      
      if (aliasError) throw aliasError;

      // Create a map of strain_id to matched alias
      const aliasMap = new Map<string, string>();
      (aliases || []).forEach((alias: StrainAlias) => {
        if (!aliasMap.has(alias.strain_id)) {
          aliasMap.set(alias.strain_id, alias.alias_name);
        }
      });

      // Filter strains by name or alias match
      const results: StrainWithMatch[] = [];
      
      for (const strain of strains as Strain[]) {
      const nameMatch = strain.name.toLowerCase().includes(searchLower);
        const aliasMatch = aliasMap.get(strain.id);
        
        if (nameMatch || aliasMatch) {
          results.push({
            ...strain,
            matchedAlias: nameMatch ? undefined : aliasMatch,
          });
        }
      }

      return results;
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

export function useCreatePendingStrain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      type: string;
      description?: string;
      thc_min?: number;
      thc_max?: number;
      cbd_min?: number;
      cbd_max?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to submit a strain");

      const { data, error } = await supabase
        .from("strains")
        .insert({
          name: input.name.trim(),
          type: input.type,
          description: input.description?.trim() || null,
          thc_min: input.thc_min ?? null,
          thc_max: input.thc_max ?? null,
          cbd_min: input.cbd_min ?? null,
          cbd_max: input.cbd_max ?? null,
          is_pending: true,
          submitted_by: user.id,
          common_effects: [],
          common_negatives: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as Strain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strains"] });
    },
  });
}

// Format THC/CBD range for display
export function formatPotencyRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    return `${min}-${max}%`;
  }
  if (min !== null) return `${min}%+`;
  if (max !== null) return `Up to ${max}%`;
  return null;
}
