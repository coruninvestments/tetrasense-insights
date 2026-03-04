import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { Skeleton } from "@/components/ui/skeleton";

function computeClarityScore(sessions: any[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const n = sessions.length;

  // 1. Positive outcome rate (0–1)
  const positiveCount = sessions.filter(s => normalizeOutcome(s.outcome) === "positive").length;
  const positiveRate = positiveCount / n;

  // 2. Dose consistency (inverse of std dev of dose_normalized_score, 0–1)
  const doses = sessions.map(s => s.dose_normalized_score).filter((d): d is number => d != null);
  let doseConsistency = 1;
  if (doses.length >= 2) {
    const mean = doses.reduce((a, b) => a + b, 0) / doses.length;
    const variance = doses.reduce((a, d) => a + (d - mean) ** 2, 0) / doses.length;
    const stdDev = Math.sqrt(variance);
    doseConsistency = Math.max(0, 1 - stdDev / 5); // normalize: stdDev of 5 → 0
  }

  // 3. Effect stability (avg inverse stddev across effect sliders, 0–1)
  const effectKeys = ["effect_relaxation", "effect_focus", "effect_euphoria", "effect_anxiety", "effect_pain_relief", "effect_sleepiness"] as const;
  const effectStabilities: number[] = [];
  for (const key of effectKeys) {
    const vals = sessions.map(s => s[key]).filter((v): v is number => v != null);
    if (vals.length >= 2) {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
      const stdDev = Math.sqrt(variance);
      effectStabilities.push(Math.max(0, 1 - stdDev / 4));
    }
  }
  const effectStability = effectStabilities.length > 0
    ? effectStabilities.reduce((a, b) => a + b, 0) / effectStabilities.length
    : 0.5;

  // 4. Session volume factor (ramp up to 1 at 10 sessions)
  const volumeFactor = Math.min(1, n / 10);

  // Weighted blend
  const raw = (positiveRate * 0.35 + doseConsistency * 0.2 + effectStability * 0.25 + volumeFactor * 0.2);
  return Math.round(raw * 100);
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent clarity";
  if (score >= 60) return "Building understanding";
  if (score >= 40) return "Getting started";
  return "Keep logging";
}

export function ClarityScoreCard() {
  const { data: sessions, isLoading } = useSessionLogs();

  const score = useMemo(() => computeClarityScore(sessions ?? []), [sessions]);
  const label = getScoreLabel(score);
  const hasData = (sessions?.length ?? 0) > 0;

  // SVG circle params
  const size = 100;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card><CardContent className="p-5"><Skeleton className="h-32 rounded-xl" /></CardContent></Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-5">
            {/* Circular progress */}
            <div className="relative flex-shrink-0 halo-focus">
              <svg width={size} height={size} className="-rotate-90">
                {/* Background track */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-2xl font-serif font-medium text-foreground leading-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {hasData ? `${score}%` : "—"}
                </motion.span>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-1">Clarity Score</h3>
              <p className="text-xs text-primary font-medium mb-1.5">{hasData ? label : "No data yet"}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your clarity score reflects how well you understand how cannabis interacts with your body.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
