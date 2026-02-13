import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, TrendingUp, Lock, CheckCircle2, Settings, Beaker, FlaskConical } from "lucide-react";
import { useCommunityStrainStats } from "@/hooks/useCommunityStrainStats";
import { usePublicBatchBrowse } from "@/hooks/usePublicBatchBrowse";
import { useProfile } from "@/hooks/useProfile";
import { useEntitlements } from "@/hooks/useEntitlements";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const INTENTS = [
  { value: "", label: "All" },
  { value: "sleep", label: "Sleep" },
  { value: "relaxation", label: "Relaxation" },
  { value: "creativity", label: "Creativity" },
  { value: "focus", label: "Focus" },
  { value: "pain_relief", label: "Pain Relief" },
  { value: "social", label: "Social" },
  { value: "recreation", label: "Recreation" },
];

const STRAIN_TYPES = [
  { value: "", label: "All Types" },
  { value: "indica", label: "Indica" },
  { value: "sativa", label: "Sativa" },
  { value: "hybrid", label: "Hybrid" },
];

const METHODS = [
  { value: "", label: "All Methods" },
  { value: "smoke", label: "Smoke" },
  { value: "vape", label: "Vape" },
  { value: "edible", label: "Edible" },
  { value: "tincture", label: "Tincture" },
];

const typeColor: Record<string, string> = {
  indica: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  sativa: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  hybrid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

function FilterChips({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selected === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function LockedSection({ title, children, isPremium }: { title: string; children: React.ReactNode; isPremium: boolean }) {
  if (isPremium) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <Badge variant="secondary" className="text-[10px] ml-auto">Premium</Badge>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Badge variant="secondary" className="text-[10px] ml-auto">Premium</Badge>
      </div>
      <div className="pointer-events-none opacity-40 select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[2px]">
        <div className="text-center space-y-1.5">
          <Lock className="w-5 h-5 mx-auto text-primary" />
          <p className="text-xs font-medium text-foreground">Unlock with Premium</p>
          <p className="text-[10px] text-muted-foreground">$4.99/mo for precision filters</p>
        </div>
      </div>
    </div>
  );
}

function CommunityOptInBadge() {
  const { data: profile } = useProfile();

  if (!profile) return null;

  if (profile.community_sharing_enabled) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] text-primary font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Contributing anonymously
      </div>
    );
  }

  return (
    <Link
      to="/profile"
      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted/80 transition-colors"
    >
      <Settings className="w-3.5 h-3.5" />
      Help improve insights (optional)
    </Link>
  );
}

function StrainCard({ stat, showIntent }: { stat: any; showIntent: boolean }) {
  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-serif text-base font-medium text-foreground">
              {stat.strain_name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] capitalize ${typeColor[stat.strain_type?.toLowerCase()] ?? ""}`}
              >
                {stat.strain_type}
              </Badge>
              {showIntent && (
                <span className="text-[10px] text-muted-foreground capitalize">
                  {stat.intent?.replace("_", " ")}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{stat.sample_size}</span>
            </div>
          </div>
        </div>

        {stat.top_effects?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {stat.top_effects.slice(0, 3).map((effect: string) => (
              <span
                key={effect}
                className="rounded-md bg-accent/50 px-2 py-0.5 text-[11px] text-accent-foreground capitalize"
              >
                {effect.replace("_", " ")}
              </span>
            ))}
          </div>
        )}

        {stat.outcome_positive_pct !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Outcome breakdown</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {stat.outcome_positive_pct != null && stat.outcome_positive_pct > 0 && (
                <div className="bg-emerald-500 transition-all" style={{ width: `${stat.outcome_positive_pct}%` }} />
              )}
              {stat.outcome_neutral_pct != null && stat.outcome_neutral_pct > 0 && (
                <div className="bg-amber-500 transition-all" style={{ width: `${stat.outcome_neutral_pct}%` }} />
              )}
              {stat.outcome_avoid_pct != null && stat.outcome_avoid_pct > 0 && (
                <div className="bg-red-400 transition-all" style={{ width: `${stat.outcome_avoid_pct}%` }} />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>👍 {stat.outcome_positive_pct}%</span>
              <span>😐 {stat.outcome_neutral_pct ?? 0}%</span>
              <span>👎 {stat.outcome_avoid_pct ?? 0}%</span>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/60">
          Updated {format(new Date(stat.last_updated), "MMM d, yyyy")}
        </p>
      </CardContent>
    </Card>
  );
}

function BatchCard({ batch }: { batch: any }) {
  const thca = batch.lab_panel_common?.THCa;
  const totalTerps = batch.lab_panel_common?.total_terpenes;

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="font-serif text-sm font-medium text-foreground">
              {batch.product_name}
            </h3>
            {batch.brand_name && (
              <p className="text-[11px] text-muted-foreground">{batch.brand_name}</p>
            )}
          </div>
          {batch.strain_type && (
            <Badge variant="outline" className={`text-[10px] capitalize ${typeColor[batch.strain_type?.toLowerCase()] ?? ""}`}>
              {batch.strain_type}
            </Badge>
          )}
        </div>

        {batch.strain_name && (
          <p className="text-[11px] text-muted-foreground">
            Strain: <span className="text-foreground">{batch.strain_name}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-[11px]">
          {thca != null && (
            <span className="rounded-md bg-accent/50 px-2 py-0.5 text-accent-foreground">
              THCa: {thca}%
            </span>
          )}
          {totalTerps != null && (
            <span className="rounded-md bg-accent/50 px-2 py-0.5 text-accent-foreground">
              Terps: {totalTerps}%
            </span>
          )}
          {batch.batch_code && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              Batch: {batch.batch_code}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
          <span>{batch.coa_status === "verified" ? "✅ Verified COA" : "Unverified"}</span>
          {batch.tested_at && <span>Tested {format(new Date(batch.tested_at), "MMM yyyy")}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: React.ElementType; message: string; sub: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-sm">
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p>{message}</p>
      <p className="text-xs mt-1">{sub}</p>
    </div>
  );
}

export default function CommunityExplore() {
  const [selectedIntent, setSelectedIntent] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [activeTab, setActiveTab] = useState("strains");

  const { data: stats, isLoading: statsLoading } = useCommunityStrainStats(selectedIntent || undefined);
  const { data: batches, isLoading: batchesLoading } = usePublicBatchBrowse();
  const { isPremium } = useEntitlements();

  // Client-side type filter (community_strain_stats doesn't have a type filter column for querying)
  const filteredStats = (stats ?? []).filter((s) => {
    if (selectedType && s.strain_type?.toLowerCase() !== selectedType) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-5 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold text-foreground">Explore</h1>
            <p className="text-sm text-muted-foreground">
              Community patterns from anonymized data.
            </p>
          </div>
          <CommunityOptInBadge />
        </div>

        {/* Privacy notice */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          <span>
            All data is aggregated and anonymized. No individual sessions or personal details are shown.
          </span>
        </div>

        {/* Tabs: Strains vs Batches */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="strains" className="flex-1 gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Top Strains
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex-1 gap-1.5">
              <Beaker className="w-3.5 h-3.5" />
              Public Batches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strains" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="space-y-2">
              <FilterChips options={INTENTS} selected={selectedIntent} onSelect={setSelectedIntent} />
              <FilterChips options={STRAIN_TYPES} selected={selectedType} onSelect={setSelectedType} />
            </div>

            {/* Premium: Batch Precision Filters */}
            <LockedSection title="Batch Precision Filters" isPremium={isPremium}>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-foreground">THCa Range</label>
                  <Slider defaultValue={[15, 25]} min={0} max={35} step={1} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>15%</span><span>25%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-foreground">Total Terpenes Range</label>
                  <Slider defaultValue={[1, 4]} min={0} max={8} step={0.5} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>1%</span><span>4%</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch disabled /> Avoid dry eyes
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch disabled /> Avoid dry mouth
                  </label>
                </div>
              </div>
            </LockedSection>

            {/* Results */}
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredStats.length === 0 ? (
              <EmptyState
                icon={Users}
                message="No community data available yet."
                sub="Data will appear once enough sessions are aggregated."
              />
            ) : (
              <div className="space-y-3">
                {filteredStats.map((stat, index) => (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <StrainCard stat={stat} showIntent={selectedIntent === ""} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Premium: Batch-level Insights */}
            <LockedSection title="Batch-level Insights" isPremium={isPremium}>
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {["Relaxed", "Euphoric", "Sleepy"].map((e) => (
                    <span key={e} className="rounded-md bg-accent/50 px-2 py-0.5 text-[11px] text-accent-foreground">
                      {e}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Top effects and side-effect likelihood for specific batches.
                </p>
              </div>
            </LockedSection>
          </TabsContent>

          <TabsContent value="batches" className="space-y-4 mt-4">
            {batchesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : !batches || batches.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                message="No public batches available yet."
                sub="Public library batches will appear here as they're curated."
              />
            ) : (
              <div className="space-y-3">
                {batches.map((batch, index) => (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <BatchCard batch={batch} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
