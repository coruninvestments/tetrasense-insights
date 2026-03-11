/**
 * COA Lab Registry — known cannabis testing lab URL patterns
 * for source detection during COA ingestion.
 */

export interface LabDetectionResult {
  sourceType: LabSourceType;
  labName: string;
  confidence: "high" | "medium" | "low";
}

export type LabSourceType =
  | "sc_labs"
  | "acs"
  | "kaycha"
  | "psi"
  | "steep_hill"
  | "confident_cannabis"
  | "green_leaf"
  | "anresco"
  | "encore"
  | "unknown";

interface LabPattern {
  sourceType: LabSourceType;
  labName: string;
  domainPatterns: RegExp[];
  pathPatterns?: RegExp[];
}

const LAB_PATTERNS: LabPattern[] = [
  {
    sourceType: "sc_labs",
    labName: "SC Labs",
    domainPatterns: [/sclabs\.com/i, /client\.sclabs\.com/i],
    pathPatterns: [/\/sample\//i, /\/coa\//i],
  },
  {
    sourceType: "acs",
    labName: "ACS Laboratory",
    domainPatterns: [/acslabcannabis\.com/i, /portal\.acslabcannabis\.com/i],
    pathPatterns: [/\/reports?\//i, /\/coa\//i],
  },
  {
    sourceType: "kaycha",
    labName: "Kaycha Labs",
    domainPatterns: [/kaychalabs\.com/i, /yourcoa\.com/i],
    pathPatterns: [/\/coa\//i, /\/report\//i],
  },
  {
    sourceType: "psi",
    labName: "PSI Labs",
    domainPatterns: [/psilabs\.org/i, /results\.psilabs\.org/i],
    pathPatterns: [/\/test-results?\//i, /\/report\//i],
  },
  {
    sourceType: "steep_hill",
    labName: "Steep Hill",
    domainPatterns: [/steephill\.com/i],
    pathPatterns: [/\/results?\//i, /\/coa\//i],
  },
  {
    sourceType: "confident_cannabis",
    labName: "Confident Cannabis",
    domainPatterns: [/confidentcannabis\.com/i, /orders\.confidentcannabis\.com/i],
    pathPatterns: [/\/report\//i],
  },
  {
    sourceType: "green_leaf",
    labName: "Green Leaf Lab",
    domainPatterns: [/greenleaflab\.org/i],
  },
  {
    sourceType: "anresco",
    labName: "Anresco Laboratories",
    domainPatterns: [/anresco\.com/i],
  },
  {
    sourceType: "encore",
    labName: "Encore Labs",
    domainPatterns: [/encorelabs\.com/i],
  },
];

/**
 * Detect lab source from a COA URL string.
 */
export function detectLabSource(url: string): LabDetectionResult {
  if (!url || typeof url !== "string") {
    return { sourceType: "unknown", labName: "Unknown", confidence: "low" };
  }

  const trimmed = url.trim().toLowerCase();

  for (const lab of LAB_PATTERNS) {
    const domainMatch = lab.domainPatterns.some((p) => p.test(trimmed));
    if (!domainMatch) continue;

    // If we also match a path pattern, higher confidence
    if (lab.pathPatterns?.length) {
      const pathMatch = lab.pathPatterns.some((p) => p.test(trimmed));
      return {
        sourceType: lab.sourceType,
        labName: lab.labName,
        confidence: pathMatch ? "high" : "medium",
      };
    }

    return {
      sourceType: lab.sourceType,
      labName: lab.labName,
      confidence: "medium",
    };
  }

  return { sourceType: "unknown", labName: "Unknown", confidence: "low" };
}

/**
 * Validate if a string looks like a plausible COA URL.
 */
export function isValidCoaUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Format a raw URL string into a proper URL.
 */
export function normalizeCoaUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
