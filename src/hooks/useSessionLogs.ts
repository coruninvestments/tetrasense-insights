import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SessionLog {
  id: string;
  user_id: string;
  intent: string;
  strain_name: string;
  strain_type: string | null;
  method: string;
  dose: string;
  effects: string[];
  notes: string | null;
  outcome: string | null;
  created_at: string;
}

export interface CreateSessionLogInput {
  intent: string;
  strain_name: string;
  strain_type?: string;
  method: string;
  dose: string;
  effects: string[];
  notes?: string;
  outcome?: string;
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SessionLog[];
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
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SessionLog[];
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
        .gte("created_at", startOfWeek.toISOString());

      if (weekError) throw weekError;

      // Get total sessions
      const { count: totalCount, error: totalError } = await supabase
        .from("session_logs")
        .select("*", { count: "exact", head: true });

      if (totalError) throw totalError;

      // Get unique strains
      const { data: strains, error: strainsError } = await supabase
        .from("session_logs")
        .select("strain_name");

      if (strainsError) throw strainsError;

      const uniqueStrains = new Set(strains?.map((s) => s.strain_name)).size;

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

      const { data, error } = await supabase
        .from("session_logs")
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-logs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session-stats"] });
    },
  });
}
