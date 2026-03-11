import { useState } from "react";
import { Link2, QrCode, Loader2, Building2, Leaf, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ingestCoaUrl, type CoaIngestionResult } from "@/lib/coaIngestion";
import { detectLabSource } from "@/lib/coaLabRegistry";
import { COAImportResultCard } from "./COAImportResultCard";

interface ImportCOAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: CoaIngestionResult) => void;
}

export function ImportCOAModal({ open, onOpenChange, onImportComplete }: ImportCOAModalProps) {
  const [coaUrl, setCoaUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [strainName, setStrainName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CoaIngestionResult | null>(null);
  const [showManual, setShowManual] = useState(false);

  // Live lab detection preview
  const labPreview = coaUrl.length > 10 ? detectLabSource(coaUrl) : null;

  const handleSubmit = async () => {
    if (!coaUrl.trim()) {
      toast.error("Please enter a COA URL");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const ingestionResult = await ingestCoaUrl({
        coaUrl: coaUrl.trim(),
        productName: productName.trim() || undefined,
        brandName: brandName.trim() || undefined,
        strainName: strainName.trim() || undefined,
      });

      setResult(ingestionResult);

      if (ingestionResult.success) {
        toast.success("COA imported successfully");
        onImportComplete?.(ingestionResult);
      } else {
        toast.error(ingestionResult.error || "Import failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCoaUrl("");
    setProductName("");
    setBrandName("");
    setStrainName("");
    setResult(null);
    setShowManual(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Import COA
          </DialogTitle>
          <DialogDescription>
            Paste a lab report URL or QR code link to import batch chemistry data.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <COAImportResultCard result={result} />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                Import Another
              </Button>
              <Button className="flex-1" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="coa-url" className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                COA / Lab Report URL
              </Label>
              <Input
                id="coa-url"
                type="url"
                placeholder="https://sclabs.com/sample/..."
                value={coaUrl}
                onChange={(e) => setCoaUrl(e.target.value)}
                className="h-12"
              />

              {/* Live lab detection */}
              {labPreview && labPreview.sourceType !== "unknown" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Detected: <span className="font-medium text-foreground">{labPreview.labName}</span>
                    <span className="ml-1 opacity-60">({labPreview.confidence} confidence)</span>
                  </span>
                </div>
              )}
            </div>

            {/* Toggle manual fields */}
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showManual ? "▾ Hide" : "▸ Add"} product details (optional)
            </button>

            {/* Manual metadata fields */}
            {showManual && (
              <div className="space-y-3 p-3 rounded-xl bg-secondary/50">
                <div className="space-y-1.5">
                  <Label htmlFor="product-name" className="text-xs flex items-center gap-1">
                    <Package className="w-3 h-3" /> Product Name
                  </Label>
                  <Input
                    id="product-name"
                    placeholder="e.g., Blue Dream Live Resin"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brand-name" className="text-xs flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Brand
                  </Label>
                  <Input
                    id="brand-name"
                    placeholder="e.g., Cookies"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="strain-name" className="text-xs flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> Strain
                  </Label>
                  <Input
                    id="strain-name"
                    placeholder="e.g., Blue Dream"
                    value={strainName}
                    onChange={(e) => setStrainName(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            )}

            <Separator />

            <Button
              className="w-full h-12"
              onClick={handleSubmit}
              disabled={isLoading || !coaUrl.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Import COA"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
