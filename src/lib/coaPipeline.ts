import type { LabPanelCustomEntry } from "@/hooks/useProductBatches";

// ── Types ──────────────────────────────────────────────────────────────

export interface ExtractedLabData {
  /** Keys like "THCa", "CBD", etc. with numeric percent values */
  compounds: Record<string, number>;
  /** Any extra compounds the parser found outside the common set */
  extras?: Array<{ compound: string; value: number; unit: string }>;
}

// ── Common compound set (must stay in sync with LabPanelSection) ──────

const COMMON_COMPOUNDS = new Set([
  "THCa", "THC", "CBDa", "CBD", "CBG", "CBN", "Total Terpenes",
  "CBC", "THCv", "Δ8", "Δ10", "HHC", "THCp",
]);

// ── normalizeLabPanel ──────────────────────────────────────────────────

/**
 * Takes raw extracted lab data and splits it into the two
 * canonical shapes stored on product_batches:
 *   • lab_panel_common  – Record<string, number> for known compounds
 *   • lab_panel_custom   – LabPanelCustomEntry[] for everything else
 */
export function normalizeLabPanel(extracted: ExtractedLabData): {
  lab_panel_common: Record<string, number>;
  lab_panel_custom: LabPanelCustomEntry[];
} {
  const lab_panel_common: Record<string, number> = {};
  const lab_panel_custom: LabPanelCustomEntry[] = [];

  // Sort compounds into common vs custom
  for (const [key, value] of Object.entries(extracted.compounds)) {
    if (COMMON_COMPOUNDS.has(key)) {
      lab_panel_common[key] = value;
    } else {
      lab_panel_custom.push({ compound: key, value, unit: "%" });
    }
  }

  // Append any extras the parser surfaced
  if (extracted.extras) {
    for (const entry of extracted.extras) {
      const unit = (["%" , "mg_g", "mg", "ppm"].includes(entry.unit)
        ? entry.unit
        : "%") as LabPanelCustomEntry["unit"];
      lab_panel_custom.push({ compound: entry.compound, value: entry.value, unit });
    }
  }

  return { lab_panel_common, lab_panel_custom };
}

// ── computeBatchMatchScore (stub) ──────────────────────────────────────

export interface UserProfileForMatch {
  sensitivity_flags?: string[] | null;
  /** Future: preferred effects, avoid list, etc. */
}

export interface BatchLabPanel {
  lab_panel_common?: Record<string, number> | null;
  lab_panel_custom?: LabPanelCustomEntry[] | null;
}

/**
 * Placeholder: computes a 0–100 compatibility score between a user
 * profile and a batch's lab panel.  Real logic will be implemented
 * when premium matching ships.
 */
export function computeBatchMatchScore(
  _userProfile: UserProfileForMatch,
  _batchLabPanel: BatchLabPanel,
): number {
  // Stub: return a neutral mid-range score
  return 50;
}

// ── DEV-only simulated extraction ──────────────────────────────────────

export const SIMULATED_EXTRACTION: ExtractedLabData = {
  compounds: {
    THCa: 24.3,
    THC: 0.8,
    CBDa: 0.12,
    CBD: 0.05,
    CBG: 1.1,
    CBN: 0.03,
    "Total Terpenes": 3.4,
    CBC: 0.09,
  },
  extras: [
    { compound: "Myrcene", value: 1.2, unit: "%" },
    { compound: "Limonene", value: 0.8, unit: "%" },
    { compound: "β-Caryophyllene", value: 0.6, unit: "%" },
  ],
};
