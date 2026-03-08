import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeTolerance } from "@/lib/toleranceEngine";

export function ToleranceCard() {
  const { data: sessions } = useSessionLogs();
  const result = computeTolerance(sessions ?? []);

  if (!result.ready) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Tolerance</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Tolerance signal forming — log at least 3 sessions to begin tracking.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const TrendIcon =
    result.trend === "rising" ? TrendingUp :
    result.trend === "falling" ? TrendingDown : Minus;

  const trendColor =
    result.trend === "rising" ? "text-warning" :
    result.trend === "falling" ? "text-success" :
    "text-muted-foreground";

  const trendLabel =
    result.trend === "rising" ? "Rising" :
    result.trend === "falling" ? "Falling" : "Stable";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Tolerance</h3>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendLabel}</span>
              {result.trendDelta !== 0 && (
                <span className="text-muted-foreground">
                  ({result.trendDelta > 0 ? "+" : ""}{result.trendDelta}%)
                </span>
              )}
            </div>
          </div>

          {/* Score + Level */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="font-serif text-2xl font-medium text-foreground">
                {result.toleranceScore}
              </span>
              <span className="text-xs font-medium text-primary">
                {result.level}
              </span>
            </div>
            <Progress value={result.toleranceScore} className="h-2" />
          </div>

          {/* Reason */}
          {result.reasons.length > 0 && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {result.reasons[0]}
            </p>
          )}

          {/* Suggestion */}
          {result.suggestions.length > 0 && (
            <p className="text-xs text-primary/80 leading-relaxed">
              💡 {result.suggestions[0]}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
