import { motion } from "framer-motion";
import { Lightbulb, AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffectPatterns } from "@/hooks/useEffectPatterns";

function ConfidenceBadge({ count }: { count: number }) {
  const level = count >= 8 ? "high" : count >= 3 ? "medium" : "low";
  const styles = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-success/10 text-success",
  };
  const labels = { low: "Early data", medium: "Growing", high: "Strong" };

  return (
    <Badge className={`text-[10px] font-normal border-0 ${styles[level]}`}>
      {labels[level]}
    </Badge>
  );
}

function EffectRow({ emoji, label, avg }: { emoji: string; label: string; avg: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">avg {avg.toFixed(1)}/10</span>
    </div>
  );
}

export function EffectDriversSection() {
  const { data, isLoading } = useEffectPatterns();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!data || !data.hasEnoughData || (data.positiveDrivers.length === 0 && data.negativeDrivers.length === 0)) {
    return null; // Don't show section if no meaningful data
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-lg font-medium text-foreground">
          What Drives Your Best Sessions
        </h2>
      </div>

      <div className="space-y-3">
        {data.positiveDrivers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="glass" className="border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">
                    You tend to have better outcomes when you feel
                  </p>
                  <ConfidenceBadge count={data.totalPositive} />
                </div>
                <div className="divide-y divide-border">
                  {data.positiveDrivers.map(d => (
                    <EffectRow key={d.key} emoji={d.emoji} label={d.label} avg={d.avg} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Based on {data.totalPositive} positive session{data.totalPositive !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.negativeDrivers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="glass" className="border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <p className="text-sm font-medium text-foreground">
                      Less favorable outcomes often involve
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {data.negativeDrivers.map(d => (
                    <EffectRow key={d.key} emoji={d.emoji} label={d.label} avg={d.avg} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Based on {data.totalNegative} less favorable session{data.totalNegative !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3 px-4">
        Compares effect levels between your positive and less favorable sessions. Not medical advice.
      </p>
    </section>
  );
}
