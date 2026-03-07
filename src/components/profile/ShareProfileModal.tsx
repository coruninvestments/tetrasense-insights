import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Download, Share2, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  generateShareImage,
  downloadShareImage,
  nativeShare,
  type ShareProfileData,
} from "@/lib/shareProfile";
import { toast } from "sonner";

interface ShareProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ShareProfileData;
}

export function ShareProfileModal({ open, onOpenChange, data }: ShareProfileModalProps) {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const blobRef = useRef<Blob | null>(null);

  const canNativeShare = useMemo(
    () => typeof navigator !== "undefined" && !!navigator.canShare,
    [],
  );

  // Generate preview when modal opens
  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      setDownloaded(false);
      blobRef.current = null;
      return;
    }

    let cancelled = false;
    setGenerating(true);

    generateShareImage(data)
      .then(blob => {
        if (cancelled) return;
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to generate image");
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, data]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownload = useCallback(async () => {
    if (!blobRef.current) return;
    try {
      await downloadShareImage(blobRef.current);
      setDownloaded(true);
      toast.success("Image saved!");
    } catch {
      toast.error("Download failed");
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!blobRef.current) return;
    try {
      const shared = await nativeShare(blobRef.current);
      if (!shared) {
        // Fallback to download
        await downloadShareImage(blobRef.current);
        toast.success("Image saved — share it from your gallery!");
      }
    } catch {
      toast.error("Sharing failed");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Share Your Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center">
            {generating ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Generating your card…</p>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Your Signal Leaf connoisseur profile card"
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleDownload}
              disabled={generating || !previewUrl}
            >
              {downloaded ? (
                <Check className="w-4 h-4 mr-1.5" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              {downloaded ? "Saved" : "Download"}
            </Button>

            {canNativeShare && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleShare}
                disabled={generating || !previewUrl}
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                Share
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            No personal data is included — only your connoisseur profile summary.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
