import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { Lightbulb } from "lucide-react";

type IntentFilter = string | null;
type TypeFilter = string | null;
type DoseFilter = string | null;

const INTENT_OPTIONS = ["sleep", "relaxation", "focus", "creativity", "pain_relief", "social", "recreation"] as const;
const TYPE_OPTIONS = ["indica", "sativa", "hybrid"] as const;
const DOSE_OPTIONS = ["low", "medium", "high"] as const;

const outcomeColor: Record<string, string> = {
  positive: "hsl(var(--primary))",
  neutral: "hsl(var(--muted-foreground))",
  negative: "hsl(var(--destructive))",
};

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

function generateTrendSummaries(sessions: any[]): string[] {
  if (!sessions || sessions.length < 3) return [];
  const summaries: string[] = [];

  // Group by intent and find best-performing dose level
  const intentDoseMap = new Map<string, Map<string, { pos: number; total: number }>>();
  for (const s of sessions) {
    if (!s.intent || !s.dose_level) continue;
    if (!intentDoseMap.has(s.intent)) intentDoseMap.set(s.intent, new Map());
    const doseMap = intentDoseMap.get(s.intent)!;
    const entry = doseMap.get(s.dose_level) ?? { pos: 0, total: 0 };
    entry.total++;
    if (normalizeOutcome(s.outcome) === "positive") entry.pos++;
    doseMap.set(s.dose_level, entry);
  }

  for (const [intent, doseMap] of intentDoseMap) {
    let bestDose = "";
    let bestRate = 0;
    for (const [dose, stats] of doseMap) {
      if (stats.total >= 2) {
        const rate = stats.pos / stats.total;
        if (rate > bestRate) { bestRate = rate; bestDose = dose; }
      }
    }
    if (bestDose && bestRate >= 0.6) {
      summaries.push(`You experience better ${intent} outcomes with ${bestDose} doses.`);
    }
  }

  // Time-of-day pattern
  const todMap = new Map<string, { pos: number; total: number }>();
  for (const s of sessions) {
    const tod = s.time_of_day;
    if (!tod) continue;
    const entry = todMap.get(tod) ?? { pos: 0, total: 0 };
    entry.total++;
    if (normalizeOutcome(s.outcome) === "positive") entry.pos++;
    todMap.set(tod, entry);
  }
  let bestTod = "";
  let bestTodRate = 0;
  for (const [tod, stats] of todMap) {
    if (stats.total >= 3) {
      const rate = stats.pos / stats.total;
      if (rate > bestTodRate) { bestTodRate = rate; bestTod = tod; }
    }
  }
  if (bestTod && bestTodRate >= 0.65) {
    summaries.push(`Your ${bestTod} sessions tend to have the best outcomes.`);
  }

  return summaries.slice(0, 2);
}

export function PatternTimelineSection() {
  const { data: sessions, isLoading } = useSessionLogs();
  const navigate = useNavigate();
  const [intentFilter, setIntentFilter] = useState<IntentFilter>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(null);
  const [doseFilter, setDoseFilter] = useState<DoseFilter>(null);

  const filtered = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter(s => {
      if (intentFilter && s.intent !== intentFilter) return false;
      if (typeFilter && s.strain_type?.toLowerCase() !== typeFilter) return false;
      if (doseFilter && s.dose_level !== doseFilter) return false;
      return true;
    });
  }, [sessions, intentFilter, typeFilter, doseFilter]);

  const chartData = useMemo(() => {
    return filtered
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((s, i) => ({
        id: s.id,
        index: i,
        date: new Date(s.created_at).getTime(),
        dateLabel: format(new Date(s.created_at), "MMM d"),
        intent: s.intent,
        strain: s.strain_name_text,
        doseLevel: s.dose_level ?? "—",
        outcome: normalizeOutcome(s.outcome),
        outcomeVal: normalizeOutcome(s.outcome) === "positive" ? 3 : normalizeOutcome(s.outcome) === "neutral" ? 2 : 1,
      }));
  }, [filtered]);

  const handleDotClick = useCallback((data: any) => {
    if (data?.id) navigate(`/session/${data.id}`);
  }, [navigate]);

  const trends = useMemo(() => generateTrendSummaries(filtered), [filtered]);

  if (isLoading) {
    return <Card><CardContent className="p-5"><Skeleton className="h-48 rounded-xl" /></CardContent></Card>;
  }

  if (!sessions || sessions.length < 3) {
    return (
      <Card>
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Log at least 3 sessions to see your pattern timeline.</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
        <p className="font-medium text-foreground">{d.dateLabel}</p>
        <p className="text-muted-foreground">
          <span className="capitalize">{d.intent}</span> · {d.strain}
        </p>
        <p className="text-muted-foreground">Dose: {d.doseLevel}</p>
        <Badge
          variant={d.outcome === "positive" ? "default" : d.outcome === "neutral" ? "secondary" : "destructive"}
          className="text-[10px]"
        >
          {d.outcome}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Trend summaries */}
      {trends.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-2">
            {trends.map((trend, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground leading-relaxed">{trend}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center mr-1">Intent</span>
          {INTENT_OPTIONS.map(i => (
            <FilterChip key={i} label={i} active={intentFilter === i} onClick={() => setIntentFilter(intentFilter === i ? null : i)} />
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center mr-1">Type</span>
          {TYPE_OPTIONS.map(t => (
            <FilterChip key={t} label={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? null : t)} />
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center mr-1">Dose</span>
          {DOSE_OPTIONS.map(d => (
            <FilterChip key={d} label={d} active={doseFilter === d} onClick={() => setDoseFilter(doseFilter === d ? null : d)} />
          ))}
        </div>
      </div>

      {/* Chart */}
      <Card className="halo-focus overflow-hidden">
        <CardContent className="p-4 relative z-[1]">
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No sessions match these filters.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, bottom: 24, left: -20 }}>
                  <XAxis
                    dataKey="date"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v) => format(new Date(v), "M/d")}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="outcomeVal"
                    type="number"
                    domain={[0.5, 3.5]}
                    ticks={[1, 2, 3]}
                    tickFormatter={(v) => v === 3 ? "👍" : v === 2 ? "😐" : "👎"}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <RechartsTooltip content={<CustomTooltipContent />} />
                  <Scatter data={chartData} fill="hsl(var(--primary))" cursor="pointer" onClick={handleDotClick}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={outcomeColor[entry.outcome] ?? outcomeColor.neutral} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            {[
              { label: "Positive", color: outcomeColor.positive },
              { label: "Neutral", color: outcomeColor.neutral },
              { label: "Negative", color: outcomeColor.negative },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
