import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDecisionInsights } from "@/hooks/useDecisionInsights";
import { logEvent } from "@/lib/analytics";

const INTENTS = [
  { id: "sleep", label: "Sleep", emoji: "🌙" },
  { id: "relaxation", label: "Relaxation", emoji: "🧘" },
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "creativity", label: "Creativity", emoji: "🎨" },
  { id: "learning", label: "Learning", emoji: "🧠" },
  { id: "pain_relief", label: "Pain Relief", emoji: "💆" },
  { id: "social", label: "Social", emoji: "👥" },
  { id: "recreation", label: "Recreation", emoji: "🎉" },
] as const;

export function TodaysGoalCard() {
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const { data: insights, isLoading } = useDecisionInsights();

  const hasEnoughData = insights?.hasEnoughData ?? false;

  // Find recommendation for selected intent
  const recommendation = (() => {
    if (!selectedIntent || !insights) return null;
    const intentData = insights.intentBreakdowns.find(
      (b) => b.intent === selectedIntent
    );
    if (!intentData || intentData.best.length === 0) return null;

    const topStrain = intentData.best[0];
    // Find best method for this intent from session data
    const bestMethod = insights.methodComparisons[0];

    return {
      strain: topStrain.strainName,
      strainRate: topStrain.positiveRate,
      method: bestMethod?.method ?? null,
      sampleSize: intentData.totalSessions,
    };
  })();

  // Build pre-filled log link
  const logLink = (() => {
    const params = new URLSearchParams();
    if (selectedIntent) params.set("intent", selectedIntent);
    if (recommendation?.strain) params.set("strain", recommendation.strain);
    if (recommendation?.method) params.set("method", recommendation.method);
    const qs = params.toString();
    return `/log${qs ? `?${qs}` : ""}`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Today's Goal
            </span>
          </div>

          {/* Intent chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {INTENTS.map((intent) => (
              <button
                key={intent.id}
                onClick={() => {
                  const next = selectedIntent === intent.id ? null : intent.id;
                  setSelectedIntent(next);
                  if (next) logEvent("used_todays_goal");
                }}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  selectedIntent === intent.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {intent.emoji} {intent.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedIntent && (
              <motion.div
                key={selectedIntent}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {!hasEnoughData ? (
                  <div className="text-center py-3">
                    <p className="text-sm text-muted-foreground">
                      Log 3 sessions to unlock recommendations.
                    </p>
                  </div>
                ) : recommendation ? (
                  <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        Based on your data
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      Your best results come with{" "}
                      <span className="font-medium">{recommendation.strain}</span>
                      {recommendation.method && (
                        <>
                          {" "}via{" "}
                          <span className="font-medium capitalize">
                            {recommendation.method}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {recommendation.strainRate}% positive across{" "}
                      {recommendation.sampleSize} sessions
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-sm text-muted-foreground">
                      No pattern found yet for this goal. Log a session to start building data.
                    </p>
                  </div>
                )}

                <Link to={logLink}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    Log this session
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
