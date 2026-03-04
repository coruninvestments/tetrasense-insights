import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { SessionLog } from "./useSessionLogs";

export function useSession(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from("session_logs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as unknown as SessionLog;
    },
    enabled: !!user && !!id,
  });
}
