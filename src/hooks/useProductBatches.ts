import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_code: string | null;
  tested_at: string | null;
  lab_name: string | null;
  coa_url: string | null;
  coa_file_path: string | null;
  coa_status: string;
  lab_panel_common: Record<string, number> | null;
  lab_panel_custom: LabPanelCustomEntry[] | null;
  created_by_user_id: string | null;
  is_public_library: boolean;
  created_at: string;
}

export interface LabPanelCustomEntry {
  compound: string;
  value: number;
  unit: "%" | "mg_g" | "mg" | "ppm";
}

export interface CreateDraftBatchInput {
  product_name: string;
  brand_name?: string;
  strain_id?: string | null;
  form?: string;
  batch_code?: string;
  tested_at?: string;
  lab_name?: string;
  coa_url?: string;
  coa_file_path?: string;
  lab_panel_common?: Record<string, number>;
  lab_panel_custom?: LabPanelCustomEntry[];
}

/** Fetch public library batches for a given product */
export function usePublicBatches(productId: string | null) {
  return useQuery({
    queryKey: ["public-batches", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_batches")
        .select("*")
        .eq("product_id", productId)
        .eq("is_public_library", true)
        .eq("coa_status", "verified")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProductBatch[];
    },
    enabled: !!productId,
  });
}

/** Fetch public library batches for a given canonical strain (across all products) */
export function usePublicBatchesByStrain(strainId: string | null) {
  return useQuery({
    queryKey: ["public-batches-strain", strainId],
    queryFn: async () => {
      if (!strainId) return [];
      // Get products for this strain
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("id, product_name, brand_name")
        .eq("strain_id", strainId);
      if (pErr) throw pErr;
      if (!products?.length) return [];

      const productIds = products.map((p: any) => p.id);
      const { data: batches, error: bErr } = await supabase
        .from("product_batches")
        .select("*")
        .in("product_id", productIds)
        .eq("is_public_library", true)
        .eq("coa_status", "verified")
        .order("created_at", { ascending: false });
      if (bErr) throw bErr;

      // Enrich with product info
      const productMap = new Map(products.map((p: any) => [p.id, p]));
      return (batches as unknown as ProductBatch[]).map(b => ({
        ...b,
        _product: productMap.get(b.product_id),
      }));
    },
    enabled: !!strainId,
  });
}

/** Attach or update COA on an existing batch */
export function useAttachCoa() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      batchId: string;
      coa_url?: string | null;
      coa_file_path?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("product_batches")
        .update({
          coa_url: input.coa_url ?? null,
          coa_file_path: input.coa_file_path ?? null,
          coa_status: "pending",
        } as any)
        .eq("id", input.batchId)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ProductBatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-batches"] });
      queryClient.invalidateQueries({ queryKey: ["public-batches-strain"] });
    },
  });
}

/** Create a private draft batch (also creates the product if needed) */
export function useCreateDraftBatch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateDraftBatchInput) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert product
      const { data: product, error: pErr } = await supabase
        .from("products")
        .insert({
          product_name: input.product_name.trim(),
          brand_name: input.brand_name?.trim() || null,
          strain_id: input.strain_id || null,
          form: input.form || null,
        } as any)
        .select()
        .single();
      if (pErr) throw pErr;

      // Create batch
      const { data: batch, error: bErr } = await supabase
        .from("product_batches")
        .insert({
          product_id: (product as any).id,
          batch_code: input.batch_code?.trim() || null,
          tested_at: input.tested_at || null,
          lab_name: input.lab_name?.trim() || null,
          coa_url: input.coa_url?.trim() || null,
          coa_file_path: input.coa_file_path || null,
          coa_status: (input.coa_url || input.coa_file_path) ? "pending" : "unverified",
          lab_panel_common: input.lab_panel_common || null,
          lab_panel_custom: input.lab_panel_custom?.length
            ? (input.lab_panel_custom as unknown as Record<string, unknown>[])
            : null,
          created_by_user_id: user.id,
          is_public_library: false,
        } as any)
        .select()
        .single();
      if (bErr) throw bErr;

      return { product: product as any, batch: batch as unknown as ProductBatch };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-batches"] });
      queryClient.invalidateQueries({ queryKey: ["public-batches-strain"] });
    },
  });
}
