/**
 * Share Profile — Canvas-based 1080×1080 profile card generator
 */

export interface ShareProfileData {
  profileName: string;
  subtitle: string;
  clarityScore: number;
  topTerpene: string | null;
  bestDoseRange: string;
  sessionCount: number;
}

// Deep Forest palette
const BG_COLOR = "#1E2B25";
const BG_GRADIENT_TOP = "#243530";
const BG_GRADIENT_BOTTOM = "#1A2420";
const TEXT_PRIMARY = "#F2EFE8";
const TEXT_MUTED = "#8BA097";
const ACCENT = "#6FAF9F";
const ACCENT_DIM = "rgba(111, 175, 159, 0.15)";
const CARD_BG = "rgba(57, 75, 89, 0.25)";
const CARD_BORDER = "rgba(111, 175, 159, 0.2)";

export async function generateShareImage(data: ShareProfileData): Promise<Blob> {
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, SIZE);
  bgGrad.addColorStop(0, BG_GRADIENT_TOP);
  bgGrad.addColorStop(1, BG_GRADIENT_BOTTOM);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Subtle decorative circles
  ctx.globalAlpha = 0.06;
  ctx.beginPath();
  ctx.arc(SIZE * 0.85, SIZE * 0.15, 300, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(SIZE * 0.1, SIZE * 0.9, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Main card ──
  const cardX = 80;
  const cardY = 200;
  const cardW = SIZE - 160;
  const cardH = 620;
  roundRect(ctx, cardX, cardY, cardW, cardH, 32, CARD_BG, CARD_BORDER);

  // ── Brand header ──
  ctx.font = "600 28px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUTED;
  ctx.textAlign = "center";
  ctx.fillText("SIGNAL LEAF", SIZE / 2, 120);

  ctx.font = "300 20px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText("Cannabis Connoisseur Profile", SIZE / 2, 155);

  // ── Profile name ──
  ctx.font = "700 52px 'DM Sans', Georgia, serif";
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.textAlign = "center";
  ctx.fillText(data.profileName, SIZE / 2, cardY + 80, cardW - 80);

  // Subtitle
  ctx.font = "400 24px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText(data.subtitle, SIZE / 2, cardY + 120, cardW - 80);

  // ── Divider ──
  ctx.strokeStyle = CARD_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, cardY + 155);
  ctx.lineTo(cardX + cardW - 60, cardY + 155);
  ctx.stroke();

  // ── Stats grid (2×2) ──
  const statsY = cardY + 195;
  const colW = (cardW - 80) / 2;

  drawStat(ctx, cardX + 40, statsY, colW, "Clarity Score", `${data.clarityScore}%`, ACCENT);
  drawStat(ctx, cardX + 40 + colW, statsY, colW, "Sessions Logged", `${data.sessionCount}`, TEXT_PRIMARY);
  drawStat(ctx, cardX + 40, statsY + 160, colW, "Top Terpene", data.topTerpene ?? "Exploring", ACCENT);
  drawStat(ctx, cardX + 40 + colW, statsY + 160, colW, "Best Dose", data.bestDoseRange, TEXT_PRIMARY);

  // ── Clarity ring ──
  const ringX = SIZE / 2;
  const ringY = cardY + cardH + 80;
  const ringR = 50;
  const pct = data.clarityScore / 100;

  // Background ring
  ctx.beginPath();
  ctx.arc(ringX, ringY, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = ACCENT_DIM;
  ctx.lineWidth = 8;
  ctx.stroke();

  // Progress ring
  ctx.beginPath();
  ctx.arc(ringX, ringY, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";

  // ── Footer ──
  ctx.font = "400 18px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUTED;
  ctx.textAlign = "center";
  ctx.fillText("signalleaf.app", SIZE / 2, SIZE - 60);

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/png",
    );
  });
}

/* ── Canvas helpers ── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string,
  strokeColor: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  valueColor: string,
) {
  ctx.textAlign = "center";
  const cx = x + w / 2;

  ctx.font = "500 16px 'DM Sans', sans-serif";
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText(label.toUpperCase(), cx, y);

  ctx.font = "700 36px 'DM Sans', Georgia, serif";
  ctx.fillStyle = valueColor;
  ctx.fillText(value, cx, y + 50, w - 20);
}

export async function downloadShareImage(blob: Blob, filename = "signal-leaf-profile.png") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function nativeShare(blob: Blob) {
  const file = new File([blob], "signal-leaf-profile.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "My Signal Leaf Profile" });
    return true;
  }
  return false;
}
