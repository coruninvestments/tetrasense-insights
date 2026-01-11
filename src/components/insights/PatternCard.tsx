import { motion } from "framer-motion";
import { Moon, Brain, TrendingUp, Sparkles, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PatternInsight } from "@/hooks/useInsights";

const iconMap = {
  sleep: Moon,
  focus: Brain,
  trending: TrendingUp,
  sparkles: Sparkles,
};

const confidenceColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-success/10 text-success",
};

interface PatternCardProps {
  pattern: PatternInsight;
  delay?: number;
}

export function PatternCard({ pattern, delay = 0 }: PatternCardProps) {
  const Icon = iconMap[pattern.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card variant="interactive" className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-medium text-foreground">
                  {pattern.title}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${confidenceColors[pattern.confidence]}`}
                >
                  {pattern.confidence} confidence
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pattern.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function NoPatternCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            Not Enough Data Yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Log at least 3 sessions to start discovering patterns in your data.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
