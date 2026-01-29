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
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-foreground uppercase tracking-wide">
        Dose Levels
      </h4>
      <div className="space-y-1.5">
        <DistributionBar label="Low" count={distribution.low} total={total} color="bg-emerald-500" />
        <DistributionBar label="Medium" count={distribution.medium} total={total} color="bg-amber-500" />
        <DistributionBar label="High" count={distribution.high} total={total} color="bg-rose-500" />
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
    { key: "smoke", label: "Smoke", color: "bg-orange-500" },
    { key: "vape", label: "Vape", color: "bg-sky-500" },
    { key: "edible", label: "Edible", color: "bg-violet-500" },
    { key: "tincture", label: "Tincture", color: "bg-teal-500" },
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
                  This Week
                </p>
                <p className="text-2xl font-serif font-medium text-foreground">
                  {data.thisWeekCount} session{data.thisWeekCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Last Week
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
        Based on the last 7 days of logged sessions.
      </p>
    </section>
  );
}
