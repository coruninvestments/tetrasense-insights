import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductBatch, BatchTerpene, BatchCannabinoid } from "./useProductChemistry";

/**
 * Fetches the newest verified batch + its terpenes and cannabinoids for a product.
 * Single query hook for use in product cards / detail pages.
 */
export function useNewestVerifiedBatchChemistry(productId: string | null | undefined) {
  return useQuery({
    queryKey: ["newest-verified-batch-chemistry", productId],
    queryFn: async () => {
      if (!productId) return null;

      // Get newest verified batch
      const { data: batches, error: bErr } = await supabase
        .from("product_batches")
        .select("*")
        .eq("product_id", productId)
        .eq("verification_status", "verified")
        .order("tested_at", { ascending: false, nullsFirst: false })
        .limit(1);

      if (bErr) throw bErr;
      const batch = (batches?.[0] as unknown as ProductBatch) ?? null;
      if (!batch) return { batch: null, terpenes: [], cannabinoids: [] };

      // Fetch terpenes and cannabinoids in parallel
      const [terpResult, cannResult] = await Promise.all([
        supabase
          .from("batch_terpenes" as any)
          .select("*, terpenes_canonical(canonical_name)")
          .eq("batch_id", batch.id)
          .order("rank_order", { ascending: true, nullsFirst: false }),
        supabase
          .from("batch_cannabinoids" as any)
          .select("*, cannabinoids_canonical(canonical_name, short_name)")
          .eq("batch_id", batch.id)
          .order("percent_value", { ascending: false, nullsFirst: true }),
      ]);

      const terpenes: BatchTerpene[] = ((terpResult.data ?? []) as any[]).map(row => ({
        id: row.id,
        batch_id: row.batch_id,
        terpene_id: row.terpene_id,
        percent_value: row.percent_value,
        rank_order: row.rank_order,
        created_at: row.created_at,
        terpene_name: row.terpenes_canonical?.canonical_name ?? null,
      }));

      const cannabinoids: BatchCannabinoid[] = ((cannResult.data ?? []) as any[]).map(row => ({
        id: row.id,
        batch_id: row.batch_id,
        cannabinoid_id: row.cannabinoid_id,
        percent_value: row.percent_value,
        mg_value: row.mg_value,
        created_at: row.created_at,
        cannabinoid_name: row.cannabinoids_canonical?.canonical_name ?? null,
        short_name: row.cannabinoids_canonical?.short_name ?? null,
      }));

      return { batch, terpenes, cannabinoids };
    },
    enabled: !!productId,
  });
}

/** Batch chemistry status for a product (verified/pending/unknown) */
export function useProductChemistryStatus(productId: string | null | undefined) {
  return useQuery({
    queryKey: ["product-chemistry-status", productId],
    queryFn: async () => {
      if (!productId) return "unknown" as const;

      const { data, error } = await supabase
        .from("product_batches")
        .select("verification_status")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      if (!data?.length) return "unknown" as const;

      const statuses = data.map((d: any) => d.verification_status);
      if (statuses.includes("verified")) return "verified" as const;
      if (statuses.includes("pending")) return "pending" as const;
      return "unknown" as const;
    },
    enabled: !!productId,
  });
}
