import type { CreateSessionLogInput, SessionIntent, SessionMethod, DoseLevel, SessionLog } from "@/hooks/useSessionLogs";
import type { SessionOutcome } from "@/lib/sessionOutcome";

export type QuickOutcome = "good" | "neutral" | "bad";
export type QuickMethod = "smoke" | "vape" | "edible" | "drink" | "concentrate" | "tincture";

export interface QuickDoseOption {
  label: string;
  doseLevel: DoseLevel;
  doseUnit?: string;
  doseCount?: number;
  doseAmountMg?: number;
}

export const QUICK_METHODS: { id: QuickMethod; label: string; emoji: string }[] = [
  { id: "smoke", label: "Flower", emoji: "🔥" },
  { id: "vape", label: "Vape", emoji: "💨" },
  { id: "edible", label: "Edible", emoji: "🍪" },
  { id: "drink", label: "Drink", emoji: "🥤" },
  { id: "concentrate", label: "Dab", emoji: "💎" },
  { id: "tincture", label: "Tincture", emoji: "💧" },
];

export function getDoseOptions(method: QuickMethod): QuickDoseOption[] {
  switch (method) {
    case "smoke":
      return [
        { label: "1 hit", doseLevel: "low", doseUnit: "hit", doseCount: 1 },
        { label: "3 hits", doseLevel: "medium", doseUnit: "hit", doseCount: 3 },
        { label: "0.25g", doseLevel: "medium", doseUnit: "g", doseCount: 0.25 },
        { label: "0.5g+", doseLevel: "high", doseUnit: "g", doseCount: 0.5 },
      ];
    case "vape":
      return [
        { label: "1 puff", doseLevel: "low", doseUnit: "puff", doseCount: 1 },
        { label: "3 puffs", doseLevel: "medium", doseUnit: "puff", doseCount: 3 },
        { label: "5+ puffs", doseLevel: "high", doseUnit: "puff", doseCount: 5 },
      ];
    case "edible":
    case "drink":
      return [
        { label: "2.5 mg", doseLevel: "low", doseUnit: "mg", doseCount: 1, doseAmountMg: 2.5 },
        { label: "5 mg", doseLevel: "medium", doseUnit: "mg", doseCount: 1, doseAmountMg: 5 },
        { label: "10 mg", doseLevel: "medium", doseUnit: "mg", doseCount: 1, doseAmountMg: 10 },
        { label: "20+ mg", doseLevel: "high", doseUnit: "mg", doseCount: 1, doseAmountMg: 20 },
      ];
    case "concentrate":
      return [
        { label: "Small dab", doseLevel: "low", doseUnit: "dab", doseCount: 1 },
        { label: "Medium dab", doseLevel: "medium", doseUnit: "dab", doseCount: 1 },
        { label: "Large dab", doseLevel: "high", doseUnit: "dab", doseCount: 1 },
      ];
    case "tincture":
      return [
        { label: "Low", doseLevel: "low" },
        { label: "Medium", doseLevel: "medium" },
        { label: "High", doseLevel: "high" },
      ];
  }
}

function mapQuickOutcome(outcome: QuickOutcome): SessionOutcome {
  switch (outcome) {
    case "good": return "positive";
    case "neutral": return "neutral";
    case "bad": return "negative";
  }
}

function mapQuickMethod(method: QuickMethod): SessionMethod {
  switch (method) {
    case "smoke": return "smoke";
    case "vape": return "vape";
    case "edible": return "edible";
    case "drink": return "edible";
    case "concentrate": return "smoke";
    case "tincture": return "tincture";
  }
}

/** Default effect sliders based on quick outcome */
function defaultEffects(outcome: QuickOutcome) {
  switch (outcome) {
    case "good":
      return { sleepiness: 3, relaxation: 7, anxiety: 1, focus: 5, pain_relief: 4, euphoria: 6 };
    case "neutral":
      return { sleepiness: 3, relaxation: 4, anxiety: 3, focus: 4, pain_relief: 3, euphoria: 3 };
    case "bad":
      return { sleepiness: 2, relaxation: 2, anxiety: 7, focus: 2, pain_relief: 1, euphoria: 1 };
  }
}

export interface QuickLogInput {
  strainText: string;
  strainId?: string | null;
  canonicalStrainId?: string | null;
  productId?: string | null;
  batchId?: string | null;
  method: QuickMethod;
  dose: QuickDoseOption;
  outcome: QuickOutcome;
  intent?: SessionIntent | null;
  contextTags?: string[];
}

export function buildSessionFromQuickLog(input: QuickLogInput): CreateSessionLogInput {
  const effects = defaultEffects(input.outcome);

  return {
    intent: input.intent ?? "recreation",
    strain_id: input.strainId ?? undefined,
    strain_name_text: input.strainText,
    canonical_strain_id: input.canonicalStrainId ?? undefined,
    product_id: input.productId ?? undefined,
    batch_id: input.batchId ?? undefined,
    method: mapQuickMethod(input.method),
    dose_level: input.dose.doseLevel,
    dose_amount_mg: input.dose.doseAmountMg ?? undefined,
    dose_unit: input.dose.doseUnit ?? undefined,
    dose_count: input.dose.doseCount ?? undefined,
    effects,
    outcome: mapQuickOutcome(input.outcome),
    mood_before: input.contextTags?.includes("high_stress") ? "stressed" : input.contextTags?.includes("low_stress") ? "calm" : undefined,
    stress_before: input.contextTags?.includes("high_stress") ? "high" : input.contextTags?.includes("low_stress") ? "low" : undefined,
    sleep_quality: input.contextTags?.includes("tired") ? "poor" : undefined,
    caffeine: input.contextTags?.includes("caffeine") ?? false,
  };
}

/** Reverse-map a stored SessionMethod back to a QuickMethod approximation. */
function inferQuickMethod(method: string | null | undefined, doseUnit?: string | null): QuickMethod {
  switch (method) {
    case "smoke":
      return doseUnit === "dab" ? "concentrate" : "smoke";
    case "vape": return "vape";
    case "edible":
      return doseUnit === "mg" || doseUnit === "ml" ? "edible" : "edible";
    case "tincture": return "tincture";
    default: return "smoke";
  }
}

export interface RepeatSessionDraft {
  sourceSessionId: string;
  strainText: string;
  canonicalStrainId: string | null;
  strainId: string | null;
  productId: string | null;
  batchId: string | null;
  method: QuickMethod;
  dose: QuickDoseOption;
  intent: SessionIntent | null;
  contextTags: string[];
  lastLoggedAt: string;
}

/** Build a prefilled draft from the user's last session for "Repeat Last Session". */
export function buildRepeatSessionDraft(last: SessionLog): RepeatSessionDraft {
  const method = inferQuickMethod(last.method, last.dose_unit);
  const doseLevel = (last.dose_level ?? "medium") as DoseLevel;

  // Reconstruct a label that matches the original dose
  let label: string;
  if (last.dose_amount_mg && last.dose_unit === "mg") {
    label = `${last.dose_amount_mg} mg`;
  } else if (last.dose_count && last.dose_unit) {
    const unit = last.dose_count === 1 ? last.dose_unit : `${last.dose_unit}s`;
    label = `${last.dose_count} ${unit}`;
  } else {
    label = doseLevel.charAt(0).toUpperCase() + doseLevel.slice(1);
  }

  const contextTags: string[] = [];
  if (last.stress_before === "high") contextTags.push("high_stress");
  else if (last.stress_before === "low") contextTags.push("low_stress");
  if (last.sleep_quality === "poor") contextTags.push("tired");
  if (last.caffeine) contextTags.push("caffeine");

  const validIntents: SessionIntent[] = ["sleep","relaxation","creativity","focus","pain_relief","social","recreation","learning"];
  const intent = validIntents.includes(last.intent as SessionIntent) && last.intent !== "recreation"
    ? (last.intent as SessionIntent)
    : null;

  return {
    sourceSessionId: last.id,
    strainText: last.strain_name_text,
    canonicalStrainId: last.canonical_strain_id,
    strainId: last.strain_id,
    productId: last.product_id,
    batchId: last.batch_id,
    method,
    dose: {
      label,
      doseLevel,
      doseUnit: last.dose_unit ?? undefined,
      doseCount: last.dose_count ?? undefined,
      doseAmountMg: last.dose_amount_mg ?? undefined,
    },
    intent,
    contextTags,
    lastLoggedAt: last.created_at,
  };
}

export function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

