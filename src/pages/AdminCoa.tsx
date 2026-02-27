import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePendingBatches, useApproveBatch, useRejectBatch, useUpdateLabPanel, type PendingBatch } from "@/hooks/useAdminCoa";
import { CoaStatusBadge } from "@/components/log/CoaStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldAlert, ExternalLink, FileText, FlaskConical, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

function CoaViewer({ batch }: { batch: PendingBatch }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openStorageFile = async () => {
    if (!batch.coa_file_path) return;
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("coa-files")
      .createSignedUrl(batch.coa_file_path, 3600);
    setLoading(false);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (batch.coa_url) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={batch.coa_url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" /> View COA URL
        </a>
      </Button>
    );
  }

  if (batch.coa_file_path) {
    return (
      <Button variant="outline" size="sm" onClick={openStorageFile} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
        View Uploaded COA
      </Button>
    );
  }

  return <span className="text-xs text-muted-foreground">No COA attached</span>;
}

function LabPanelEditor({ batch }: { batch: PendingBatch }) {
  const [common, setCommon] = useState<Record<string, number>>(
    (batch.lab_panel_common as Record<string, number>) ?? {}
  );
  const [custom, setCustom] = useState<{ compound: string; value: number; unit: string }[]>(
    (batch.lab_panel_custom as any[]) ?? []
  );
  const [expanded, setExpanded] = useState(false);
  const updateLabPanel = useUpdateLabPanel();

  const COMMON_FIELDS = ["total_thc", "total_cbd", "total_cannabinoids"];

  const handleCommonChange = (key: string, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) {
      const next = { ...common };
      delete next[key];
      setCommon(next);
    } else {
      setCommon({ ...common, [key]: num });
    }
  };

  const addTerpene = () => setCustom([...custom, { compound: "", value: 0, unit: "%" }]);
  const removeTerpene = (i: number) => setCustom(custom.filter((_, idx) => idx !== i));
  const updateTerpene = (i: number, field: string, val: any) => {
    const next = [...custom];
    (next[i] as any)[field] = field === "value" ? parseFloat(val) || 0 : val;
    setCustom(next);
  };

  const handleSave = () => {
    updateLabPanel.mutate({
      batchId: batch.id,
      labPanelCommon: Object.keys(common).length ? common : null,
      labPanelCustom: custom.length ? custom : null,
    });
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        {batch.lab_panel_common ? "Edit Lab Panel" : "Add Lab Panel"}
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
      <h4 className="text-xs font-semibold text-foreground">Cannabinoids</h4>
      <div className="grid grid-cols-3 gap-2">
        {COMMON_FIELDS.map((key) => (
          <div key={key}>
            <label className="text-[10px] text-muted-foreground capitalize">
              {key.replace(/_/g, " ")}
            </label>
            <Input
              type="number"
              step="0.01"
              className="h-8 text-xs"
              value={common[key] ?? ""}
              onChange={(e) => handleCommonChange(key, e.target.value)}
              placeholder="%"
            />
          </div>
        ))}
      </div>

      <h4 className="text-xs font-semibold text-foreground">Terpenes</h4>
      {custom.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            className="h-8 text-xs flex-1"
            value={t.compound}
            onChange={(e) => updateTerpene(i, "compound", e.target.value)}
            placeholder="e.g. Myrcene"
          />
          <Input
            type="number"
            step="0.01"
            className="h-8 text-xs w-20"
            value={t.value || ""}
            onChange={(e) => updateTerpene(i, "value", e.target.value)}
            placeholder="%"
          />
          <button type="button" onClick={() => removeTerpene(i)} className="text-destructive hover:text-destructive/80">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addTerpene} className="gap-1.5 text-xs">
        <Plus className="w-3.5 h-3.5" /> Add Terpene
      </Button>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={updateLabPanel.isPending} className="text-xs">
          {updateLabPanel.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Lab Panel"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setExpanded(false)} className="text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function BatchReviewCard({ batch }: { batch: PendingBatch }) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const approve = useApproveBatch();
  const reject = useRejectBatch();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base font-serif">
              {batch.product_name}
              {batch.brand_name && <span className="text-muted-foreground font-normal"> · {batch.brand_name}</span>}
            </CardTitle>
            {batch.strain_name && (
              <p className="text-xs text-muted-foreground">Strain: {batch.strain_name}</p>
            )}
          </div>
          <CoaStatusBadge status={batch.coa_status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metadata */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {batch.batch_code && <Badge variant="secondary" className="text-[10px]">Batch: {batch.batch_code}</Badge>}
          {batch.lab_name && <Badge variant="secondary" className="text-[10px]">Lab: {batch.lab_name}</Badge>}
          {batch.tested_at && <Badge variant="secondary" className="text-[10px]">Tested: {format(new Date(batch.tested_at), "MMM d, yyyy")}</Badge>}
          <Badge variant="outline" className="text-[10px]">
            {batch.is_public_library ? "Public Library" : "Private Draft"}
          </Badge>
        </div>

        {/* COA Viewer */}
        <CoaViewer batch={batch} />

        {/* Lab Panel Editor (Prompt 5) */}
        <LabPanelEditor batch={batch} />

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            size="sm"
            onClick={() => approve.mutate(batch.id)}
            disabled={approve.isPending}
            className="gap-1.5"
          >
            {approve.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Approve
          </Button>
          {!showReject ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowReject(true)}
              className="gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Reject
            </Button>
          ) : (
            <div className="flex-1 space-y-2">
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
                  onClick={() => reject.mutate({ batchId: batch.id, reason: rejectReason })}
                  disabled={!rejectReason.trim() || reject.isPending}
                  className="text-xs"
                >
                  {reject.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Reject"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReject(false)} className="text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCoa() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: batches, isLoading } = usePendingBatches();

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-semibold text-foreground">COA Review Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review and verify pending Certificates of Analysis.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !batches || batches.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No pending reviews</p>
            <p className="text-xs mt-1">All COA submissions have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{batches.length} pending review{batches.length !== 1 ? "s" : ""}</p>
            {batches.map((batch) => (
              <BatchReviewCard key={batch.id} batch={batch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
