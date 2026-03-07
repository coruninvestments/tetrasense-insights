import type { SessionLog, DoseLevel } from "@/hooks/useSessionLogs";

/* ── Types ───────────────────────────────────────────────────────── */

export type PredictionConfidence = "forming" | "low" | "medium" | "high";

export interface PredictionInput {
  strainName: string;
  strainId?: string | null;
  canonicalStrainId?: string | null;
  intent: string;
  method: string;
  doseLevel: DoseLevel;
  doseUnit?: string | null;
  doseCount?: number | null;
  timeOfDay?: string | null;
  sleepQuality?: string | null;
  caffeine?: boolean;
  moodBefore?: string | null;
  stressBefore?: string | null;
  stomach?: string | null;
}

export interface PredictionResult {
  score: number;           // 0-100 likelihood of positive outcome
  confidence: PredictionConfidence;
  summary: string;
  warnings: string[];
  positiveSignals: string[];
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function getConfidence(matchCount: number): PredictionConfidence {
  if (matchCount < 3) return "forming";
  if (matchCount < 5) return "low";
  if (matchCount < 10) return "medium";
  return "high";
}

function positiveRate(sessions: SessionLog[]): number {
  if (sessions.length === 0) return 0.5;
  return sessions.filter((s) => s.outcome === "positive").length / sessions.length;
}

function matchScore(session: SessionLog, input: PredictionInput): number {
  let score = 0;
  let maxScore = 0;

  // Strain match (strongest signal)
  maxScore += 30;
  if (input.canonicalStrainId && session.canonical_strain_id === input.canonicalStrainId) {
    score += 30;
  } else if (session.strain_name_text.toLowerCase() === input.strainName.toLowerCase()) {
    score += 25;
  }

  // Intent match
  maxScore += 25;
  if (session.intent === input.intent) score += 25;

  // Method match
  maxScore += 15;
  if (session.method === input.method) score += 15;

  // Dose level match
  maxScore += 15;
  if (session.dose_level === input.doseLevel) score += 15;
  else if (
    (session.dose_level === "medium" && input.doseLevel !== "high") ||
    (input.doseLevel === "medium" && session.dose_level !== "high")
  ) {
    score += 8; // adjacent dose
  }

  // Context matches (weaker signals)
  if (input.timeOfDay && session.time_of_day) {
    maxScore += 5;
    if (session.time_of_day === input.timeOfDay) score += 5;
  }
  if (input.caffeine !== undefined && session.caffeine !== undefined) {
    maxScore += 5;
    if (session.caffeine === input.caffeine) score += 5;
  }
  if (input.stressBefore && session.stress_before) {
    maxScore += 5;
    if (session.stress_before === input.stressBefore) score += 5;
  }

  return maxScore > 0 ? score / maxScore : 0;
}

/* ── Warning detection ───────────────────────────────────────────── */

function detectWarnings(
  input: PredictionInput,
  similar: SessionLog[],
  allSessions: SessionLog[]
): string[] {
  const warnings: string[] = [];

  // Caffeine + anxiety pattern
  if (input.caffeine) {
    const cafSessions = allSessions.filter((s) => s.caffeine);
    if (cafSessions.length >= 2) {
      const avgAnxiety =
        cafSessions.reduce((a, s) => a + (s.effect_anxiety ?? 0), 0) / cafSessions.length;
      const noCafSessions = allSessions.filter((s) => !s.caffeine && s.effect_anxiety !== null);
      const avgAnxietyNoCaf =
        noCafSessions.length > 0
          ? noCafSessions.reduce((a, s) => a + (s.effect_anxiety ?? 0), 0) / noCafSessions.length
          : 0;
      if (avgAnxiety >= 5 && avgAnxiety > avgAnxietyNoCaf + 1.5) {
        warnings.push("Caffeine has been associated with higher anxiety in your past sessions");
      }
    }
  }

  // Dose above usual positive range
  const positiveSessions = allSessions.filter(
    (s) => s.outcome === "positive" && s.intent === input.intent
  );
  if (positiveSessions.length >= 3) {
    const doseMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const avgPosDose =
      positiveSessions.reduce((a, s) => a + (doseMap[s.dose_level ?? "medium"] ?? 2), 0) /
      positiveSessions.length;
    const inputDose = doseMap[input.doseLevel] ?? 2;
    if (inputDose > avgPosDose + 0.5) {
      warnings.push("This dose is above your usual positive range for this intent");
    }
  }

  // Low sleep + session pattern
  if (input.sleepQuality === "poor") {
    const poorSleepSessions = allSessions.filter((s) => s.sleep_quality === "poor");
    if (poorSleepSessions.length >= 2) {
      const negRate =
        poorSleepSessions.filter((s) => s.outcome === "negative").length / poorSleepSessions.length;
      if (negRate >= 0.5) {
        warnings.push("Poor sleep has correlated with less favorable outcomes in your history");
      }
    }
  }

  // High stress pattern
  if (input.stressBefore === "high") {
    const stressSessions = allSessions.filter((s) => s.stress_before === "high");
    if (stressSessions.length >= 2) {
      const negRate =
        stressSessions.filter((s) => s.outcome === "negative").length / stressSessions.length;
      if (negRate >= 0.4) {
        warnings.push("High pre-session stress has been linked to mixed outcomes for you");
      }
    }
  }

  // Empty stomach pattern
  if (input.stomach === "empty") {
    const emptySessions = allSessions.filter((s) => s.stomach === "empty");
    if (emptySessions.length >= 2) {
      const negRate =
        emptySessions.filter((s) => s.outcome === "negative").length / emptySessions.length;
      if (negRate >= 0.5) {
        warnings.push("Sessions on an empty stomach have tended toward negative outcomes");
      }
    }
  }

  return warnings.slice(0, 3);
}

/* ── Positive signal detection ───────────────────────────────────── */

function detectPositiveSignals(
  input: PredictionInput,
  similar: SessionLog[],
  allSessions: SessionLog[]
): string[] {
  const signals: string[] = [];

  // Good strain match
  const strainSessions = similar.filter(
    (s) =>
      s.strain_name_text.toLowerCase() === input.strainName.toLowerCase() ||
      (input.canonicalStrainId && s.canonical_strain_id === input.canonicalStrainId)
  );
  if (strainSessions.length >= 2) {
    const posRate = positiveRate(strainSessions);
    if (posRate >= 0.6) {
      signals.push(
        `${input.strainName} has a ${Math.round(posRate * 100)}% positive rate in your history`
      );
    }
  }

  // Good intent + method combo
  const comboSessions = allSessions.filter(
    (s) => s.intent === input.intent && s.method === input.method
  );
  if (comboSessions.length >= 2) {
    const posRate = positiveRate(comboSessions);
    if (posRate >= 0.65) {
      signals.push(
        `This setup matches some of your better ${input.intent.replace("_", " ")} sessions`
      );
    }
  }

  // Time of day correlation
  if (input.timeOfDay) {
    const todSessions = allSessions.filter(
      (s) => s.time_of_day === input.timeOfDay && s.intent === input.intent
    );
    if (todSessions.length >= 2) {
      const posRate = positiveRate(todSessions);
      if (posRate >= 0.7) {
        signals.push(
          `${input.timeOfDay.charAt(0).toUpperCase() + input.timeOfDay.slice(1)} sessions for ${input.intent.replace("_", " ")} tend to go well for you`
        );
      }
    }
  }

  // Dose sweet spot
  const doseSessions = allSessions.filter(
    (s) => s.dose_level === input.doseLevel && s.intent === input.intent
  );
  if (doseSessions.length >= 2) {
    const posRate = positiveRate(doseSessions);
    if (posRate >= 0.7) {
      signals.push(`${input.doseLevel} dose is in your sweet spot for this intent`);
    }
  }

  return signals.slice(0, 3);
}

/* ── Summary generation ──────────────────────────────────────────── */

function buildSummary(score: number, confidence: PredictionConfidence, input: PredictionInput): string {
  if (confidence === "forming") {
    return "Not enough similar sessions yet to make a reliable prediction";
  }

  const intent = input.intent.replace("_", " ");

  if (score >= 75) {
    return `Based on your history, this ${intent} setup looks promising`;
  }
  if (score >= 55) {
    return `This setup has shown mixed but leaning-positive results for ${intent}`;
  }
  if (score >= 35) {
    return `Similar setups have produced mixed results — consider adjusting`;
  }
  return `Past sessions with similar parameters have tended toward less favorable outcomes`;
}

/* ── Main export ─────────────────────────────────────────────────── */

export function predictOutcome(
  input: PredictionInput,
  allSessions: SessionLog[]
): PredictionResult {
  if (allSessions.length < 3) {
    return {
      score: 50,
      confidence: "forming",
      summary: "Log a few more sessions to unlock outcome predictions",
      warnings: [],
      positiveSignals: [],
    };
  }

  // Score similarity of each past session to the current input
  const scored = allSessions
    .map((s) => ({ session: s, similarity: matchScore(s, input) }))
    .filter((s) => s.similarity >= 0.3) // only reasonably similar
    .sort((a, b) => b.similarity - a.similarity);

  const similar = scored.map((s) => s.session);
  const confidence = getConfidence(similar.length);

  if (similar.length < 3) {
    return {
      score: 50,
      confidence: "forming",
      summary: "Not enough similar sessions to predict — keep logging",
      warnings: [],
      positiveSignals: [],
    };
  }

  // Weighted positive rate — more similar sessions weighted higher
  let weightedPositive = 0;
  let totalWeight = 0;
  for (const { session, similarity } of scored.slice(0, 20)) {
    const weight = similarity;
    weightedPositive += session.outcome === "positive" ? weight : 0;
    totalWeight += weight;
  }

  const rawScore = totalWeight > 0 ? (weightedPositive / totalWeight) * 100 : 50;
  const score = Math.round(Math.max(5, Math.min(95, rawScore)));

  const warnings = detectWarnings(input, similar, allSessions);
  const positiveSignals = detectPositiveSignals(input, similar, allSessions);
  const summary = buildSummary(score, confidence, input);

  return { score, confidence, summary, warnings, positiveSignals };
}
