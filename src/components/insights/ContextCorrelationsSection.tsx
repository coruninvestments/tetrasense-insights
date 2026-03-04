import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionLogs, type SessionLog } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { InsightUnlockCard } from "./InsightUnlockCard";

interface ContextCorrelation {
  label: string;
  emoji: string;
  negativeRate: number;
  sampleSize: number;
}

const CONTEXT_FIELDS: {
  key: keyof SessionLog;
  label: string;
  values: { id: string; label: string; emoji: string }[];
}[] = [
  {
    key: "time_of_day",
    label: "Time of day",
    values: [
      { id: "morning", label: "Morning", emoji: "🌅" },
      { id: "afternoon", label: "Afternoon", emoji: "☀️" },
      { id: "evening", label: "Evening", emoji: "🌆" },
      { id: "night", label: "Night", emoji: "🌙" },
    ],
  },
  {
    key: "setting",
    label: "Setting",
    values: [
      { id: "home", label: "Home", emoji: "🏠" },
      { id: "outdoors", label: "Outdoors", emoji: "🌳" },
      { id: "social", label: "Social", emoji: "👥" },
      { id: "alone", label: "Alone", emoji: "🧘" },
      { id: "public", label: "Public", emoji: "🏙️" },
    ],
  },
  {
    key: "stomach",
    label: "Stomach",
    values: [
      { id: "empty", label: "Empty stomach", emoji: "🍽️" },
      { id: "light", label: "Light meal", emoji: "🥗" },
      { id: "normal", label: "Normal meal", emoji: "🍽️" },
      { id: "heavy", label: "Full stomach", emoji: "🍔" },
    ],
  },
  {
    key: "hydration",
    label: "Hydration",
    values: [
      { id: "low", label: "Low hydration", emoji: "🏜️" },
      { id: "ok", label: "OK hydration", emoji: "💧" },
      { id: "high", label: "Well hydrated", emoji: "🌊" },
    ],
  },
  {
    key: "sleep_quality",
    label: "Sleep quality",
    values: [
      { id: "poor", label: "Poor sleep", emoji: "😴" },
      { id: "ok", label: "OK sleep", emoji: "😐" },
      { id: "good", label: "Good sleep", emoji: "😊" },
    ],
  },
  {
    key: "mood_before",
    label: "Mood before",
    values: [
      { id: "low", label: "Low mood", emoji: "😔" },
      { id: "neutral", label: "Neutral mood", emoji: "😐" },
      { id: "good", label: "Good mood", emoji: "😊" },
    ],
  },
  {
    key: "stress_before",
    label: "Stress",
    values: [
      { id: "low", label: "Low stress", emoji: "😌" },
      { id: "medium", label: "Medium stress", emoji: "😐" },
      { id: "high", label: "High stress", emoji: "😤" },
    ],
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
          emoji: val.emoji,
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
        emoji: "☕",
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
            {correlations.map((c) => (
              <div key={c.label} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">
                  <span className="mr-1.5">{c.emoji}</span>
                  {c.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(c.negativeRate * 100)}% negative · {c.sampleSize} sessions
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Patterns from your session history — not medical advice
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
