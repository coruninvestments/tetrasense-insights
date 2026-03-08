import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, Zap, Eye, User, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeChallengeState, type Milestone } from "@/lib/calibrationChallenge";
import { useState, useEffect } from "react";
import { ChallengeCompletionModal } from "./ChallengeCompletionModal";

/* ── Milestone icon map ───────────────────────────────────────────── */

const milestoneIcon: Record<string, React.ElementType> = {
  signal_started: Zap,
  early_signal: Eye,
  pattern_snapshot: Sparkles,
  profile_awakening: User,
  signal_established: Award,
};

/* ── Component ────────────────────────────────────────────────────── */

export function ChallengeCard() {
  const { data: sessions } = useSessionLogs();
  const [showCompletion, setShowCompletion] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  const state = computeChallengeState(sessions ?? []);

  // Detect completion moment
  useEffect(() => {
    if (state.isComplete && prevCount < 10 && state.sessionsLogged >= 10) {
      setShowCompletion(true);
    }
    setPrevCount(state.sessionsLogged);
  }, [state.sessionsLogged, state.isComplete, prevCount]);

  // Don't render if no sessions or completed (unless modal open)
  if (!state.isActive && !showCompletion) return null;

  const nextMsg = state.nextMilestone
    ? `Log ${state.nextMilestone.sessionTarget - state.sessionsLogged} more session${state.nextMilestone.sessionTarget - state.sessionsLogged === 1 ? "" : "s"} to unlock ${state.nextMilestone.label}.`
    : "Your signal is established!";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
      >
        <Card variant="glass" className="overflow-hidden border-primary/20">
          {/* Glow accent line */}
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Find Your Signal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {state.sessionsLogged} / 10 sessions
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <Progress value={state.progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">{nextMsg}</p>
            </div>

            {/* Milestones */}
            <div className="flex items-center justify-between gap-1">
              {state.milestones.map((m) => {
                const Icon = milestoneIcon[m.key] ?? Zap;
                return (
                  <MilestoneDot key={m.key} milestone={m} Icon={Icon} />
                );
              })}
            </div>

            {/* Reward message */}
            <AnimatePresence mode="wait">
              {state.currentMilestone && (
                <motion.div
                  key={state.currentMilestone.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-lg bg-primary/5 border border-primary/10 p-3"
                >
                  <MilestoneReward milestone={state.currentMilestone} state={state} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Helper + CTA */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted-foreground/70 max-w-[55%]">
                More complete logs create stronger personal insights.
              </p>
              <Button size="sm" asChild>
                <Link to="/log" className="gap-1.5">
                  Log Session
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ChallengeCompletionModal
        open={showCompletion}
        onClose={() => setShowCompletion(false)}
        signalReport={state.signalReport}
        genomeDimensions={state.signalReport?.genomeDimensions ?? []}
      />
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function MilestoneDot({ milestone, Icon }: { milestone: Milestone; Icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
          milestone.reached
            ? "bg-primary text-primary-foreground shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]"
            : "bg-muted text-muted-foreground"
        }`}
        animate={milestone.reached ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Icon className="w-3.5 h-3.5" />
      </motion.div>
      <span className="text-[9px] text-muted-foreground leading-tight text-center max-w-[48px]">
        {milestone.sessionTarget}
      </span>
    </div>
  );
}

function MilestoneReward({ milestone, state }: { milestone: Milestone; state: ReturnType<typeof computeChallengeState> }) {
  switch (milestone.key) {
    case "signal_started":
      return (
        <p className="text-xs text-foreground/80">
          ✨ Your signal has begun forming.
        </p>
      );
    case "early_signal":
      return (
        <p className="text-xs text-foreground/80">
          🔍 We're starting to detect patterns in your sessions.
        </p>
      );
    case "pattern_snapshot":
      return (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground/90">Pattern Snapshot</p>
          {state.patternSnapshot?.bestSession && (
            <p className="text-[11px] text-muted-foreground">
              Best recent: <span className="text-foreground">{state.patternSnapshot.bestSession.strain}</span>
            </p>
          )}
          {state.patternSnapshot?.emergingTerpene && (
            <p className="text-[11px] text-muted-foreground">
              Emerging terpene: <span className="text-primary">{state.patternSnapshot.emergingTerpene}</span>
            </p>
          )}
        </div>
      );
    case "profile_awakening":
      return (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground/90">Profile Awakening</p>
          <p className="text-[11px] text-muted-foreground">
            Your connoisseur profile is taking shape. Check <Link to="/profile" className="text-primary hover:underline">your profile</Link> for details.
          </p>
        </div>
      );
    case "signal_established":
      return (
        <p className="text-xs text-foreground/80">
          🎉 Your signal is established. Full report ready!
        </p>
      );
    default:
      return null;
  }
}
