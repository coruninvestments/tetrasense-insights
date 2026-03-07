import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeLearningPath } from "@/lib/learningPath";

export function LearningPathCard() {
  const { data: sessions } = useSessionLogs();

  const path = useMemo(() => {
    return computeLearningPath(sessions ?? []);
  }, [sessions]);

  const progressPct = path.totalCount > 0
    ? Math.round((path.completedCount / path.totalCount) * 100)
    : 0;

  const nextModule = path.modules.find((m) => m.id === path.nextRecommended);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link to="/learn/connoisseur">
        <Card variant="interactive">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base font-medium text-foreground">
                  Connoisseur Path
                </h3>
                <p className="text-xs text-muted-foreground">
                  {progressPct === 100
                    ? "All modules complete — well done"
                    : `${path.completedCount}/${path.totalCount} modules · ${progressPct}%`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>

            <Progress value={progressPct} className="h-1.5" />

            {nextModule && nextModule.recommendation && (
              <p className="text-[11px] text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="truncate">Up next: {nextModule.title}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
