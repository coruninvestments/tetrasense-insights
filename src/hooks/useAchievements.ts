import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Achievement {
  id: string;
  user_id: string;
  key: string;
  unlocked_at: string;
}

export function useAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Achievement[];
    },
    enabled: !!user,
  });
}
