import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeTolerance } from "@/lib/toleranceEngine";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function ToleranceTrendCard() {
  const { data: sessions } = useSessionLogs();
  const result = computeTolerance(sessions ?? []);

  if (!result.ready) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Tolerance Trend</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Log at least 3 sessions to see tolerance trends over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = result.weeklySnapshots.map((s) => ({
    week: s.week.slice(5), // MM-DD
    score: s.score,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Tolerance Trend</h3>
            </div>
            <span className="text-xs font-medium text-primary">{result.level}</span>
          </div>

          {/* Chart */}
          {chartData.length >= 2 ? (
            <div className="h-32 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="toleranceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value}`, "Score"]}
                    labelFormatter={(label) => `Week of ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#toleranceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              More weeks of data needed for trend visualization.
            </p>
          )}

          {/* Explanation */}
          {result.reasons.length > 0 && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {result.reasons[0]}
              {result.reasons.length > 1 && `. ${result.reasons[1]}`}
            </p>
          )}

          {/* Recovery note */}
          {result.recoveryEstimate && (
            <div className="rounded-lg bg-accent/50 px-3 py-2">
              <p className="text-xs text-accent-foreground leading-relaxed">
                🌿 {result.recoveryEstimate}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
