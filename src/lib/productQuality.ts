/**
 * Product Quality Score Engine
 *
 * Evaluates product/batch quality based on COA completeness,
 * cannabinoid & terpene panel depth, and batch recency.
 */

export interface QualityInput {
  coaStatus: string; // "verified" | "pending" | "unverified" | "rejected"
  labPanelCommon: Record<string, number> | null;
  labPanelCustom: Record<string, number> | Array<{ compound: string; value: number }> | null;
  testedAt: string | null; // ISO date
  labName: string | null;
  batchCode: string | null;
}

export interface QualityResult {
  qualityScore: number; // 0-100
  level: "unknown" | "basic" | "good" | "high quality";
  reasons: string[];
}

const CANNABINOID_KEYS = ["thc", "thca", "cbd", "cbda", "cbg", "cbn", "cbc", "thcv"];
const MONTHS_RECENT = 12;

export function computeProductQuality(input: QualityInput): QualityResult {
  // Non-verified products → unknown
  if (input.coaStatus !== "verified") {
    return {
      qualityScore: 0,
      level: "unknown",
      reasons: [input.coaStatus === "pending" ? "COA pending verification" : "No verified COA available"],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  // 1. Verified COA baseline (30 pts)
  score += 30;
  reasons.push("Verified COA on file");

  // 2. Cannabinoid panel completeness (0-25 pts)
  const cannabCount = countCannabinoids(input.labPanelCommon);
  if (cannabCount >= 5) {
    score += 25;
    reasons.push(`Full cannabinoid panel (${cannabCount} compounds)`);
  } else if (cannabCount >= 3) {
    score += 18;
    reasons.push(`Partial cannabinoid panel (${cannabCount} compounds)`);
  } else if (cannabCount >= 1) {
    score += 10;
    reasons.push("Basic cannabinoid data only");
  } else {
    reasons.push("No cannabinoid data");
  }

  // 3. Terpene panel (0-25 pts)
  const terpCount = countTerpenes(input.labPanelCustom);
  if (terpCount >= 5) {
    score += 25;
    reasons.push(`Detailed terpene profile (${terpCount} terpenes)`);
  } else if (terpCount >= 3) {
    score += 18;
    reasons.push(`Partial terpene profile (${terpCount} terpenes)`);
  } else if (terpCount >= 1) {
    score += 8;
    reasons.push("Limited terpene data");
  } else {
    reasons.push("No terpene profile");
  }

  // 4. Batch recency (0-10 pts)
  if (input.testedAt) {
    const months = monthsAgo(input.testedAt);
    if (months <= MONTHS_RECENT) {
      score += 10;
      reasons.push("Recent batch test");
    } else {
      score += 4;
      reasons.push("Older batch test");
    }
  }

  // 5. Metadata completeness (0-10 pts)
  let metaPts = 0;
  if (input.labName) metaPts += 5;
  if (input.batchCode) metaPts += 5;
  score += metaPts;
  if (metaPts === 10) reasons.push("Full batch metadata");

  // Determine level
  const level: QualityResult["level"] =
    score >= 75 ? "high quality" : score >= 45 ? "good" : "basic";

  return { qualityScore: Math.min(score, 100), level, reasons };
}

function countCannabinoids(panel: Record<string, number> | null): number {
  if (!panel || typeof panel !== "object") return 0;
  return CANNABINOID_KEYS.filter(k => {
    const val = panel[k] ?? panel[k.toUpperCase()] ?? panel[k.toLowerCase()];
    return val != null && val > 0;
  }).length;
}

function countTerpenes(
  custom: Record<string, number> | Array<{ compound: string; value: number }> | null,
): number {
  if (!custom) return 0;
  if (Array.isArray(custom)) {
    return custom.filter(e => e.value > 0).length;
  }
  return Object.values(custom).filter(v => typeof v === "number" && v > 0).length;
}

function monthsAgo(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

/**
 * Compute the best quality score from a list of batches for a given strain/product.
 */
export function bestQualityForBatches(
  batches: Array<{
    coa_status: string;
    lab_panel_common: Record<string, number> | null;
    lab_panel_custom: any;
    tested_at: string | null;
    lab_name: string | null;
    batch_code: string | null;
  }>,
): QualityResult | null {
  if (!batches.length) return null;
  let best: QualityResult | null = null;
  for (const b of batches) {
    const result = computeProductQuality({
      coaStatus: b.coa_status,
      labPanelCommon: b.lab_panel_common,
      labPanelCustom: b.lab_panel_custom,
      testedAt: b.tested_at,
      labName: b.lab_name,
      batchCode: b.batch_code,
    });
    if (!best || result.qualityScore > best.qualityScore) best = result;
  }
  return best;
}
