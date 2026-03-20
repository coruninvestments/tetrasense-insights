import { Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getMatchColor, getMatchBgColor, getMatchLabel, type SignalMatchResult } from "@/lib/signalMatchEngine";

interface SignalMatchBadgeProps {
  match: SignalMatchResult;
  size?: "sm" | "md";
  onClick?: () => void;
}

export function SignalMatchBadge({ match, size = "sm", onClick }: SignalMatchBadgeProps) {
  if (!match.ready) return null;

  const colorClass = getMatchColor(match.score);
  const bgClass = getMatchBgColor(match.score);
  const label = getMatchLabel(match.score);

  const content = (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-all ${bgClass} ${colorClass} ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } ${onClick ? "cursor-pointer hover:opacity-80" : "cursor-help"}`}
    >
      <Zap className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {match.score}%
    </button>
  );

  if (onClick) return content;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          <p className="font-medium">{label}</p>
          {match.confidence !== "high" && (
            <p className="text-muted-foreground">Confidence: {match.confidence}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
