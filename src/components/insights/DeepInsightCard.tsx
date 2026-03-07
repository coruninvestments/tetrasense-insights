import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DeepInsightReport, DeepInsightBullet } from "@/lib/deepInsights";

interface DeepInsightCardProps {
  report: DeepInsightReport;
  index: number;
}

const sentimentIcon = {
  positive: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />,
  negative: <TrendingDown className="w-3.5 h-3.5 text-destructive" />,
  neutral: <Minus className="w-3.5 h-3.5 text-muted-foreground" />,
};

const sentimentBar: Record<string, string> = {
  positive: "bg-emerald-500/70",
  negative: "bg-destructive/70",
  neutral: "bg-muted-foreground/40",
};

export function DeepInsightCard({ report, index }: DeepInsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card
        variant="glass"
        className="overflow-hidden cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none mt-0.5">{report.emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground">{report.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {report.summary}
              </p>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 mt-1"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>

          {/* Expandable details */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-1">
                  {report.bullets.map((b, i) => (
                    <BulletRow key={i} bullet={b} />
                  ))}
                </div>

                {/* Recommendation */}
                {report.recommendation && (
                  <div className="mt-3 flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">
                      {report.recommendation}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BulletRow({ bullet }: { bullet: DeepInsightBullet }) {
  return (
    <div className="flex items-center gap-2.5">
      {sentimentIcon[bullet.sentiment]}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-foreground truncate">{bullet.label}</span>
          <span className="text-[11px] text-muted-foreground shrink-0">{bullet.value}</span>
        </div>
        <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
          <div className={`h-full rounded-full ${sentimentBar[bullet.sentiment]}`} style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  );
}
