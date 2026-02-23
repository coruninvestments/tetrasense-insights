import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Activity, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffectDrivers, EffectDriver } from "@/hooks/useEffectDrivers";

function DriverRow({ driver, variant }: { driver: EffectDriver; variant: "positive" | "negative" }) {
  const avgValue = variant === "positive" ? driver.avgPositive : driver.avgNegative;
  const diffAbs = Math.abs(driver.difference);

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg shrink-0">{driver.emoji}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{driver.label}</span>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        avg {avgValue.toFixed(1)} · {diffAbs.toFixed(1)} pts gap
      </span>
    </div>
  );
}

export function EffectDriversSection() {
  const { data, isLoading } = useEffectDrivers();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!data.hasEnoughData) {
    return (
      <Card variant="glass">
        <CardContent className="p-5 text-center">
          <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Log more sessions with varied outcomes to discover what drives your best experiences.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasPositive = data.positiveDrivers.length > 0;
  const hasNegative = data.negativeDrivers.length > 0;

  if (!hasPositive && !hasNegative) {
    return (
      <Card variant="glass">
        <CardContent className="p-5 text-center">
          <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No strong effect patterns detected yet. Keep logging to refine your data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hasPositive && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-foreground">
                  You tend to have better outcomes when you feel
                </span>
              </div>
              <div className="divide-y divide-border">
                {data.positiveDrivers.map((d) => (
                  <DriverRow key={d.key} driver={d} variant="positive" />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Based on {data.positiveSampleSize} positive vs {data.negativeSampleSize} less favorable sessions
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {hasNegative && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass" className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">
                  You tend to have worse outcomes when you feel
                </span>
              </div>
              <div className="divide-y divide-border">
                {data.negativeDrivers.map((d) => (
                  <DriverRow key={d.key} driver={d} variant="negative" />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Patterns from your session history — not medical advice
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
