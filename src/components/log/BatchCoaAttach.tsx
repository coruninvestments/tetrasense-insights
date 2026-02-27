import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, Loader2, X, FileCheck, ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAttachCoa } from "@/hooks/useProductBatches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QrScanner } from "./QrScanner";

const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png";

interface BatchCoaAttachProps {
  batchId: string;
  onDone: () => void;
}

export function BatchCoaAttach({ batchId, onDone }: BatchCoaAttachProps) {
  const { user } = useAuth();
  const attachCoa = useAttachCoa();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coaUrl, setCoaUrl] = useState("");
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [coaFilePath, setCoaFilePath] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [showScanner, setShowScanner] = useState(false);

  const hasSource = !!(coaUrl.trim() || coaFilePath);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setCoaFile(file);
    setUploadProgress("uploading");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from("coa-files").upload(storagePath, file, { upsert: false });
    if (error) {
      setUploadProgress("error");
      setCoaFile(null);
    } else {
      setCoaFilePath(storagePath);
      setUploadProgress("done");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = async () => {
    if (coaFilePath) await supabase.storage.from("coa-files").remove([coaFilePath]);
    setCoaFile(null);
    setCoaFilePath(null);
    setUploadProgress("idle");
  };

  const handleSubmit = async () => {
    if (!hasSource) return;
    await attachCoa.mutateAsync({
      batchId,
      coa_url: coaUrl.trim() || null,
      coa_file_path: coaFilePath || null,
    });
    onDone();
  };

  const handleQrScan = (url: string) => {
    setCoaUrl(url);
    setShowScanner(false);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border mt-2">
      {/* QR Scanner */}
      {showScanner && (
        <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
      )}

      {/* URL + Scan button */}
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input value={coaUrl} onChange={(e) => setCoaUrl(e.target.value)} placeholder="Paste COA URL…" className="h-8 text-xs" />
        {!showScanner && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            title="Scan QR code"
            onClick={() => setShowScanner(true)}
          >
            <ScanLine className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* File */}
      {uploadProgress === "done" && coaFile ? (
        <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <FileCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate text-foreground">{coaFile.name}</span>
          </div>
          <button type="button" onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : uploadProgress === "uploading" ? (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Uploading…</span>
        </div>
      ) : (
        <>
          <input ref={fileInputRef} type="file" accept={ACCEPTED_FILE_TYPES} onChange={handleFileSelect} className="hidden" />
          <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload PDF / image
          </Button>
          {uploadProgress === "error" && <p className="text-xs text-destructive">Upload failed.</p>}
        </>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={onDone}>Cancel</Button>
        <Button type="button" size="sm" className="flex-1 h-8 text-xs" disabled={!hasSource || attachCoa.isPending} onClick={handleSubmit}>
          {attachCoa.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Attach COA"}
        </Button>
      </div>
    </div>
  );
}
