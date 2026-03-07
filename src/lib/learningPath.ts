import type { SessionLog } from "@/hooks/useSessionLogs";

/* ── Types ───────────────────────────────────────────────────────── */

export type ModuleStatus = "locked" | "available" | "completed";

export interface LearningModule {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  status: ModuleStatus;
  recommendation: string | null; // personalized reason to do this module
  content: ModuleContent;
}

export interface ModuleContent {
  sections: ContentSection[];
}

export interface ContentSection {
  heading: string;
  body: string;
}

export interface LearningPathResult {
  modules: LearningModule[];
  completedCount: number;
  totalCount: number;
  nextRecommended: string | null; // module id
}

/* ── Module definitions ──────────────────────────────────────────── */

interface ModuleDef {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  unlockAt: number; // session count required
  content: ModuleContent;
}

const MODULE_DEFS: ModuleDef[] = [
  {
    id: "thc-cbd-balance",
    title: "Understanding THC & CBD Balance",
    subtitle: "The two pillars of every cannabis experience",
    readTime: "3 min",
    unlockAt: 0,
    content: {
      sections: [
        {
          heading: "THC: The Primary Driver",
          body: "THC (tetrahydrocannabinol) is responsible for most of the psychoactive effects you feel. Higher THC generally means stronger mental effects — but more isn't always better. Your personal sensitivity, tolerance, and the presence of other compounds all shape the experience.",
        },
        {
          heading: "CBD: The Balancer",
          body: "CBD (cannabidiol) doesn't produce a \"high\" on its own, but it can moderate THC's intensity. Products with balanced THC:CBD ratios (like 1:1) often produce a calmer, more functional experience. Many users find CBD-rich products helpful for relaxation without strong psychoactive effects.",
        },
        {
          heading: "Finding Your Balance",
          body: "There's no universal ideal ratio. Your Signal Leaf sessions help you track how different THC/CBD balances affect you personally. Pay attention to the strain type and any lab data when available — over time, patterns will emerge about what ratios work best for your goals.",
        },
      ],
    },
  },
  {
    id: "intro-terpenes",
    title: "Intro to Terpenes",
    subtitle: "Why cannabis smells matter more than you think",
    readTime: "4 min",
    unlockAt: 1,
    content: {
      sections: [
        {
          heading: "What Are Terpenes?",
          body: "Terpenes are aromatic compounds found in all plants — they give pine trees their scent, lemons their zing, and lavender its calming aroma. Cannabis produces over 200 terpenes, and they play a significant role in shaping each strain's character beyond just THC and CBD content.",
        },
        {
          heading: "Common Cannabis Terpenes",
          body: "Myrcene (earthy, herbal) is the most common and is associated with sedating effects. Limonene (citrus) may support mood elevation. Pinene (pine, fresh) is linked to alertness. Caryophyllene (peppery, spicy) is unique because it also interacts with your body's endocannabinoid system. Linalool (floral) is shared with lavender and is associated with calming effects.",
        },
        {
          heading: "The Entourage Effect",
          body: "Many researchers believe terpenes work alongside cannabinoids to create the full experience — this is called the \"entourage effect.\" This is why two strains with identical THC levels can feel completely different. Tracking your aroma and flavor notes in Signal Leaf helps identify which terpene profiles work best for you.",
        },
      ],
    },
  },
  {
    id: "reading-coa",
    title: "How to Read a COA",
    subtitle: "Decoding lab test results like a pro",
    readTime: "5 min",
    unlockAt: 3,
    content: {
      sections: [
        {
          heading: "What Is a COA?",
          body: "A Certificate of Analysis (COA) is a lab report that shows exactly what's in a cannabis product. It typically includes cannabinoid potency (THC, CBD, CBN, etc.), terpene profile, and safety screenings for pesticides, heavy metals, and microbials. Think of it as a nutrition label for cannabis.",
        },
        {
          heading: "Key Numbers to Look For",
          body: "Total THC and Total CBD are the most important potency numbers. Look for \"total\" rather than just \"delta-9 THC\" since total includes the converted acid forms. Terpene percentages above 1% are notable — the top 3 terpenes shape most of the experience. Safety tests should all show \"pass\" or \"ND\" (not detected).",
        },
        {
          heading: "Using COA Data in Signal Leaf",
          body: "When you attach a COA to a product batch in Signal Leaf, the lab panel data becomes part of your session history. Over time, this lets the app identify specific cannabinoid and terpene combinations that consistently produce your preferred outcomes — moving beyond strain names to actual chemistry.",
        },
      ],
    },
  },
  {
    id: "dose-effects",
    title: "How Dose Changes Effect",
    subtitle: "Finding your sweet spot through data",
    readTime: "3 min",
    unlockAt: 5,
    content: {
      sections: [
        {
          heading: "The Dose-Response Curve",
          body: "Cannabis doesn't follow a simple \"more = stronger\" pattern. Many effects follow a biphasic curve: low doses may reduce anxiety, while higher doses of the same product might increase it. This is why tracking your dose level and outcomes is so valuable — your ideal dose may be different from what you expect.",
        },
        {
          heading: "Method Matters",
          body: "The same dose can hit very differently depending on method. Inhalation (smoking, vaping) produces effects within minutes that peak quickly. Edibles take 30-90 minutes to onset but last much longer. Tinctures fall somewhere in between. Your Signal Leaf dose normalization score helps compare across methods.",
        },
        {
          heading: "Building Your Dose Profile",
          body: "Your Dose Insights in Signal Leaf analyze which dose levels produce the best outcomes for each intent. If you're consistently logging, the app can identify your \"sweet spot\" — the dose range where you get the effects you want with minimal downsides. Start low and track honestly for the most useful data.",
        },
      ],
    },
  },
  {
    id: "context-matters",
    title: "Why Context Matters",
    subtitle: "Same strain, different day, different results",
    readTime: "3 min",
    unlockAt: 5,
    content: {
      sections: [
        {
          heading: "Set and Setting",
          body: "Your experience isn't determined by the product alone. Your mental state (mood, stress, expectations), physical state (sleep, food, hydration), and environment all contribute. This is why the same strain can feel relaxing one day and anxiety-inducing another.",
        },
        {
          heading: "Context Factors That Matter Most",
          body: "Based on community patterns, the most impactful context factors tend to be: sleep quality (poor sleep + cannabis often increases negative effects), caffeine intake (can amplify anxiety), stomach fullness (empty stomach = faster, stronger onset), and pre-session stress level. Signal Leaf tracks all of these.",
        },
        {
          heading: "Using Context Data",
          body: "Your Context Risks section in Insights identifies which environmental factors correlate with negative outcomes for you specifically. This isn't about avoiding cannabis in certain contexts — it's about being aware so you can adjust dose or expectations when conditions aren't ideal.",
        },
      ],
    },
  },
  {
    id: "flavor-vs-effect",
    title: "Flavor vs Effect: What to Notice",
    subtitle: "Training your palate alongside your awareness",
    readTime: "4 min",
    unlockAt: 3,
    content: {
      sections: [
        {
          heading: "Flavor as Signal",
          body: "What you taste and smell isn't just about enjoyment — it's information. Citrus notes often indicate limonene (associated with mood elevation). Peppery or spicy notes suggest caryophyllene (associated with body comfort). Pine freshness comes from pinene (associated with alertness). Your sensory experience is a window into the terpene profile.",
        },
        {
          heading: "Training Your Palate",
          body: "Like wine or coffee tasting, cannabis appreciation is a skill that develops with intentional attention. Start by noting the first 2-3 aromas and flavors that stand out. Is the inhale smooth or harsh? Does the aftertaste linger or fade quickly? These observations, tracked over time, become a personal reference library.",
        },
        {
          heading: "Connecting Sensory to Outcome",
          body: "Signal Leaf's Terpene Preferences engine uses your flavor and aroma tags to identify patterns between what you taste and how you feel. Over time, you might discover that citrus-forward strains consistently deliver your best focus sessions, or that earthy profiles are your go-to for evening relaxation.",
        },
      ],
    },
  },
];

/* ── Completion tracking (localStorage) ──────────────────────────── */

const STORAGE_KEY = "signal-leaf-learning-completed";

export function getCompletedModules(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markModuleCompleted(moduleId: string): void {
  const completed = getCompletedModules();
  completed.add(moduleId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
}

/* ── Recommendation logic ────────────────────────────────────────── */

interface UserContext {
  sessionCount: number;
  hasTerpeneData: boolean;
  hasCoaBatches: boolean;
  hasContextData: boolean;
  hasSensoryData: boolean;
}

function buildUserContext(sessions: SessionLog[]): UserContext {
  return {
    sessionCount: sessions.length,
    hasTerpeneData: sessions.some(
      (s) => ((s as any).aroma_tags?.length ?? 0) > 0 || ((s as any).flavor_tags?.length ?? 0) > 0
    ),
    hasCoaBatches: sessions.some((s) => s.coa_attached),
    hasContextData: sessions.some(
      (s) => s.time_of_day || s.sleep_quality || s.mood_before
    ),
    hasSensoryData: sessions.some((s) => (s as any).sensory_enjoyment != null),
  };
}

function getRecommendation(moduleId: string, ctx: UserContext): string | null {
  switch (moduleId) {
    case "intro-terpenes":
      if (ctx.hasTerpeneData) return "You've been logging aromas — this will help you understand why";
      if (ctx.hasSensoryData) return "Your sensory data connects directly to terpene science";
      return null;
    case "reading-coa":
      if (ctx.hasCoaBatches) return "You've attached COAs — learn to read them like a pro";
      return null;
    case "context-matters":
      if (ctx.hasContextData) return "You're already tracking context — learn why it matters";
      return "Understanding context will make your logging more valuable";
    case "dose-effects":
      if (ctx.sessionCount >= 5) return "With your data, you can start finding your sweet spot";
      return null;
    case "flavor-vs-effect":
      if (ctx.hasSensoryData) return "You're tracking flavors — time to connect them to effects";
      return null;
    default:
      return null;
  }
}

/* ── Main export ─────────────────────────────────────────────────── */

export function computeLearningPath(sessions: SessionLog[]): LearningPathResult {
  const completed = getCompletedModules();
  const ctx = buildUserContext(sessions);

  const modules: LearningModule[] = MODULE_DEFS.map((def) => {
    const isCompleted = completed.has(def.id);
    const isUnlocked = ctx.sessionCount >= def.unlockAt;

    return {
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      readTime: def.readTime,
      status: isCompleted ? "completed" : isUnlocked ? "available" : "locked",
      recommendation: isCompleted ? null : getRecommendation(def.id, ctx),
      content: def.content,
    };
  });

  // Find next recommended module
  const available = modules.filter((m) => m.status === "available");
  const recommended = available.find((m) => m.recommendation) ?? available[0] ?? null;

  return {
    modules,
    completedCount: modules.filter((m) => m.status === "completed").length,
    totalCount: modules.length,
    nextRecommended: recommended?.id ?? null,
  };
}
