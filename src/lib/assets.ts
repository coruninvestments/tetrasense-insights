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
  calibrationDark: "/illustrations/illustration-calibration.dark.svg",
  calibrationLight: "/illustrations/illustration-calibration.light.svg",
  signalStrengthDark: "/illustrations/illustration-signal-strength.dark.svg",
  signalStrengthLight: "/illustrations/illustration-signal-strength.light.svg",

  /* ── Badges ────────────────────────────────────── */
  badgeVerified: "/badges/verified.svg",
  badgeVerifiedCoa: "/badges/verified-coa.svg",
  badgePremium: "/badges/premium.svg",
  badgePremiumLock: "/badges/premium-lock.svg",
  badgeLocked: "/badges/locked.svg",
  badgeSession1: "/badges/badge-session-1.svg",
  badgeSession3: "/badges/badge-session-3.svg",
  badgeSession5: "/badges/badge-session-5.svg",
  badgeSession7: "/badges/badge-session-7.svg",
  badgeSession10: "/badges/badge-session-10.svg",
  badgeConnoisseurNovice: "/badges/badge-connoisseur-novice.svg",
  badgeConnoisseurExplorer: "/badges/badge-connoisseur-explorer.svg",
  badgeConnoisseurExpert: "/badges/badge-connoisseur-expert.svg",
  badgeSignalMaster: "/badges/badge-signal-master.svg",
  badgeQuality: "/badges/quality-badge.svg",

  /* ── Cards ──────────────────────────────────────── */
  cardSignalProfile: "/cards/card-signal-profile.svg",
  cardStrainFingerprint: "/cards/card-strain-fingerprint.svg",
  cardWeeklyReport: "/cards/card-weekly-report.svg",
  cardChallengeComplete: "/cards/card-challenge-complete.svg",

  /* ── UI ─────────────────────────────────────────── */
  signalHalo: "/ui/signal-halo.svg",
  signalPulse: "/ui/signal-pulse.svg",
  constellationGrid: "/ui/constellation-grid.svg",
  chartGrid: "/ui/chart-grid.svg",

  /* ── Backgrounds ────────────────────────────────── */
  signalGlowBg: "/backgrounds/signal-glow-background.svg",
  premiumHaloBg: "/backgrounds/premium-halo-background.svg",
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