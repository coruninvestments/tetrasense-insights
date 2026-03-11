import {
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Beaker,
  Leaf,
  Package,
  Building2,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CoaIngestionResult } from "@/lib/coaIngestion";

interface COAImportResultCardProps {
  result: CoaIngestionResult;
}

export function COAImportResultCard({ result }: COAImportResultCardProps) {
  const statusConfig = {
    complete: {
      icon: CheckCircle2,
      label: "Import Complete",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    partial: {
      icon: AlertTriangle,
      label: "Partial Import",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    review_needed: {
      icon: FileSearch,
      label: "Review Needed",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    error: {
      icon: ShieldAlert,
      label: "Import Failed",
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
  };

  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <Card className={`p-4 border ${config.border} ${config.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <StatusIcon className={`w-5 h-5 ${config.color}`} />
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
      </div>

      {/* Error message */}
      {result.error && (
        <p className="text-sm text-destructive mb-4">{result.error}</p>
      )}

      {/* Details grid */}
      <div className="space-y-2.5 text-sm">
        {/* Lab detection */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" /> Source
          </span>
          <span className="text-foreground">
            {result.labDetection.labName}
            <span className="ml-1 text-xs text-muted-foreground">
              ({result.labDetection.confidence})
            </span>
          </span>
        </div>

        {/* Product */}
        {result.productName && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="w-3.5 h-3.5" /> Product
            </span>
            <span className="text-foreground">
              {result.productName}
              {result.productMatched && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  matched
                </span>
              )}
            </span>
          </div>
        )}

        {/* Chemistry counts */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Beaker className="w-3.5 h-3.5" /> Cannabinoids
          </span>
          <span className="text-foreground font-medium">{result.cannabinoidCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Leaf className="w-3.5 h-3.5" /> Terpenes
          </span>
          <span className="text-foreground font-medium">{result.terpeneCount}</span>
        </div>

        {/* Verification status */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Info className="w-3.5 h-3.5" /> Status
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
            {result.verificationStatus}
          </span>
        </div>
      </div>

      {/* Unmapped terms */}
      {result.unmappedTerms.length > 0 && (
        <div className="mt-4 p-2.5 rounded-lg bg-secondary/70">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Unmapped compounds ({result.unmappedTerms.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {result.unmappedTerms.map((term, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
              {w}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
