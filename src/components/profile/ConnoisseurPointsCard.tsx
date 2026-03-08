import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useConnoisseurPoints } from "@/hooks/useConnoisseurPoints";

interface Props {
  compact?: boolean;
}

const TIPS = [
  "Complete sessions with context for +20 CP",
  "Log flavor & aroma for +5 CP per session",
  "Explore new products for +15 CP each",
  "Complete learning modules for +10 CP",
];

export function ConnoisseurPointsCard({ compact = false }: Props) {
  const { data: cp, isLoading } = useConnoisseurPoints();

  if (isLoading) {
    return <Skeleton className={compact ? "h-16 rounded-xl" : "h-36 rounded-xl"} />;
  }

  if (!cp) return null;

  const tipIndex = cp.totalPoints % TIPS.length;

  if (compact) {
    return (
      <Card variant="glass">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{cp.totalPoints} CP</p>
              <p className="text-xs text-muted-foreground">{cp.currentLevel}</p>
            </div>
            <Progress value={cp.progressPercent} className="h-1.5 mt-1.5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg font-medium text-foreground">Connoisseur Points</h3>
              <p className="text-xs text-muted-foreground">{cp.currentLevel} · {cp.totalPoints} CP</p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{cp.currentLevel}</span>
              <span>{cp.nextLevel ?? "Max Level"}</span>
            </div>
            <Progress value={cp.progressPercent} className="h-2" />
            {cp.nextLevel && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {cp.pointsToNext} CP to {cp.nextLevel}
              </p>
            )}
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2 bg-secondary/50 rounded-lg p-3">
            <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{TIPS[tipIndex]}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
