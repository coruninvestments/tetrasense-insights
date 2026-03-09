import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { SessionOutcome, computeSessionOutcome } from "@/lib/sessionOutcome";
import { computeDoseNormalizedScore } from "@/lib/doseNormalization";
import { computeIntensity } from "@/lib/psychoactiveIntensity";
import { checkSessionMilestones } from "@/lib/analytics";
import { checkSessionAchievements, type AchievementKey } from "@/lib/achievements";

export type SessionIntent = 'sleep' | 'relaxation' | 'creativity' | 'focus' | 'pain_relief' | 'social' | 'recreation' | 'learning';
export type SessionMethod = 'smoke' | 'vape' | 'edible' | 'tincture' | 'topical' | 'other';
export type DoseLevel = 'low' | 'medium' | 'high';

// Re-export SessionOutcome from centralized location for backwards compatibility
export type { SessionOutcome } from "@/lib/sessionOutcome";

export interface EffectSliders {
  sleepiness: number;
  relaxation: number;
  anxiety: number;
  focus: number;
  pain_relief: number;
  euphoria: number;
}

export interface PhysicalEffectsData {
  dry_mouth: number;
  dry_eyes: number;
  throat_irritation: number;
  body_heaviness: number;
}

export interface CustomEffectEntry {
  name: string;
  value: number;
}

export interface SessionLog {
  id: string;
  user_id: string;
  created_at: string;
  local_time: string | null;
  intent: string;
  strain_id: string | null;
  canonical_strain_id: string | null;
  strain_name_text: string;
  strain_type: string | null;
  method: string;
  dose: string;
  dose_level: DoseLevel | null;
  dose_amount_mg: number | null;
  effect_sleepiness: number | null;
  effect_relaxation: number | null;
  effect_anxiety: number | null;
  effect_focus: number | null;
  effect_pain_relief: number | null;
  effect_euphoria: number | null;
  effects: string[] | null;
  notes: string | null;
  outcome: SessionOutcome | null;
  effect_dry_mouth: number | null;
  effect_dry_eyes: number | null;
  effect_throat_irritation: number | null;
  effect_body_heaviness: number | null;
  effect_duration_bucket: string | null;
  effect_body_mind: number | null;
  outcome_preference: string | null;
  custom_effects: CustomEffectEntry[] | null;
  intent_match_score: number | null;
  comfort_score: number | null;
  time_of_day: string | null;
  setting: string | null;
  stomach: string | null;
  caffeine: boolean;
  hydration: string | null;
  sleep_quality: string | null;
  mood_before: string | null;
  stress_before: string | null;
  dose_unit: string | null;
  dose_count: number | null;
  dose_normalized_score: number | null;
  aroma_tags: string[] | null;
  flavor_tags: string[] | null;
  inhale_quality: string | null;
  aftertaste: string | null;
  sensory_enjoyment: number | null;
  product_id: string | null;
  batch_id: string | null;
  coa_attached: boolean;
  intensity_score: number | null;
}

export interface CreateSessionLogInput {
  intent: SessionIntent;
  strain_id?: string | null;
  strain_name_text: string;
  strain_type?: string;
  method: SessionMethod;
  dose_level: DoseLevel;
  dose_amount_mg?: number | null;
  effects: EffectSliders;
  physicalEffects?: PhysicalEffectsData;
  durationBucket?: string;
  bodyMind?: number;
  outcomePreference?: string;
  customEffects?: CustomEffectEntry[];
  notes?: string;
  outcome?: SessionOutcome;
  canonical_strain_id?: string | null;
  product_id?: string | null;
  batch_id?: string | null;
  coa_attached?: boolean;
  time_of_day?: string | null;
  setting?: string | null;
  stomach?: string | null;
  caffeine?: boolean;
  hydration?: string | null;
  sleep_quality?: string | null;
  mood_before?: string | null;
  stress_before?: string | null;
  dose_unit?: string | null;
  dose_count?: number | null;
  aroma_tags?: string[];
  flavor_tags?: string[];
  inhale_quality?: string | null;
  aftertaste?: string | null;
  sensory_enjoyment?: number | null;
}

export function useSessionLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["session-logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("session_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as SessionLog[];
    },
    enabled: !!user,
  });
}

export function useRecentSessions(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-sessions", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("session_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as SessionLog[];
    },
    enabled: !!user,
  });
}

export function useSessionStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["session-stats", user?.id],
    queryFn: async () => {
      if (!user) return { thisWeek: 0, totalSessions: 0, uniqueStrains: 0 };

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get this week's sessions
      const { data: weekSessions, error: weekError } = await supabase
        .from("session_logs")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", startOfWeek.toISOString());

      if (weekError) throw weekError;

      // Get total sessions
      const { count: totalCount, error: totalError } = await supabase
        .from("session_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (totalError) throw totalError;

      // Get unique strains
      const { data: strains, error: strainsError } = await supabase
        .from("session_logs")
        .select("strain_name_text")
        .eq("user_id", user.id);

      if (strainsError) throw strainsError;

      const uniqueStrains = new Set(strains?.map((s) => s.strain_name_text)).size;

      return {
        thisWeek: weekSessions?.length || 0,
        totalSessions: totalCount || 0,
        uniqueStrains,
      };
    },
    enabled: !!user,
  });
}

export function useCreateSessionLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateSessionLogInput) => {
      if (!user) throw new Error("Not authenticated");

      // Normalize and validate strain name
      const normalizedStrainName = input.strain_name_text.trim();
      if (!normalizedStrainName) {
        throw new Error("Strain name is required");
      }

      // Compute default outcome from effect sliders if not provided
      const computedOutcome = computeSessionOutcome(input.effects);
      const finalOutcome = input.outcome ?? computedOutcome;

      // Capture local time
      const now = new Date();
      const localTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      // Map old dose field for backwards compatibility
      const doseMap: Record<DoseLevel, string> = {
        low: 'low',
        medium: 'medium', 
        high: 'high'
      };

      const { data, error } = await supabase
        .from("session_logs")
        .insert({
          user_id: user.id,
          intent: input.intent,
          strain_id: input.strain_id || null,
          strain_name_text: normalizedStrainName,
          strain_type: input.strain_type || null,
          method: input.method,
          dose: doseMap[input.dose_level],
          dose_level: input.dose_level,
          dose_amount_mg: input.dose_amount_mg || null,
          local_time: localTime,
          effect_sleepiness: input.effects.sleepiness,
          effect_relaxation: input.effects.relaxation,
          effect_anxiety: input.effects.anxiety,
          effect_focus: input.effects.focus,
          effect_pain_relief: input.effects.pain_relief,
          effect_euphoria: input.effects.euphoria,
          effect_dry_mouth: input.physicalEffects?.dry_mouth ?? 0,
          effect_dry_eyes: input.physicalEffects?.dry_eyes ?? 0,
          effect_throat_irritation: input.physicalEffects?.throat_irritation ?? 0,
          effect_body_heaviness: input.physicalEffects?.body_heaviness ?? 0,
          effect_duration_bucket: input.durationBucket || null,
          effect_body_mind: input.bodyMind ?? null,
          outcome_preference: input.outcomePreference || null,
          custom_effects: input.customEffects && input.customEffects.length > 0
            ? (input.customEffects as unknown as Record<string, unknown>[])
            : null,
          notes: input.notes || null,
          outcome: finalOutcome,
          canonical_strain_id: input.canonical_strain_id || null,
          product_id: input.product_id || null,
          batch_id: input.batch_id || null,
          coa_attached: input.coa_attached ?? false,
          time_of_day: input.time_of_day || null,
          setting: input.setting || null,
          stomach: input.stomach || null,
          caffeine: input.caffeine ?? false,
          hydration: input.hydration || null,
          sleep_quality: input.sleep_quality || null,
          mood_before: input.mood_before || null,
          stress_before: input.stress_before || null,
          dose_unit: input.dose_unit || null,
          dose_count: input.dose_count ?? null,
          dose_normalized_score: computeDoseNormalizedScore({
            dose_level: input.dose_level,
            dose_unit: input.dose_unit,
            dose_count: input.dose_count,
            dose_amount_mg: input.dose_amount_mg,
          }),
          aroma_tags: input.aroma_tags && input.aroma_tags.length > 0 ? input.aroma_tags : [],
          flavor_tags: input.flavor_tags && input.flavor_tags.length > 0 ? input.flavor_tags : [],
          inhale_quality: input.inhale_quality || null,
          aftertaste: input.aftertaste || null,
          sensory_enjoyment: input.sensory_enjoyment ?? null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["session-logs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session-stats"] });

      // Check milestones (fire-and-forget)
      const cached = queryClient.getQueryData<SessionLog[]>(["session-logs", user?.id]);
      const total = (cached?.length ?? 0) + 1;
      checkSessionMilestones(total);

      // Check achievements
      const newlyUnlocked = await checkSessionAchievements(total);
      if (newlyUnlocked.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["achievements"] });
        // Store for modal display
        window.dispatchEvent(new CustomEvent("achievement-unlocked", { detail: newlyUnlocked[0] }));
      }
    },
  });
}
