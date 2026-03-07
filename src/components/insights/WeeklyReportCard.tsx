import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, TrendingUp, AlertTriangle, Beaker, Target, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { generateWeeklyInsights, type WeeklyInsightReport } from "@/lib/weeklyInsights";

export function WeeklyReportCard() {
  const { data: sessions } = useSessionLogs();

  const report = useMemo(() => {
    if (!sessions) return null;
    return generateWeeklyInsights(sessions);
  }, [sessions]);

  if (!report) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Your Week in Cannabis</h3>
                <p className="text-[11px] text-muted-foreground">
                  {report.sessionCount} session{report.sessionCount !== 1 ? "s" : ""} · {report.positiveRate}% positive
                </p>
              </div>
            </div>
            <PositiveRateBadge rate={report.positiveRate} />
          </div>

          {/* Insight bullets */}
          <div className="space-y-2.5">
            <InsightBullet
              icon={<TrendingUp className="w-3.5 h-3.5 text-success" />}
              label="Best session"
              value={report.bestSession}
            />
            <InsightBullet
              icon={<Target className="w-3.5 h-3.5 text-primary" />}
              label="Best dose"
              value={report.bestDoseRange}
            />
            <InsightBullet
              icon={<Beaker className="w-3.5 h-3.5 text-primary" />}
              label="Terpene trend"
              value={report.terpeneTrend}
            />
            {report.riskPattern !== "No negative patterns detected this week" && (
              <InsightBullet
                icon={<AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                label="Watch out"
                value={report.riskPattern}
              />
            )}
          </div>

          {/* Chart placeholder */}
          <div className="h-12 rounded-lg bg-muted/30 flex items-center justify-center">
            <div className="flex items-center gap-4">
              {Array.from({ length: 7 }).map((_, i) => {
                const height = 12 + Math.random() * 24;
                return (
                  <div
                    key={i}
                    className="w-2 rounded-full bg-primary/30"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-2 pt-1 border-t border-border/50">
            <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {report.recommendation}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InsightBullet({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
        <p className="text-xs text-foreground leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function PositiveRateBadge({ rate }: { rate: number }) {
  const color =
    rate >= 70
      ? "bg-success/15 text-success"
      : rate >= 40
      ? "bg-primary/15 text-primary"
      : "bg-destructive/15 text-destructive";

  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${color}`}>
      {rate}%
    </span>
  );
}
