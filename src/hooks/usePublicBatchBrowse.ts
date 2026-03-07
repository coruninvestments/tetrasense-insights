import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicBatchBrowseItem {
  id: string;
  product_id: string;
  batch_code: string | null;
  tested_at: string | null;
  lab_name: string | null;
  coa_status: string;
  lab_panel_common: Record<string, number> | null;
  lab_panel_custom: Record<string, number> | Array<{ compound: string; value: number }> | null;
  is_public_library: boolean;
  created_at: string;
  product_name: string;
  brand_name: string | null;
  strain_id: string | null;
  strain_name: string | null;
  strain_type: string | null;
}

export function usePublicBatchBrowse() {
  return useQuery({
    queryKey: ["public-batch-browse"],
    queryFn: async () => {
      const { data: batches, error: bErr } = await supabase
        .from("product_batches")
        .select("id, product_id, batch_code, tested_at, lab_name, coa_status, lab_panel_common, lab_panel_custom, is_public_library, created_at")
        .eq("is_public_library", true)
        .eq("coa_status", "verified")
        .order("created_at", { ascending: false })
        .limit(50);
      if (bErr) throw bErr;
      if (!batches?.length) return [];

      const productIds = [...new Set(batches.map((b: any) => b.product_id))];
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("id, product_name, brand_name, strain_id")
        .in("id", productIds);
      if (pErr) throw pErr;

      const strainIds = (products ?? []).map((p: any) => p.strain_id).filter(Boolean);
      let strainMap = new Map<string, { canonical_name: string; strain_type: string | null }>();
      if (strainIds.length) {
        const { data: strains } = await supabase
          .from("strains_canonical")
          .select("id, canonical_name, strain_type")
          .in("id", strainIds);
        if (strains) {
          strainMap = new Map(strains.map((s: any) => [s.id, s]));
        }
      }

      const productMap = new Map((products ?? []).map((p: any) => [p.id, p]));

      return batches.map((b: any) => {
        const product = productMap.get(b.product_id);
        const strain = product?.strain_id ? strainMap.get(product.strain_id) : null;
        return {
          ...b,
          product_name: product?.product_name ?? "Unknown",
          brand_name: product?.brand_name ?? null,
          strain_id: product?.strain_id ?? null,
          strain_name: strain?.canonical_name ?? null,
          strain_type: strain?.strain_type ?? null,
        } as PublicBatchBrowseItem;
      });
    },
  });
}
