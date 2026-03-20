import { FounderMetricCard } from "./FounderMetricCard";
import { FounderChartCard } from "./FounderChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Target, Users, Activity, Repeat } from "lucide-react";

export interface BetaMetrics {
  totalUsers: number;
  pctReaching2: number;
  pctReaching5: number;
  avgSessionsPerUser: number;
  retention24h: number;
  retention7d: number;
}

interface Props {
  metrics: BetaMetrics;
  loading: boolean;
}

export function BetaActivationSection({ metrics: m, loading }: Props) {
  const funnelData = [
    { label: "All Users", value: m.totalUsers },
    { label: "≥2 Sessions", value: Math.round((m.pctReaching2 / 100) * m.totalUsers) },
    { label: "≥5 Sessions", value: Math.round((m.pctReaching5 / 100) * m.totalUsers) },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <FounderMetricCard
          label="Total Users"
          value={m.totalUsers}
          icon={<Users className="w-4 h-4 text-primary" />}
          loading={loading}
        />
        <FounderMetricCard
          label="% Reaching 2 Sessions"
          value={`${m.pctReaching2}%`}
          icon={<Target className="w-4 h-4 text-primary" />}
          loading={loading}
        />
        <FounderMetricCard
          label="% Reaching 5 Sessions"
          value={`${m.pctReaching5}%`}
          icon={<Target className="w-4 h-4 text-primary" />}
          loading={loading}
        />
        <FounderMetricCard
          label="Avg Sessions / User"
          value={m.avgSessionsPerUser}
          icon={<Activity className="w-4 h-4 text-primary" />}
          loading={loading}
        />
        <FounderMetricCard
          label="24h Retention"
          value={`${m.retention24h}%`}
          icon={<Repeat className="w-4 h-4 text-primary" />}
          loading={loading}
        />
        <FounderMetricCard
          label="7d Retention"
          value={`${m.retention7d}%`}
          icon={<Repeat className="w-4 h-4 text-primary" />}
          loading={loading}
        />
      </div>

      <FounderChartCard title="Beta Activation Funnel" loading={loading}>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={funnelData} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={90} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </FounderChartCard>
    </div>
  );
}
