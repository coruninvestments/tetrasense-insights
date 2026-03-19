import { ShieldCheck, Clock, ShieldQuestion, Beaker } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ChemistryState = "verified" | "pending" | "unknown";

const config: Record<ChemistryState, { icon: typeof ShieldCheck; label: string; tooltip: string; className: string }> = {
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    tooltip: "Verified laboratory analysis available.",
    className: "bg-success/15 text-success",
  },
  pending: {
    icon: Clock,
    label: "Pending review",
    tooltip: "Chemistry data submitted and awaiting review.",
    className: "bg-warning/15 text-warning",
  },
  unknown: {
    icon: ShieldQuestion,
    label: "Not verified",
    tooltip: "No verified chemistry yet.",
    className: "bg-muted text-muted-foreground",
  },
};

/** Compact pill showing verified / pending / unknown chemistry state */
export function ChemistryStatusBadge({ status = "unknown" }: { status?: ChemistryState }) {
  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Badge className={cn("text-[10px] font-medium border-0 gap-1 cursor-help", cfg.className)}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          {cfg.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Larger inline banner for detail pages */
export function ChemistryStatusBanner({ status = "unknown", testDate, labName }: { status?: ChemistryState; testDate?: string | null; labName?: string | null }) {
  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium", cfg.className)}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{status === "verified" ? "Verified batch available" : status === "pending" ? "Chemistry pending review" : "No verified chemistry yet"}</span>
      {status === "verified" && testDate && (
        <span className="ml-auto text-[10px] opacity-70">Tested {new Date(testDate).toLocaleDateString()}</span>
      )}
      {status === "verified" && labName && (
        <span className="text-[10px] opacity-70">· {labName}</span>
      )}
    </div>
  );
}
