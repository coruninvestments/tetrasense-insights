import { motion } from "framer-motion";
import { TrendingUp, Droplets, Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useInsights } from "@/hooks/useInsights";
import { useSessionStats } from "@/hooks/useSessionLogs";

export function QuickStatsCard() {
  const { data: insights } = useInsights();
  const { data: stats } = useSessionStats();

  const positiveRate = insights?.weeklyPositiveRate ?? 0;
  const totalSessions = stats?.totalSessions ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <StatItem
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
              label="Positive"
              value={totalSessions > 0 ? `${positiveRate}%` : "—"}
            />
            <StatItem
              icon={<Droplets className="w-4 h-4 text-primary" />}
              label="Top Terpene"
              value={totalSessions > 0 ? "Myrcene" : "—"}
            />
            <StatItem
              icon={<Gauge className="w-4 h-4 text-primary" />}
              label="Typical Dose"
              value={totalSessions > 0 ? "Medium" : "—"}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-lg font-serif font-medium text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      </div>
    </div>
  );
}
