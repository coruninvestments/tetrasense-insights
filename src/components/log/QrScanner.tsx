import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Camera, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ReturnType<BrowserQRCodeReader["decodeFromVideoDevice"]> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    controlsRef.current?.then((controls) => controls.stop()).catch(() => {});
    controlsRef.current = null;
  }, []);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
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
              // Ignore "not found" frames, they're normal
            }
          }
        );
        controlsRef.current = promise;
        await promise; // will resolve with controls
      } catch (e: any) {
        if (!cancelled) {
          console.warn("QR camera error:", e);
          setError(
            e?.name === "NotAllowedError"
              ? "Camera access denied. Please paste the URL instead."
              : "Could not access camera. Please paste the URL instead."
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [onScan, stop]);

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

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full aspect-square object-cover"
        muted
        playsInline
      />
      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-[15%] border-2 border-primary/60 rounded-lg" />
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
            Point at COA QR code
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
