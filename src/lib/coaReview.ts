import { supabase } from "@/integrations/supabase/client";

export interface ReviewQueueItem {
  id: string;
  product_id: string;
  product_name: string;
  brand_name: string | null;
  strain_name: string | null;
  strain_id: string | null;
  lab_name: string | null;
  coa_url: string | null;
  coa_file_path: string | null;
  batch_number: string | null;
  lot_number: string | null;
  coa_source_type: string;
  verification_status: string;
  coa_status: string;
  created_at: string;
  created_by_user_id: string | null;
  tested_at: string | null;
  total_thc_percent: number | null;
  total_cbd_percent: number | null;
  total_terpenes_percent: number | null;
  terpene_count: number;
  cannabinoid_count: number;
  lab_panel_custom: any[] | null;
}

export interface BatchDetailTerpene {
  id: string;
  terpene_id: string;
  terpene_name: string;
  percent_value: number;
  rank_order: number | null;
}

export interface BatchDetailCannabinoid {
  id: string;
  cannabinoid_id: string;
  cannabinoid_name: string;
  percent_value: number | null;
  mg_value: number | null;
}

export interface BatchDetail {
  batch: Record<string, any>;
  product: Record<string, any>;
  strain: Record<string, any> | null;
  terpenes: BatchDetailTerpene[];
  cannabinoids: BatchDetailCannabinoid[];
  ingestion: Record<string, any> | null;
}

export interface ReviewStats {
  pending: number;
  draft: number;
  verified: number;
  rejected: number;
  total: number;
}

export async function fetchReviewQueue(
  status?: string | null,
  labName?: string | null
): Promise<ReviewQueueItem[]> {
  const { data, error } = await supabase.rpc("admin_review_queue", {
    _status: status || null,
    _lab_name: labName || null,
    _has_unmapped: null,
  });
  if (error) throw error;
  return (data ?? []) as unknown as ReviewQueueItem[];
}

export async function fetchBatchDetail(batchId: string): Promise<BatchDetail> {
  const { data, error } = await supabase.rpc("admin_batch_detail", {
    _batch_id: batchId,
  });
  if (error) throw error;
  return data as unknown as BatchDetail;
}

export async function setVerificationStatus(
  batchId: string,
  status: string,
  reason?: string
) {
  const { error } = await supabase.rpc("admin_set_verification_status", {
    _batch_id: batchId,
    _status: status,
    _reason: reason || null,
  });
  if (error) throw error;
}

export async function updateProductMetadata(
  productId: string,
  updates: { productName?: string; brandName?: string; strainId?: string }
) {
  const { error } = await supabase.rpc("admin_update_product_metadata", {
    _product_id: productId,
    _product_name: updates.productName || null,
    _brand_name: updates.brandName || null,
    _strain_id: updates.strainId || null,
  });
  if (error) throw error;
}

export async function updateBatchMetadata(
  batchId: string,
  updates: {
    labName?: string;
    batchNumber?: string;
    lotNumber?: string;
    totalThcPercent?: number;
    totalCbdPercent?: number;
    totalTerpenesPercent?: number;
  }
) {
  const { error } = await supabase.rpc("admin_update_batch_metadata", {
    _batch_id: batchId,
    _lab_name: updates.labName || null,
    _batch_number: updates.batchNumber || null,
    _lot_number: updates.lotNumber || null,
    _total_thc_percent: updates.totalThcPercent ?? null,
    _total_cbd_percent: updates.totalCbdPercent ?? null,
    _total_terpenes_percent: updates.totalTerpenesPercent ?? null,
  });
  if (error) throw error;
}

export async function removeCompound(type: "terpene" | "cannabinoid", rowId: string) {
  const { error } = await supabase.rpc("admin_remove_batch_compound", {
    _type: type,
    _row_id: rowId,
  });
  if (error) throw error;
}

export async function fetchReviewStats(): Promise<ReviewStats> {
  const { data, error } = await supabase.rpc("admin_review_stats");
  if (error) throw error;
  return data as unknown as ReviewStats;
}
