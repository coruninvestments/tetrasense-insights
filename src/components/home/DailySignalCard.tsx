import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, TrendingUp, Star, Zap, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDailySignal } from "@/hooks/useDailySignal";
import { markShownToday } from "@/lib/dailySignalCheck";
import type { DailySignal } from "@/lib/dailySignalCheck";

const iconMap = {
  flame: Flame,
  target: Target,
  trending: TrendingUp,
  star: Star,
  zap: Zap,
} as const;

function SignalRow({ signal }: { signal: DailySignal }) {
  const Icon = iconMap[signal.icon];
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm text-foreground leading-snug">{signal.message}</p>
    </div>
  );
}

export function DailySignalCard() {
  const { signals, alreadyShown, sessionCount } = useDailySignal();
  const [dismissed, setDismissed] = useState(false);

  // Mark shown on mount (once per day)
  useEffect(() => {
    if (signals.length > 0 && !alreadyShown) {
      markShownToday();
    }
  }, [signals, alreadyShown]);

  if (sessionCount === 0 || signals.length === 0 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <CardContent className="p-4 pr-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              Daily Signal
            </p>
            <div className="space-y-3">
              {signals.map((s) => (
                <SignalRow key={s.id} signal={s} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
