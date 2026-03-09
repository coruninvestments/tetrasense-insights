import { FounderMetricCard } from "./FounderMetricCard";
import { Users, Activity, Repeat, CalendarCheck, ArrowUpDown } from "lucide-react";
import type { FounderMetrics } from "@/lib/founderMetrics";

interface Props {
  metrics: FounderMetrics;
  loading: boolean;
}

export function RetentionSection({ metrics: m, loading }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <FounderMetricCard label="Active 7d" value={m.retention.active7d} icon={<Users className="w-4 h-4 text-primary" />} loading={loading} />
      <FounderMetricCard label="Active 30d" value={m.retention.active30d} icon={<Users className="w-4 h-4 text-primary" />} loading={loading} />
      <FounderMetricCard label="Avg / Active User" value={m.retention.avgSessionsPerActiveUser} icon={<Activity className="w-4 h-4 text-primary" />} loading={loading} />
      <FounderMetricCard label="Avg Days Between" value={m.retention.avgDaysBetweenSessions != null ? `${m.retention.avgDaysBetweenSessions}d` : "—"} icon={<ArrowUpDown className="w-4 h-4 text-primary" />} loading={loading} />
      <FounderMetricCard label="Weekly Returning" value={m.retention.weeklyReturning} icon={<Repeat className="w-4 h-4 text-primary" />} loading={loading} />
    </div>
  );
}
