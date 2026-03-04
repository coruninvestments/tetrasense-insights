import type { SessionLog } from "@/hooks/useSessionLogs";
import { normalizeOutcome, type SessionOutcome } from "@/lib/sessionOutcome";

export interface WhyBullet {
  title: string;
  evidence: string;
  type: "positive" | "warning";
}

export interface NextSuggestion {
  title: string;
  action: string;
  confidence: "low" | "med" | "high";
}

export interface SimilarSession {
  session: SessionLog;
  score: number;
}

export interface SessionReplay {
  why: WhyBullet[];
  next: NextSuggestion[];
  similar: SimilarSession[];
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function iqr(arr: number[]): { q1: number; q3: number } {
  const sorted = [...arr].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return { q1, q3 };
}

export function generateSessionReplay(
  session: SessionLog,
  allSessions: SessionLog[]
): SessionReplay {
  const outcome = normalizeOutcome(session.outcome);
  const why: WhyBullet[] = [];
  const next: NextSuggestion[] = [];

  // === DOSE ANALYSIS ===
  const positiveSessions = allSessions.filter(s => normalizeOutcome(s.outcome) === "positive" && s.dose_normalized_score != null);
  if (session.dose_normalized_score != null && positiveSessions.length >= 3) {
    const scores = positiveSessions.map(s => s.dose_normalized_score!);
    const { q1, q3 } = iqr(scores);
    const dns = session.dose_normalized_score;

    if (dns >= q1 && dns <= q3) {
      why.push({ title: "Dose in your sweet spot", evidence: "This dose matched the range where you typically have positive experiences.", type: "positive" });
    } else if (dns > q3) {
      why.push({ title: "Higher-than-usual dose", evidence: "This dose was above your typical positive range, which may have increased negative effects.", type: "warning" });
    } else if (dns < q1) {
      why.push({ title: "Lower-than-usual dose", evidence: "This dose was below your typical positive range — effects may have been too subtle.", type: "warning" });
    }
  }

  // === CAFFEINE + ANXIETY ===
  if (session.caffeine && (session.effect_anxiety ?? 0) > 5) {
    const caffAnxiety = allSessions.filter(s => s.caffeine && (s.effect_anxiety ?? 0) > 5);
    if (caffAnxiety.length >= 2) {
      why.push({ title: "Caffeine may have amplified anxiety", evidence: `In ${caffAnxiety.length} of your sessions with caffeine, anxiety was elevated.`, type: "warning" });
    }
  }

  // === SLEEP QUALITY ===
  if (session.sleep_quality === "poor" && outcome !== "positive") {
    why.push({ title: "Poor sleep before this session", evidence: "Sessions after poor sleep tend to have less favorable outcomes in your data.", type: "warning" });
  }

  // === TIME OF DAY ===
  if (session.time_of_day && session.intent) {
    const sameIntent = allSessions.filter(s => s.intent === session.intent && s.time_of_day);
    if (sameIntent.length >= 3) {
      const byTod = new Map<string, { pos: number; total: number }>();
      for (const s of sameIntent) {
        const entry = byTod.get(s.time_of_day!) ?? { pos: 0, total: 0 };
        entry.total++;
        if (normalizeOutcome(s.outcome) === "positive") entry.pos++;
        byTod.set(s.time_of_day!, entry);
      }
      const thisTod = byTod.get(session.time_of_day);
      if (thisTod && thisTod.total >= 2) {
        const rate = thisTod.pos / thisTod.total;
        if (rate >= 0.7) {
          why.push({ title: `${session.time_of_day} works well for ${session.intent}`, evidence: `${Math.round(rate * 100)}% of your ${session.time_of_day} ${session.intent} sessions were positive.`, type: "positive" });
        } else if (rate <= 0.3) {
          why.push({ title: `${session.time_of_day} may not suit ${session.intent}`, evidence: `Only ${Math.round(rate * 100)}% of your ${session.time_of_day} ${session.intent} sessions were positive.`, type: "warning" });
        }
      }
    }
  }

  // === STRAIN PERFORMANCE ===
  const strainSessions = allSessions.filter(s => s.strain_name_text === session.strain_name_text);
  if (strainSessions.length >= 3) {
    const posRate = strainSessions.filter(s => normalizeOutcome(s.outcome) === "positive").length / strainSessions.length;
    if (posRate >= 0.65) {
      why.push({ title: "This strain tends to work for you", evidence: `${Math.round(posRate * 100)}% of your sessions with ${session.strain_name_text} were positive.`, type: "positive" });
    } else if (posRate <= 0.3) {
      why.push({ title: "This strain has mixed results for you", evidence: `Only ${Math.round(posRate * 100)}% of your ${session.strain_name_text} sessions were positive.`, type: "warning" });
    }
  }

  // === METHOD PERFORMANCE ===
  const methodSessions = allSessions.filter(s => s.method === session.method && s.intent === session.intent);
  if (methodSessions.length >= 3) {
    const posRate = methodSessions.filter(s => normalizeOutcome(s.outcome) === "positive").length / methodSessions.length;
    if (posRate >= 0.65) {
      why.push({ title: `${session.method} works well for ${session.intent}`, evidence: `${Math.round(posRate * 100)}% positive outcome rate with this method + intent.`, type: "positive" });
    }
  }

  // === FALLBACK ===
  if (why.length === 0) {
    if (outcome === "positive") {
      why.push({ title: "Solid session", evidence: "Your effects were favorable with manageable side effects.", type: "positive" });
    } else if (outcome === "negative") {
      why.push({ title: "Something was off", evidence: "Negative effects outweighed positives. More sessions will help identify the pattern.", type: "warning" });
    } else {
      why.push({ title: "Middle ground", evidence: "Effects were mixed. Log more sessions with context to sharpen insights.", type: "positive" });
    }
  }

  // === NEXT TIME SUGGESTIONS ===
  if (outcome === "positive") {
    next.push({
      title: "Repeat this recipe",
      action: `Same ${session.dose_level ?? "dose"} dose${session.time_of_day ? `, ${session.time_of_day}` : ""}${session.setting ? `, ${session.setting}` : ""}.`,
      confidence: strainSessions.length >= 3 ? "high" : "med",
    });
  } else {
    // Dose suggestion
    if (session.dose_normalized_score != null && positiveSessions.length >= 2) {
      const med = median(positiveSessions.map(s => s.dose_normalized_score!));
      if (session.dose_normalized_score > med) {
        next.push({ title: "Try a lower dose", action: "Your positive sessions tend to use a lower dose range.", confidence: "med" });
      }
    }

    // Caffeine
    if (session.caffeine) {
      next.push({ title: "Skip the caffeine", action: "Try a session without caffeine to see if anxiety decreases.", confidence: "med" });
    }

    // Setting
    if (session.setting && ["social", "public"].includes(session.setting)) {
      const homeSessions = allSessions.filter(s => s.intent === session.intent && ["home", "alone"].includes(s.setting ?? ""));
      const homePos = homeSessions.filter(s => normalizeOutcome(s.outcome) === "positive").length;
      if (homeSessions.length >= 2 && homePos / homeSessions.length > 0.5) {
        next.push({ title: "Try a calmer setting", action: "Your data suggests home/alone settings yield better outcomes for this intent.", confidence: "med" });
      }
    }

    // Time of day
    if (session.time_of_day === "night" && session.intent) {
      const daySessions = allSessions.filter(s => s.intent === session.intent && s.time_of_day && s.time_of_day !== "night");
      const dayPos = daySessions.filter(s => normalizeOutcome(s.outcome) === "positive").length;
      if (daySessions.length >= 2 && dayPos / daySessions.length > 0.5) {
        next.push({ title: "Try earlier in the day", action: "Your non-night sessions for this intent tend to go better.", confidence: "low" });
      }
    }
  }

  // Fallback next
  if (next.length === 0) {
    next.push({ title: "Keep logging", action: "More sessions with context will unlock sharper suggestions.", confidence: "low" });
  }

  // === SIMILAR SESSIONS ===
  const similar: SimilarSession[] = allSessions
    .filter(s => s.id !== session.id)
    .map(s => {
      let score = 0;
      if (s.intent === session.intent) score += 3;
      if (s.strain_name_text === session.strain_name_text) score += 3;
      if (s.method === session.method) score += 2;
      if (
        s.dose_normalized_score != null &&
        session.dose_normalized_score != null &&
        Math.abs(s.dose_normalized_score - session.dose_normalized_score) / Math.max(session.dose_normalized_score, 1) <= 0.15
      ) {
        score += 2;
      }
      if (s.time_of_day === session.time_of_day) score += 1;
      return { session: s, score };
    })
    .filter(s => s.score >= 3)
    .sort((a, b) => b.score - a.score || new Date(b.session.created_at).getTime() - new Date(a.session.created_at).getTime())
    .slice(0, 5);

  return { why, next, similar };
}

/** Extract top positive and negative effects from a session */
export function getKeyEffects(session: SessionLog) {
  const positives = [
    { name: "Relaxation", value: session.effect_relaxation ?? 0 },
    { name: "Focus", value: session.effect_focus ?? 0 },
    { name: "Euphoria", value: session.effect_euphoria ?? 0 },
    { name: "Pain Relief", value: session.effect_pain_relief ?? 0 },
    { name: "Sleepiness", value: session.effect_sleepiness ?? 0 },
  ].filter(e => e.value > 0).sort((a, b) => b.value - a.value);

  const negatives = [
    { name: "Anxiety", value: session.effect_anxiety ?? 0 },
    { name: "Dry Mouth", value: session.effect_dry_mouth ?? 0 },
    { name: "Dry Eyes", value: session.effect_dry_eyes ?? 0 },
    { name: "Throat Irritation", value: session.effect_throat_irritation ?? 0 },
    { name: "Body Heaviness", value: session.effect_body_heaviness ?? 0 },
  ].filter(e => e.value > 0).sort((a, b) => b.value - a.value);

  return {
    top3Positive: positives.slice(0, 3),
    top2Negative: negatives.slice(0, 2),
  };
}
