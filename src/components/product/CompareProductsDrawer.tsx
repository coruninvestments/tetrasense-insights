import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Beaker, BarChart3, ShieldCheck, AlertTriangle, Sparkles, ShieldQuestion } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPotencyRange } from "@/hooks/useStrains";
import type { QualityResult } from "@/lib/productQuality";

export interface CompareProduct {
  id: string;
  name: string;
  type: string;
  description?: string;
  thcMin?: number;
  thcMax?: number;
  cbdMin?: number;
  cbdMax?: number;
  terpenes?: string[];
  sessionCount?: number;
  positiveRate?: number;
  avgAnxiety?: number;
  quality?: QualityResult | null;
  aromaFlavors?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productA: CompareProduct | null;
  productB: CompareProduct | null;
}

const typeStyle: Record<string, string> = {
  indica: "bg-accent/20 text-accent-foreground",
  sativa: "bg-primary/15 text-primary",
  hybrid: "bg-secondary text-secondary-foreground",
};

function qualityBadge(q: QualityResult | null | undefined) {
  if (!q || q.level === "unknown") return { label: "Unknown", cls: "bg-muted text-muted-foreground", Icon: ShieldQuestion };
  if (q.level === "high quality") return { label: `${q.qualityScore}`, cls: "bg-success/15 text-success", Icon: Sparkles };
  return { label: `${q.qualityScore}`, cls: "bg-primary/15 text-primary", Icon: ShieldCheck };
}

function CompareRow({ label, valA, valB, highlightBetter }: {
  label: string;
  valA: React.ReactNode;
  valB: React.ReactNode;
  highlightBetter?: "a" | "b" | null;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center py-2.5 border-b border-border/40 last:border-0">
      <div className={`text-sm text-right ${highlightBetter === "a" ? "text-primary font-medium" : "text-foreground"}`}>
        {valA}
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium w-20 text-center shrink-0">
        {label}
      </span>
      <div className={`text-sm text-left ${highlightBetter === "b" ? "text-primary font-medium" : "text-foreground"}`}>
        {valB}
      </div>
    </div>
  );
}

function NoData() {
  return <span className="text-muted-foreground/60 italic text-xs">No data</span>;
}

export function CompareProductsDrawer({ open, onOpenChange, productA, productB }: Props) {
  const comparisons = useMemo(() => {
    if (!productA || !productB) return { betterPositive: null, betterAnxiety: null, betterQuality: null };
    const a = productA;
    const b = productB;

    const betterPositive: "a" | "b" | null =
      a.positiveRate != null && b.positiveRate != null
        ? a.positiveRate > b.positiveRate ? "a" : a.positiveRate < b.positiveRate ? "b" : null
        : null;

    const betterAnxiety: "a" | "b" | null =
      a.avgAnxiety != null && b.avgAnxiety != null
        ? a.avgAnxiety < b.avgAnxiety ? "a" : a.avgAnxiety > b.avgAnxiety ? "b" : null
        : null;

    const betterQuality: "a" | "b" | null =
      a.quality && b.quality && a.quality.level !== "unknown" && b.quality.level !== "unknown"
        ? a.quality.qualityScore > b.quality.qualityScore ? "a" : a.quality.qualityScore < b.quality.qualityScore ? "b" : null
        : null;

    return { betterPositive, betterAnxiety, betterQuality };
  }, [productA, productB]);

  if (!productA || !productB) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-serif text-lg">Compare Products</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 space-y-1">
          {/* Product headers */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start pb-3 border-b border-border">
            <ProductHeader product={productA} />
            <div className="w-20 flex items-center justify-center pt-2">
              <span className="text-xs text-muted-foreground font-medium">vs</span>
            </div>
            <ProductHeader product={productB} />
          </div>

          {/* Comparison rows */}
          <CompareRow
            label="Type"
            valA={<Badge className={`text-[10px] border-0 ${typeStyle[productA.type.toLowerCase()] ?? "bg-secondary text-secondary-foreground"}`}>{productA.type}</Badge>}
            valB={<Badge className={`text-[10px] border-0 ${typeStyle[productB.type.toLowerCase()] ?? "bg-secondary text-secondary-foreground"}`}>{productB.type}</Badge>}
          />

          <CompareRow
            label="THC"
            valA={formatPotencyRange(productA.thcMin ?? null, productA.thcMax ?? null) ?? <NoData />}
            valB={formatPotencyRange(productB.thcMin ?? null, productB.thcMax ?? null) ?? <NoData />}
          />

          <CompareRow
            label="CBD"
            valA={formatPotencyRange(productA.cbdMin ?? null, productA.cbdMax ?? null) ?? <NoData />}
            valB={formatPotencyRange(productB.cbdMin ?? null, productB.cbdMax ?? null) ?? <NoData />}
          />

          <CompareRow
            label="Terpenes"
            valA={productA.terpenes?.length ? (
              <div className="flex flex-wrap gap-1 justify-end">
                {productA.terpenes.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{t}</span>
                ))}
              </div>
            ) : <NoData />}
            valB={productB.terpenes?.length ? (
              <div className="flex flex-wrap gap-1">
                {productB.terpenes.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{t}</span>
                ))}
              </div>
            ) : <NoData />}
          />

          <CompareRow
            label="Aroma/Flavor"
            valA={productA.aromaFlavors?.length ? (
              <div className="flex flex-wrap gap-1 justify-end">
                {productA.aromaFlavors.slice(0, 4).map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{t}</span>
                ))}
              </div>
            ) : <NoData />}
            valB={productB.aromaFlavors?.length ? (
              <div className="flex flex-wrap gap-1">
                {productB.aromaFlavors.slice(0, 4).map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{t}</span>
                ))}
              </div>
            ) : <NoData />}
          />

          <CompareRow
            label="Sessions"
            valA={productA.sessionCount != null && productA.sessionCount > 0 ? `${productA.sessionCount}` : <NoData />}
            valB={productB.sessionCount != null && productB.sessionCount > 0 ? `${productB.sessionCount}` : <NoData />}
          />

          <CompareRow
            label="Positive %"
            valA={productA.positiveRate != null ? `${productA.positiveRate}%` : <NoData />}
            valB={productB.positiveRate != null ? `${productB.positiveRate}%` : <NoData />}
            highlightBetter={comparisons.betterPositive}
          />

          <CompareRow
            label="Anxiety"
            valA={productA.avgAnxiety != null ? (
              <span className="flex items-center gap-1 justify-end">
                {productA.avgAnxiety > 5 && <AlertTriangle className="w-3 h-3 text-destructive" />}
                {productA.avgAnxiety.toFixed(1)}/10
              </span>
            ) : <NoData />}
            valB={productB.avgAnxiety != null ? (
              <span className="flex items-center gap-1">
                {productB.avgAnxiety > 5 && <AlertTriangle className="w-3 h-3 text-destructive" />}
                {productB.avgAnxiety.toFixed(1)}/10
              </span>
            ) : <NoData />}
            highlightBetter={comparisons.betterAnxiety}
          />

          <CompareRow
            label="Quality"
            valA={
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${qA.cls}`}>
                <qA.Icon className="w-3 h-3" />
                {qA.label}
              </span>
            }
            valB={
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${qB.cls}`}>
                <qB.Icon className="w-3 h-3" />
                {qB.label}
              </span>
            }
            highlightBetter={comparisons.betterQuality}
          />

          {/* Summary */}
          <div className="pt-3 mt-2 border-t border-border">
            <p className="text-[11px] text-muted-foreground text-center">
              Based on your personal session data. Missing data may affect comparison accuracy.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ProductHeader({ product }: { product: CompareProduct }) {
  return (
    <div className="text-center space-y-1">
      <h3 className="font-serif text-sm font-medium text-foreground leading-tight">{product.name}</h3>
      {product.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-2">{product.description}</p>
      )}
    </div>
  );
}

/** Floating bar shown when compare mode is active */
export function CompareSelectionBar({
  selections,
  onClear,
  onCompare,
}: {
  selections: CompareProduct[];
  onClear: () => void;
  onCompare: () => void;
}) {
  return (
    <AnimatePresence>
      {selections.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 bg-card border border-border rounded-2xl shadow-elevated p-3 flex items-center gap-3 safe-bottom"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">
              {selections.length === 1
                ? `${selections[0].name} selected — pick another`
                : `${selections[0].name} vs ${selections[1].name}`}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {selections.length === 1 ? "Tap another product to compare" : "Ready to compare"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
              <X className="w-4 h-4" />
            </Button>
            {selections.length === 2 && (
              <Button size="sm" onClick={onCompare} className="h-8">
                Compare
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
