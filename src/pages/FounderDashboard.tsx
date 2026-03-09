import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Activity, Zap, Trophy, BarChart3,
  Leaf, ArrowLeft, RefreshCw, Clock, Shield,
  Star, Target, TrendingUp, Lightbulb,
  Layers, HeartPulse, Gauge, AlertTriangle,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { fetchFounderMetrics, ACHIEVEMENT_LABELS, METHOD_LABELS, generateDiagnosticInsights, type TimeRange } from "@/lib/founderMetrics";
import { PreBetaToolsPanel } from "@/components/admin/PreBetaToolsPanel";
import { FounderMetricCard } from "@/components/admin/FounderMetricCard";
import { FounderChartCard } from "@/components/admin/FounderChartCard";
import { DiagnosticInsightsPanel } from "@/components/admin/DiagnosticInsightsPanel";
import { ActivationFunnelSection } from "@/components/admin/ActivationFunnelSection";
import { DataQualitySection } from "@/components/admin/DataQualitySection";
import { RetentionSection } from "@/components/admin/RetentionSection";
import { FeatureAdoptionSection } from "@/components/admin/FeatureAdoptionSection";
import { SupportHealthSection } from "@/components/admin/SupportHealthSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "All time", value: "all" },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

export default function FounderDashboard() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [range, setRange] = useState<TimeRange>("all");

  const { data: metrics, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["founder-metrics", range],
    queryFn: () => fetchFounderMetrics(range),
    enabled: isAdmin,
    staleTime: 60_000,
    retry: 1,
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const m = metrics;
  const diagnostics = m ? generateDiagnosticInsights(m) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-lg font-medium text-foreground">Founder Intelligence</h1>
            <p className="text-xs text-muted-foreground">App Health · Admin only</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Time range filter */}
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ═══ 1. App Health Overview ═══ */}
        <section className="space-y-3">
          <SectionHeader icon={Gauge} label="App Health Overview" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <FounderMetricCard label="Total Users" value={m?.users.total ?? "—"} icon={<Users className="w-4 h-4 text-primary" />} loading={isLoading} />
            <FounderMetricCard label="Active 7d" value={m?.users.active7d ?? "—"} icon={<Activity className="w-4 h-4 text-primary" />} loading={isLoading} />
            <FounderMetricCard label="Total Sessions" value={m?.sessions.total ?? "—"} icon={<Zap className="w-4 h-4 text-primary" />} loading={isLoading} />
            <FounderMetricCard label="Avg / User" value={m?.sessions.avgPerUser ?? "—"} icon={<BarChart3 className="w-4 h-4 text-primary" />} loading={isLoading} />
            <FounderMetricCard label="New (7d)" value={m?.users.newUsers7d ?? "—"} icon={<TrendingUp className="w-4 h-4 text-primary" />} loading={isLoading} />
            <FounderMetricCard label="Premium" value={m?.users.premium ?? "—"} icon={<Star className="w-4 h-4 text-primary" />} loading={isLoading} />
          </div>

          {/* Diagnostic insights */}
          {diagnostics.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Diagnostic Insights</p>
              </div>
              <DiagnosticInsightsPanel insights={diagnostics} />
            </div>
          )}
        </section>

        {/* Sessions Over Time */}
        <FounderChartCard title="Sessions Over Time" loading={isLoading}>
          {m && m.sessionsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={m.sessionsOverTime}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No session data</p>
          )}
        </FounderChartCard>

        {/* ═══ 2. Activation Funnel ═══ */}
        <section className="space-y-3">
          <SectionHeader icon={Target} label="Activation Funnel" />
          {m ? <ActivationFunnelSection metrics={m} loading={isLoading} /> : <SkeletonBlock />}
        </section>

        {/* ═══ 3. Data Quality ═══ */}
        <section className="space-y-3">
          <SectionHeader icon={Shield} label="Data Quality" />
          {m ? <DataQualitySection metrics={m} loading={isLoading} /> : <SkeletonBlock />}
        </section>

        {/* ═══ 4. Retention Proxies ═══ */}
        <section className="space-y-3">
          <SectionHeader icon={HeartPulse} label="Retention Proxies" />
          {m ? <RetentionSection metrics={m} loading={isLoading} /> : <SkeletonBlock />}
        </section>

        {/* ═══ 5. Feature Adoption ═══ */}
        <section className="space-y-3">
          <SectionHeader icon={Layers} label="Feature Adoption" />
          {m ? <FeatureAdoptionSection metrics={m} loading={isLoading} /> : <SkeletonBlock />}
        </section>

        {/* ═══ 6. Support / Issue Load ═══ */}
        <section className="space-y-3">
          <SectionHeader icon={AlertTriangle} label="Support &amp; Issue Load" />
          {m ? <SupportHealthSection metrics={m} loading={isLoading} /> : <SkeletonBlock />}
        </section>

        {/* ── Charts row: Methods + Dose ── */}
        <div className="grid md:grid-cols-2 gap-4">
          <FounderChartCard title="Method Distribution" loading={isLoading}>
            {m && m.methodDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={m.methodDistribution.map((d) => ({ ...d, method: METHOD_LABELS[d.method] || d.method }))}>
                  <XAxis dataKey="method" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No data</p>
            )}
          </FounderChartCard>

          <FounderChartCard title="Dose Level Distribution" loading={isLoading}>
            {m && Object.keys(m.doseDistribution).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={Object.entries(m.doseDistribution).map(([name, value]) => ({ name, value }))}
                    cx="50%" cy="50%" outerRadius={70} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {Object.entries(m.doseDistribution).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No data</p>
            )}
          </FounderChartCard>
        </div>

        {/* Top lists */}
        <div className="grid md:grid-cols-2 gap-4">
          <FounderChartCard title="Most Logged Strains" loading={isLoading}>
            {m && m.topStrains.length > 0 ? (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {m.topStrains.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30">
                    <span className="text-xs font-medium text-primary w-5 shrink-0">#{i + 1}</span>
                    <span className="text-sm text-foreground flex-1 truncate">{s.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{s.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No data</p>
            )}
          </FounderChartCard>

          <FounderChartCard title="Top Achievements Unlocked" loading={isLoading}>
            {m && m.topAchievements.length > 0 ? (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {m.topAchievements.map((a) => (
                  <div key={a.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30">
                    <span className="text-sm text-foreground flex-1 truncate">{ACHIEVEMENT_LABELS[a.key] || a.key}</span>
                    <Badge variant="secondary" className="text-[10px]">{a.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No achievements yet</p>
            )}
          </FounderChartCard>
        </div>

        {/* ── Pre-Beta Tools ── */}
        <section className="space-y-3">
          <SectionHeader icon={Target} label="Pre-Beta Tools" />
          <PreBetaToolsPanel />
        </section>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Signal Leaf · Founder Intelligence · Not for public use</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-medium text-foreground">{label}</h2>
    </div>
  );
}

function SkeletonBlock() {
  return <div className="h-32 rounded-xl bg-secondary/30 animate-pulse" />;
}
