import { motion } from "framer-motion";
import { Signal, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeSignalStrength } from "@/lib/signalStrength";

export function SignalStrengthCard() {
  const { data: sessions } = useSessionLogs();

  if (!sessions || sessions.length === 0) return null;

  const { score, level, reasons, nextActions } = computeSignalStrength(sessions);

  // Meter color based on level
  const meterColor =
    level === "Strong Signal"
      ? "bg-primary"
      : level === "Forming Signal"
        ? "bg-warning"
        : "bg-muted-foreground/40";

  const glowClass = level === "Strong Signal" ? "shadow-[0_0_16px_-4px_hsl(var(--primary)/0.35)]" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className={`overflow-hidden ${glowClass}`}>
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Signal className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Signal Strength</h3>
                <p className="text-[11px] text-muted-foreground">{level}</p>
              </div>
            </div>
            <span className="text-2xl font-serif font-medium text-foreground tabular-nums">
              {score}
            </span>
          </div>

          {/* Meter bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${meterColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>

          {/* Reasons */}
          <div className="space-y-1">
            {reasons.map((r, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                {r}
              </p>
            ))}
          </div>

          {/* Next actions */}
          {nextActions.length > 0 && (
            <div className="pt-1 border-t border-border/50 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                Strengthen your signal
              </p>
              {nextActions.map((a, i) => (
                <Link
                  key={i}
                  to="/log"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  {a}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
