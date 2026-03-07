import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Lock, ChevronRight, BookOpen, Sparkles, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import {
  computeLearningPath,
  markModuleCompleted,
  type LearningModule,
  type ModuleStatus,
} from "@/lib/learningPath";

const statusStyle: Record<ModuleStatus, { icon: typeof Check; badge: string; badgeClass: string }> = {
  completed: { icon: Check, badge: "Done", badgeClass: "bg-success/15 text-success" },
  available: { icon: BookOpen, badge: "Available", badgeClass: "bg-primary/15 text-primary" },
  locked: { icon: Lock, badge: "Locked", badgeClass: "bg-muted text-muted-foreground" },
};

export default function ConnoisseurLearning() {
  const navigate = useNavigate();
  const { data: sessions } = useSessionLogs();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [completedLocal, setCompletedLocal] = useState(0); // force re-render on complete

  const path = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _tick = completedLocal; // dependency to re-compute
    return computeLearningPath(sessions ?? []);
  }, [sessions, completedLocal]);

  const handleComplete = useCallback((moduleId: string) => {
    markModuleCompleted(moduleId);
    setCompletedLocal((c) => c + 1);
    setExpandedModule(null);
  }, []);

  const progressPct = path.totalCount > 0
    ? Math.round((path.completedCount / path.totalCount) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="px-5 pt-12 pb-4 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-serif text-xl font-medium text-foreground">
                Connoisseur Path
              </h1>
              <p className="text-xs text-muted-foreground">
                Grow your cannabis knowledge
              </p>
            </div>
          </motion.div>
        </header>

        <div className="px-5 pb-28 space-y-5">
          {/* Progress overview */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card variant="glass">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {path.completedCount} of {path.totalCount} modules completed
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {progressPct === 100
                        ? "You've completed the full path — well done"
                        : "Each module unlocks as you log more sessions"}
                    </p>
                  </div>
                  <span className="text-lg font-serif font-medium text-primary">
                    {progressPct}%
                  </span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Module list */}
          <div className="space-y-3">
            {path.modules.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                index={i}
                isExpanded={expandedModule === mod.id}
                isRecommended={path.nextRecommended === mod.id}
                onToggle={() =>
                  setExpandedModule(expandedModule === mod.id ? null : mod.id)
                }
                onComplete={() => handleComplete(mod.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ── Module Card ─────────────────────────────────────────────────── */

function ModuleCard({
  module: mod,
  index,
  isExpanded,
  isRecommended,
  onToggle,
  onComplete,
}: {
  module: LearningModule;
  index: number;
  isExpanded: boolean;
  isRecommended: boolean;
  onToggle: () => void;
  onComplete: () => void;
}) {
  const style = statusStyle[mod.status];
  const StatusIcon = style.icon;
  const isLocked = mod.status === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.04 }}
    >
      <Card
        className={`overflow-hidden transition-all ${
          isLocked ? "opacity-60" : ""
        } ${isRecommended && !isExpanded ? "ring-1 ring-primary/30" : ""}`}
      >
        {/* Header — always visible */}
        <button
          type="button"
          disabled={isLocked}
          onClick={onToggle}
          className="w-full p-4 flex items-center gap-3 text-left disabled:cursor-not-allowed"
        >
          {/* Number / status icon */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              mod.status === "completed"
                ? "bg-success/10"
                : mod.status === "available"
                ? "bg-primary/10"
                : "bg-muted"
            }`}
          >
            {mod.status === "completed" ? (
              <Check className="w-4 h-4 text-success" />
            ) : isLocked ? (
              <Lock className="w-4 h-4 text-muted-foreground" />
            ) : (
              <span className="text-xs font-medium text-primary">{index + 1}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{mod.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{mod.subtitle}</p>
            {isRecommended && mod.recommendation && !isExpanded && (
              <p className="text-[11px] text-primary mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {mod.recommendation}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`text-[9px] font-medium border-0 ${style.badgeClass}`}>
              {mod.readTime}
            </Badge>
            {!isLocked && (
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            )}
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && !isLocked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                {mod.content.sections.map((section, si) => (
                  <div key={si} className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {section.heading}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.body}
                    </p>
                  </div>
                ))}

                {mod.status !== "completed" && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={onComplete}
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Mark as Read
                  </Button>
                )}

                {mod.status === "completed" && (
                  <p className="text-xs text-success text-center flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Completed
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
