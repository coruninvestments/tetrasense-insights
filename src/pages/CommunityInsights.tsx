import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, AlertTriangle, Beaker, BarChart3, Shield, Target, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { SignalLeafLogo } from "@/components/brand/SignalLeafLogo";
import { useCommunityStrainStats } from "@/hooks/useCommunityStrainStats";
import { computeCommunityInsights, type RankedStrain, type TerpineCombination } from "@/lib/communityInsights";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell } from "recharts";

const typeColor: Record<string, string> = {
  indica: "bg-accent/20 text-accent-foreground",
  sativa: "bg-primary/15 text-primary",
  hybrid: "bg-secondary text-secondary-foreground",
};

const BAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.8)",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--primary) / 0.45)",
  "hsl(var(--primary) / 0.3)",
  "hsl(var(--primary) / 0.2)",
];

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

export default function CommunityInsights() {
  const { data: stats, isLoading } = useCommunityStrainStats();

  const insights = useMemo(() => {
    if (!stats || stats.length === 0) return null;
    return computeCommunityInsights(stats);
  }, [stats]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background aurora-bg">
        <header className="px-5 pt-12 pb-4 safe-top">
          <motion.div {...anim(0)}>
            <Link
              to="/explore"
              className="flex items-center gap-2 text-muted-foreground mb-3 hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Explore
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-medium text-foreground">Community Insights</h1>
                <p className="text-xs text-muted-foreground">
                  {insights
                    ? `${insights.totalStrains} strains · ${insights.totalSamples} sessions`
                    : "Aggregated & anonymized trends"}
                </p>
              </div>
            </div>
          </motion.div>
        </header>

        <div className="px-5 pb-28 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : !insights || insights.totalSamples === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* 1 — Top Strains Overall */}
              <motion.div {...anim(0.05)}>
                <SectionCard
                  icon={<TrendingUp className="w-4 h-4 text-primary" />}
                  title="Top Strains Overall"
                  subtitle="Highest community positive outcome rate"
                >
                  <StrainBarChart strains={insights.topOverall} />
                </SectionCard>
              </motion.div>

              {/* 2 — Top Focus Strains */}
              {insights.topFocusStrains.length > 0 && (
                <motion.div {...anim(0.1)}>
                  <SectionCard
                    icon={<Target className="w-4 h-4 text-primary" />}
                    title="Best for Focus"
                    subtitle="Community's top-rated strains for focus sessions"
                  >
                    <StrainRankingList strains={insights.topFocusStrains} />
                  </SectionCard>
                </motion.div>
              )}

              {/* 3 — Top Sleep Strains */}
              {insights.topSleepStrains.length > 0 && (
                <motion.div {...anim(0.15)}>
                  <SectionCard
                    icon={<Target className="w-4 h-4 text-accent-foreground" />}
                    title="Best for Sleep"
                    subtitle="Community's top-rated strains for sleep"
                  >
                    <StrainRankingList strains={insights.topSleepStrains} />
                  </SectionCard>
                </motion.div>
              )}

              {/* 4 — Top Relaxation Strains */}
              {insights.topRelaxStrains.length > 0 && (
                <motion.div {...anim(0.2)}>
                  <SectionCard
                    icon={<Target className="w-4 h-4 text-success" />}
                    title="Best for Relaxation"
                    subtitle="Community's top-rated strains for relaxation"
                  >
                    <StrainRankingList strains={insights.topRelaxStrains} />
                  </SectionCard>
                </motion.div>
              )}

              {/* 5 — Effect Combinations */}
              {insights.topEffectCombos.length > 0 && (
                <motion.div {...anim(0.25)}>
                  <SectionCard
                    icon={<Beaker className="w-4 h-4 text-primary" />}
                    title="Top Effect Combinations"
                    subtitle="Most successful effect profiles in the community"
                  >
                    <div className="space-y-2">
                      {insights.topEffectCombos.map((combo, i) => (
                        <EffectComboRow key={i} combo={combo} rank={i + 1} />
                      ))}
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {/* 6 — Anxiety Triggers */}
              {insights.anxietyTriggers.length > 0 && (
                <motion.div {...anim(0.3)}>
                  <SectionCard
                    icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
                    title="Common Anxiety Triggers"
                    subtitle="Effects appearing in sessions with higher avoid rates"
                  >
                    <div className="flex flex-wrap gap-2">
                      {insights.anxietyTriggers.map(trigger => (
                        <Badge
                          key={trigger}
                          className="text-xs bg-destructive/10 text-destructive border-0"
                        >
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {/* 7 — Dose Insight */}
              <motion.div {...anim(0.35)}>
                <SectionCard
                  icon={<BarChart3 className="w-4 h-4 text-primary" />}
                  title="Dose Insight"
                  subtitle="Community-wide observation"
                >
                  <p className="text-sm text-foreground">{insights.bestDoseInsight}</p>
                </SectionCard>
              </motion.div>

              {/* Privacy disclaimer */}
              <motion.div {...anim(0.4)}>
                <div className="flex items-start gap-2.5 px-1 py-3">
                  <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    All data is aggregated and anonymized. No individual user data or identifiers
                    are stored or displayed. Only users who have opted in to community sharing
                    contribute to these insights.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/* ── Sub-components ── */

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="glass">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function StrainBarChart({ strains }: { strains: RankedStrain[] }) {
  const chartData = strains.slice(0, 6).map(s => ({
    name: s.strainName.length > 14 ? s.strainName.slice(0, 12) + "…" : s.strainName,
    positive: s.positivePct,
    sessions: s.sampleSize,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickLine={false} axisLine={false} width={100} />
          <ReTooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${value}%`, "Positive"]}
          />
          <Bar dataKey="positive" radius={[0, 6, 6, 0]} barSize={16}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StrainRankingList({ strains }: { strains: RankedStrain[] }) {
  return (
    <div className="space-y-2">
      {strains.map((s, i) => (
        <div
          key={s.strainName}
          className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0"
        >
          <span className="text-xs text-muted-foreground font-medium w-5 text-center shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium truncate">{s.strainName}</p>
            <Badge className={`text-[9px] border-0 mt-0.5 ${typeColor[s.strainType] ?? "bg-secondary text-secondary-foreground"}`}>
              {s.strainType}
            </Badge>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium text-success">{s.positivePct}%</p>
            <p className="text-[10px] text-muted-foreground">{s.sampleSize} sessions</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EffectComboRow({ combo, rank }: { combo: TerpineCombination; rank: number }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground font-medium w-5 text-center shrink-0">
        {rank}
      </span>
      <div className="flex-1 flex flex-wrap gap-1">
        {combo.effects.map(e => (
          <Badge key={e} className="text-[10px] bg-primary/10 text-primary border-0">
            {e}
          </Badge>
        ))}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-medium text-success">{combo.avgPositive}%</p>
        <p className="text-[10px] text-muted-foreground">{combo.strainCount} strains</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-16 gap-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-serif text-lg text-foreground">No Community Data Yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Community insights will appear once enough users opt in and log sessions with library strains.
        </p>
      </div>
      <Link to="/profile">
        <Button variant="outline" size="sm">
          Enable Community Sharing
        </Button>
      </Link>
    </motion.div>
  );
}
