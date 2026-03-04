import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePersonalPatterns } from "@/hooks/usePersonalPatterns";
import { useSessionStats } from "@/hooks/useSessionLogs";

export function PatternSnapshotCard() {
  const { data: patterns, isLoading } = usePersonalPatterns();
  const { data: stats } = useSessionStats();

  const summary = (() => {
    if (isLoading) return null;
    if (patterns && patterns.length > 0) {
      return patterns[0].headline;
    }
    if (stats && stats.totalSessions > 0) {
      return `You've logged ${stats.totalSessions} session${stats.totalSessions > 1 ? "s" : ""}. Keep tracking to reveal patterns in your data.`;
    }
    return "Log your first session to start uncovering personal patterns.";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Pattern Snapshot
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
          {patterns && patterns.length > 1 && (
            <p className="text-xs text-muted-foreground/70 mt-2">
              +{patterns.length - 1} more pattern{patterns.length - 1 > 1 ? "s" : ""} detected
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
