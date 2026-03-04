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
  appIcon192: "/brand/app-icon-192.png",
  appIcon512: "/brand/app-icon-512.png",
  appleTouchIcon: "/brand/apple-touch-icon.png",
  favicon16: "/brand/favicon-16.png",
  favicon32: "/brand/favicon-32.png",
  maskableIcon: "/brand/maskable-icon-512.png",

  /* ── Illustrations (theme-aware SVG pairs) ─────── */
  heroPremiumDark: "/illustrations/premium-hero.dark.svg",
  heroPremiumLight: "/illustrations/premium-hero.light.svg",
  emptyInsightsDark: "/illustrations/empty-insights.dark.svg",
  emptyInsightsLight: "/illustrations/empty-insights.light.svg",
  emptyLibraryDark: "/illustrations/empty-library.dark.svg",
  emptyLibraryLight: "/illustrations/empty-library.light.svg",

  /* ── Badges ────────────────────────────────────── */
  badgeVerified: "/badges/verified.svg",
  badgeVerifiedCoa: "/badges/verified-coa.svg",
  badgePremium: "/badges/premium.svg",
  badgePremiumLock: "/badges/premium-lock.svg",
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