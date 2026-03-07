import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, ShieldCheck, ShieldAlert, Clock, Beaker, BarChart3, Leaf, Trophy, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { SignalLeafLogo } from "@/components/brand/SignalLeafLogo";
import { useStrains, formatPotencyRange } from "@/hooks/useStrains";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { usePublicBatchBrowse } from "@/hooks/usePublicBatchBrowse";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { bestQualityForBatches, type QualityResult } from "@/lib/productQuality";
import { computeStrainRankings } from "@/lib/bestForYou";
import { BrandImage } from "@/components/brand/BrandImage";
import { ASSETS } from "@/lib/assets";
import { Button } from "@/components/ui/button";
import { QualityScorePill } from "@/components/product/QualityScore";

const TYPE_OPTIONS = ["Indica", "Sativa", "Hybrid"] as const;

const TERPENE_OPTIONS = [
  "Myrcene",
  "Limonene",
  "Caryophyllene",
  "Linalool",
  "Pinene",
  "Terpinolene",
  "Humulene",
  "Ocimene",
] as const;

const OUTCOME_OPTIONS = [
  { value: "high", label: "70%+ positive" },
  { value: "mid", label: "50%+ positive" },
] as const;

type TypeFilter = (typeof TYPE_OPTIONS)[number] | null;
type TerpeneFilter = string | null;
type OutcomeFilter = string | null;

// Fallback strains when DB is empty
const FALLBACK_STRAINS = [
  { id: "1", name: "Blue Dream", type: "Hybrid", common_effects: ["Relaxed", "Creative", "Euphoric"], thc_min: 17, thc_max: 24, description: "A balanced hybrid known for gentle cerebral invigoration" },
  { id: "2", name: "Granddaddy Purple", type: "Indica", common_effects: ["Sleepy", "Relaxed", "Hungry"], thc_min: 17, thc_max: 27, description: "A famous indica with potent physical relaxation effects" },
  { id: "3", name: "Jack Herer", type: "Sativa", common_effects: ["Focused", "Creative", "Euphoric"], thc_min: 15, thc_max: 24, description: "A clear-headed, creative sativa" },
  { id: "4", name: "OG Kush", type: "Hybrid", common_effects: ["Relaxed", "Euphoric", "Sleepy"], thc_min: 19, thc_max: 26, description: "A legendary strain with stress-relieving effects" },
  { id: "5", name: "Northern Lights", type: "Indica", common_effects: ["Sleepy", "Relaxed", "Happy"], thc_min: 16, thc_max: 21, description: "Classic indica for dreamy relaxation" },
  { id: "6", name: "Sour Diesel", type: "Sativa", common_effects: ["Energetic", "Focused", "Creative"], thc_min: 20, thc_max: 25, description: "Energizing sativa with diesel aroma" },
];

export default function ProductLibrary() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(null);
  const [terpeneFilter, setTerpeneFilter] = useState<TerpeneFilter>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>(null);
  const [sortMode, setSortMode] = useState<"default" | "best">("default");

  const hasActiveFilters = !!(search || typeFilter || terpeneFilter || outcomeFilter);
  const resetFilters = useCallback(() => {
    setSearch("");
    setTypeFilter(null);
    setTerpeneFilter(null);
    setOutcomeFilter(null);
    setSortMode("default");
  }, []);

  const { data: dbStrains, isLoading: strainsLoading } = useStrains(search, typeFilter);
  const { data: sessions } = useSessionLogs();
  const { data: verifiedBatches } = usePublicBatchBrowse();

  // Compute per-strain stats from sessions
  const strainStats = useMemo(() => {
    if (!sessions) return new Map<string, { count: number; positiveRate: number }>();
    const map = new Map<string, { pos: number; total: number }>();
    for (const s of sessions) {
      const key = s.strain_name_text?.toLowerCase();
      if (!key) continue;
      const entry = map.get(key) ?? { pos: 0, total: 0 };
      entry.total++;
      if (normalizeOutcome(s.outcome) === "positive") entry.pos++;
      map.set(key, entry);
    }
    const result = new Map<string, { count: number; positiveRate: number }>();
    map.forEach((v, k) => {
      result.set(k, { count: v.total, positiveRate: v.total > 0 ? Math.round((v.pos / v.total) * 100) : 0 });
    });
    return result;
  }, [sessions]);

  // Build map of strain names to COA status (verified > pending > none)
  const strainCoaStatus = useMemo(() => {
    if (!verifiedBatches) return new Map<string, "verified" | "pending">();
    const map = new Map<string, "verified" | "pending">();
    for (const b of verifiedBatches as any[]) {
      const name = (b.strain_name || b.product_name || "").toLowerCase();
      if (!name) continue;
      // verified batches from usePublicBatchBrowse are always verified
      map.set(name, "verified");
    }
    return map;
  }, [verifiedBatches]);

  // Terpene highlights from verified batch lab panels
  const strainTerpenes = useMemo(() => {
    if (!verifiedBatches) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const b of verifiedBatches as any[]) {
      const name = (b.strain_name || b.product_name || "").toLowerCase();
      if (!name || map.has(name)) continue;
      const custom = b.lab_panel_custom;
      if (custom && typeof custom === "object") {
        const terpNames = Object.keys(custom).filter(k => (custom as any)[k] > 0).slice(0, 3);
        if (terpNames.length > 0) map.set(name, terpNames);
      }
    }
    return map;
  }, [verifiedBatches]);

  const strains = dbStrains && dbStrains.length > 0 ? dbStrains : FALLBACK_STRAINS;

  // Compute Best For You rankings for sort mode
  const bestForYouScores = useMemo(() => {
    if (sortMode !== "best" || !sessions) return new Map<string, number>();
    const rankings = computeStrainRankings(sessions, null, null, 1);
    const map = new Map<string, number>();
    rankings.forEach(r => map.set(r.strainName.toLowerCase(), r.score));
    return map;
  }, [sessions, sortMode]);

  // Apply local filters
  const filtered = useMemo(() => {
    let list = dbStrains && dbStrains.length > 0
      ? strains
      : strains.filter(s => {
          const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
          const matchType = !typeFilter || s.type === typeFilter;
          return matchSearch && matchType;
        });

    // Terpene filter
    if (terpeneFilter) {
      const tf = terpeneFilter.toLowerCase();
      list = list.filter(s => {
        const terps = strainTerpenes.get(s.name.toLowerCase());
        return terps?.some(t => t.toLowerCase().includes(tf));
      });
    }

    // Outcome filter
    if (outcomeFilter) {
      const threshold = outcomeFilter === "high" ? 70 : 50;
      list = list.filter(s => {
        const stats = strainStats.get(s.name.toLowerCase());
        return stats && stats.count >= 2 && stats.positiveRate >= threshold;
      });
    }

    // Apply Best For You sort
    if (sortMode === "best") {
      list = [...list].sort((a, b) => {
        const scoreA = bestForYouScores.get(a.name.toLowerCase()) ?? -1;
        const scoreB = bestForYouScores.get(b.name.toLowerCase()) ?? -1;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [strains, dbStrains, search, typeFilter, terpeneFilter, outcomeFilter, strainTerpenes, strainStats, sortMode, bestForYouScores]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background aurora-bg">
        {/* Header */}
        <header className="px-5 pt-12 pb-2 safe-top">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <SignalLeafLogo variant="icon" size="md" />
              <h1 className="font-serif text-2xl font-medium text-foreground">Product Library</h1>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search strains or products…"
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>
          </motion.div>
        </header>

        {/* Filters */}
        <div className="px-5 pb-4 space-y-3">
          {/* Type chips */}
          <div className="flex gap-2 flex-wrap">
            {TYPE_OPTIONS.map(type => (
              <FilterChip
                key={type}
                label={type}
                active={typeFilter === type}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              />
            ))}
          </div>

          {/* Terpene chips */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide self-center mr-1">Terpene</span>
            {TERPENE_OPTIONS.map(t => (
              <FilterChip
                key={t}
                label={t}
                active={terpeneFilter === t}
                onClick={() => setTerpeneFilter(terpeneFilter === t ? null : t)}
                size="sm"
              />
            ))}
          </div>

          {/* Outcome chips */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide self-center mr-1">Outcome</span>
            {OUTCOME_OPTIONS.map(o => (
              <FilterChip
                key={o.value}
                label={o.label}
                active={outcomeFilter === o.value}
                onClick={() => setOutcomeFilter(outcomeFilter === o.value ? null : o.value)}
                size="sm"
              />
            ))}
          </div>

          {/* Sort toggle */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide self-center mr-1">Sort</span>
            <FilterChip
              label="Default"
              active={sortMode === "default"}
              onClick={() => setSortMode("default")}
              size="sm"
            />
            <button
              onClick={() => setSortMode("best")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all flex items-center gap-1 ${
                sortMode === "best"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="w-3 h-3" />
              Best for you
            </button>
            <Link
              to="/best"
              className="rounded-full px-2.5 py-1 text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors flex items-center gap-1 ml-auto"
            >
              Full ranking →
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div className="px-5 pb-28">
          {strainsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
               {filtered.map((strain, idx) => {
                const stats = strainStats.get(strain.name.toLowerCase());
                const terps = strainTerpenes.get(strain.name.toLowerCase());
                const coaStatus = strainCoaStatus.get(strain.name.toLowerCase()) ?? null;

                return (
                  <motion.div
                    key={strain.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  >
                    <Link to={`/strains/${strain.id}`}>
                      <ProductCard
                        name={strain.name}
                        type={strain.type}
                        description={strain.description ?? undefined}
                        thcMin={strain.thc_min ?? undefined}
                        thcMax={strain.thc_max ?? undefined}
                        coaStatus={coaStatus}
                        terpenes={terps}
                        sessionCount={stats?.count}
                        positiveRate={stats?.positiveRate}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-12 gap-4"
            >
              <div className="w-full h-[160px] flex items-center justify-center opacity-50">
                <BrandImage
                  src={ASSETS.emptyLibraryDark}
                  alt="No results"
                  themeAware
                  className="max-h-[160px] w-auto object-contain rounded-xl"
                />
              </div>
              <p className="text-sm text-muted-foreground">No products match your filters</p>
              {hasActiveFilters && (
                <Button variant="soft" size="sm" onClick={resetFilters}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset filters
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/* ─── Sub-components ─── */

function FilterChip({
  label,
  active,
  onClick,
  size = "md",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full font-medium transition-all ${
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
      } ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ProductCard({
  name,
  type,
  description,
  thcMin,
  thcMax,
  coaStatus,
  terpenes,
  sessionCount,
  positiveRate,
}: {
  name: string;
  type: string;
  description?: string;
  thcMin?: number;
  thcMax?: number;
  coaStatus: "verified" | "pending" | null;
  terpenes?: string[];
  sessionCount?: number;
  positiveRate?: number;
}) {
  const typeLower = type.toLowerCase();
  const typeStyle =
    typeLower === "indica"
      ? "bg-accent/20 text-accent-foreground"
      : typeLower === "sativa"
      ? "bg-primary/15 text-primary"
      : "bg-secondary text-secondary-foreground";

  const thcLabel = formatPotencyRange(thcMin ?? null, thcMax ?? null);

  return (
    <Card variant="glass" className="hover:shadow-elevated hover:-translate-y-0.5 transition-all cursor-pointer h-full">
      <CardContent className="p-4 flex flex-col gap-3 h-full">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-serif text-base font-medium text-foreground truncate">{name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`text-[10px] font-medium border-0 ${typeStyle}`}>
                {type}
              </Badge>
              {coaStatus && <CoaBadgeWithTooltip status={coaStatus} />}
            </div>
          </div>
          {thcLabel && (
            <span className="text-xs text-muted-foreground shrink-0">THC {thcLabel}</span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Terpene highlights */}
        {terpenes && terpenes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Beaker className="w-3 h-3 text-primary/60 shrink-0" />
            {terpenes.map(t => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Bottom stats */}
        {(sessionCount != null && sessionCount > 0) && (
          <div className="flex items-center gap-3 mt-auto pt-1 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {sessionCount} session{sessionCount !== 1 ? "s" : ""}
            </span>
            {positiveRate != null && (
              <span className="text-[11px] text-success font-medium">
                {positiveRate}% positive
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CoaBadgeWithTooltip({ status }: { status: "verified" | "pending" }) {
  const isVerified = status === "verified";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Badge
              className={`text-[10px] font-medium border-0 gap-1 cursor-help ${
                isVerified
                  ? "bg-success/15 text-success"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isVerified ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {isVerified ? "Verified" : "Pending"}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          {isVerified
            ? "Verified laboratory analysis available for this batch."
            : "Pending verification — lab results are awaiting review."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
