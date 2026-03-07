/**
 * Community Insights Engine
 *
 * Aggregates anonymized community_strain_stats data into
 * actionable trend insights — no user identifiers involved.
 */

import type { CommunityStrainStat } from "@/hooks/useCommunityStrainStats";

/* ── Types ── */

export interface RankedStrain {
  strainName: string;
  strainType: string;
  positivePct: number;
  sampleSize: number;
}

export interface TerpineCombination {
  effects: string[];
  strainCount: number;
  avgPositive: number;
}

export interface CommunityInsightsResult {
  topFocusStrains: RankedStrain[];
  topSleepStrains: RankedStrain[];
  topRelaxStrains: RankedStrain[];
  topOverall: RankedStrain[];
  anxietyTriggers: string[];
  bestDoseInsight: string;
  topEffectCombos: TerpineCombination[];
  totalSamples: number;
  totalStrains: number;
}

const MIN_SAMPLE = 1; // minimum sample size to include

export function computeCommunityInsights(
  stats: CommunityStrainStat[],
): CommunityInsightsResult {
  const validStats = stats.filter(s => s.sample_size >= MIN_SAMPLE);
  const totalSamples = validStats.reduce((sum, s) => sum + s.sample_size, 0);
  const uniqueStrains = new Set(validStats.map(s => s.strain_name));

  // ── Top strains by intent ──
  const topFocusStrains = rankByIntent(validStats, "focus");
  const topSleepStrains = rankByIntent(validStats, "sleep");
  const topRelaxStrains = rankByIntent(validStats, "relaxation");

  // ── Top overall (across all intents) ──
  const strainAgg = new Map<string, { type: string; posPct: number[]; samples: number }>();
  for (const s of validStats) {
    const entry = strainAgg.get(s.strain_name) ?? { type: s.strain_type, posPct: [], samples: 0 };
    if (s.outcome_positive_pct != null) entry.posPct.push(s.outcome_positive_pct);
    entry.samples += s.sample_size;
    strainAgg.set(s.strain_name, entry);
  }
  const topOverall = [...strainAgg.entries()]
    .map(([name, v]) => ({
      strainName: name,
      strainType: v.type,
      positivePct: v.posPct.length > 0 ? Math.round(v.posPct.reduce((a, b) => a + b, 0) / v.posPct.length) : 0,
      sampleSize: v.samples,
    }))
    .sort((a, b) => b.positivePct - a.positivePct || b.sampleSize - a.sampleSize)
    .slice(0, 8);

  // ── Anxiety triggers (effects that appear in low-positive strains) ──
  const anxietyTriggers = findAnxietyTriggers(validStats);

  // ── Top effect combinations ──
  const topEffectCombos = findTopEffectCombos(validStats);

  // ── Best dose insight ──
  const bestDoseInsight = deriveDoseInsight(validStats);

  return {
    topFocusStrains,
    topSleepStrains,
    topRelaxStrains,
    topOverall,
    anxietyTriggers,
    bestDoseInsight,
    topEffectCombos,
    totalSamples,
    totalStrains: uniqueStrains.size,
  };
}

/* ── Helpers ── */

function rankByIntent(stats: CommunityStrainStat[], intent: string): RankedStrain[] {
  return stats
    .filter(s => s.intent === intent && s.outcome_positive_pct != null)
    .sort((a, b) => (b.outcome_positive_pct ?? 0) - (a.outcome_positive_pct ?? 0) || b.sample_size - a.sample_size)
    .slice(0, 6)
    .map(s => ({
      strainName: s.strain_name,
      strainType: s.strain_type,
      positivePct: Math.round(s.outcome_positive_pct ?? 0),
      sampleSize: s.sample_size,
    }));
}

function findAnxietyTriggers(stats: CommunityStrainStat[]): string[] {
  // Find effects that commonly appear alongside higher avoid rates
  const effectAvoid = new Map<string, { avoidSum: number; count: number }>();
  for (const s of stats) {
    if (!s.outcome_avoid_pct || s.outcome_avoid_pct < 20) continue;
    for (const eff of s.top_effects) {
      const entry = effectAvoid.get(eff) ?? { avoidSum: 0, count: 0 };
      entry.avoidSum += s.outcome_avoid_pct;
      entry.count++;
      effectAvoid.set(eff, entry);
    }
  }

  return [...effectAvoid.entries()]
    .filter(([, v]) => v.count >= 1)
    .sort((a, b) => (b[1].avoidSum / b[1].count) - (a[1].avoidSum / a[1].count))
    .slice(0, 5)
    .map(([eff]) => formatEffect(eff));
}

function findTopEffectCombos(stats: CommunityStrainStat[]): TerpineCombination[] {
  const comboMap = new Map<string, { effects: string[]; count: number; posSum: number }>();
  for (const s of stats) {
    if (s.top_effects.length < 2) continue;
    const key = s.top_effects.slice(0, 3).sort().join("+");
    const entry = comboMap.get(key) ?? { effects: s.top_effects.slice(0, 3), count: 0, posSum: 0 };
    entry.count++;
    entry.posSum += s.outcome_positive_pct ?? 0;
    comboMap.set(key, entry);
  }

  return [...comboMap.values()]
    .filter(c => c.count >= 1)
    .sort((a, b) => (b.posSum / b.count) - (a.posSum / a.count))
    .slice(0, 5)
    .map(c => ({
      effects: c.effects.map(formatEffect),
      strainCount: c.count,
      avgPositive: Math.round(c.posSum / c.count),
    }));
}

function deriveDoseInsight(stats: CommunityStrainStat[]): string {
  // Since community stats don't track dose directly, derive from outcomes
  const highPos = stats.filter(s => (s.outcome_positive_pct ?? 0) >= 70);
  if (highPos.length === 0) return "Not enough community data for dose insights yet";

  const avgSample = Math.round(highPos.reduce((s, v) => s + v.sample_size, 0) / highPos.length);
  return `Community's most successful strains average ${avgSample} sessions — consistency matters`;
}

function formatEffect(e: string): string {
  return e
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}
