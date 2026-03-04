import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, MapPin, Coffee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionLogs, type SessionLog } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { InsightUnlockCard } from "./InsightUnlockCard";
import { getContextIcon, CAFFEINE_ICON } from "@/lib/context";
import type { LucideIcon } from "lucide-react";
import {
  TIME_OPTIONS,
  SETTING_OPTIONS,
  STOMACH_OPTIONS,
  HYDRATION_OPTIONS,
  SLEEP_OPTIONS,
  MOOD_OPTIONS,
  STRESS_OPTIONS,
} from "@/lib/context";

interface ContextCorrelation {
  label: string;
  icon: LucideIcon;
  negativeRate: number;
  sampleSize: number;
}

const CONTEXT_FIELDS: {
  key: keyof SessionLog;
  label: string;
  values: { id: string; label: string; icon: LucideIcon }[];
}[] = [
  { key: "time_of_day", label: "Time of day", values: TIME_OPTIONS },
  { key: "setting", label: "Setting", values: SETTING_OPTIONS },
  {
    key: "stomach",
    label: "Stomach",
    values: STOMACH_OPTIONS.map((o) => ({ ...o, label: o.id === "empty" ? "Empty stomach" : o.id === "light" ? "Light meal" : o.id === "normal" ? "Normal meal" : "Full stomach" })),
  },
  {
    key: "hydration",
    label: "Hydration",
    values: HYDRATION_OPTIONS.map((o) => ({ ...o, label: o.id === "low" ? "Low hydration" : o.id === "ok" ? "OK hydration" : "Well hydrated" })),
  },
  {
    key: "sleep_quality",
    label: "Sleep quality",
    values: SLEEP_OPTIONS.map((o) => ({ ...o, label: o.id === "poor" ? "Poor sleep" : o.id === "ok" ? "OK sleep" : "Good sleep" })),
  },
  {
    key: "mood_before",
    label: "Mood before",
    values: MOOD_OPTIONS.map((o) => ({ ...o, label: o.id === "low" ? "Low mood" : o.id === "neutral" ? "Neutral mood" : "Good mood" })),
  },
  {
    key: "stress_before",
    label: "Stress",
    values: STRESS_OPTIONS.map((o) => ({ ...o, label: o.id === "low" ? "Low stress" : o.id === "medium" ? "Medium stress" : "High stress" })),
  },
];

function computeCorrelations(sessions: SessionLog[]): ContextCorrelation[] {
  const results: ContextCorrelation[] = [];

  for (const field of CONTEXT_FIELDS) {
    for (const val of field.values) {
      const matching = sessions.filter((s) => (s as any)[field.key] === val.id);
      if (matching.length < 2) continue;
      const negCount = matching.filter((s) => normalizeOutcome(s.outcome) === "negative").length;
      const negRate = negCount / matching.length;
      if (negRate >= 0.4) {
        results.push({
          label: val.label,
          icon: val.icon,
          negativeRate: negRate,
          sampleSize: matching.length,
        });
      }
    }
  }

  // Also check caffeine
  const caffeineSessions = sessions.filter((s) => (s as any).caffeine === true);
  if (caffeineSessions.length >= 2) {
    const negCount = caffeineSessions.filter((s) => normalizeOutcome(s.outcome) === "negative").length;
    const negRate = negCount / caffeineSessions.length;
    if (negRate >= 0.4) {
      results.push({
        label: "Had caffeine",
        icon: CAFFEINE_ICON,
        negativeRate: negRate,
        sampleSize: caffeineSessions.length,
      });
    }
  }

  return results.sort((a, b) => b.negativeRate - a.negativeRate).slice(0, 2);
}

export function ContextCorrelationsSection() {
  const { data: sessions, isLoading } = useSessionLogs();
  const sessionCount = sessions?.length ?? 0;

  const correlations = useMemo(() => {
    if (!sessions || sessions.length < 3) return [];
    return computeCorrelations(sessions);
  }, [sessions]);

  if (isLoading) return null;

  if (sessionCount < 3) {
    return (
      <InsightUnlockCard
        icon={MapPin}
        title="Log 3 sessions with context to see risk patterns"
        subtitle="Add setting, mood, and hydration for best results"
        current={sessionCount}
        target={3}
      />
    );
  }

  if (correlations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card variant="glass" className="border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-foreground">
              Contexts linked with worse outcomes
            </span>
          </div>
          <div className="space-y-2">
            {correlations.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
                    {c.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(c.negativeRate * 100)}% negative · {c.sampleSize} sessions
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Patterns from your session history — not medical advice
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
