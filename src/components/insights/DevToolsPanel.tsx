import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wrench, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SessionIntent, SessionMethod, DoseLevel } from "@/hooks/useSessionLogs";
import type { SessionOutcome } from "@/lib/sessionOutcome";

// Only render in development
export function DevToolsPanel() {
  if (!import.meta.env.DEV) return null;
  
  return <DevToolsPanelContent />;
}

const STORAGE_KEY = "dataQuality:lastTier";

const SAMPLE_STRAINS = [
  { name: "Blue Dream", type: "hybrid" },
  { name: "OG Kush", type: "indica" },
  { name: "Sour Diesel", type: "sativa" },
  { name: "Gorilla Glue", type: "hybrid" },
  { name: "Girl Scout Cookies", type: "hybrid" },
  { name: "Northern Lights", type: "indica" },
  { name: "Jack Herer", type: "sativa" },
  { name: "Granddaddy Purple", type: "indica" },
];

const INTENTS: SessionIntent[] = ["sleep", "relaxation", "creativity", "focus", "pain_relief", "social", "recreation", "learning"];
const METHODS: SessionMethod[] = ["smoke", "vape", "edible", "tincture"];
const DOSE_LEVELS: DoseLevel[] = ["low", "medium", "high"];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a sample session with balanced outcome distribution:
 * ~65% positive, ~25% neutral, ~10% negative
 * 
 * This is a minimal dev seeding payload. Optional/legacy fields
 * (dose, dose_amount_mg, local_time) are intentionally omitted.
 */
type SeedingSource = 'preset-5' | 'preset-20' | 'custom';
type SeedingState = { count: number; source: SeedingSource } | null;

function generateSampleSession(userId: string, daysAgo: number) {
  const strain = randomPick(SAMPLE_STRAINS);
  const intent = randomPick(INTENTS);
  const method = randomPick(METHODS);
  const doseLevel = randomPick(DOSE_LEVELS);
  
  // Determine target outcome first using weighted random
  const roll = Math.random();
  let targetOutcome: SessionOutcome;
  if (roll < 0.65) {
    targetOutcome = "positive";
  } else if (roll < 0.90) {
    targetOutcome = "neutral";
  } else {
    targetOutcome = "negative";
  }
  
  // Generate effects based on target outcome
  let baseSleepiness: number;
  let baseRelaxation: number;
  let baseAnxiety: number;
  let baseFocus: number;
  let basePainRelief: number;
  let baseEuphoria: number;

  if (targetOutcome === "positive") {
    // High positive effects, low anxiety
    baseRelaxation = randomInt(6, 10);
    baseSleepiness = intent === "sleep" ? randomInt(6, 10) : randomInt(3, 7);
    baseFocus = intent === "focus" || intent === "creativity" ? randomInt(6, 10) : randomInt(4, 8);
    basePainRelief = intent === "pain_relief" ? randomInt(6, 10) : randomInt(3, 7);
    baseEuphoria = randomInt(5, 10);
    baseAnxiety = randomInt(0, 4);
  } else if (targetOutcome === "negative") {
    // High anxiety triggers negative outcome
    baseAnxiety = randomInt(7, 10);
    baseRelaxation = randomInt(1, 5);
    baseSleepiness = randomInt(1, 4);
    baseFocus = randomInt(1, 4);
    basePainRelief = randomInt(1, 5);
    baseEuphoria = randomInt(1, 4);
  } else {
    // Neutral: moderate effects, moderate anxiety
    baseRelaxation = randomInt(3, 5);
    baseSleepiness = randomInt(2, 5);
    baseFocus = randomInt(3, 5);
    basePainRelief = randomInt(2, 5);
    baseEuphoria = randomInt(3, 6);
    baseAnxiety = randomInt(4, 6);
  }
  
  // Create date spread across days
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(8, 23), randomInt(0, 59), 0, 0);

  // Return only the exact columns confirmed by the real create mutation
  return {
    user_id: userId,
    created_at: date.toISOString(),
    intent,
    strain_id: null,
    strain_name_text: strain.name,
    strain_type: strain.type,
    method,
    dose: doseLevel,
    dose_level: doseLevel,
    effect_sleepiness: baseSleepiness,
    effect_relaxation: baseRelaxation,
    effect_anxiety: baseAnxiety,
    effect_focus: baseFocus,
    effect_pain_relief: basePainRelief,
    effect_euphoria: baseEuphoria,
    outcome: targetOutcome,
    notes: null,
  };
}

function DevToolsPanelContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [seedingState, setSeedingState] = useState<SeedingState>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [customCount, setCustomCount] = useState(20);
  const [daysBack, setDaysBack] = useState(14);

  const invalidateQueries = () => {
    // Invalidate all session-related queries used by the app
    queryClient.invalidateQueries({ queryKey: ["session-logs"] });
    queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["session-stats"] });
    // Fallback: invalidate all queries to ensure insights/patterns recompute
    queryClient.invalidateQueries();
  };

  const handleSeedSessions = async (count: number, source: SeedingSource) => {
    if (!user) {
      toast({ title: "Not authenticated", description: "Please log in first.", variant: "destructive" });
      return;
    }
    
    setSeedingState({ count, source });
    try {
      // Generate sessions spread across the configured days range
      const sessions = [];
      for (let i = 0; i < count; i++) {
        const daysAgoValue = randomInt(0, daysBack - 1);
        sessions.push(generateSampleSession(user.id, daysAgoValue));
      }
      
      const { error } = await supabase
        .from("session_logs")
        .insert(sessions);
      
      if (error) {
        // Rich error reporting for schema mismatches
        console.error("Supabase insert error (full object):", error);
        
        const errorParts: string[] = [error.message];
        if ('details' in error && error.details) {
          errorParts.push(`Details: ${error.details}`);
        }
        if ('hint' in error && error.hint) {
          errorParts.push(`Hint: ${error.hint}`);
        }
        
        toast({ 
          title: "Seed failed", 
          description: errorParts.join(" | "), 
          variant: "destructive" 
        });
        return;
      }
      
      // Calculate outcome breakdown for toast
      const outcomes = sessions.reduce((acc, s) => {
        acc[s.outcome as SessionOutcome] = (acc[s.outcome as SessionOutcome] || 0) + 1;
        return acc;
      }, {} as Record<SessionOutcome, number>);
      
      const statsDesc = `${outcomes.positive || 0} positive, ${outcomes.neutral || 0} neutral, ${outcomes.negative || 0} negative`;
      
      invalidateQueries();
      toast({ title: `Seeded ${count} sessions`, description: statsDesc });
    } catch (err) {
      console.error("Seed error (caught exception):", err);
      toast({ title: "Seed failed", description: String(err), variant: "destructive" });
    } finally {
      setSeedingState(null);
    }
  };

  const handleClearSessions = async () => {
    if (!user) {
      toast({ title: "Not authenticated", description: "Please log in first.", variant: "destructive" });
      return;
    }
    
    // SSR safety guard for window.confirm
    if (typeof window === "undefined") return;
    
    const confirmed = window.confirm("Are you sure you want to clear ALL session data? This cannot be undone.");
    if (!confirmed) return;
    
    setIsClearing(true);
    try {
      const { error } = await supabase
        .from("session_logs")
        .delete()
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Supabase delete error (full object):", error);
        
        const errorParts: string[] = [error.message];
        if ('details' in error && error.details) {
          errorParts.push(`Details: ${error.details}`);
        }
        if ('hint' in error && error.hint) {
          errorParts.push(`Hint: ${error.hint}`);
        }
        
        toast({ 
          title: "Clear failed", 
          description: errorParts.join(" | "), 
          variant: "destructive" 
        });
        return;
      }
      
      invalidateQueries();
      toast({ title: "Cleared all sessions", description: "All your session data removed." });
    } catch (err) {
      console.error("Clear error (caught exception):", err);
      toast({ title: "Clear failed", description: String(err), variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetTierCelebration = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      toast({ title: "Tier celebration reset", description: "Next tier-up will trigger a toast." });
    }
  };

  const handleResetDefaults = () => {
    setCustomCount(20);
    setDaysBack(14);
    toast({ title: "Defaults reset", description: "Count 20, Range 14 days" });
  };

  const isSeeding = seedingState !== null;
  const isPreset5 = seedingState?.source === 'preset-5';
  const isPreset20 = seedingState?.source === 'preset-20';
  const isCustom = seedingState?.source === 'custom';

  // Calculate expected outcome counts based on target distribution
  const expectedPositive = Math.round(customCount * 0.65);
  const expectedNeutral = Math.round(customCount * 0.25);
  const expectedNegative = customCount - expectedPositive - expectedNeutral;

  // Outcome Preview Component - shows target distribution visually
  const OutcomePreview = () => (
    <div className="mt-2 space-y-1">
      <div className="flex h-2 w-full rounded-sm overflow-hidden">
        {/* Dev-only hardcoded colors acceptable per requirements */}
        <div className="h-full" style={{ width: '65%', backgroundColor: '#22c55e' }} />
        <div className="h-full" style={{ width: '25%', backgroundColor: '#a3a3a3' }} />
        <div className="h-full" style={{ width: '10%', backgroundColor: '#ef4444' }} />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Target: {expectedPositive} positive / {expectedNeutral} neutral / {expectedNegative} negative
      </p>
    </div>
  );
  
  return (
    <Card className="border-dashed border-amber-500/30 bg-amber-500/10">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Dev Tools</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSeedSessions(5, 'preset-5')}
            disabled={isSeeding || isClearing}
            className="text-xs h-7"
          >
            {isPreset5 ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Seed 5
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSeedSessions(20, 'preset-20')}
            disabled={isSeeding || isClearing}
            className="text-xs h-7"
          >
            {isPreset20 ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Seed 20
          </Button>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={200}
              value={customCount}
              onChange={(e) => setCustomCount(Math.min(200, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 h-7 text-xs"
              disabled={isSeeding || isClearing}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSeedSessions(customCount, 'custom')}
              disabled={isSeeding || isClearing}
              className="text-xs h-7"
            >
              {isCustom ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
              Seed
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={60}
              value={daysBack}
              onChange={(e) => setDaysBack(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-14 h-7 text-xs"
              disabled={isSeeding || isClearing}
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearSessions}
            disabled={isSeeding || isClearing}
            className="text-xs h-7"
          >
            {isClearing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Clear all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetTierCelebration}
            disabled={isSeeding || isClearing}
            className="text-xs h-7"
          >
            Reset Tier
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetDefaults}
            disabled={isSeeding || isClearing}
            className="text-xs h-7"
          >
            Reset defaults
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setIsRefreshingStats(true);
              try {
                const { data, error } = await supabase.rpc("refresh_community_strain_stats" as any);
                if (error) {
                  toast({ title: "Refresh failed", description: error.message, variant: "destructive" });
                } else {
                  queryClient.invalidateQueries({ queryKey: ["community-strain-stats"] });
                  toast({ title: "Community stats refreshed", description: `${data} rows rebuilt.` });
                }
              } catch (err) {
                toast({ title: "Refresh failed", description: String(err), variant: "destructive" });
              } finally {
                setIsRefreshingStats(false);
              }
            }}
            disabled={isSeeding || isClearing || isRefreshingStats}
            className="text-xs h-7"
          >
            {isRefreshingStats ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Refresh Stats
          </Button>
        </div>
        <OutcomePreview />
      </CardContent>
    </Card>
  );
}
