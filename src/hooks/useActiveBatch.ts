import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "./useProfile";

export interface ActiveBatchInfo {
  strainName: string;
  productName: string;
  batchCode: string | null;
  canonicalStrainId: string;
  productId: string;
  batchId: string | null;
}

export function useActiveBatch() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const query = useQuery({
    queryKey: [
      "active-batch",
      profile?.active_strain_id,
      profile?.active_product_id,
      profile?.active_batch_id,
    ],
    queryFn: async (): Promise<ActiveBatchInfo | null> => {
      if (!profile?.active_strain_id || !profile?.active_product_id) return null;

      // Fetch strain name
      const { data: strain } = await supabase
        .from("strains_canonical")
        .select("canonical_name")
        .eq("id", profile.active_strain_id)
        .single();

      // Fetch product name
      const { data: product } = await supabase
        .from("products")
        .select("product_name")
        .eq("id", profile.active_product_id)
        .single();

      if (!strain || !product) return null;

      // Fetch batch code if present
      let batchCode: string | null = null;
      if (profile.active_batch_id) {
        const { data: batch } = await supabase
          .from("product_batches")
          .select("batch_code")
          .eq("id", profile.active_batch_id)
          .single();
        batchCode = batch?.batch_code ?? null;
      }

      return {
        strainName: strain.canonical_name,
        productName: product.product_name,
        batchCode,
        canonicalStrainId: profile.active_strain_id,
        productId: profile.active_product_id,
        batchId: profile.active_batch_id,
      };
    },
    enabled: !!profile?.active_strain_id && !!profile?.active_product_id,
  });

  const setActiveBatch = (
    strainId: string | null,
    productId: string | null,
    batchId: string | null
  ) => {
    updateProfile.mutate({
      active_strain_id: strainId,
      active_product_id: productId,
      active_batch_id: batchId,
    } as any);
  };

  const clearActiveBatch = () => {
    setActiveBatch(null, null, null);
  };

  return {
    activeBatch: query.data ?? null,
    isLoading: query.isLoading,
    setActiveBatch,
    clearActiveBatch,
  };
}
