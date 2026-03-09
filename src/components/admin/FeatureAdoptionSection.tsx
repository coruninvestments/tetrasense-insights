import { FounderMetricCard } from "./FounderMetricCard";
import { Badge } from "@/components/ui/badge";
import { Zap, BarChart3, Repeat, ArrowUpDown, CalendarCheck } from "lucide-react";
import type { FounderMetrics } from "@/lib/founderMetrics";

interface Props {
  metrics: FounderMetrics;
  loading: boolean;
}

export function FeatureAdoptionSection({ metrics: m, loading }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FounderMetricCard label="Quick Log Rate" value={`${m.featureAdoption.quickLogRate}%`} icon={<Zap className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Full Log Rate" value={`${m.featureAdoption.fullLogRate}%`} icon={<BarChart3 className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Compare Usage" value={m.featureAdoption.compareUsage} icon={<ArrowUpDown className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Export Usage" value={m.featureAdoption.exportUsage} icon={<CalendarCheck className="w-4 h-4 text-primary" />} loading={loading} />
      </div>

      {!loading && m.featureAdoption.mostUsedEvents.length > 0 && (
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Most Tracked Events</p>
          <div className="space-y-1.5">
            {m.featureAdoption.mostUsedEvents.map((e) => (
              <div key={e.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30">
                <span className="text-sm text-foreground flex-1 truncate">{e.name}</span>
                <Badge variant="secondary" className="text-[10px]">{e.count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
