import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Clock, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  rejected: {
    label: "Rejected",
    icon: ShieldAlert,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  unverified: {
    label: "Unverified",
    icon: ShieldQuestion,
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
};

export function CoaStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unverified;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] px-1.5 py-0.5", config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
