import { useMemo } from "react";
import { Beaker, FlaskConical, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChemistryStatusBanner } from "./ChemistryStatusBadge";
import type { ProductBatch, BatchTerpene, BatchCannabinoid } from "@/hooks/useProductChemistry";

interface Props {
  batch: ProductBatch | null;
  terpenes?: BatchTerpene[];
  cannabinoids?: BatchCannabinoid[];
  showCoaLink?: boolean;
}

export function BatchChemistrySummary({ batch, terpenes = [], cannabinoids = [], showCoaLink = true }: Props) {
  if (!batch) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <ChemistryStatusBanner status="unknown" />
          <p className="text-xs text-muted-foreground text-center py-2">
            This product hasn't been chemistry-verified yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isVerified = batch.verification_status === "verified";
  const isPending = batch.verification_status === "pending";
  const status = isVerified ? "verified" as const : isPending ? "pending" as const : "unknown" as const;

  const topTerpenes = useMemo(() => 
    [...terpenes].sort((a, b) => b.percent_value - a.percent_value).slice(0, 5),
    [terpenes]
  );

  const topCannabinoids = useMemo(() =>
    [...cannabinoids].filter(c => c.percent_value != null && c.percent_value > 0).sort((a, b) => (b.percent_value ?? 0) - (a.percent_value ?? 0)).slice(0, 6),
    [cannabinoids]
  );

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <ChemistryStatusBanner status={status} testDate={batch.tested_at} labName={batch.lab_name} />

        {/* Summary numbers */}
        <div className="grid grid-cols-3 gap-3">
          {batch.total_thc_percent != null && (
            <StatBlock label="Total THC" value={`${batch.total_thc_percent}%`} />
          )}
          {batch.total_cbd_percent != null && (
            <StatBlock label="Total CBD" value={`${batch.total_cbd_percent}%`} />
          )}
          {batch.total_terpenes_percent != null && (
            <StatBlock label="Total Terpenes" value={`${batch.total_terpenes_percent}%`} />
          )}
        </div>

        {/* Terpene profile */}
        {topTerpenes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Beaker className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-xs font-medium text-foreground">Terpene Profile</span>
            </div>
            <div className="space-y-1.5">
              {topTerpenes.map(t => (
                <TerpeneBar key={t.id} name={t.terpene_name ?? "Unknown"} percent={t.percent_value} maxPercent={topTerpenes[0]?.percent_value ?? 1} />
              ))}
            </div>
          </div>
        )}

        {/* Cannabinoid profile */}
        {topCannabinoids.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-xs font-medium text-foreground">Cannabinoid Profile</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topCannabinoids.map(c => (
                <Badge key={c.id} variant="outline" className="text-[10px] gap-1 font-normal">
                  {c.short_name ?? c.cannabinoid_name ?? "?"}: {c.percent_value}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Batch metadata */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/50 flex-wrap">
          {batch.tested_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(batch.tested_at).toLocaleDateString()}
            </span>
          )}
          {batch.lab_name && <span>{batch.lab_name}</span>}
          {batch.batch_number && <span>Batch #{batch.batch_number}</span>}
          {showCoaLink && batch.coa_url && (
            <a href={batch.coa_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-primary hover:underline ml-auto">
              View COA <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-medium text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function TerpeneBar({ name, percent, maxPercent }: { name: string; percent: number; maxPercent: number }) {
  const width = Math.max(8, (percent / maxPercent) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-foreground w-24 truncate capitalize">{name}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${width}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-10 text-right">{percent.toFixed(2)}%</span>
    </div>
  );
}
