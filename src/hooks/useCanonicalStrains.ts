import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CanonicalStrain {
  id: string;
  canonical_name: string;
  normalized_name: string;
  strain_type: string | null;
  breeder_name: string | null;
  lineage_summary: string | null;
  parent_1_name: string | null;
  parent_2_name: string | null;
  source_notes: string | null;
  confidence_level: number;
  verified_batch_count: number;
  is_active: boolean;
  is_verified: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
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

      const sanitized = search?.trim().slice(0, 50).replace(/[%_\\]/g, "") || "";

      if (!sanitized) {
        return (strains as unknown as CanonicalStrain[]).map(s => ({ ...s, matchedAlias: undefined }));
      }

      const searchLower = sanitized.toLowerCase();

      const { data: aliases, error: aliasError } = await supabase
        .from("strain_aliases_canonical")
        .select("*")
        .ilike("alias_name", `%${sanitized}%`);

      if (aliasError) throw aliasError;

      const aliasMap = new Map<string, string>();
      (aliases || []).forEach((a: any) => {
        if (!aliasMap.has(a.strain_id)) {
          aliasMap.set(a.strain_id, a.alias_name);
        }
      });

      const results: CanonicalStrain[] = [];
      for (const strain of strains as unknown as CanonicalStrain[]) {
        const nameMatch = strain.canonical_name.toLowerCase().includes(searchLower);
        const normalizedMatch = strain.normalized_name?.toLowerCase().includes(searchLower);
        const aliasMatch = aliasMap.get(strain.id);
        if (nameMatch || normalizedMatch || aliasMatch) {
          results.push({ ...strain, matchedAlias: (nameMatch || normalizedMatch) ? undefined : aliasMatch });
        }
      }

      return results;
    },
  });
}

/** Search canonical strains with alias resolution */
export function useCanonicalStrainSearch(query: string) {
  return useQuery({
    queryKey: ["canonical-strain-search", query],
    queryFn: async () => {
      const sanitized = query?.trim().slice(0, 50).replace(/[%_\\]/g, "") || "";
      if (!sanitized || sanitized.length < 2) return [];

      const searchLower = sanitized.toLowerCase();
      const normalized = sanitized.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      // Search by normalized_name for fast matching
      const { data: nameMatches, error: nameErr } = await supabase
        .from("strains_canonical")
        .select("*")
        .or(`normalized_name.ilike.%${normalized}%,canonical_name.ilike.%${sanitized}%`)
        .limit(20);

      if (nameErr) throw nameErr;

      // Search aliases
      const { data: aliasMatches, error: aliasErr } = await supabase
        .from("strain_aliases_canonical")
        .select("strain_id, alias_name, normalized_alias")
        .or(`normalized_alias.ilike.%${normalized}%,alias_name.ilike.%${sanitized}%`)
        .limit(20);

      if (aliasErr) throw aliasErr;

      const resultMap = new Map<string, CanonicalStrain>();

      for (const s of nameMatches as unknown as CanonicalStrain[]) {
        resultMap.set(s.id, { ...s, matchedAlias: undefined });
      }

      // Fetch strains for alias matches not already found
      const missingIds = (aliasMatches || [])
        .filter((a: any) => !resultMap.has(a.strain_id))
        .map((a: any) => a.strain_id);

      if (missingIds.length > 0) {
        const { data: aliasStrains, error: asErr } = await supabase
          .from("strains_canonical")
          .select("*")
          .in("id", missingIds);

        if (!asErr && aliasStrains) {
          for (const s of aliasStrains as unknown as CanonicalStrain[]) {
            const alias = (aliasMatches || []).find((a: any) => a.strain_id === s.id);
            resultMap.set(s.id, { ...s, matchedAlias: alias?.alias_name });
          }
        }
      }

      // Also tag alias info on name matches
      for (const a of aliasMatches || []) {
        const existing = resultMap.get((a as any).strain_id);
        if (existing && !existing.matchedAlias) {
          const nameMatch = existing.canonical_name.toLowerCase().includes(searchLower);
          if (!nameMatch) {
            existing.matchedAlias = (a as any).alias_name;
          }
        }
      }

      return Array.from(resultMap.values());
    },
    enabled: (query?.trim().length ?? 0) >= 2,
  });
}

/** Resolve an alias to its canonical strain */
export async function resolveStrainAlias(aliasOrName: string): Promise<CanonicalStrain | null> {
  const normalized = aliasOrName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Try direct name match first
  const { data: direct } = await supabase
    .from("strains_canonical")
    .select("*")
    .eq("normalized_name", normalized)
    .maybeSingle();

  if (direct) return direct as unknown as CanonicalStrain;

  // Try alias
  const { data: alias } = await supabase
    .from("strain_aliases_canonical")
    .select("strain_id")
    .eq("normalized_alias", normalized)
    .maybeSingle();

  if (!alias) return null;

  const { data: strain } = await supabase
    .from("strains_canonical")
    .select("*")
    .eq("id", (alias as any).strain_id)
    .maybeSingle();

  return strain as unknown as CanonicalStrain | null;
}
