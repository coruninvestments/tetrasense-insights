import type { SessionLog } from "@/hooks/useSessionLogs";

/* ── Types ───────────────────────────────────────────────────────── */

export type TerpeneConfidence = "forming" | "low" | "medium" | "high";

export interface TerpeneSignal {
  name: string;
  score: number;       // 0-100 affinity
  sessionCount: number;
  positiveRate: number; // 0-1
  source: "lab" | "aroma" | "flavor" | "mixed";
}

export interface TerpeneWarning {
  description: string;
  confidence: TerpeneConfidence;
}

export interface TerpeneInsight {
  description: string;
  confidence: TerpeneConfidence;
}

export interface TerpenePreferenceResult {
  preferred: TerpeneSignal[];
  warnings: TerpeneWarning[];
  insights: TerpeneInsight[];
  confidence: TerpeneConfidence;
  dataSource: "lab" | "sensory" | "mixed" | "none";
  sessionCount: number;
}

/* ── Terpene ↔ Aroma/Flavor mapping ─────────────────────────────── */

const TERPENE_FAMILIES: Record<string, { aromas: string[]; flavors: string[] }> = {
  Limonene:   { aromas: ["citrus", "sweet", "fruity"],   flavors: ["citrus", "sweet", "tropical"] },
  Pinene:     { aromas: ["pine", "herbal", "earthy"],    flavors: ["pine", "woody", "earthy"] },
  Myrcene:    { aromas: ["earthy", "herbal", "skunky"],  flavors: ["earthy", "berry", "woody"] },
  Linalool:   { aromas: ["floral", "sweet", "herbal"],   flavors: ["sweet", "minty"] },
  Caryophyllene: { aromas: ["spicy", "diesel", "earthy"], flavors: ["peppery", "woody", "earthy"] },
  Terpinolene: { aromas: ["floral", "fruity", "herbal"], flavors: ["sweet", "tropical", "citrus"] },
  Humulene:   { aromas: ["earthy", "spicy", "herbal"],   flavors: ["earthy", "peppery", "woody"] },
  Ocimene:    { aromas: ["sweet", "floral", "fruity"],   flavors: ["sweet", "tropical", "citrus"] },
  Bisabolol:  { aromas: ["floral", "sweet", "creamy"],   flavors: ["sweet", "minty"] },
};

/* ── Helpers ─────────────────────────────────────────────────────── */

function getConfidence(n: number): TerpeneConfidence {
  if (n < 3) return "forming";
  if (n < 5) return "low";
  if (n < 10) return "medium";
  return "high";
}

function scoreTerpeneFromTags(
  sessions: SessionLog[],
  terpene: string,
  family: { aromas: string[]; flavors: string[] }
): TerpeneSignal | null {
  // Find sessions that mention aromas/flavors matching this terpene
  const matching = sessions.filter((s) => {
    const aromaTags: string[] = (s as any).aroma_tags ?? [];
    const flavorTags: string[] = (s as any).flavor_tags ?? [];
    const aromaHit = family.aromas.some((a) => aromaTags.includes(a));
    const flavorHit = family.flavors.some((f) => flavorTags.includes(f));
    return aromaHit || flavorHit;
  });

  if (matching.length < 2) return null;

  const positiveCount = matching.filter((s) => s.outcome === "positive").length;
  const positiveRate = positiveCount / matching.length;
  const enjoymentScores = matching
    .map((s) => (s as any).sensory_enjoyment as number | null)
    .filter((v): v is number => v !== null && v !== undefined);

  const avgEnjoyment = enjoymentScores.length > 0
    ? enjoymentScores.reduce((a, b) => a + b, 0) / enjoymentScores.length
    : 3; // neutral default

  // Score: weighted blend of positive rate + enjoyment
  const outcomeScore = positiveRate * 60;
  const enjoymentScore = (avgEnjoyment / 5) * 40;
  const score = Math.round(outcomeScore + enjoymentScore);

  return {
    name: terpene,
    score,
    sessionCount: matching.length,
    positiveRate,
    source: "aroma",
  };
}

function scoreTerpeneFromLab(
  sessions: SessionLog[],
  terpene: string
): TerpeneSignal | null {
  // Check for lab_panel_common data on batches — we look at sessions with batch_id
  // Since we don't have batch terpene data joined, we skip this for now
  // and rely on aroma/flavor mapping
  return null;
}

/* ── Insight generation ──────────────────────────────────────────── */

function buildInsights(
  preferred: TerpeneSignal[],
  sessions: SessionLog[]
): TerpeneInsight[] {
  const insights: TerpeneInsight[] = [];
  const n = sessions.length;
  const conf = getConfidence(n);

  if (preferred.length === 0) return insights;

  const top = preferred[0];

  // Cross-reference top terpene with intent
  const intentCounts: Record<string, { total: number; positive: number }> = {};
  for (const s of sessions) {
    const aromaTags: string[] = (s as any).aroma_tags ?? [];
    const flavorTags: string[] = (s as any).flavor_tags ?? [];
    const family = TERPENE_FAMILIES[top.name];
    if (!family) continue;
    const hit = family.aromas.some((a) => aromaTags.includes(a)) ||
                family.flavors.some((f) => flavorTags.includes(f));
    if (!hit) continue;
    if (!intentCounts[s.intent]) intentCounts[s.intent] = { total: 0, positive: 0 };
    intentCounts[s.intent].total++;
    if (s.outcome === "positive") intentCounts[s.intent].positive++;
  }

  const bestIntent = Object.entries(intentCounts)
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => (b[1].positive / b[1].total) - (a[1].positive / a[1].total))[0];

  if (bestIntent) {
    const intentLabel = bestIntent[0].replace("_", " ");
    const rate = Math.round((bestIntent[1].positive / bestIntent[1].total) * 100);
    insights.push({
      description: `${top.name}-associated profiles correlate with better ${intentLabel} sessions (${rate}% positive)`,
      confidence: conf,
    });
  }

  // Pairing insight
  if (preferred.length >= 2) {
    insights.push({
      description: `Based on your data, you tend to respond well to ${preferred[0].name} + ${preferred[1].name} profiles`,
      confidence: conf,
    });
  }

  return insights.slice(0, 3);
}

function buildWarnings(
  allSignals: TerpeneSignal[],
  sessions: SessionLog[]
): TerpeneWarning[] {
  const warnings: TerpeneWarning[] = [];
  const conf = getConfidence(sessions.length);

  // Find terpenes with low positive rate
  const problematic = allSignals
    .filter((s) => s.sessionCount >= 2 && s.positiveRate < 0.4)
    .sort((a, b) => a.positiveRate - b.positiveRate);

  for (const p of problematic.slice(0, 2)) {
    const negRate = Math.round((1 - p.positiveRate) * 100);
    if (p.name === "Myrcene" && p.positiveRate < 0.4) {
      warnings.push({
        description: `High ${p.name} products may increase sedation based on your sessions (${negRate}% mixed/negative)`,
        confidence: conf,
      });
    } else {
      warnings.push({
        description: `${p.name}-associated sessions show ${negRate}% mixed or negative outcomes`,
        confidence: conf,
      });
    }
  }

  return warnings;
}

/* ── Main export ─────────────────────────────────────────────────── */

export function computeTerpenePreferences(sessions: SessionLog[]): TerpenePreferenceResult {
  const n = sessions.length;
  const confidence = getConfidence(n);

  // Check if any sessions have sensory data
  const sessionsWithSensory = sessions.filter((s) => {
    const aromaTags: string[] = (s as any).aroma_tags ?? [];
    const flavorTags: string[] = (s as any).flavor_tags ?? [];
    return aromaTags.length > 0 || flavorTags.length > 0;
  });

  if (sessionsWithSensory.length < 2) {
    return {
      preferred: [],
      warnings: [],
      insights: [],
      confidence: "forming",
      dataSource: sessionsWithSensory.length === 0 ? "none" : "sensory",
      sessionCount: sessionsWithSensory.length,
    };
  }

  // Score all terpene families
  const allSignals: TerpeneSignal[] = [];
  for (const [name, family] of Object.entries(TERPENE_FAMILIES)) {
    const signal = scoreTerpeneFromTags(sessionsWithSensory, name, family);
    if (signal) allSignals.push(signal);
  }

  // Sort by score descending
  allSignals.sort((a, b) => b.score - a.score);

  const preferred = allSignals.filter((s) => s.positiveRate >= 0.5).slice(0, 4);
  const warnings = buildWarnings(allSignals, sessionsWithSensory);
  const insights = buildInsights(preferred, sessionsWithSensory);

  return {
    preferred,
    warnings,
    insights,
    confidence,
    dataSource: "sensory",
    sessionCount: sessionsWithSensory.length,
  };
}
