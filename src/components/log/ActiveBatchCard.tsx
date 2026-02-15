import { Package, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ActiveBatchInfo } from "@/hooks/useActiveBatch";

interface Props {
  batch: ActiveBatchInfo;
  onContinue: () => void;
  onChange: () => void;
  onClear: () => void;
}

export function ActiveBatchCard({ batch, onContinue, onChange, onClear }: Props) {
  return (
    <Card className="p-4 mb-6 border-primary/20 bg-primary/5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Currently using</span>
        </div>
        <button
          onClick={onClear}
          className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
          aria-label="Clear active product"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="mb-4 space-y-0.5">
        <p className="text-sm font-medium text-foreground">{batch.strainName}</p>
        <p className="text-xs text-muted-foreground">{batch.productName}</p>
        {batch.batchCode && (
          <p className="text-xs text-muted-foreground">Batch: {batch.batchCode}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" className="flex-1" onClick={onContinue}>
          Continue with this <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={onChange}>
          Change
        </Button>
      </div>
    </Card>
  );
}
