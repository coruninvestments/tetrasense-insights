import { supabase } from "@/integrations/supabase/client";
import type { ProductBatch } from "@/hooks/useProductBatches";

/**
 * Returns a usable download URL for a batch's COA:
 *  - If coa_url exists, return it directly.
 *  - Else if coa_file_path exists, generate a signed URL (1 hour expiry).
 *  - Otherwise null.
 */
export async function getCoaDownloadUrl(
  batch: Pick<ProductBatch, "coa_url" | "coa_file_path">,
): Promise<string | null> {
  if (batch.coa_url) return batch.coa_url;

  if (batch.coa_file_path) {
    const { data, error } = await supabase.storage
      .from("coa-files")
      .createSignedUrl(batch.coa_file_path, 3600);
    if (error) {
      console.error("Failed to create signed COA URL:", error);
      return null;
    }
    return data.signedUrl;
  }

  return null;
}
