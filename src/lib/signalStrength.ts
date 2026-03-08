import type { SessionLog } from "@/hooks/useSessionLogs";

export type SignalLevel = "Early Signal" | "Forming Signal" | "Strong Signal";

export interface SignalStrengthResult {
  score: number;
  level: SignalLevel;
  reasons: string[];
  nextActions: string[];
}

function pct(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

export function computeSignalStrength(sessions: SessionLog[]): SignalStrengthResult {
  const total = sessions.length;

  if (total === 0) {
    return {
      score: 0,
      level: "Early Signal",
      reasons: ["No sessions logged yet."],
      nextActions: ["Log your first session to begin building your signal."],
    };
  }

  // ── Dimension scores (each 0–1) ──

  // 1. Volume (up to 20 sessions = full credit, logarithmic curve)
  const volumeScore = Math.min(Math.log(total + 1) / Math.log(21), 1);

  // 2. Dose completeness
  const withDose = sessions.filter(
    (s) => s.dose_level != null || (s.dose_amount_mg != null && s.dose_amount_mg > 0)
  ).length;
  const dosePct = pct(withDose, total);

  // 3. Effects completeness
  const withEffects = sessions.filter(
    (s) =>
      (s.effect_relaxation != null && s.effect_relaxation > 0) ||
      (s.effect_focus != null && s.effect_focus > 0) ||
      (s.effect_euphoria != null && s.effect_euphoria > 0) ||
      (s.effect_sleepiness != null && s.effect_sleepiness > 0) ||
      (s.effect_pain_relief != null && s.effect_pain_relief > 0)
  ).length;
  const effectsPct = pct(withEffects, total);

  // 4. Context completeness (time_of_day, setting, mood_before, etc.)
  const withContext = sessions.filter(
    (s) => s.time_of_day || s.setting || s.mood_before || s.stress_before || s.sleep_quality
  ).length;
  const contextPct = pct(withContext, total);

  // 5. Flavor/aroma completeness
  const withSensory = sessions.filter(
    (s) =>
      (s.aroma_tags && s.aroma_tags.length > 0) ||
      (s.flavor_tags && s.flavor_tags.length > 0)
  ).length;
  const sensoryPct = pct(withSensory, total);

  // 6. Product diversity
  const uniqueProducts = new Set(
    sessions.map((s) => s.strain_name_text?.toLowerCase().trim()).filter(Boolean)
  ).size;
  const diversityScore = Math.min(uniqueProducts / 5, 1);

  // ── Weighted composite ──
  const weights = {
    volume: 0.20,
    dose: 0.15,
    effects: 0.20,
    context: 0.15,
    sensory: 0.15,
    diversity: 0.15,
  };

  const raw =
    volumeScore * weights.volume +
    dosePct * weights.dose +
    effectsPct * weights.effects +
    contextPct * weights.context +
    sensoryPct * weights.sensory +
    diversityScore * weights.diversity;

  const score = Math.round(raw * 100);

  // ── Level ──
  const level: SignalLevel =
    score >= 60 ? "Strong Signal" : score >= 30 ? "Forming Signal" : "Early Signal";

  // ── Reasons (what's strong) ──
  const reasons: string[] = [];
  if (total >= 5) reasons.push(`${total} sessions logged — solid foundation`);
  else reasons.push(`${total} session${total > 1 ? "s" : ""} logged so far`);

  if (effectsPct >= 0.8) reasons.push("Great effect tracking across sessions");
  if (dosePct >= 0.8) reasons.push("Strong dose logging consistency");
  if (contextPct >= 0.6) reasons.push("Context data enriching your insights");
  if (sensoryPct >= 0.5) reasons.push("Flavor & aroma data deepening profiles");
  if (uniqueProducts >= 3) reasons.push(`${uniqueProducts} unique products compared`);

  // ── Next actions (what's weak) ──
  const nextActions: string[] = [];
  if (total < 5) nextActions.push(`Log ${5 - total} more session${5 - total > 1 ? "s" : ""} to strengthen patterns`);
  if (dosePct < 0.6) nextActions.push("Include dose details in your sessions");
  if (effectsPct < 0.6) nextActions.push("Rate effects to sharpen your signal");
  if (contextPct < 0.4) nextActions.push("Add context (mood, setting) for richer correlations");
  if (sensoryPct < 0.3) nextActions.push("Track flavor and aroma to deepen product insights");
  if (uniqueProducts < 3) nextActions.push("Try different products to improve comparison accuracy");

  return {
    score,
    level,
    reasons: reasons.slice(0, 3),
    nextActions: nextActions.slice(0, 2),
  };
}
