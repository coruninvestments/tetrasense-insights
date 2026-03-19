import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  fetchBatchDetail,
  setVerificationStatus,
  updateProductMetadata,
  updateBatchMetadata,
  removeCompound,
  type BatchDetail,
} from "@/lib/coaReview";
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Pencil,
  Trash2,
  ExternalLink,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  batchId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function COAReviewDetailModal({ batchId, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  // Editable fields
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [labName, setLabName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");

  const { data: detail, isLoading } = useQuery({
    queryKey: ["admin-batch-detail", batchId],
    queryFn: () => fetchBatchDetail(batchId!),
    enabled: !!batchId && open,
  });

  useEffect(() => {
    if (detail) {
      setProductName(detail.product?.product_name || "");
      setBrandName(detail.product?.brand_name || "");
      setLabName(detail.batch?.lab_name || "");
      setBatchNumber(detail.batch?.batch_number || "");
      setLotNumber(detail.batch?.lot_number || "");
      setEditing(false);
      setShowReject(false);
      setRejectReason("");
    }
  }, [detail]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-batch-detail", batchId] });
    qc.invalidateQueries({ queryKey: ["admin-review-queue"] });
    qc.invalidateQueries({ queryKey: ["admin-review-stats"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      setVerificationStatus(batchId!, status, reason),
    onSuccess: (_, { status }) => {
      invalidate();
      toast({ title: `Batch ${status}` });
      if (status === "verified" || status === "rejected") onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateProductMetadata(detail!.product.id, {
        productName,
        brandName,
      });
      await updateBatchMetadata(batchId!, {
        labName,
        batchNumber,
        lotNumber,
      });
    },
    onSuccess: () => {
      invalidate();
      setEditing(false);
      toast({ title: "Metadata saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: ({ type, rowId }: { type: "terpene" | "cannabinoid"; rowId: string }) =>
      removeCompound(type, rowId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Compound removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const isPending = statusMutation.isPending || saveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Batch Review</DialogTitle>
        </DialogHeader>

        {isLoading || !detail ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={
                  detail.batch.verification_status === "verified"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : detail.batch.verification_status === "rejected"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                }
              >
                {detail.batch.verification_status}
              </Badge>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1 text-xs">
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
              )}
            </div>

            {/* Product metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</h4>
              {editing ? (
                <div className="space-y-2">
                  <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product name" className="h-8 text-sm" />
                  <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand" className="h-8 text-sm" />
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">{detail.product.product_name}</p>
                  {detail.product.brand_name && <p className="text-xs text-muted-foreground">{detail.product.brand_name}</p>}
                </div>
              )}
              {detail.strain && (
                <p className="text-xs text-muted-foreground">
                  Strain: <span className="text-foreground">{detail.strain.canonical_name}</span>
                </p>
              )}
            </div>

            <Separator />

            {/* Batch metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Batch</h4>
              {editing ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Lab name" className="h-8 text-sm" />
                  <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="Batch #" className="h-8 text-sm" />
                  <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="Lot #" className="h-8 text-sm" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {detail.batch.lab_name && <Badge variant="secondary" className="text-[10px]">Lab: {detail.batch.lab_name}</Badge>}
                  {detail.batch.batch_number && <Badge variant="secondary" className="text-[10px]">Batch: {detail.batch.batch_number}</Badge>}
                  {detail.batch.lot_number && <Badge variant="secondary" className="text-[10px]">Lot: {detail.batch.lot_number}</Badge>}
                  {detail.batch.tested_at && <Badge variant="secondary" className="text-[10px]">Tested: {format(new Date(detail.batch.tested_at), "MMM d, yyyy")}</Badge>}
                  <Badge variant="outline" className="text-[10px]">{detail.batch.coa_source_type}</Badge>
                </div>
              )}
              {detail.batch.total_thc_percent != null && (
                <p className="text-xs text-muted-foreground">
                  THC: {detail.batch.total_thc_percent}% · CBD: {detail.batch.total_cbd_percent ?? "—"}%
                </p>
              )}
              {detail.batch.coa_url && (
                <a href={detail.batch.coa_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" /> View COA
                </a>
              )}
            </div>

            {editing && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1 text-xs">
                  {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-xs">Cancel</Button>
              </div>
            )}

            <Separator />

            {/* Terpenes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Terpenes ({detail.terpenes.length})
              </h4>
              {detail.terpenes.length === 0 ? (
                <p className="text-xs text-muted-foreground">None mapped</p>
              ) : (
                <div className="space-y-1">
                  {detail.terpenes.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span>{t.terpene_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t.percent_value}%</span>
                        <button
                          onClick={() => removeMutation.mutate({ type: "terpene", rowId: t.id })}
                          className="text-destructive/60 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cannabinoids */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cannabinoids ({detail.cannabinoids.length})
              </h4>
              {detail.cannabinoids.length === 0 ? (
                <p className="text-xs text-muted-foreground">None mapped</p>
              ) : (
                <div className="space-y-1">
                  {detail.cannabinoids.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <span>{c.cannabinoid_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {c.percent_value != null ? `${c.percent_value}%` : `${c.mg_value}mg`}
                        </span>
                        <button
                          onClick={() => removeMutation.mutate({ type: "cannabinoid", rowId: c.id })}
                          className="text-destructive/60 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingestion metadata */}
            {detail.ingestion && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingestion</h4>
                  <p className="text-xs text-muted-foreground">Source: {detail.ingestion.source}</p>
                  <p className="text-xs text-muted-foreground">Parser: {detail.ingestion.parser_version}</p>
                  <p className="text-xs text-muted-foreground">Status: {detail.ingestion.status}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => statusMutation.mutate({ status: "verified" })}
                disabled={isPending}
                className="gap-1"
              >
                {statusMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate({ status: "draft" })}
                disabled={isPending}
                className="text-xs"
              >
                Needs Review
              </Button>
              {!showReject ? (
                <Button size="sm" variant="destructive" onClick={() => setShowReject(true)} className="gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Reject
                </Button>
              ) : (
                <div className="w-full space-y-2">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="text-xs min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => statusMutation.mutate({ status: "rejected", reason: rejectReason })}
                      disabled={!rejectReason.trim() || isPending}
                      className="text-xs"
                    >
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowReject(false)} className="text-xs">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
