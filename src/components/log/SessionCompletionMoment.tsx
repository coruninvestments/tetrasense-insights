import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSessionLogs, type SessionLog } from "@/hooks/useSessionLogs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

type OutcomeChoice = "positive" | "neutral" | "negative";

interface Props {
  sessionId?: string;
  strainName: string;
  intent: string;
}

const outcomeOptions: { id: OutcomeChoice; emoji: string; label: string }[] = [
  { id: "positive", emoji: "👍", label: "Worked well" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "negative", emoji: "👎", label: "Not ideal" },
];

function getSmartFeedback(
  sessions: SessionLog[],
  strainName: string,
  intent: string
): string {
  if (sessions.length < 2) {
    return "Keep logging to unlock deeper insights.";
  }

  // Check if this strain has worked well before for this intent
  const strainSessions = sessions.filter(
    (s) =>
      s.strain_name_text.toLowerCase() === strainName.toLowerCase() &&
      s.outcome === "positive"
  );
  if (strainSessions.length >= 2) {
    const intentLabel = intent.replace("_", " ");
    return `This strain has worked well for ${intentLabel} before.`;
  }

  // Check time-of-day pattern
  const now = new Date();
  const currentHour = now.getHours();
  const isEvening = currentHour >= 18 || currentHour < 4;
  const eveningSessions = sessions.filter((s) => {
    if (!s.local_time) return false;
    const match = s.local_time.match(/(\d+):/);
    if (!match) return false;
    const hour = parseInt(match[1]);
    const isPM = s.local_time.includes("PM");
    const h24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;
    return h24 >= 18 || h24 < 4;
  });
  if (isEvening && eveningSessions.length >= 3) {
    return "You usually log evening sessions around this time.";
  }

  // Consistency message
  if (sessions.length >= 5) {
    return "You're building consistency — insights improve over time.";
  }

  return "Keep logging to unlock deeper insights.";
}

export function SessionCompletionMoment({ sessionId, strainName, intent }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useSessionLogs();

  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeChoice | null>(null);
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [reflectionNote, setReflectionNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const feedback = getSmartFeedback(sessions, strainName, intent);

  const handleOutcomeSelect = async (outcome: OutcomeChoice) => {
    setSelectedOutcome(outcome);
    if (!sessionId || !user) return;

    setSavingOutcome(true);
    try {
      await supabase
        .from("session_logs")
        .update({ outcome } as any)
        .eq("id", sessionId)
        .eq("user_id", user.id);
      queryClient.invalidateQueries({ queryKey: ["session-logs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
    } catch {
      // silent fail — outcome is optional
    } finally {
      setSavingOutcome(false);
    }
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
        Your data helps Tetra learn what works for you.
      </motion.p>

      {/* Quick Outcome Rating */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-8"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          How was it?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {outcomeOptions.map((opt) => (
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
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs text-center leading-tight text-muted-foreground">
                {opt.label}
              </span>
            </button>
          ))}
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
                <p className="text-xs text-primary">Note saved ✓</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>

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
