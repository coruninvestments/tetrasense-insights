import { FounderMetricCard } from "./FounderMetricCard";
import { FounderChartCard } from "./FounderChartCard";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Bug, HelpCircle, MessageSquare, Clock, BarChart3 } from "lucide-react";
import type { FounderMetrics } from "@/lib/founderMetrics";

interface Props {
  metrics: FounderMetrics;
  loading: boolean;
}

export function SupportHealthSection({ metrics: m, loading }: Props) {
  const bugTrendData = (m.supportHealth.bugTrend ?? []).map((count, i) => ({
    label: i === 0 ? "This week" : i === 1 ? "Last week" : `${i + 1}w ago`,
    count,
  })).reverse();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <FounderMetricCard label="Total Tickets" value={m.supportHealth.total} icon={<MessageSquare className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Bugs" value={m.supportHealth.byType?.bug ?? 0} icon={<Bug className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Support" value={m.supportHealth.byType?.support ?? 0} icon={<HelpCircle className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Unresolved" value={m.supportHealth.unresolved} icon={<Clock className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Support:Feedback" value={m.supportHealth.supportFeedbackRatio != null ? `${m.supportHealth.supportFeedbackRatio}:1` : "—"} icon={<BarChart3 className="w-4 h-4 text-primary" />} loading={loading} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FounderChartCard title="Bug Trend (4 weeks)" loading={loading}>
          {bugTrendData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={bugTrendData}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No bugs reported</p>
          )}
        </FounderChartCard>

        <FounderChartCard title="Recent Tickets" loading={loading}>
          {m.supportHealth.recent.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {m.supportHealth.recent.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30">
                  <Badge variant="secondary" className="text-[10px] capitalize">{t.type}</Badge>
                  <span className="text-xs text-muted-foreground flex-1">{new Date(t.created_at).toLocaleDateString()}</span>
                  <Badge variant={t.status === "new" ? "default" : "secondary"} className="text-[10px] capitalize">{t.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No tickets</p>
          )}
        </FounderChartCard>
      </div>
    </div>
  );
}
