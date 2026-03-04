import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionLogs, type SessionLog } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { InsightUnlockCard } from "./InsightUnlockCard";

interface DoseInsight {
  sweetSpotLow: number;
  sweetSpotHigh: number;
  sweetSpotSampleSize: number;
  highDoseWarning: boolean;
  highDoseNegRate: number;
  highDoseSampleSize: number;
}

function computeDoseInsight(sessions: SessionLog[]): DoseInsight | null {
  const scored = sessions.filter(
    (s) => (s as any).dose_normalized_score != null
  );
  if (scored.length < 5) return null;

  const positive = scored.filter((s) => normalizeOutcome(s.outcome) === "positive");
  if (positive.length < 2) return null;

  const posScores = positive.map((s) => (s as any).dose_normalized_score as number).sort((a, b) => a - b);

  // Find the interquartile range of positive sessions
  const q1Idx = Math.floor(posScores.length * 0.25);
  const q3Idx = Math.floor(posScores.length * 0.75);
  const sweetSpotLow = posScores[q1Idx];
  const sweetSpotHigh = posScores[q3Idx];

  // Check high dose warning (score >= 8)
  const highDose = scored.filter((s) => (s as any).dose_normalized_score >= 8);
  let highDoseWarning = false;
  let highDoseNegRate = 0;
  const highDoseSampleSize = highDose.length;

  if (highDose.length >= 2) {
    const negCount = highDose.filter((s) => normalizeOutcome(s.outcome) === "negative").length;
    highDoseNegRate = negCount / highDose.length;
    highDoseWarning = highDoseNegRate >= 0.4;
  }

  return {
    sweetSpotLow,
    sweetSpotHigh,
    sweetSpotSampleSize: positive.length,
    highDoseWarning,
    highDoseNegRate,
    highDoseSampleSize,
  };
}

export function DoseInsightsSection() {
  const { data: sessions, isLoading } = useSessionLogs();
  const sessionCount = sessions?.length ?? 0;

  const insight = useMemo(() => {
    if (!sessions) return null;
    return computeDoseInsight(sessions);
  }, [sessions]);

  if (isLoading) return null;

  if (!insight) {
    return (
      <InsightUnlockCard
        icon={Target}
        title="Log 5 sessions to find your dose sweet spot"
        subtitle="We'll identify your ideal dose range"
        current={sessionCount}
        target={5}
      />
    );
  }

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-foreground">
                Your dose sweet spot
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your best outcomes tend to happen around dose score{" "}
              <span className="font-semibold text-foreground">
                {insight.sweetSpotLow.toFixed(1)}–{insight.sweetSpotHigh.toFixed(1)}
              </span>
              /10
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              Based on {insight.sweetSpotSampleSize} positive sessions
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {insight.highDoseWarning && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">
                  High doses correlate with worse outcomes
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sessions with dose score ≥ 8 had{" "}
                <span className="font-semibold text-foreground">
                  {Math.round(insight.highDoseNegRate * 100)}%
                </span>{" "}
                negative outcomes ({insight.highDoseSampleSize} sessions).
              </p>
              <p className="text-[11px] text-muted-foreground mt-2">
                Consider staying in your sweet spot range — not medical advice
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
