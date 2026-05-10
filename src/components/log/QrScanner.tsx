import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ScannerMode = "qr" | "barcode" | "any";

interface QrScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
  mode?: ScannerMode;
}

const BARCODE_FORMATS = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.PDF_417,
];

export function QrScanner({ onScan, onClose, mode = "qr" }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ReturnType<BrowserMultiFormatReader["decodeFromVideoDevice"]> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    controlsRef.current?.then((controls) => controls.stop()).catch(() => {});
    controlsRef.current = null;
  }, []);

  useEffect(() => {
    const hints = new Map<DecodeHintType, unknown>();
    const formats =
      mode === "qr"
        ? [BarcodeFormat.QR_CODE]
        : mode === "barcode"
        ? BARCODE_FORMATS
        : [BarcodeFormat.QR_CODE, ...BARCODE_FORMATS];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints as any);
    let cancelled = false;

    const start = async () => {
      try {
        const promise = reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText();
              if (text) {
                stop();
                onScan(text);
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              // ignore non-fatal frames
            }
          }
        );
        controlsRef.current = promise;
        await promise;
      } catch (e: any) {
        if (!cancelled) {
          console.warn("Scanner camera error:", e);
          setError(
            e?.name === "NotAllowedError"
              ? "Camera access denied. Please enter the code manually."
              : "Could not access camera. Please enter the code manually."
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [onScan, stop, mode]);

  if (error) {
    return (
      <div className="rounded-xl bg-muted p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{error}</span>
        </div>
        <Button type="button" variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const label =
    mode === "barcode"
      ? "Point at package barcode"
      : mode === "any"
      ? "Point at QR or barcode"
      : "Point at COA QR code";

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full aspect-square object-cover"
        muted
        playsInline
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-[15%] border-2 border-primary/60 rounded-lg" />
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
            {label}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => { stop(); onClose(); }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
