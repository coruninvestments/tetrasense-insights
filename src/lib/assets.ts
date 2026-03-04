/**
 * Central asset manifest for Signal Leaf.
 *
 * Every visual asset referenced in the app should be declared here so that
 * paths are managed in one place.  Theme-aware assets use a `.dark.` / `.light.`
 * suffix convention — the <BrandImage /> component resolves the right variant
 * at render time.
 */

export const ASSETS = {
  /* ── Brand ─────────────────────────────────────── */
  logoFull: "/brand/signal-leaf-logo.svg",
  logoIcon: "/brand/signal-leaf-icon.svg",
  mark: "/brand/signal-leaf-mark.svg",
  appIcon: "/brand/app-icon-1024.png",

  /* ── Illustrations (theme-aware pairs) ─────────── */
  heroPremiumDark: "/illustrations/premium-hero.dark.png",
  heroPremiumLight: "/illustrations/premium-hero.light.png",
  emptyInsightsDark: "/illustrations/empty-insights.dark.png",
  emptyInsightsLight: "/illustrations/empty-insights.light.png",
  emptyLibraryDark: "/illustrations/empty-library.dark.png",
  emptyLibraryLight: "/illustrations/empty-library.light.png",

  /* ── Badges ────────────────────────────────────── */
  badgeVerified: "/badges/verified.svg",
  badgePremium: "/badges/premium.svg",
  badgeLocked: "/badges/locked.svg",
} as const;

export type AssetKey = keyof typeof ASSETS;

/**
 * Given a "base" asset key that ends with `Dark`, return the matching
 * light-mode key (and vice-versa) so callers can resolve theme pairs
 * without string manipulation at the call site.
 */
export function themeAssetPair(darkKey: AssetKey, lightKey: AssetKey) {
  return { dark: ASSETS[darkKey], light: ASSETS[lightKey] } as const;
}
