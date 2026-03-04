import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon";
type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoTheme = "light" | "dark" | "auto";

interface SignalLeafLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  className?: string;
}

const sizeConfig: Record<LogoSize, { icon: string; iconSize: string; text: string; gap: string }> = {
  sm: { icon: "w-7 h-7 rounded-lg", iconSize: "w-3.5 h-3.5", text: "text-sm", gap: "gap-2" },
  md: { icon: "w-8 h-8 rounded-lg", iconSize: "w-4 h-4", text: "text-lg", gap: "gap-2.5" },
  lg: { icon: "w-10 h-10 rounded-xl", iconSize: "w-5 h-5", text: "text-xl", gap: "gap-3" },
  xl: { icon: "w-12 h-12 rounded-2xl", iconSize: "w-6 h-6", text: "text-3xl", gap: "gap-3" },
};

export function SignalLeafLogo({
  variant = "full",
  size = "md",
  theme = "auto",
  className,
}: SignalLeafLogoProps) {
  const config = sizeConfig[size];

  // Theme classes
  const iconBg =
    theme === "light"
      ? "bg-primary-foreground/20"
      : theme === "dark"
      ? "gradient-primary"
      : "gradient-primary";

  const iconColor =
    theme === "light" ? "text-primary-foreground" : "text-primary-foreground";

  const textColor =
    theme === "light" ? "text-primary-foreground" : "text-foreground";

  const svgSrc = variant === "full" ? "/brand/signal-leaf-logo.svg" : "/brand/signal-leaf-icon.svg";

  const LogoIcon = (
    <div className={cn(config.icon, iconBg, "flex items-center justify-center flex-shrink-0 overflow-hidden")}>
      <img
        src="/brand/signal-leaf-icon.svg"
        alt="Signal Leaf"
        className={cn(config.iconSize, "object-contain")}
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
          const sibling = (e.target as HTMLElement).nextElementSibling as HTMLElement;
          if (sibling) sibling.style.display = "block";
        }}
      />
      <Leaf className={cn(config.iconSize, iconColor, "hidden")} />
    </div>
  );

  if (variant === "icon") {
    return <div className={className}>{LogoIcon}</div>;
  }

  return (
    <div className={cn("flex items-center", config.gap, className)}>
      {LogoIcon}
      <span className={cn("font-serif font-medium tracking-tight", config.text, textColor)}>
        Signal Leaf
      </span>
    </div>
  );
}
