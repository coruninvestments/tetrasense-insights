import { FounderMetricCard } from "./FounderMetricCard";
import { FounderChartCard } from "./FounderChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Target, Clock, Fingerprint, CreditCard, Beaker } from "lucide-react";
import type { FounderMetrics } from "@/lib/founderMetrics";

interface Props {
  metrics: FounderMetrics;
  loading: boolean;
}

export function ActivationFunnelSection({ metrics: m, loading }: Props) {
  const funnelData = [
    { label: "Signed up", value: m.users.total },
    { label: "1+ session", value: m.challenge.started },
    { label: "3+ sessions", value: m.challenge.reached3 },
    { label: "5+ sessions", value: m.challenge.reached5 },
    { label: "10+ sessions", value: m.challenge.reached10 },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FounderMetricCard label="Activation Rate" value={`${m.activation.activationRate}%`} sub="≥5 sessions / total" icon={<Target className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Avg → 1st Session" value={m.activation.avgTimeToFirst != null ? `${m.activation.avgTimeToFirst}d` : "—"} icon={<Clock className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Avg → 5 Sessions" value={m.activation.avgTimeTo5 != null ? `${m.activation.avgTimeTo5}d` : "—"} icon={<Clock className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Avg → 10 Sessions" value={m.activation.avgTimeTo10 != null ? `${m.activation.avgTimeTo10}d` : "—"} icon={<Clock className="w-4 h-4 text-primary" />} loading={loading} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FounderMetricCard label="Fingerprint" value={m.unlocks.fingerprint} icon={<Fingerprint className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Signal Card" value={m.unlocks.signalCard} icon={<CreditCard className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Genome" value={m.unlocks.genome} icon={<Beaker className="w-4 h-4 text-primary" />} loading={loading} />
      </div>

      <FounderChartCard title="Activation Funnel" loading={loading}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
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
