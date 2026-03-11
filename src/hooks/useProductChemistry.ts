import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Product {
  id: string;
  product_name: string;
  normalized_product_name: string | null;
  brand_name: string | null;
  normalized_brand_name: string | null;
  product_type: string;
  source_type: string;
  strain_id: string | null;
  state_code: string | null;
  country_code: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // legacy
  form: string | null;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string | null;
  lot_number: string | null;
  lab_name: string | null;
  coa_url: string | null;
  coa_file_path: string | null;
  coa_source_type: string;
  tested_at: string | null;
  expiration_date: string | null;
  total_thc_percent: number | null;
  total_cbd_percent: number | null;
  total_terpenes_percent: number | null;
  intensity_hint_score: number | null;
  verification_status: string;
  verified_at: string | null;
  verified_by: string | null;
  created_by_user_id: string | null;
  is_public_library: boolean;
  created_at: string;
  updated_at: string;
  // legacy
  batch_code: string | null;
  coa_status: string;
  coa_reject_reason: string | null;
  lab_panel_common: any;
  lab_panel_custom: any;
}

export interface BatchTerpene {
  id: string;
  batch_id: string;
  terpene_id: string;
  percent_value: number;
  rank_order: number | null;
  created_at: string;
  terpene_name?: string;
}

export interface BatchCannabinoid {
  id: string;
  batch_id: string;
  cannabinoid_id: string;
  percent_value: number | null;
  mg_value: number | null;
  created_at: string;
  cannabinoid_name?: string;
  short_name?: string;
}

/* ------------------------------------------------------------------ */
/*  useProductsSearch                                                   */
/* ------------------------------------------------------------------ */

export function useProductsSearch(query: string) {
  return useQuery({
    queryKey: ["products-search", query],
    queryFn: async () => {
      const sanitized = query?.trim().slice(0, 80).replace(/[%_\\]/g, "") || "";
      if (!sanitized || sanitized.length < 2) return [];

      const normalized = sanitized.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(
          `normalized_product_name.ilike.%${normalized}%,product_name.ilike.%${sanitized}%,brand_name.ilike.%${sanitized}%`
        )
        .order("product_name")
        .limit(30);

      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    enabled: (query?.trim().length ?? 0) >= 2,
  });
}

/* ------------------------------------------------------------------ */
/*  useVerifiedBatch                                                   */
/* ------------------------------------------------------------------ */

export function useVerifiedBatch(batchId: string | null | undefined) {
  return useQuery({
    queryKey: ["verified-batch", batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const { data, error } = await supabase
        .from("product_batches")
        .select("*")
        .eq("id", batchId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as ProductBatch | null;
    },
    enabled: !!batchId,
  });
}

/* ------------------------------------------------------------------ */
/*  useProductWithBestVerifiedBatch                                    */
/* ------------------------------------------------------------------ */

export function useProductWithBestVerifiedBatch(productId: string | null | undefined) {
  return useQuery({
    queryKey: ["product-best-batch", productId],
    queryFn: async () => {
      if (!productId) return null;

      // Get product
      const { data: product, error: pErr } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (pErr) throw pErr;
      if (!product) return null;

      // Get newest verified batch
      const { data: batches, error: bErr } = await supabase
        .from("product_batches")
        .select("*")
        .eq("product_id", productId)
        .eq("verification_status", "verified")
        .order("tested_at", { ascending: false, nullsFirst: false })
        .limit(1);

      if (bErr) throw bErr;

      return {
        product: product as unknown as Product,
        bestBatch: (batches?.[0] as unknown as ProductBatch) ?? null,
      };
    },
    enabled: !!productId,
  });
}

/* ------------------------------------------------------------------ */
/*  useBatchTerpenes                                                   */
/* ------------------------------------------------------------------ */

export function useBatchTerpenes(batchId: string | null | undefined) {
  return useQuery({
    queryKey: ["batch-terpenes", batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from("batch_terpenes" as any)
        .select("*, terpenes_canonical(canonical_name)")
        .eq("batch_id", batchId)
        .order("rank_order", { ascending: true, nullsFirst: false });

      if (error) throw error;

      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        batch_id: row.batch_id,
        terpene_id: row.terpene_id,
        percent_value: row.percent_value,
        rank_order: row.rank_order,
        created_at: row.created_at,
        terpene_name: row.terpenes_canonical?.canonical_name ?? null,
      })) as BatchTerpene[];
    },
    enabled: !!batchId,
  });
}

/* ------------------------------------------------------------------ */
/*  useBatchCannabinoids                                               */
/* ------------------------------------------------------------------ */

export function useBatchCannabinoids(batchId: string | null | undefined) {
  return useQuery({
    queryKey: ["batch-cannabinoids", batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from("batch_cannabinoids" as any)
        .select("*, cannabinoids_canonical(canonical_name, short_name)")
        .eq("batch_id", batchId)
        .order("percent_value", { ascending: false, nullsFirst: true });

      if (error) throw error;

      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        batch_id: row.batch_id,
        cannabinoid_id: row.cannabinoid_id,
        percent_value: row.percent_value,
        mg_value: row.mg_value,
        created_at: row.created_at,
        cannabinoid_name: row.cannabinoids_canonical?.canonical_name ?? null,
        short_name: row.cannabinoids_canonical?.short_name ?? null,
      })) as BatchCannabinoid[];
    },
    enabled: !!batchId,
  });
}
