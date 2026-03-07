/**
 * Cannabis Genome — computes personal effect-response scores
 * from session history for radar-chart visualisation.
 */

import type { SessionLog } from "@/hooks/useSessionLogs";
import { computeConfidence, type ConfidenceLevel } from "./confidenceEngine";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GenomeDimension {
  key: string;
  label: string;
  /** 0–10 weighted score */
  score: number;
  /** Number of sessions contributing */
  sampleSize: number;
}

export interface CannabisGenome {
  dimensions: GenomeDimension[];
  confidence: ConfidenceLevel;
  confidenceScore: number;
  sessionCount: number;
  message: string;
}

/* ------------------------------------------------------------------ */
/*  Dimension definitions                                              */
/* ------------------------------------------------------------------ */

interface DimConfig {
  key: string;
  label: string;
  /** Extract a raw 0-10 value from a session, or null if no data */
  extract: (s: SessionLog) => number | null;
}

const DIMENSIONS: DimConfig[] = [
  {
    key: "focus",
    label: "Focus",
    extract: (s) => s.effect_focus,
  },
  {
    key: "relaxation",
    label: "Relaxation",
    extract: (s) => s.effect_relaxation,
  },
  {
    key: "creativity",
    label: "Creativity",
    // Creativity isn't a direct slider — proxy via euphoria + focus combo on creativity-intent sessions
    extract: (s) => {
      if (s.intent === "creativity") {
        const e = s.effect_euphoria ?? 0;
        const f = s.effect_focus ?? 0;
        return Math.min(10, Math.round((e + f) / 2));
      }
      // For non-creativity sessions, use euphoria as a loose proxy
      return s.effect_euphoria != null ? Math.round(s.effect_euphoria * 0.6) : null;
    },
  },
  {
    key: "anxiety",
    label: "Anxiety Control",
    // Invert: high anxiety = low control. Score = 10 - anxiety_level
    extract: (s) => s.effect_anxiety != null ? Math.max(0, 10 - s.effect_anxiety) : null,
  },
  {
    key: "sleep",
    label: "Sleep",
    extract: (s) => s.effect_sleepiness,
  },
  {
    key: "pain_relief",
    label: "Pain Relief",
    extract: (s) => s.effect_pain_relief,
  },
];

/* ------------------------------------------------------------------ */
/*  Confidence messages                                                */
/* ------------------------------------------------------------------ */

const MESSAGES: Record<ConfidenceLevel, string> = {
  Low: "Early picture — log more sessions to sharpen your genome.",
  Medium: "Your profile is taking shape. Patterns are becoming reliable.",
  High: "Strong signal — this is a dependable map of how cannabis affects you.",
};

/* ------------------------------------------------------------------ */
/*  Compute                                                            */
/* ------------------------------------------------------------------ */

const MIN_SESSIONS = 3;

export function computeCannabisGenome(sessions: SessionLog[]): CannabisGenome | null {
  if (sessions.length < MIN_SESSIONS) return null;

  const { confidenceScore, level } = computeConfidence(sessions);

  const dimensions: GenomeDimension[] = DIMENSIONS.map((dim) => {
    const values: number[] = [];
    for (const s of sessions) {
      const v = dim.extract(s);
      if (v != null) values.push(v);
    }

    if (values.length === 0) {
      return { key: dim.key, label: dim.label, score: 0, sampleSize: 0 };
    }

    // Weighted average: recent sessions matter more
    let weightedSum = 0;
    let weightTotal = 0;
    const sorted = [...values]; // already chronological from query
    sorted.forEach((v, i) => {
      const w = 1 + i * 0.15; // later = more weight
      weightedSum += v * w;
      weightTotal += w;
    });

    const score = Math.round((weightedSum / weightTotal) * 10) / 10;

    return {
      key: dim.key,
      label: dim.label,
      score: Math.min(10, Math.max(0, score)),
      sampleSize: values.length,
    };
  });

  return {
    dimensions,
    confidence: level,
    confidenceScore,
    sessionCount: sessions.length,
    message: MESSAGES[level],
  };
}
