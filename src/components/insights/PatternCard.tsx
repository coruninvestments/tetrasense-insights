import { motion } from "framer-motion";
import { Moon, Brain, TrendingUp, Sparkles, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PatternInsight } from "@/hooks/useInsights";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const iconMap = {
  sleep: Moon,
  focus: Brain,
  trending: TrendingUp,
  sparkles: Sparkles,
};

const confidenceConfig = {
  low: {
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    label: "Low",
    hint: "Small sample or weak signal — treat as a hypothesis.",
  },
  medium: {
    bgClass: "bg-primary/10",
    textClass: "text-primary",
    label: "Medium",
    hint: "Moderate sample and/or signal — worth testing.",
  },
  high: {
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600",
    label: "High",
    hint: "Strong signal with enough samples — more reliable.",
  },
};

export function PatternCard({ pattern }: { pattern: PatternInsight }) {
  const Icon = iconMap[pattern.icon];
  const confidence = confidenceConfig[pattern.confidence];

  // Use new translation fields when available, fall back to legacy
  const headline = pattern.headline || pattern.title;
  const explanation = pattern.explanation || pattern.description;

  return (
    <Card variant="interactive" className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">
                {headline}
              </h3>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidence.bgClass} ${confidence.textClass} cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                    aria-label={`${confidence.label} confidence: ${confidence.hint}`}
                  >
                    {confidence.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-center">
                  <p className="text-xs">{confidence.hint}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>
            {pattern.suggestion && (
              <p className="text-xs text-muted-foreground/80 mt-2 italic leading-relaxed">
                {pattern.suggestion}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
