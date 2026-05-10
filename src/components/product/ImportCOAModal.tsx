import { useState } from "react";
import { Link2, QrCode, Loader2, Building2, Leaf, Package, ScanLine, ClipboardEdit, Barcode, Info } from "lucide-react";
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
import { detectLabSource, isValidCoaUrl } from "@/lib/coaLabRegistry";
import { COAImportResultCard } from "./COAImportResultCard";
import { COAEducationLink } from "@/components/onboarding/COAEducationModal";
import { QrScanner } from "@/components/log/QrScanner";
import { useCreateDraftBatch } from "@/hooks/useProductBatches";

interface ImportCOAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: CoaIngestionResult) => void;
}

type Mode = "menu" | "scan_qr" | "scan_barcode" | "paste_url" | "manual";

export function ImportCOAModal({ open, onOpenChange, onImportComplete }: ImportCOAModalProps) {
  const [mode, setMode] = useState<Mode>("menu");

  // URL flow
  const [coaUrl, setCoaUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [strainName, setStrainName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CoaIngestionResult | null>(null);

  // Barcode + manual label fields
  const [barcodeValue, setBarcodeValue] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [packageDate, setPackageDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [labelMessage, setLabelMessage] = useState<string | null>(null);

  const createDraft = useCreateDraftBatch();

  const labPreview = coaUrl.length > 10 ? detectLabSource(coaUrl) : null;

  const resetAll = () => {
    setMode("menu");
    setCoaUrl("");
    setProductName("");
    setBrandName("");
    setStrainName("");
    setResult(null);
    setBarcodeValue("");
    setBatchNumber("");
    setLotNumber("");
    setFacilityName("");
    setLicenseNumber("");
    setHarvestDate("");
    setPackageDate("");
    setExpirationDate("");
    setLabelMessage(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetAll();
    onOpenChange(isOpen);
  };

  // ──────────────────────────────────────────── URL ingestion
  const handleSubmitUrl = async () => {
    if (!coaUrl.trim()) {
      toast.error("Please enter a COA URL");
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const r = await ingestCoaUrl({
        coaUrl: coaUrl.trim(),
        productName: productName.trim() || undefined,
        brandName: brandName.trim() || undefined,
        strainName: strainName.trim() || undefined,
      });
      setResult(r);
      if (r.success) {
        toast.success("COA imported successfully");
        onImportComplete?.(r);
      } else {
        toast.error(r.error || "Import failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────── Scan handlers
  const handleQrScan = (text: string) => {
    if (isValidCoaUrl(text)) {
      setCoaUrl(text);
      setMode("paste_url");
      toast.success("QR code scanned");
    } else {
      // Treat non-URL QR payload as a label/barcode value
      setBarcodeValue(text);
      setMode("manual");
      toast.message("QR didn't contain a URL — added as label code");
    }
  };

  const handleBarcodeScan = (text: string) => {
    setBarcodeValue(text);
    setMode("manual");
    toast.success("Barcode captured");
  };

  // ──────────────────────────────────────────── Manual / barcode submission
  const handleSubmitLabel = async () => {
    const hasAny =
      barcodeValue.trim() ||
      batchNumber.trim() ||
      lotNumber.trim() ||
      facilityName.trim() ||
      licenseNumber.trim() ||
      productName.trim() ||
      strainName.trim();
    if (!hasAny) {
      toast.error("Add at least a product name, barcode, or batch number.");
      return;
    }

    const resolvedProduct = productName.trim() || strainName.trim() || `Label ${new Date().toISOString().slice(0, 10)}`;
    const sourceType = barcodeValue.trim() ? "barcode_scan" : "manual_label";

    try {
      await createDraft.mutateAsync({
        product_name: resolvedProduct,
        brand_name: brandName.trim() || undefined,
        coa_source_type: sourceType,
        barcode_value: barcodeValue.trim() || undefined,
        facility_name: facilityName.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
        batch_number: batchNumber.trim() || undefined,
        lot_number: lotNumber.trim() || undefined,
        harvest_date: harvestDate || undefined,
        package_date: packageDate || undefined,
        expiration_date: expirationDate || undefined,
      });
      setLabelMessage(
        "Barcode saved for review. This does not verify chemistry until a COA is linked or approved."
      );
      toast.success("Label info saved as draft");
    } catch (err: any) {
      toast.error(err?.message || "Could not save label info");
    }
  };

  // ──────────────────────────────────────────── Render

  const renderMenu = () => (
    <div className="space-y-2 py-2">
      <button
        type="button"
        onClick={() => setMode("scan_qr")}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/60 transition-colors text-left"
      >
        <QrCode className="w-5 h-5 text-primary shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium">Scan QR code</div>
          <div className="text-xs text-muted-foreground">Lab COA QR on the package</div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => setMode("scan_barcode")}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/60 transition-colors text-left"
      >
        <Barcode className="w-5 h-5 text-primary shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium">Scan barcode</div>
          <div className="text-xs text-muted-foreground">Package or shelf barcode</div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => setMode("paste_url")}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/60 transition-colors text-left"
      >
        <Link2 className="w-5 h-5 text-primary shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium">Paste COA URL</div>
          <div className="text-xs text-muted-foreground">Direct lab report link</div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => setMode("manual")}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/60 transition-colors text-left"
      >
        <ClipboardEdit className="w-5 h-5 text-primary shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium">Enter label info manually</div>
          <div className="text-xs text-muted-foreground">Batch, license, dates from packaging</div>
        </div>
      </button>
    </div>
  );

  const renderUrl = () => (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="coa-url" className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" /> COA / Lab Report URL
        </Label>
        <Input
          id="coa-url"
          type="url"
          placeholder="https://sclabs.com/sample/..."
          value={coaUrl}
          onChange={(e) => setCoaUrl(e.target.value)}
          className="h-12"
        />
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

      <div className="space-y-3 p-3 rounded-xl bg-secondary/40">
        <div className="space-y-1.5">
          <Label htmlFor="product-name" className="text-xs flex items-center gap-1">
            <Package className="w-3 h-3" /> Product Name (optional)
          </Label>
          <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand-name" className="text-xs flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Brand
          </Label>
          <Input id="brand-name" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="strain-name" className="text-xs flex items-center gap-1">
            <Leaf className="w-3 h-3" /> Strain
          </Label>
          <Input id="strain-name" value={strainName} onChange={(e) => setStrainName(e.target.value)} className="h-10" />
        </div>
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 h-12" onClick={() => setMode("menu")}>Back</Button>
        <Button className="flex-1 h-12" onClick={handleSubmitUrl} disabled={isLoading || !coaUrl.trim()}>
          {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>) : "Import COA"}
        </Button>
      </div>
    </div>
  );

  const renderScan = (scanMode: "qr" | "barcode") => (
    <div className="space-y-3 py-2">
      <QrScanner
        mode={scanMode}
        onScan={scanMode === "qr" ? handleQrScan : handleBarcodeScan}
        onClose={() => setMode("menu")}
      />
      <p className="text-xs text-muted-foreground text-center">
        {scanMode === "qr"
          ? "Hold steady on the COA QR code on the package."
          : "Hold steady on the package barcode (UPC, Code 128, etc)."}
      </p>
      <Button variant="ghost" className="w-full" onClick={() => setMode("menu")}>Cancel</Button>
    </div>
  );

  const renderManual = () => (
    <div className="space-y-4 py-2">
      {labelMessage ? (
        <div className="space-y-3">
          <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{labelMessage}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetAll}>Add another</Button>
            <Button className="flex-1" onClick={() => handleClose(false)}>Done</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Barcode className="w-3 h-3" /> Barcode / package code</Label>
              <Input value={barcodeValue} onChange={(e) => setBarcodeValue(e.target.value)} placeholder="Scanned or typed" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Brand</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Product / strain</Label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Batch #</Label>
                <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lot / package #</Label>
                <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Facility name</Label>
              <Input value={facilityName} onChange={(e) => setFacilityName(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">License number</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="h-10" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Harvest date</Label>
                <Input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Package date</Label>
                <Input type="date" value={packageDate} onChange={(e) => setPackageDate(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expires</Label>
                <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="h-10" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Saved as a pending draft. Chemistry stays unverified until a COA URL is linked or admin review approves it.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setMode("menu")}>Back</Button>
            <Button className="flex-1" onClick={handleSubmitLabel} disabled={createDraft.isPending}>
              {createDraft.isPending ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>) : "Save label info"}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Import COA or label
          </DialogTitle>
          <DialogDescription>
            Scan a QR or barcode, paste a lab URL, or enter package label info manually.
          </DialogDescription>
          <div className="pt-1">
            <COAEducationLink source="import_coa_modal" />
          </div>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <COAImportResultCard result={result} />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={resetAll}>Import another</Button>
              <Button className="flex-1" onClick={() => handleClose(false)}>Done</Button>
            </div>
          </div>
        ) : mode === "menu" ? (
          renderMenu()
        ) : mode === "paste_url" ? (
          renderUrl()
        ) : mode === "scan_qr" ? (
          renderScan("qr")
        ) : mode === "scan_barcode" ? (
          renderScan("barcode")
        ) : (
          renderManual()
        )}
      </DialogContent>
    </Dialog>
  );
}
