import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FounderMetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function FounderMetricCard({ label, value, sub, icon, loading }: FounderMetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-serif font-medium text-foreground mt-0.5">
                {value}
              </p>
            )}
            {sub && !loading && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
