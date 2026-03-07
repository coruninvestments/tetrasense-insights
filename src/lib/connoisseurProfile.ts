import type { SessionLog } from "@/hooks/useSessionLogs";

/* ── Types ───────────────────────────────────────────────────────── */

export type ConnoisseurConfidence = "forming" | "low" | "medium" | "high";

export interface ConnoisseurProfile {
  profileName: string;
  subtitle: string;
  strengths: string[];
  likelyPreferences: string[];
  likelyAvoids: string[];
  confidence: ConnoisseurConfidence;
  sessionCount: number;
}

/* ── Intent labels ───────────────────────────────────────────────── */

const INTENT_LABELS: Record<string, string> = {
  sleep: "Sleep",
  relaxation: "Relaxation",
  creativity: "Creativity",
  focus: "Focus",
  pain_relief: "Pain Relief",
  social: "Social",
  recreation: "Recreation",
  learning: "Learning",
};

const METHOD_LABELS: Record<string, string> = {
  smoke: "Smoking",
  vape: "Vaping",
  edible: "Edibles",
  tincture: "Tinctures",
  topical: "Topicals",
  other: "Other methods",
};

/* ── Profile archetypes ──────────────────────────────────────────── */

interface Archetype {
  name: string;
  subtitle: string;
  match: (ctx: AnalysisContext) => number; // 0-100 fit score
}

interface AnalysisContext {
  sessions: SessionLog[];
  topIntent: string;
  topIntentPct: number;
  topMethod: string;
  avgDoseLevel: string;
  positiveRate: number;
  uniqueStrains: number;
  avgEffects: Record<string, number>;
  hasMicrodose: boolean;
  eveningRate: number;
  highDoseRate: number;
}

const ARCHETYPES: Archetype[] = [
  {
    name: "Focus Seeker",
    subtitle: "Precision-driven, clarity-first",
    match: (c) => {
      let score = 0;
      if (c.topIntent === "focus" || c.topIntent === "learning") score += 50;
      if ((c.avgEffects.focus ?? 0) >= 6) score += 25;
      if (c.avgDoseLevel === "low" || c.avgDoseLevel === "medium") score += 15;
      if (c.positiveRate >= 0.6) score += 10;
      return score;
    },
  },
  {
    name: "Evening Relaxer",
    subtitle: "Wind-down specialist, calm curator",
    match: (c) => {
      let score = 0;
      if (c.topIntent === "relaxation" || c.topIntent === "sleep") score += 40;
      if (c.eveningRate >= 0.5) score += 30;
      if ((c.avgEffects.relaxation ?? 0) >= 6) score += 20;
      if ((c.avgEffects.sleepiness ?? 0) >= 5) score += 10;
      return score;
    },
  },
  {
    name: "Microdose Optimizer",
    subtitle: "Less is more, dialed in",
    match: (c) => {
      let score = 0;
      if (c.hasMicrodose || c.avgDoseLevel === "low") score += 45;
      if (c.positiveRate >= 0.7) score += 25;
      if (c.highDoseRate < 0.1) score += 20;
      if (c.topIntentPct >= 0.5) score += 10;
      return score;
    },
  },
  {
    name: "Flavor Hunter",
    subtitle: "Variety-driven, exploratory palate",
    match: (c) => {
      let score = 0;
      if (c.uniqueStrains >= 5) score += 40;
      else if (c.uniqueStrains >= 3) score += 20;
      if (c.topIntentPct < 0.5) score += 25; // diverse intents
      if (c.sessions.length >= 5) score += 15;
      if (c.positiveRate >= 0.5) score += 10;
      return score;
    },
  },
  {
    name: "Pain Manager",
    subtitle: "Comfort-oriented, relief-focused",
    match: (c) => {
      let score = 0;
      if (c.topIntent === "pain_relief") score += 50;
      if ((c.avgEffects.pain_relief ?? 0) >= 6) score += 30;
      if (c.positiveRate >= 0.5) score += 20;
      return score;
    },
  },
  {
    name: "Social Enhancer",
    subtitle: "Connection-minded, vibe curator",
    match: (c) => {
      let score = 0;
      if (c.topIntent === "social" || c.topIntent === "recreation") score += 45;
      if ((c.avgEffects.euphoria ?? 0) >= 6) score += 25;
      if (c.avgDoseLevel === "medium") score += 15;
      if (c.positiveRate >= 0.5) score += 15;
      return score;
    },
  },
  {
    name: "Creative Catalyst",
    subtitle: "Imagination-first, flow state seeker",
    match: (c) => {
      let score = 0;
      if (c.topIntent === "creativity") score += 50;
      if ((c.avgEffects.euphoria ?? 0) >= 5) score += 20;
      if ((c.avgEffects.focus ?? 0) >= 5) score += 15;
      if (c.positiveRate >= 0.5) score += 15;
      return score;
    },
  },
  {
    name: "Balanced Explorer",
    subtitle: "Versatile, data-curious",
    match: (c) => {
      let score = 30; // baseline fallback
      if (c.uniqueStrains >= 3) score += 15;
      if (c.positiveRate >= 0.5) score += 15;
      if (c.sessions.length >= 3) score += 10;
      return score;
    },
  },
];

/* ── Analysis helpers ────────────────────────────────────────────── */

function getTopEntry(counts: Record<string, number>): [string, number] {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0] ?? ["unknown", 0];
}

function buildContext(sessions: SessionLog[]): AnalysisContext {
  const intentCounts: Record<string, number> = {};
  const methodCounts: Record<string, number> = {};
  const doseCounts: Record<string, number> = {};
  let positiveCount = 0;
  let eveningCount = 0;
  let highDoseCount = 0;
  const effectSums: Record<string, number> = {
    sleepiness: 0, relaxation: 0, anxiety: 0,
    focus: 0, pain_relief: 0, euphoria: 0,
  };

  const strainSet = new Set<string>();

  for (const s of sessions) {
    intentCounts[s.intent] = (intentCounts[s.intent] || 0) + 1;
    methodCounts[s.method] = (methodCounts[s.method] || 0) + 1;
    const dl = s.dose_level || "medium";
    doseCounts[dl] = (doseCounts[dl] || 0) + 1;

    if (s.outcome === "positive") positiveCount++;
    if (s.time_of_day === "evening" || s.time_of_day === "night") eveningCount++;
    if (dl === "high") highDoseCount++;

    strainSet.add(s.strain_name_text.toLowerCase());

    effectSums.sleepiness += s.effect_sleepiness ?? 0;
    effectSums.relaxation += s.effect_relaxation ?? 0;
    effectSums.anxiety += s.effect_anxiety ?? 0;
    effectSums.focus += s.effect_focus ?? 0;
    effectSums.pain_relief += s.effect_pain_relief ?? 0;
    effectSums.euphoria += s.effect_euphoria ?? 0;
  }

  const n = sessions.length || 1;
  const avgEffects: Record<string, number> = {};
  for (const [k, v] of Object.entries(effectSums)) {
    avgEffects[k] = v / n;
  }

  const [topIntent, topIntentCount] = getTopEntry(intentCounts);
  const [topMethod] = getTopEntry(methodCounts);
  const [avgDoseLevel] = getTopEntry(doseCounts);

  const hasMicrodose = sessions.some(
    (s) => s.dose_level === "low" && (s.dose_amount_mg ?? 999) <= 5
  );

  return {
    sessions,
    topIntent,
    topIntentPct: topIntentCount / n,
    topMethod,
    avgDoseLevel,
    positiveRate: positiveCount / n,
    uniqueStrains: strainSet.size,
    avgEffects,
    hasMicrodose,
    eveningRate: eveningCount / n,
    highDoseRate: highDoseCount / n,
  };
}

/* ── Strengths / preferences / avoids ────────────────────────────── */

function buildStrengths(ctx: AnalysisContext): string[] {
  const strengths: string[] = [];
  const il = INTENT_LABELS[ctx.topIntent] || ctx.topIntent;

  if (ctx.topIntentPct >= 0.5) {
    strengths.push(`Strong alignment with ${il} sessions`);
  }

  if (ctx.positiveRate >= 0.7) {
    strengths.push("High positive outcome rate across sessions");
  } else if (ctx.positiveRate >= 0.5) {
    strengths.push("Majority of sessions end positively");
  }

  if (ctx.uniqueStrains >= 5) {
    strengths.push("Broad strain exploration — strong variety");
  } else if (ctx.uniqueStrains >= 3) {
    strengths.push("Growing strain repertoire");
  }

  // Effect-based strengths
  const topEffect = Object.entries(ctx.avgEffects)
    .filter(([k]) => k !== "anxiety")
    .sort((a, b) => b[1] - a[1])[0];

  if (topEffect && topEffect[1] >= 6) {
    const effectName = topEffect[0].replace("_", " ");
    strengths.push(`Consistently strong ${effectName} response`);
  }

  if (ctx.avgDoseLevel === "low" && ctx.positiveRate >= 0.6) {
    strengths.push("Effective at lower doses");
  }

  return strengths.slice(0, 3);
}

function buildPreferences(ctx: AnalysisContext): string[] {
  const prefs: string[] = [];
  const ml = METHOD_LABELS[ctx.topMethod] || ctx.topMethod;
  prefs.push(`Prefers ${ml.toLowerCase()}`);

  const il = INTENT_LABELS[ctx.topIntent] || ctx.topIntent;
  prefs.push(`Most common goal: ${il}`);

  if (ctx.eveningRate >= 0.5) {
    prefs.push("Tends toward evening sessions");
  } else if (ctx.eveningRate < 0.2 && ctx.sessions.length >= 3) {
    prefs.push("Tends toward daytime sessions");
  }

  return prefs.slice(0, 3);
}

function buildAvoids(ctx: AnalysisContext): string[] {
  const avoids: string[] = [];

  if ((ctx.avgEffects.anxiety ?? 0) >= 5) {
    avoids.push("Sessions often trigger elevated anxiety");
  }

  if (ctx.highDoseRate >= 0.4 && ctx.positiveRate < 0.5) {
    avoids.push("High doses correlate with mixed outcomes");
  }

  // Check for specific negative physical effects
  const negSessions = ctx.sessions.filter((s) => s.outcome === "negative");
  if (negSessions.length >= 2) {
    const negIntents: Record<string, number> = {};
    for (const s of negSessions) {
      negIntents[s.intent] = (negIntents[s.intent] || 0) + 1;
    }
    const [worstIntent, worstCount] = getTopEntry(negIntents);
    if (worstCount >= 2) {
      const il = INTENT_LABELS[worstIntent] || worstIntent;
      avoids.push(`${il} sessions tend toward negative outcomes`);
    }
  }

  if (avoids.length === 0 && ctx.sessions.length >= 3) {
    avoids.push("No strong negative patterns detected yet");
  }

  return avoids.slice(0, 2);
}

/* ── Confidence ──────────────────────────────────────────────────── */

function getConfidence(n: number): ConnoisseurConfidence {
  if (n < 3) return "forming";
  if (n < 5) return "low";
  if (n < 10) return "medium";
  return "high";
}

/* ── Main export ─────────────────────────────────────────────────── */

export function computeConnoisseurProfile(sessions: SessionLog[]): ConnoisseurProfile {
  const n = sessions.length;
  const confidence = getConfidence(n);

  if (n < 3) {
    return {
      profileName: "Profile Forming",
      subtitle: `${n}/3 sessions logged — keep going`,
      strengths: [],
      likelyPreferences: [],
      likelyAvoids: [],
      confidence,
      sessionCount: n,
    };
  }

  const ctx = buildContext(sessions);

  // Score all archetypes and pick best
  const scored = ARCHETYPES.map((a) => ({
    archetype: a,
    score: a.match(ctx),
  })).sort((a, b) => b.score - a.score);

  const best = scored[0].archetype;

  return {
    profileName: best.name,
    subtitle: best.subtitle,
    strengths: buildStrengths(ctx),
    likelyPreferences: buildPreferences(ctx),
    likelyAvoids: buildAvoids(ctx),
    confidence,
    sessionCount: n,
  };
}
