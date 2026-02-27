import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PendingBatch {
  id: string;
  product_id: string;
  batch_code: string | null;
  tested_at: string | null;
  lab_name: string | null;
  coa_url: string | null;
  coa_file_path: string | null;
  coa_status: string;
  coa_reject_reason: string | null;
  lab_panel_common: Record<string, number> | null;
  lab_panel_custom: any[] | null;
  is_public_library: boolean;
  created_at: string;
  created_by_user_id: string | null;
  product_name: string;
  brand_name: string | null;
  strain_name: string | null;
}

export function usePendingBatches() {
  return useQuery({
    queryKey: ["admin-pending-batches"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_pending_batches");
      if (error) throw error;
      return (data ?? []) as unknown as PendingBatch[];
    },
  });
}

export function useApproveBatch() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase.rpc("admin_approve_batch", { _batch_id: batchId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-batches"] });
      toast({ title: "Batch approved", description: "COA status set to verified." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useRejectBatch() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ batchId, reason }: { batchId: string; reason: string }) => {
      const { error } = await supabase.rpc("admin_reject_batch", {
        _batch_id: batchId,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-batches"] });
      toast({ title: "Batch rejected", description: "COA status set to rejected." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateLabPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      batchId,
      labPanelCommon,
      labPanelCustom,
    }: {
      batchId: string;
      labPanelCommon: Record<string, number> | null;
      labPanelCustom: any[] | null;
    }) => {
      const { error } = await supabase.rpc("admin_update_lab_panel", {
        _batch_id: batchId,
        _lab_panel_common: labPanelCommon ?? {},
        _lab_panel_custom: labPanelCustom ?? [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-batches"] });
      toast({ title: "Lab panel saved" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
