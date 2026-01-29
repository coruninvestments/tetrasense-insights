import { motion } from "framer-motion";
import { Calendar, Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyUsage, DoseDistribution, MethodDistribution } from "@/hooks/useWeeklyUsage";

interface DistributionBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function DistributionBar({ label, count, total, color }: DistributionBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16 capitalize">{label}</span>
      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
    </div>
  );
}

interface DoseDistributionDisplayProps {
  distribution: DoseDistribution;
  total: number;
}

function DoseDistributionDisplay({ distribution, total }: DoseDistributionDisplayProps) {
  const doseItems = [
    { key: "low" as const, label: "Low", color: "bg-primary/40" },
    { key: "medium" as const, label: "Medium", color: "bg-primary/70" },
    { key: "high" as const, label: "High", color: "bg-primary" },
    { key: "unknown" as const, label: "Unknown", color: "bg-muted" },
  ];

  // Only show unknown if there are unknown doses
  const visibleDoseItems = doseItems.filter(
    (item) => item.key !== "unknown" || distribution.unknown > 0
  );

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-foreground uppercase tracking-wide">
        Dose Levels
      </h4>
      <div className="space-y-1.5">
        {visibleDoseItems.map((item) => (
          <DistributionBar
            key={item.key}
            label={item.label}
            count={distribution[item.key]}
            total={total}
            color={item.color}
          />
        ))}
      </div>
    </div>
  );
}

interface MethodDistributionDisplayProps {
  distribution: MethodDistribution;
  total: number;
}

function MethodDistributionDisplay({ distribution, total }: MethodDistributionDisplayProps) {
  const methods = [
    { key: "smoke", label: "Smoke", color: "bg-accent" },
    { key: "vape", label: "Vape", color: "bg-secondary" },
    { key: "edible", label: "Edible", color: "bg-primary/60" },
    { key: "tincture", label: "Tincture", color: "bg-primary/40" },
    { key: "topical", label: "Topical", color: "bg-primary/30" },
    { key: "other", label: "Other", color: "bg-muted" },
  ] as const;

  // Only show methods that have been used
  const usedMethods = methods.filter((m) => distribution[m.key] > 0);

  if (usedMethods.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-foreground uppercase tracking-wide">
        Methods
      </h4>
      <div className="space-y-1.5">
        {usedMethods.map((method) => (
          <DistributionBar
            key={method.key}
            label={method.label}
            count={distribution[method.key]}
            total={total}
            color={method.color}
          />
        ))}
      </div>
    </div>
  );
}

function NoDataCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            No Recent Sessions
          </h3>
          <p className="text-sm text-muted-foreground">
            Log a session to see your weekly summary here.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function WeeklyUsageSection() {
  const { data, isLoading } = useWeeklyUsage();

  if (isLoading) {
    return (
      <section>
        <h2 className="font-serif text-lg font-medium text-foreground mb-4">
          Weekly Summary
        </h2>
        <Skeleton className="h-48 rounded-xl" />
      </section>
    );
  }

  if (!data || !data.hasData) {
    return (
      <section>
        <h2 className="font-serif text-lg font-medium text-foreground mb-4">
          Weekly Summary
        </h2>
        <NoDataCard />
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-lg font-medium text-foreground mb-4">
        Weekly Summary
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card variant="glass" className="overflow-hidden">
          <CardContent className="p-4 space-y-5">
            {/* Session Count Comparison */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Last 7 days
                </p>
                <p className="text-2xl font-serif font-medium text-foreground">
                  {data.thisWeekCount} session{data.thisWeekCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Previous 7 days
                </p>
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-lg text-muted-foreground">
                    {data.lastWeekCount}
                  </p>
                  {data.weekOverWeekChange !== null && data.weekOverWeekChange !== 0 && (
                    <span
                      className={`flex items-center text-xs ${
                        data.weekOverWeekChange > 0 ? "text-muted-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {data.weekOverWeekChange > 0 ? (
                        <Plus className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {Math.abs(data.weekOverWeekChange)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dose Distribution */}
            {data.thisWeekCount > 0 && (
              <DoseDistributionDisplay
                distribution={data.doseDistribution}
                total={data.thisWeekCount}
              />
            )}

            {/* Method Distribution */}
            {data.thisWeekCount > 0 && (
              <MethodDistributionDisplay
                distribution={data.methodDistribution}
                total={data.thisWeekCount}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Based on your last 7 days of logged sessions.
      </p>
    </section>
  );
}
