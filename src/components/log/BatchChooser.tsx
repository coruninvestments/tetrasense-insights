import { useState, useRef } from "react";
import { FlaskConical, ChevronDown, ChevronUp, Plus, Check, Loader2, Link as LinkIcon, Shield, Lock, Users, Sparkles, Upload, X, FileCheck, Paperclip } from "lucide-react";
import { normalizeLabPanel, SIMULATED_EXTRACTION } from "@/lib/coaPipeline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LabPanelSection } from "./LabPanelSection";
import { CoaStatusBadge } from "./CoaStatusBadge";
import { BatchCoaAttach } from "./BatchCoaAttach";
import { usePublicBatchesByStrain, useCreateDraftBatch, type LabPanelCustomEntry, type ProductBatch } from "@/hooks/useProductBatches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface BatchChooserProps {
  canonicalStrainId: string;
  selectedBatchId: string | null;
  selectedProductId: string | null;
  onSelect: (productId: string | null, batchId: string | null, coaAttached: boolean) => void;
}

type Mode = "collapsed" | "choose" | "create";

const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png";

export function BatchChooser({ canonicalStrainId, selectedBatchId, selectedProductId, onSelect }: BatchChooserProps) {
  const [mode, setMode] = useState<Mode>("collapsed");
  const { data: publicBatches, isLoading } = usePublicBatchesByStrain(canonicalStrainId);
  const createDraft = useCreateDraftBatch();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachingBatchId, setAttachingBatchId] = useState<string | null>(null);

  // Draft form state
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [testedAt, setTestedAt] = useState("");
  const [labName, setLabName] = useState("");
  const [coaUrl, setCoaUrl] = useState("");
  const [labPanelCommon, setLabPanelCommon] = useState<Record<string, number>>({});
  const [labPanelCustom, setLabPanelCustom] = useState<LabPanelCustomEntry[]>([]);
  const [showLabPanel, setShowLabPanel] = useState(false);

  // File upload state
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [coaFilePath, setCoaFilePath] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");

  const hasCoaSource = !!(coaUrl.trim() || coaFilePath);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setCoaFile(file);
    setUploadProgress("uploading");

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${timestamp}-${safeName}`;

    const { error } = await supabase.storage
      .from("coa-files")
      .upload(storagePath, file, { upsert: false });

    if (error) {
      console.error("COA upload failed:", error);
      setUploadProgress("error");
      setCoaFile(null);
    } else {
      setCoaFilePath(storagePath);
      setUploadProgress("done");
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = async () => {
    if (coaFilePath) {
      await supabase.storage.from("coa-files").remove([coaFilePath]);
    }
    setCoaFile(null);
    setCoaFilePath(null);
    setUploadProgress("idle");
  };

  const handleSelectPublicBatch = (batch: any) => {
    onSelect(batch.product_id, batch.id, !!(batch.coa_url || batch.coa_file_path));
  };

  const handleCreateDraft = async () => {
    if (!productName.trim()) return;
    try {
      const { product, batch } = await createDraft.mutateAsync({
        product_name: productName,
        brand_name: brandName || undefined,
        strain_id: canonicalStrainId,
        batch_code: batchCode || undefined,
        tested_at: testedAt || undefined,
        lab_name: labName || undefined,
        coa_url: coaUrl || undefined,
        coa_file_path: coaFilePath || undefined,
        lab_panel_common: Object.keys(labPanelCommon).length ? labPanelCommon : undefined,
        lab_panel_custom: labPanelCustom.length ? labPanelCustom : undefined,
      });
      onSelect(product.id, batch.id, !!(coaUrl || coaFilePath));
      setMode("collapsed");
    } catch (err: any) {
      // Error handled by mutation
    }
  };

  const handleClear = () => {
    onSelect(null, null, false);
    setMode("collapsed");
  };

  if (mode === "collapsed") {
    return (
      <div className="space-y-2">
        {selectedBatchId ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <FlaskConical className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">Batch attached</span>
            </div>
            <button type="button" onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground">
              Remove
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMode("choose")}
            className="w-full"
          >
            <FlaskConical className="w-4 h-4 mr-2" />
            Add COA / Batch (optional)
          </Button>
        )}
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> Attach Batch / COA
          </h4>
          <button type="button" onClick={() => setMode("collapsed")} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && publicBatches && publicBatches.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Library batches</span>
            {publicBatches.map((batch: any) => (
              <div key={batch.id} className="space-y-0">
                <button
                  type="button"
                  onClick={() => handleSelectPublicBatch(batch)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedBatchId === batch.id ? "bg-primary/10 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {batch._product?.product_name || "Product"}{batch._product?.brand_name ? ` · ${batch._product.brand_name}` : ""}
                      </span>
                      {batch.batch_code && (
                        <span className="text-xs text-muted-foreground">#{batch.batch_code}</span>
                      )}
                      <CoaStatusBadge status={batch.coa_status || "unverified"} />
                    </div>
                    {selectedBatchId === batch.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Library batch
                    </span>
                    {!batch.coa_url && !batch.coa_file_path && batch.created_by_user_id === user?.id && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline ml-auto flex items-center gap-1"
                        onClick={(e) => { e.stopPropagation(); setAttachingBatchId(batch.id); }}
                      >
                        <Paperclip className="w-3 h-3" /> Attach COA
                      </button>
                    )}
                  </div>
                </button>
                {attachingBatchId === batch.id && (
                  <div className="px-3 pb-2">
                    <BatchCoaAttach batchId={batch.id} onDone={() => setAttachingBatchId(null)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMode("create")}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" /> Create private draft batch
        </Button>
      </Card>
    );
  }

  // mode === "create"
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4" /> New Private Draft Batch
        </h4>
        <button type="button" onClick={() => setMode("choose")} className="text-xs text-muted-foreground hover:text-foreground">
          Back
        </button>
      </div>

      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
        <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">Private draft (only you can see this)</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Product Name *</label>
          <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Northern Lights Pre-roll" className="h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Brand (optional)</label>
          <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g., GreenCo" className="h-9" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Batch Code</label>
            <Input value={batchCode} onChange={(e) => setBatchCode(e.target.value)} placeholder="Optional" className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tested Date</label>
            <Input type="date" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} className="h-9" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Lab Name</label>
          <Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Optional" className="h-9" />
        </div>

        {/* COA URL */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">COA URL</label>
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input value={coaUrl} onChange={(e) => setCoaUrl(e.target.value)} placeholder="https://..." className="h-9" />
          </div>
        </div>

        {/* COA File Upload */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Upload COA (PDF/JPG/PNG)</label>
          {uploadProgress === "done" && coaFile ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-sm min-w-0">
                <FileCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground truncate">{coaFile.name}</span>
                <span className="text-xs text-primary shrink-0">✅</span>
              </div>
              <button type="button" onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : uploadProgress === "uploading" ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted border border-border">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uploading…</span>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose file
              </Button>
              {uploadProgress === "error" && (
                <p className="text-xs text-destructive mt-1">Upload failed. Please try again.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Auto-extract Premium button */}
      {hasCoaSource && (
        <div className="relative">
          {import.meta.env.DEV ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-primary/30 text-primary"
              onClick={() => {
                const { lab_panel_common, lab_panel_custom } = normalizeLabPanel(SIMULATED_EXTRACTION);
                setLabPanelCommon(lab_panel_common);
                setLabPanelCustom(lab_panel_custom);
                setShowLabPanel(true);
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              DEV: Simulate Auto-Extract
            </Button>
          ) : (
            <div className="p-3 rounded-xl bg-muted/60 border border-border opacity-70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Auto-extract (Premium)</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically reads your COA and fills in the lab panel. Available with Premium.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lab Panel toggle */}
      <button
        type="button"
        onClick={() => setShowLabPanel(!showLabPanel)}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        {showLabPanel ? "Hide lab panel" : "Enter lab results"}
        {showLabPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showLabPanel && (
        <LabPanelSection
          commonValues={labPanelCommon}
          onCommonChange={setLabPanelCommon}
          customEntries={labPanelCustom}
          onCustomChange={setLabPanelCustom}
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => setMode("choose")} className="flex-1">
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleCreateDraft}
          disabled={!productName.trim() || createDraft.isPending}
          className="flex-1"
        >
          {createDraft.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Draft"}
        </Button>
      </div>
    </Card>
  );
}
