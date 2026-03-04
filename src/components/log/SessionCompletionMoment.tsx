import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Sparkles, TrendingUp, AlertTriangle, Lightbulb, ThumbsUp, Meh, ThumbsDown, Coffee, Moon, UtensilsCrossed } from "lucide-react";
import { HelpTip } from "@/components/guide/HelpTip";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSessionLogs, type SessionLog } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useEffectDrivers } from "@/hooks/useEffectDrivers";
import type { LucideIcon } from "lucide-react";

type OutcomeChoice = "positive" | "neutral" | "negative";

interface Props {
  sessionId?: string;
  strainName: string;
  intent: string;
  method?: string;
  doseLevel?: string;
  sessionContext?: {
    caffeine?: boolean;
    stomach?: string | null;
    sleep_quality?: string | null;
  };
}

const outcomeOptions: { id: OutcomeChoice; icon: LucideIcon; label: string }[] = [
  { id: "positive", icon: ThumbsUp, label: "Worked well" },
  { id: "neutral", icon: Meh, label: "Neutral" },
  { id: "negative", icon: ThumbsDown, label: "Not ideal" },
];

type PatternSignal = {
  type: "positive" | "caution";
  message: string;
  detail?: string;
};

function detectPatternSignal(
  sessions: SessionLog[],
  strainName: string,
  intent: string,
  method?: string
): PatternSignal | null {
  const past = sessions.filter((s) => s.id);

  const matchingSessions = past.filter(
    (s) =>
      s.strain_name_text.toLowerCase() === strainName.toLowerCase() &&
      s.intent === intent
  );

  if (matchingSessions.length >= 2) {
    const positives = matchingSessions.filter((s) => normalizeOutcome(s.outcome) === "positive").length;
    const negatives = matchingSessions.filter((s) => normalizeOutcome(s.outcome) === "negative").length;
    const posRate = positives / matchingSessions.length;
    const negRate = negatives / matchingSessions.length;

    if (posRate >= 0.6) {
      return {
        type: "positive",
        message: "Good choice — this aligns with what works best for you.",
        detail: `This strain has worked well for ${intent.replace("_", " ")} in ${positives} of ${matchingSessions.length} sessions.`,
      };
    }
    if (negRate >= 0.4) {
      return {
        type: "caution",
        message: "Heads up — similar sessions in the past led to less favorable outcomes.",
        detail: `${negatives} of ${matchingSessions.length} past sessions with this combo felt off. Consider adjusting dose or method.`,
      };
    }
  }

  const strainSessions = past.filter(
    (s) => s.strain_name_text.toLowerCase() === strainName.toLowerCase()
  );
  if (strainSessions.length >= 3) {
    const negatives = strainSessions.filter((s) => normalizeOutcome(s.outcome) === "negative").length;
    const negRate = negatives / strainSessions.length;
    if (negRate >= 0.5) {
      return {
        type: "caution",
        message: "Heads up — this strain hasn't been consistent for you.",
        detail: `${negatives} of ${strainSessions.length} sessions had less favorable outcomes.`,
      };
    }
  }

  if (method) {
    const methodSessions = past.filter((s) => s.method === method && s.intent === intent);
    if (methodSessions.length >= 3) {
      const positives = methodSessions.filter((s) => normalizeOutcome(s.outcome) === "positive").length;
      if (positives / methodSessions.length >= 0.6) {
        return {
          type: "positive",
          message: `${method} tends to work well for you when the goal is ${intent.replace("_", " ")}.`,
        };
      }
    }
  }

  if (past.length < 3) {
    return null;
  }

  return null;
}

function getSmartFeedback(
  sessions: SessionLog[],
  sessionCount: number
): string {
  if (sessionCount < 3) {
    return "Keep logging to unlock deeper insights.";
  }
  if (sessionCount >= 5) {
    return "You're building consistency — insights improve over time.";
  }
  return "Each session helps Signal Leaf understand you better.";
}

export function SessionCompletionMoment({ sessionId, strainName, intent, method, doseLevel, sessionContext }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useSessionLogs();
  const { data: driverData } = useEffectDrivers();

  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeChoice | null>(null);
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [reflectionNote, setReflectionNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [intentMatch, setIntentMatch] = useState<number | null>(null);
  const [comfort, setComfort] = useState<number | null>(null);

  const pastSessions = useMemo(() => sessions.filter((s) => s.id !== sessionId), [sessions, sessionId]);
  const patternSignal = useMemo(() => detectPatternSignal(pastSessions, strainName, intent, method), [pastSessions, strainName, intent, method]);
  const feedback = getSmartFeedback(sessions, sessions.length);

  const contextTips = useMemo(() => {
    const tips: { icon: LucideIcon; message: string }[] = [];
    const anxietyIsNegDriver = driverData.negativeDrivers.some((d) => d.key === "effect_anxiety");
    if (!anxietyIsNegDriver) return tips;

    if (sessionContext?.caffeine) {
      tips.push({ icon: Coffee, message: "Caffeine + cannabis can increase anxiety for some people — consider lowering caffeine." });
    }
    if (sessionContext?.stomach === "empty") {
      tips.push({ icon: UtensilsCrossed, message: "Empty stomach can intensify effects — try a light meal next time." });
    }
    if (sessionContext?.sleep_quality === "poor") {
      tips.push({ icon: Moon, message: "Poor sleep often increases sensitivity — consider a lower dose." });
    }
    return tips;
  }, [driverData, sessionContext]);

  const comparison = useMemo(() => {
    const previous = sessions
      .filter((s) => s.id !== sessionId)
      .find(
        (s) =>
          s.strain_name_text.toLowerCase() === strainName.toLowerCase() &&
          s.intent === intent
      );
    if (!previous) return null;

    const prevOutcome = normalizeOutcome(previous.outcome);
    const prevComfort = previous.comfort_score;

    return { prevOutcome, prevComfort };
  }, [sessions, sessionId, strainName, intent]);

  const saveField = async (fields: Record<string, unknown>) => {
    if (!sessionId || !user) return;
    try {
      await supabase
        .from("session_logs")
        .update(fields as any)
        .eq("id", sessionId)
        .eq("user_id", user.id);
      queryClient.invalidateQueries({ queryKey: ["session-logs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
    } catch {
      // silent fail — these fields are optional
    }
  };

  const handleOutcomeSelect = async (outcome: OutcomeChoice) => {
    setSelectedOutcome(outcome);
    setSavingOutcome(true);
    await saveField({ outcome });
    setSavingOutcome(false);
  };

  const handleIntentMatch = (val: number) => {
    setIntentMatch(val);
    saveField({ intent_match_score: val });
  };

  const handleComfort = (val: number) => {
    setComfort(val);
    saveField({ comfort_score: val });
  };

  const handleSaveNote = async () => {
    if (!sessionId || !user || !reflectionNote.trim()) return;
    try {
      await supabase
        .from("session_logs")
        .update({ notes: reflectionNote.trim() } as any)
        .eq("id", sessionId)
        .eq("user_id", user.id);
      setNoteSaved(true);
    } catch {
      // silent
    }
  };

  return (
    <div className="text-center py-6">
      {/* Confirmation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5"
      >
        <Check className="w-8 h-8 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-serif text-2xl font-medium text-foreground mb-2"
      >
        Session Logged
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-sm text-muted-foreground mb-8"
      >
        Your data helps Signal Leaf learn what works for you.
      </motion.p>

      {/* Quick Outcome Rating */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-8"
      >
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            How was it?
          </p>
          <HelpTip id="completion_outcome" title="Outcome Rating" description="This helps Signal Leaf learn what works for you over time." />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {outcomeOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={savingOutcome}
                onClick={() => handleOutcomeSelect(opt.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-all ${
                  selectedOutcome === opt.id
                    ? "ring-2 ring-primary bg-primary/5 scale-[1.02]"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={2} />
                <span className="text-xs text-center leading-tight text-muted-foreground">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Rating Sliders */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8 space-y-5"
      >
        <div className="text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Did this match your intent?
            </p>
            <HelpTip id="completion_intent_match" title="Intent Match" description="This compares your goal with the actual result." />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["Missed", "Close", "Perfect"] as const).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => handleIntentMatch(i)}
                className={`p-2.5 rounded-xl text-xs font-medium transition-all ${
                  intentMatch === i
                    ? "ring-2 ring-primary bg-primary/5 scale-[1.02]"
                    : "bg-secondary hover:bg-secondary/80"
                } text-muted-foreground`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              How comfortable did this feel?
            </p>
            <HelpTip id="completion_comfort" title="Comfort Level" description="Helps identify doses that feel too strong or too light." />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["Too strong", "Comfortable", "Too light"] as const).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => handleComfort(i)}
                className={`p-2.5 rounded-xl text-xs font-medium transition-all ${
                  comfort === i
                    ? "ring-2 ring-primary bg-primary/5 scale-[1.02]"
                    : "bg-secondary hover:bg-secondary/80"
                } text-muted-foreground`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Optional Reflection Note */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-6 text-left"
      >
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            <ChevronDown
              className={`w-4 h-4 transition-transform ${notesOpen ? "rotate-180" : ""}`}
            />
            <span>Add a quick note (optional)</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-2 space-y-3">
              <textarea
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                placeholder="How it felt, unexpected effects, context..."
                disabled={noteSaved}
                className="w-full h-20 px-4 py-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              {reflectionNote.trim() && !noteSaved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveNote}
                >
                  Save Note
                </Button>
              )}
              {noteSaved && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <Check className="h-3 w-3" /> Note saved
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>

      {/* Comparison to Last Session */}
      {comparison && (selectedOutcome || comfort !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-secondary/60 rounded-xl p-3 mb-4 text-left"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Compared to your last session
          </p>
          <div className="space-y-1">
            {selectedOutcome && comparison.prevOutcome && (
              <p className="text-xs text-muted-foreground">
                Outcome:{" "}
                <span className="text-foreground font-medium">
                  {selectedOutcome === comparison.prevOutcome
                    ? "Same as last time"
                    : selectedOutcome === "positive" && comparison.prevOutcome !== "positive"
                    ? "Better than last time"
                    : selectedOutcome === "negative" && comparison.prevOutcome !== "negative"
                    ? "Worse than last time"
                    : "Different from last time"}
                </span>
              </p>
            )}
            {comfort !== null && comparison.prevComfort !== null && comparison.prevComfort !== undefined && (
              <p className="text-xs text-muted-foreground">
                Comfort:{" "}
                <span className="text-foreground font-medium">
                  {comfort === comparison.prevComfort
                    ? "Similar comfort level"
                    : comfort === 1 && comparison.prevComfort !== 1
                    ? "More comfortable this time"
                    : comfort !== 1 && comparison.prevComfort === 1
                    ? "Less comfortable this time"
                    : "Different comfort level"}
                </span>
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Pattern Signal */}
      {patternSignal && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`flex items-start gap-2.5 rounded-xl p-3.5 mb-4 text-left ${
            patternSignal.type === "positive"
              ? "bg-primary/5 border border-primary/20"
              : "bg-destructive/5 border border-destructive/20"
          }`}
        >
          {patternSignal.type === "positive" ? (
            <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-medium leading-snug ${
              patternSignal.type === "positive" ? "text-primary" : "text-destructive"
            }`}>
              {patternSignal.message}
            </p>
            {patternSignal.detail && (
              <p className="text-xs text-muted-foreground mt-1">{patternSignal.detail}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Context-Aware Tips */}
      {contextTips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="bg-warning/5 border border-warning/20 rounded-xl p-3.5 mb-4 text-left space-y-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4 text-warning shrink-0" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Context tip
            </p>
          </div>
          {contextTips.map((tip, i) => {
            const TipIcon = tip.icon;
            return (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <TipIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                {tip.message}
              </p>
            );
          })}
        </motion.div>
      )}

      {/* Smart Feedback */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="flex items-start gap-2 bg-secondary/60 rounded-xl p-3 mb-8 text-left"
      >
        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">{feedback}</p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Done
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => navigate("/insights")}
        >
          View Insights
        </Button>
      </motion.div>
    </div>
  );
}
