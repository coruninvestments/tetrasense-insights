import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  predictOutcome,
  type PredictionInput,
  type PredictionConfidence,
} from "@/lib/outcomePrediction";
import type { SessionLog } from "@/hooks/useSessionLogs";

const CONFIDENCE_STYLE: Record<PredictionConfidence, { label: string; className: string }> = {
  forming: { label: "Forming", className: "bg-muted text-muted-foreground" },
  low: { label: "Low", className: "bg-warning/15 text-warning" },
  medium: { label: "Medium", className: "bg-info/15 text-info" },
  high: { label: "High", className: "bg-success/15 text-success" },
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-success";
  if (score >= 45) return "text-warning";
  return "text-destructive";
}

function progressColor(score: number): string {
  if (score >= 70) return "[&>div]:bg-success";
  if (score >= 45) return "[&>div]:bg-warning";
  return "[&>div]:bg-destructive";
}

interface OutcomePredictionCardProps {
  input: PredictionInput;
  sessions: SessionLog[];
}

export function OutcomePredictionCard({ input, sessions }: OutcomePredictionCardProps) {
  const prediction = useMemo(
    () => predictOutcome(input, sessions),
    [input, sessions]
  );

  const conf = CONFIDENCE_STYLE[prediction.confidence];
  const isForming = prediction.confidence === "forming";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${prediction.score}-${prediction.confidence}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
      >
        <Card variant="glass">
          <CardContent className="p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">Outcome Prediction</p>
                  {!isForming && (
                    <p className={`text-lg font-serif font-medium leading-tight ${scoreColor(prediction.score)}`}>
                      {prediction.score}%
                    </p>
                  )}
                </div>
              </div>
              <Badge className={`shrink-0 text-[10px] font-medium border-0 ${conf.className}`}>
                {conf.label}
              </Badge>
            </div>

            {/* Progress bar */}
            {!isForming && (
              <Progress
                value={prediction.score}
                className={`h-1.5 ${progressColor(prediction.score)}`}
              />
            )}

            {/* Summary */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {prediction.summary}
            </p>

            {/* Positive signals */}
            {prediction.positiveSignals.length > 0 && (
              <ul className="space-y-1">
                {prediction.positiveSignals.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Warnings */}
            {prediction.warnings.length > 0 && (
              <ul className="space-y-1">
                {prediction.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
