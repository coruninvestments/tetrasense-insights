import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { Dna, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeCannabisGenome } from "@/lib/cannabisGenome";
import { InsightUnlockCard } from "./InsightUnlockCard";

const CONFIDENCE_STYLE: Record<string, { label: string; className: string }> = {
  Low: { label: "Early Signal", className: "bg-warning/15 text-warning" },
  Medium: { label: "Growing", className: "bg-info/15 text-info" },
  High: { label: "Strong Signal", className: "bg-success/15 text-success" },
};

export function CannabisGenomeCard() {
  const { data: sessions, isLoading } = useSessionLogs();

  const genome = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return computeCannabisGenome(sessions);
  }, [sessions]);

  if (isLoading) {
    return (
      <Card variant="glass" className="p-6">
        <div className="h-[280px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  if (!genome) {
    return (
      <InsightUnlockCard
        icon={Dna}
        title="Your Cannabis Genome"
        subtitle="Log at least 3 sessions to see how cannabis affects you personally."
        current={sessions?.length ?? 0}
        target={3}
      />
    );
  }

  const chartData = genome.dimensions.map((d) => ({
    subject: d.label,
    value: d.score,
    fullMark: 10,
  }));

  const conf = CONFIDENCE_STYLE[genome.confidence] ?? CONFIDENCE_STYLE.Low;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Dna className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Your Cannabis Genome</h3>
                <p className="text-[11px] text-muted-foreground">
                  Based on {genome.sessionCount} session{genome.sessionCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Badge className={conf.className}>{conf.label}</Badge>
          </div>

          {/* Radar Chart */}
          <div className="w-full h-[260px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
                <PolarGrid
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    padding: "6px 10px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} / 10`, "Score"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Dimension pills */}
          <div className="grid grid-cols-3 gap-2">
            {genome.dimensions.map((d) => (
              <div
                key={d.key}
                className="bg-secondary/50 rounded-lg px-2.5 py-2 text-center"
              >
                <p className="text-xs font-medium text-foreground">
                  {d.score.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {d.label}
                </p>
              </div>
            ))}
          </div>

          {/* Confidence message */}
          <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {genome.message}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
