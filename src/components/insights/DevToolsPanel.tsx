import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const INTENTS: SessionIntent[] = ["sleep", "relaxation", "creativity", "focus", "pain_relief", "social", "recreation"];
const METHODS: SessionMethod[] = ["smoke", "vape", "edible", "tincture"];
const DOSE_LEVELS: DoseLevel[] = ["low", "medium", "high"];
const OUTCOMES: SessionOutcome[] = ["positive", "neutral", "negative"];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSampleSession(userId: string, daysAgo: number) {
  const strain = randomPick(SAMPLE_STRAINS);
  const intent = randomPick(INTENTS);
  const method = randomPick(METHODS);
  const doseLevel = randomPick(DOSE_LEVELS);
  
  // Generate effects based on intent for more realistic data
  const baseRelaxation = intent === "relaxation" || intent === "sleep" ? randomInt(6, 10) : randomInt(2, 7);
  const baseSleepiness = intent === "sleep" ? randomInt(6, 10) : randomInt(1, 5);
  const baseFocus = intent === "focus" || intent === "creativity" ? randomInt(6, 10) : randomInt(2, 6);
  const baseAnxiety = randomInt(0, 5);
  const basePainRelief = intent === "pain_relief" ? randomInt(6, 10) : randomInt(2, 6);
  const baseEuphoria = randomInt(4, 9);
  
  // Determine outcome based on effects
  let outcome: SessionOutcome = "neutral";
  if ((baseRelaxation >= 6 || baseSleepiness >= 6 || baseFocus >= 6 || basePainRelief >= 6) && baseAnxiety <= 5) {
    outcome = "positive";
  } else if (baseAnxiety >= 7) {
    outcome = "negative";
  }
  
  // Create date spread across days
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(8, 23), randomInt(0, 59), 0, 0);
  
  const localTime = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return {
    user_id: userId,
    created_at: date.toISOString(),
    local_time: localTime,
    intent,
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
    outcome,
    notes: null,
  };
}

function DevToolsPanelContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["session-logs"] });
    queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["session-stats"] });
  };

  const handleSeedSessions = async () => {
    if (!user) {
      toast({ title: "Not authenticated", description: "Please log in first.", variant: "destructive" });
      return;
    }
    
    setIsSeeding(true);
    try {
      // Generate 20 sessions spread across 14 days
      const sessions = [];
      for (let i = 0; i < 20; i++) {
        const daysAgo = randomInt(0, 13);
        sessions.push(generateSampleSession(user.id, daysAgo));
      }
      
      const { error } = await supabase
        .from("session_logs")
        .insert(sessions);
      
      if (error) throw error;
      
      invalidateQueries();
      toast({ title: "Seeded 20 sessions", description: "Sample data added successfully." });
    } catch (err) {
      console.error("Seed error:", err);
      toast({ title: "Seed failed", description: String(err), variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearSessions = async () => {
    if (!user) {
      toast({ title: "Not authenticated", description: "Please log in first.", variant: "destructive" });
      return;
    }
    
    setIsClearing(true);
    try {
      const { error } = await supabase
        .from("session_logs")
        .delete()
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      invalidateQueries();
      toast({ title: "Cleared all sessions", description: "All your session data removed." });
    } catch (err) {
      console.error("Clear error:", err);
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

  return (
    <Card className="border-dashed border-warning/50 bg-warning/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-4 h-4 text-warning" />
          <span className="text-xs font-medium text-warning uppercase tracking-wide">Dev Tools</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSeedSessions}
            disabled={isSeeding || isClearing}
            className="text-xs h-7"
          >
            {isSeeding ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Seed 20 sessions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearSessions}
            disabled={isSeeding || isClearing}
            className="text-xs h-7"
          >
            {isClearing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Clear all sessions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetTierCelebration}
            disabled={isSeeding || isClearing}
            className="text-xs h-7"
          >
            Reset Tier Celebration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
