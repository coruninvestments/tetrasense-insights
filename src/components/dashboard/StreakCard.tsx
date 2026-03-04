import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Flame, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeStreaks } from "@/lib/streakEngine";
import { logEvent } from "@/lib/analytics";

function Sparkle({ index }: { index: number }) {
  const angle = (index / 3) * Math.PI * 2 + Math.random() * 0.8;
  const dist = 12 + Math.random() * 10;
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-primary"
      style={{ top: "50%", left: "50%", willChange: "transform, opacity" }}
      initial={{ opacity: 0.9, x: 0, y: 0, scale: 1 }}
      animate={{
        opacity: 0,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        scale: 0.3,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 + Math.random() * 0.2, ease: "easeOut" }}
    />
  );
}

function getEncouragement(streak: number): string {
  if (streak === 0) return "Log your first session to begin building your signal.";
  if (streak <= 2) return "Log again tomorrow to start a streak.";
  if (streak < 5) return "You're building reliable patterns.";
  return "Consistency builds clearer insights.";
}

export function StreakCard() {
  const prefersReduced = useReducedMotion();
  const { data: sessions } = useSessionLogs();
  const streaks = computeStreaks(sessions ?? []);

  const prevLoggingRef = useRef(streaks.loggingStreak);
  const [sparkle, setSparkle] = useState(false);

  useEffect(() => {
    logEvent("viewed_streak_card" as any);
  }, []);

  useEffect(() => {
    if (streaks.loggingStreak > prevLoggingRef.current && streaks.loggingStreak > 0) {
      setSparkle(true);
      logEvent("streak_incremented" as any);
      const t = setTimeout(() => setSparkle(false), 900);
      return () => clearTimeout(t);
    }
    prevLoggingRef.current = streaks.loggingStreak;
  }, [streaks.loggingStreak]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Logging Streak */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0 mt-0.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  streaks.loggingStreak > 0
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Flame className="w-4 h-4" />
              </div>

              {/* Sparkle celebration */}
              {!prefersReduced && (
                <AnimatePresence>
                  {sparkle && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[0, 1, 2].map((i) => (
                        <Sparkle key={i} index={i} />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              )}

              {/* Glow on active streak */}
              {sparkle && !prefersReduced && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.3, 1.3] }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ willChange: "transform, opacity" }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-foreground tabular-nums">
                  {streaks.loggingStreak}
                </span>
                <span className="text-sm font-medium text-foreground">
                  Day Logging Streak
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getEncouragement(streaks.loggingStreak)}
              </p>
              {streaks.longestLoggingStreak > 0 && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Longest streak: {streaks.longestLoggingStreak} day{streaks.longestLoggingStreak !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Reliability Streak */}
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                streaks.reliabilityStreak > 0
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-foreground tabular-nums">
                  {streaks.reliabilityStreak}
                </span>
                <span className="text-sm font-medium text-foreground">
                  Day Reliability Streak
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {streaks.reliabilityStreak > 0
                  ? "Consistent session detail improves pattern accuracy."
                  : "Log a session with full details to start."}
              </p>
              {streaks.longestReliabilityStreak > 0 && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Longest streak: {streaks.longestReliabilityStreak} day{streaks.longestReliabilityStreak !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* CTA */}
          {streaks.loggingStreak === 0 && (
            <Link
              to="/log"
              className="block text-center text-xs font-medium text-primary hover:underline pt-1"
            >
              Log a session →
            </Link>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
