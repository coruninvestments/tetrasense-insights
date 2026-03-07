/**
 * Deep Insight Reports — premium-only advanced pattern analysis.
 * Generates dose-optimisation, terpene-correlation, anxiety-risk,
 * and sleep-interaction reports from local session history.
 */

import type { Tables } from "@/integrations/supabase/types";

type SessionLog = Tables<"session_logs">;

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export interface DeepInsightBullet {
  label: string;
  value: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface DeepInsightReport {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  bullets: DeepInsightBullet[];
  recommendation: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function positiveOutcome(s: SessionLog) {
  return s.outcome === "positive" || (s.comfort_score ?? 0) >= 7;
}

function negativeOutcome(s: SessionLog) {
  return s.outcome === "negative" || (s.comfort_score ?? 0) <= 3;
}

function pct(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

function doseLabel(level: string | null | undefined): string {
  if (!level) return "unspecified";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Report generators                                                  */
/* ------------------------------------------------------------------ */

function doseOptimisation(sessions: SessionLog[]): DeepInsightReport {
  const byLevel: Record<string, { pos: number; neg: number; total: number }> = {};

  for (const s of sessions) {
    const lvl = s.dose_level ?? "unspecified";
    if (!byLevel[lvl]) byLevel[lvl] = { pos: 0, neg: 0, total: 0 };
    byLevel[lvl].total++;
    if (positiveOutcome(s)) byLevel[lvl].pos++;
    if (negativeOutcome(s)) byLevel[lvl].neg++;
  }

  const entries = Object.entries(byLevel).filter(([, v]) => v.total >= 2);
  const best = entries.sort((a, b) => pct(b[1].pos, b[1].total) - pct(a[1].pos, a[1].total))[0];
  const worst = entries.sort((a, b) => pct(b[1].neg, b[1].total) - pct(a[1].neg, a[1].total))[0];

  const bullets: DeepInsightBullet[] = entries.map(([lvl, v]) => ({
    label: `${doseLabel(lvl)} dose`,
    value: `${pct(v.pos, v.total)}% positive (${v.total} sessions)`,
    sentiment: pct(v.pos, v.total) >= 60 ? "positive" : pct(v.neg, v.total) >= 40 ? "negative" : "neutral",
  }));

  const bestName = best ? doseLabel(best[0]) : "—";
  const worstName = worst ? doseLabel(worst[0]) : "—";

  return {
    id: "dose-optimisation",
    title: "Dose Optimisation",
    emoji: "💊",
    summary: best
      ? `Your ${bestName.toLowerCase()} dose has the highest success rate across ${best[1].total} sessions.`
      : "Not enough data yet to determine optimal dose.",
    bullets,
    recommendation: worst && worst[1].neg >= 2
      ? `Consider reducing frequency of ${worstName.toLowerCase()} doses — they show a ${pct(worst[1].neg, worst[1].total)}% negative rate.`
      : `Keep logging to refine your dose sweet-spot.`,
  };
}

function terpeneCorrelation(sessions: SessionLog[]): DeepInsightReport {
  const terpMap: Record<string, { pos: number; neg: number; total: number }> = {};
  const TERP_KEYWORDS: Record<string, string> = {
    pine: "Pinene", citrus: "Limonene", lemon: "Limonene", orange: "Limonene",
    lavender: "Linalool", floral: "Linalool", mango: "Myrcene", earthy: "Myrcene",
    herbal: "Myrcene", pepper: "Caryophyllene", spicy: "Caryophyllene", woody: "Humulene",
    hoppy: "Humulene", berry: "Terpinolene", fruity: "Terpinolene", sweet: "Ocimene",
  };

  for (const s of sessions) {
    const tags = [...(s.aroma_tags ?? []), ...(s.flavor_tags ?? [])];
    const terps = new Set<string>();
    for (const tag of tags) {
      const low = tag.toLowerCase();
      for (const [kw, terp] of Object.entries(TERP_KEYWORDS)) {
        if (low.includes(kw)) terps.add(terp);
      }
    }
    for (const t of terps) {
      if (!terpMap[t]) terpMap[t] = { pos: 0, neg: 0, total: 0 };
      terpMap[t].total++;
      if (positiveOutcome(s)) terpMap[t].pos++;
      if (negativeOutcome(s)) terpMap[t].neg++;
    }
  }

  const sorted = Object.entries(terpMap)
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => pct(b[1].pos, b[1].total) - pct(a[1].pos, a[1].total));

  const bullets: DeepInsightBullet[] = sorted.slice(0, 5).map(([name, v]) => ({
    label: name,
    value: `${pct(v.pos, v.total)}% positive (${v.total} sessions)`,
    sentiment: pct(v.pos, v.total) >= 60 ? "positive" : pct(v.neg, v.total) >= 40 ? "negative" : "neutral",
  }));

  const topTerp = sorted[0];

  return {
    id: "terpene-correlation",
    title: "Terpene Correlation",
    emoji: "🌿",
    summary: topTerp
      ? `${topTerp[0]} correlates with your best outcomes at ${pct(topTerp[1].pos, topTerp[1].total)}% positive.`
      : "Log sessions with aroma/flavor tags to unlock terpene analysis.",
    bullets,
    recommendation: topTerp
      ? `Seek strains high in ${topTerp[0]} for consistent results.`
      : "Add aroma and flavor tags to your sessions for richer terpene data.",
  };
}

function anxietyRisk(sessions: SessionLog[]): DeepInsightReport {
  const highAnxiety = sessions.filter((s) => (s.effect_anxiety ?? 0) >= 6);
  const lowAnxiety = sessions.filter((s) => (s.effect_anxiety ?? 0) <= 2);

  const bullets: DeepInsightBullet[] = [];

  // Dose correlation
  const highDoseAnxious = highAnxiety.filter((s) => s.dose_level === "high").length;
  if (highAnxiety.length >= 2) {
    bullets.push({
      label: "High-dose link",
      value: `${pct(highDoseAnxious, highAnxiety.length)}% of anxious sessions used high dose`,
      sentiment: highDoseAnxious > highAnxiety.length / 2 ? "negative" : "neutral",
    });
  }

  // Caffeine correlation
  const caffeineAnxious = highAnxiety.filter((s) => s.caffeine).length;
  if (caffeineAnxious >= 2) {
    bullets.push({
      label: "Caffeine trigger",
      value: `${caffeineAnxious} anxious sessions had caffeine`,
      sentiment: "negative",
    });
  }

  // Stress correlation
  const stressAnxious = highAnxiety.filter((s) => s.stress_before === "high").length;
  if (stressAnxious >= 2) {
    bullets.push({
      label: "Pre-stress link",
      value: `${stressAnxious} anxious sessions started stressed`,
      sentiment: "negative",
    });
  }

  // Safe zone
  if (lowAnxiety.length >= 2) {
    const commonDose = lowAnxiety.reduce<Record<string, number>>((acc, s) => {
      const d = s.dose_level ?? "unspecified";
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {});
    const safeDose = Object.entries(commonDose).sort((a, b) => b[1] - a[1])[0];
    if (safeDose) {
      bullets.push({
        label: "Safe zone",
        value: `${doseLabel(safeDose[0])} dose — ${safeDose[1]} calm sessions`,
        sentiment: "positive",
      });
    }
  }

  return {
    id: "anxiety-risk",
    title: "Anxiety Risk Analysis",
    emoji: "⚡",
    summary: highAnxiety.length >= 2
      ? `${highAnxiety.length} of ${sessions.length} sessions showed elevated anxiety.`
      : "Your anxiety levels have been generally low — great pattern!",
    bullets,
    recommendation: highAnxiety.length >= 2
      ? "Try lower doses in calm settings to reduce anxiety triggers."
      : "Keep up your current approach — your comfort levels are strong.",
  };
}

function sleepInteraction(sessions: SessionLog[]): DeepInsightReport {
  const sleepIntent = sessions.filter((s) => s.intent === "sleep");
  const withSleepQuality = sessions.filter((s) => s.sleep_quality);

  const bullets: DeepInsightBullet[] = [];

  // Sleep-intent success rate
  if (sleepIntent.length >= 2) {
    const posRate = pct(sleepIntent.filter(positiveOutcome).length, sleepIntent.length);
    bullets.push({
      label: "Sleep sessions",
      value: `${posRate}% positive across ${sleepIntent.length} sessions`,
      sentiment: posRate >= 60 ? "positive" : posRate <= 40 ? "negative" : "neutral",
    });
  }

  // Prior sleep quality impact
  const goodSleep = withSleepQuality.filter((s) => s.sleep_quality === "good" || s.sleep_quality === "great");
  const poorSleep = withSleepQuality.filter((s) => s.sleep_quality === "poor" || s.sleep_quality === "bad");

  if (goodSleep.length >= 2) {
    const posRate = pct(goodSleep.filter(positiveOutcome).length, goodSleep.length);
    bullets.push({
      label: "Well-rested sessions",
      value: `${posRate}% positive outcomes`,
      sentiment: posRate >= 60 ? "positive" : "neutral",
    });
  }

  if (poorSleep.length >= 2) {
    const negRate = pct(poorSleep.filter(negativeOutcome).length, poorSleep.length);
    bullets.push({
      label: "Sleep-deprived sessions",
      value: `${negRate}% negative outcomes`,
      sentiment: negRate >= 40 ? "negative" : "neutral",
    });
  }

  // Evening vs other times
  const evening = sessions.filter((s) => s.time_of_day === "evening" || s.time_of_day === "night");
  if (evening.length >= 2) {
    const posRate = pct(evening.filter(positiveOutcome).length, evening.length);
    bullets.push({
      label: "Evening sessions",
      value: `${posRate}% positive (${evening.length} sessions)`,
      sentiment: posRate >= 60 ? "positive" : "neutral",
    });
  }

  return {
    id: "sleep-interaction",
    title: "Sleep Interaction",
    emoji: "🌙",
    summary: sleepIntent.length >= 2
      ? `Analysed ${sleepIntent.length} sleep-intent sessions and ${withSleepQuality.length} sessions with sleep context.`
      : "Log more sleep-focused sessions to unlock deeper analysis.",
    bullets,
    recommendation: poorSleep.length >= 2
      ? "Poor prior sleep correlates with worse outcomes — consider timing sessions after rest."
      : "Your sleep-related patterns look healthy. Keep logging for sharper insights.",
  };
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

const MIN_SESSIONS = 5;

export function generateDeepInsights(sessions: SessionLog[]): DeepInsightReport[] | null {
  if (sessions.length < MIN_SESSIONS) return null;

  return [
    doseOptimisation(sessions),
    terpeneCorrelation(sessions),
    anxietyRisk(sessions),
    sleepInteraction(sessions),
  ];
}
