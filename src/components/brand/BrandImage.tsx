import { useState } from "react";
import { useTheme } from "next-themes";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandImageProps {
  /** Path to the image – can be a theme-aware pair base (without .dark/.light extension). */
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /**
   * When true the component swaps `.dark.` ↔ `.light.` in the src path
   * based on the current resolved theme.
   *
   * Convention: provide the *dark* variant path — the component will derive
   * the light variant automatically (or vice-versa).
   */
  themeAware?: boolean;
}

function resolveThemeSrc(src: string, resolvedTheme: string | undefined): string {
  if (!resolvedTheme) return src;

  const isDark = resolvedTheme === "dark";

  // If the src contains .dark. or .light., swap to match theme
  if (src.includes(".dark.")) {
    return isDark ? src : src.replace(".dark.", ".light.");
  }
  if (src.includes(".light.")) {
    return isDark ? src.replace(".light.", ".dark.") : src;
  }

  return src;
}

export function BrandImage({
  src,
  alt,
  className,
  width,
  height,
  themeAware = false,
}: BrandImageProps) {
  const { resolvedTheme } = useTheme();
  const [failed, setFailed] = useState(false);

  const resolvedSrc = themeAware ? resolveThemeSrc(src, resolvedTheme) : src;

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/50 rounded-xl",
          className,
        )}
        style={{ width: width ?? "100%", height: height ?? "auto" }}
        role="img"
        aria-label={alt}
      >
        <Leaf className="w-6 h-6 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
