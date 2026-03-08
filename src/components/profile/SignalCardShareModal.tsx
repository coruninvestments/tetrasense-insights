import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Download, Share2, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { downloadShareImage, nativeShare } from "@/lib/shareProfile";
import { toast } from "sonner";
import type { SignalCardData } from "@/lib/signalCard";

/* ── Canvas palette (Deep Forest) ── */
const BG_TOP = "#243530";
const BG_BOT = "#1A2420";
const TEXT_PRI = "#F2EFE8";
const TEXT_MUT = "#8BA097";
const ACCENT = "#6FAF9F";
const CARD_BG = "rgba(57, 75, 89, 0.25)";
const CARD_BORDER = "rgba(111, 175, 159, 0.2)";

interface SignalCardShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: SignalCardData;
}

export function SignalCardShareModal({ open, onOpenChange, card }: SignalCardShareModalProps) {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const blobRef = useRef<Blob | null>(null);

  const canNativeShare = useMemo(
    () => typeof navigator !== "undefined" && !!navigator.canShare,
    [],
  );

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      setDownloaded(false);
      blobRef.current = null;
      return;
    }

    let cancelled = false;
    setGenerating(true);

    generateSignalCardImage(card)
      .then((blob) => {
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

    return () => { cancelled = true; };
  }, [open, card]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleDownload = useCallback(async () => {
    if (!blobRef.current) return;
    try {
      await downloadShareImage(blobRef.current, "signal-leaf-card.png");
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
        await downloadShareImage(blobRef.current, "signal-leaf-card.png");
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
          <DialogTitle className="font-serif text-lg">Share Signal Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center">
            {generating ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Generating your card…</p>
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="Your Signal Card" className="w-full h-full object-contain" />
            ) : null}
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleDownload} disabled={generating || !previewUrl}>
              {downloaded ? <Check className="w-4 h-4 mr-1.5" /> : <Download className="w-4 h-4 mr-1.5" />}
              {downloaded ? "Saved" : "Download"}
            </Button>
            {canNativeShare && (
              <Button variant="outline" className="flex-1" onClick={handleShare} disabled={generating || !previewUrl}>
                <Share2 className="w-4 h-4 mr-1.5" />
                Share
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            No personal data beyond your profile-level insights is shared.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Canvas image generator ── */

async function generateSignalCardImage(card: SignalCardData): Promise<Blob> {
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, SIZE);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(1, BG_BOT);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Decorative circles
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = ACCENT;
  ctx.beginPath(); ctx.arc(SIZE * 0.8, SIZE * 0.12, 280, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(SIZE * 0.15, SIZE * 0.88, 220, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Brand
  ctx.font = "600 26px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUT;
  ctx.textAlign = "center";
  ctx.fillText("SIGNAL LEAF", SIZE / 2, 90);
  ctx.font = "300 18px 'DM Sans', sans-serif";
  ctx.fillText("Signal Card", SIZE / 2, 120);

  // Main card
  const cX = 70, cY = 160, cW = SIZE - 140, cH = 700;
  roundRect(ctx, cX, cY, cW, cH, 28, CARD_BG, CARD_BORDER);

  // Profile name
  ctx.font = "700 46px 'DM Sans', Georgia, serif";
  ctx.fillStyle = TEXT_PRI;
  ctx.fillText(card.profileName, SIZE / 2, cY + 70, cW - 60);

  // Metrics row
  const metricsY = cY + 120;
  drawStat(ctx, cX + 30, metricsY, (cW - 60) / 3, "CLARITY", `${card.clarityScore}%`, ACCENT);
  drawStat(ctx, cX + 30 + (cW - 60) / 3, metricsY, (cW - 60) / 3, "CONFIDENCE", card.confidenceLabel, TEXT_PRI);
  drawStat(ctx, cX + 30 + ((cW - 60) / 3) * 2, metricsY, (cW - 60) / 3, "SIGNAL", card.signalStrengthLabel.replace(" Signal", ""), TEXT_PRI);

  // Divider
  ctx.strokeStyle = CARD_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cX + 50, metricsY + 80);
  ctx.lineTo(cX + cW - 50, metricsY + 80);
  ctx.stroke();

  // Dose & Method
  let infoY = metricsY + 120;
  if (card.bestDoseRange !== "Gathering data") {
    drawLabel(ctx, cX + 50, infoY, "Best Dose");
    drawValue(ctx, cX + 50, infoY + 30, card.bestDoseRange);
    infoY += 70;
  }
  if (card.preferredMethod) {
    drawLabel(ctx, cX + 50, infoY, "Preferred Method");
    drawValue(ctx, cX + 50, infoY + 30, card.preferredMethod);
    infoY += 70;
  }

  // Terpenes
  if (card.topTerpenes.length > 0) {
    drawLabel(ctx, cX + 50, infoY, "Terpene Likes");
    infoY += 30;
    for (const t of card.topTerpenes.slice(0, 3)) {
      ctx.font = "400 22px 'DM Sans', sans-serif";
      ctx.fillStyle = ACCENT;
      ctx.textAlign = "left";
      ctx.fillText(`• ${t.name}`, cX + 50, infoY);
      infoY += 32;
    }
  }

  // Top matches
  if (card.topMatches.length > 0) {
    infoY += 10;
    drawLabel(ctx, cX + 50, infoY, "Profile Matches");
    infoY += 30;
    for (const m of card.topMatches) {
      ctx.font = "400 22px 'DM Sans', sans-serif";
      ctx.fillStyle = TEXT_PRI;
      ctx.textAlign = "left";
      ctx.fillText(m.label, cX + 50, infoY, cW - 200);
      ctx.fillStyle = TEXT_MUT;
      ctx.textAlign = "right";
      ctx.fillText(`${m.matchScore}%`, cX + cW - 50, infoY);
      infoY += 32;
    }
  }

  // Sessions count
  ctx.font = "400 16px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUT;
  ctx.textAlign = "center";
  ctx.fillText(`Built from ${card.sessionsLogged} sessions`, SIZE / 2, SIZE - 80);

  // Footer
  ctx.fillText("signalleaf.app", SIZE / 2, SIZE - 50);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/png",
    );
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawStat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, value: string, color: string) {
  const cx = x + w / 2;
  ctx.textAlign = "center";
  ctx.font = "500 14px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUT;
  ctx.fillText(label, cx, y);
  ctx.font = "700 32px 'DM Sans', Georgia, serif";
  ctx.fillStyle = color;
  ctx.fillText(value, cx, y + 42, w - 10);
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.font = "500 14px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUT;
  ctx.textAlign = "left";
  ctx.fillText(label.toUpperCase(), x, y);
}

function drawValue(ctx: CanvasRenderingContext2D, x: number, y: number, value: string) {
  ctx.font = "500 24px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_PRI;
  ctx.textAlign = "left";
  ctx.fillText(value, x, y);
}
