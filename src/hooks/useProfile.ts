import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  age_range: string | null;
  weight_range: string | null;
  sensitivity_flags: string[];
  is_premium: boolean;
  community_sharing_enabled: boolean;
  guide_mode_enabled: boolean;
  dismissed_tip_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
