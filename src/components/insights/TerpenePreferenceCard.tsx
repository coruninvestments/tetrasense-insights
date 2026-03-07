import { useMemo } from "react";
import { motion } from "framer-motion";
import { Leaf, TrendingUp, AlertTriangle, Sparkles, Loader2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import {
  computeTerpenePreferences,
  type TerpeneConfidence,
} from "@/lib/terpenePreferences";

const CONFIDENCE_CONFIG: Record<TerpeneConfidence, { label: string; className: string }> = {
  forming: { label: "Forming", className: "bg-muted text-muted-foreground" },
  low: { label: "Early Signal", className: "bg-warning/15 text-warning" },
  medium: { label: "Growing", className: "bg-info/15 text-info" },
  high: { label: "Strong Signal", className: "bg-success/15 text-success" },
};

export function TerpenePreferenceCard() {
  const { data: sessions, isLoading } = useSessionLogs();

  const result = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return computeTerpenePreferences(sessions);
  }, [sessions]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center justify-center h-28">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const conf = CONFIDENCE_CONFIG[result.confidence];
  const isForming = result.confidence === "forming";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card variant="glass">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Terpene Preferences
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isForming
                    ? "Add flavor & aroma data to unlock"
                    : `Based on ${result.sessionCount} sessions with sensory data`}
                </p>
              </div>
            </div>
            <Badge className={`shrink-0 text-[10px] font-medium border-0 ${conf.className}`}>
              {conf.label}
            </Badge>
          </div>

          {/* Forming state */}
          {isForming && (
            <div className="space-y-2">
              <Progress
                value={(result.sessionCount / 2) * 100}
                className="h-1.5"
              />
              <p className="text-xs text-muted-foreground">
                Log {2 - result.sessionCount} more session{2 - result.sessionCount !== 1 ? "s" : ""} with
                flavor &amp; aroma tags to start seeing terpene trends
              </p>
            </div>
          )}

          {/* Preferred terpenes */}
          {!isForming && result.preferred.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Your Top Terpenes
              </p>
              <div className="space-y-2">
                {result.preferred.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {Math.round(t.positiveRate * 100)}% positive across {t.sessionCount} sessions
                      </p>
                    </div>
                    <span className="text-xs font-medium text-primary shrink-0">
                      {t.score}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {!isForming && result.insights.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Observations
              </p>
              <ul className="space-y-1.5">
                {result.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{ins.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {!isForming && result.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Watch Patterns
              </p>
              <ul className="space-y-1.5">
                {result.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                    <span>{w.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No data fallback */}
          {!isForming && result.preferred.length === 0 && result.insights.length === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Not enough matching sensory data yet. Keep logging aroma and flavor tags to build your terpene profile.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
