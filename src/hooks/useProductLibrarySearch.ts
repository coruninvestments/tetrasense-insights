import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced product library search that resolves:
 * - product name / brand
 * - canonical strain name
 * - strain aliases (e.g. GSC → Girl Scout Cookies)
 *
 * Returns product IDs and matched strain IDs for display.
 */

export interface ProductSearchResult {
  id: string;
  product_name: string;
  brand_name: string | null;
  product_type: string;
  strain_id: string | null;
  is_verified: boolean;
  // enriched
  strain_name: string | null;
  strain_type: string | null;
  match_source: "product" | "strain" | "alias";
}

export function useProductLibrarySearch(query: string) {
  return useQuery({
    queryKey: ["product-library-search", query],
    queryFn: async () => {
      const sanitized = query?.trim().slice(0, 80).replace(/[%_\\]/g, "") || "";
      if (!sanitized || sanitized.length < 2) return null; // null = use default strain list

      const searchLower = sanitized.toLowerCase();
      const normalized = sanitized.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      // 1. Search products directly
      const { data: products } = await supabase
        .from("products")
        .select("id, product_name, brand_name, product_type, strain_id, is_verified")
        .eq("is_active", true)
        .or(`normalized_product_name.ilike.%${normalized}%,product_name.ilike.%${sanitized}%,brand_name.ilike.%${sanitized}%`)
        .limit(30);

      const resultMap = new Map<string, ProductSearchResult>();

      // Collect strain IDs we need to resolve
      const strainIdsToResolve = new Set<string>();

      for (const p of (products ?? []) as any[]) {
        resultMap.set(p.id, {
          ...p,
          strain_name: null,
          strain_type: null,
          match_source: "product",
        });
        if (p.strain_id) strainIdsToResolve.add(p.strain_id);
      }

      // 2. Search canonical strains by name
      const { data: strainMatches } = await supabase
        .from("strains_canonical")
        .select("id, canonical_name, strain_type, normalized_name")
        .or(`normalized_name.ilike.%${normalized}%,canonical_name.ilike.%${sanitized}%`)
        .eq("is_active", true)
        .limit(20);

      const matchedStrainIds = new Set<string>();
      for (const s of (strainMatches ?? []) as any[]) {
        matchedStrainIds.add(s.id);
        strainIdsToResolve.add(s.id);
      }

      // 3. Search strain aliases
      const { data: aliasMatches } = await supabase
        .from("strain_aliases_canonical")
        .select("strain_id, alias_name, normalized_alias")
        .or(`normalized_alias.ilike.%${normalized}%,alias_name.ilike.%${sanitized}%`)
        .limit(20);

      for (const a of (aliasMatches ?? []) as any[]) {
        matchedStrainIds.add(a.strain_id);
        strainIdsToResolve.add(a.strain_id);
      }

      // 4. Fetch products linked to matched strains (that we don't already have)
      const strainIdArray = [...matchedStrainIds];
      if (strainIdArray.length > 0) {
        const { data: strainProducts } = await supabase
          .from("products")
          .select("id, product_name, brand_name, product_type, strain_id, is_verified")
          .eq("is_active", true)
          .in("strain_id", strainIdArray)
          .limit(30);

        for (const p of (strainProducts ?? []) as any[]) {
          if (!resultMap.has(p.id)) {
            // Check if it came from alias or direct strain match
            const fromAlias = (aliasMatches ?? []).some((a: any) => a.strain_id === p.strain_id);
            const fromStrain = (strainMatches ?? []).some((s: any) => s.id === p.strain_id);
            resultMap.set(p.id, {
              ...p,
              strain_name: null,
              strain_type: null,
              match_source: fromStrain ? "strain" : fromAlias ? "alias" : "product",
            });
          }
        }
      }

      // 5. Resolve all strain names
      const allStrainIds = [...strainIdsToResolve];
      if (allStrainIds.length > 0) {
        const { data: strains } = await supabase
          .from("strains_canonical")
          .select("id, canonical_name, strain_type")
          .in("id", allStrainIds);

        const strainMap = new Map((strains ?? []).map((s: any) => [s.id, s]));
        for (const r of resultMap.values()) {
          if (r.strain_id) {
            const s = strainMap.get(r.strain_id);
            if (s) {
              r.strain_name = s.canonical_name;
              r.strain_type = s.strain_type;
            }
          }
        }
      }

      return [...resultMap.values()];
    },
    enabled: (query?.trim().length ?? 0) >= 2,
  });
}
