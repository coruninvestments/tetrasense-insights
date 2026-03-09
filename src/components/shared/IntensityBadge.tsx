import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import {
  getIntensityLabel,
  type IntensityLabel,
  type IntensityConfidence,
} from "@/lib/psychoactiveIntensity";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IntensityBadgeProps {
  score: number;
  confidence?: IntensityConfidence;
  reasoning?: string[];
  size?: "sm" | "md";
  className?: string;
}

const TIER_STYLES: Record<IntensityLabel, string> = {
  "Very Light": "bg-muted text-muted-foreground",
  Light: "bg-success/15 text-success",
  Moderate: "bg-info/15 text-info",
  Strong: "bg-warning/15 text-warning-foreground",
  "Very Strong": "bg-destructive/15 text-destructive",
  Extreme: "bg-destructive/25 text-destructive",
};

export function IntensityBadge({
  score,
  confidence,
  reasoning,
  size = "sm",
  className,
}: IntensityBadgeProps) {
  const label = getIntensityLabel(score);
  const tierStyle = TIER_STYLES[label];

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        tierStyle,
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Zap className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {score}
      <span className="opacity-70">·</span>
      {label}
    </span>
  );

  if (!reasoning?.length) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="text-xs font-medium mb-1">
            Intensity: {score}/100 ({label})
          </p>
          {confidence && (
            <p className="text-[11px] text-muted-foreground mb-1 capitalize">
              Confidence: {confidence}
            </p>
          )}
          <ul className="text-[11px] text-muted-foreground space-y-0.5">
            {reasoning.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
