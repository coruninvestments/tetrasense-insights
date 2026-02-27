export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          key: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          key: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          key?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      coa_ingestions: {
        Row: {
          batch_id: string
          created_at: string
          extracted_json: Json | null
          id: string
          parser_version: string
          raw_text: string | null
          source: string
          status: string
          user_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          extracted_json?: Json | null
          id?: string
          parser_version?: string
          raw_text?: string | null
          source: string
          status?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          extracted_json?: Json | null
          id?: string
          parser_version?: string
          raw_text?: string | null
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coa_ingestions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      community_strain_stats: {
        Row: {
          id: string
          intent: string
          last_updated: string
          outcome_avoid_pct: number | null
          outcome_neutral_pct: number | null
          outcome_positive_pct: number | null
          sample_size: number
          strain_id: string
          strain_name: string
          strain_type: string
          top_effects: string[]
        }
        Insert: {
          id?: string
          intent: string
          last_updated?: string
          outcome_avoid_pct?: number | null
          outcome_neutral_pct?: number | null
          outcome_positive_pct?: number | null
          sample_size?: number
          strain_id: string
          strain_name: string
          strain_type: string
          top_effects?: string[]
        }
        Update: {
          id?: string
          intent?: string
          last_updated?: string
          outcome_avoid_pct?: number | null
          outcome_neutral_pct?: number | null
          outcome_positive_pct?: number | null
          sample_size?: number
          strain_id?: string
          strain_name?: string
          strain_type?: string
          top_effects?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "community_strain_stats_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string | null
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      product_batches: {
        Row: {
          batch_code: string | null
          coa_file_path: string | null
          coa_reject_reason: string | null
          coa_status: string
          coa_url: string | null
          created_at: string
          created_by_user_id: string | null
          id: string
          is_public_library: boolean
          lab_name: string | null
          lab_panel_common: Json | null
          lab_panel_custom: Json | null
          product_id: string
          tested_at: string | null
        }
        Insert: {
          batch_code?: string | null
          coa_file_path?: string | null
          coa_reject_reason?: string | null
          coa_status?: string
          coa_url?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_public_library?: boolean
          lab_name?: string | null
          lab_panel_common?: Json | null
          lab_panel_custom?: Json | null
          product_id: string
          tested_at?: string | null
        }
        Update: {
          batch_code?: string | null
          coa_file_path?: string | null
          coa_reject_reason?: string | null
          coa_status?: string
          coa_url?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_public_library?: boolean
          lab_name?: string | null
          lab_panel_common?: Json | null
          lab_panel_custom?: Json | null
          product_id?: string
          tested_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_name: string | null
          created_at: string
          form: string | null
          id: string
          product_name: string
          strain_id: string | null
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          form?: string | null
          id?: string
          product_name: string
          strain_id?: string | null
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          form?: string | null
          id?: string
          product_name?: string
          strain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains_canonical"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_batch_id: string | null
          active_product_id: string | null
          active_strain_id: string | null
          age_range: string | null
          calibration_anchors: Json | null
          community_sharing_enabled: boolean
          created_at: string
          disclaimer_accepted_at: string | null
          disclaimer_version: string | null
          dismissed_tip_ids: string[]
          display_name: string | null
          guide_mode_enabled: boolean
          id: string
          is_premium: boolean | null
          legal_age_confirmed: boolean
          onboarding_completed: boolean
          privacy_acknowledged_at: string | null
          quick_log_enabled: boolean
          sensitivity_flags: string[] | null
          updated_at: string
          user_id: string
          weight_range: string | null
        }
        Insert: {
          active_batch_id?: string | null
          active_product_id?: string | null
          active_strain_id?: string | null
          age_range?: string | null
          calibration_anchors?: Json | null
          community_sharing_enabled?: boolean
          created_at?: string
          disclaimer_accepted_at?: string | null
          disclaimer_version?: string | null
          dismissed_tip_ids?: string[]
          display_name?: string | null
          guide_mode_enabled?: boolean
          id?: string
          is_premium?: boolean | null
          legal_age_confirmed?: boolean
          onboarding_completed?: boolean
          privacy_acknowledged_at?: string | null
          quick_log_enabled?: boolean
          sensitivity_flags?: string[] | null
          updated_at?: string
          user_id: string
          weight_range?: string | null
        }
        Update: {
          active_batch_id?: string | null
          active_product_id?: string | null
          active_strain_id?: string | null
          age_range?: string | null
          calibration_anchors?: Json | null
          community_sharing_enabled?: boolean
          created_at?: string
          disclaimer_accepted_at?: string | null
          disclaimer_version?: string | null
          dismissed_tip_ids?: string[]
          display_name?: string | null
          guide_mode_enabled?: boolean
          id?: string
          is_premium?: boolean | null
          legal_age_confirmed?: boolean
          onboarding_completed?: boolean
          privacy_acknowledged_at?: string | null
          quick_log_enabled?: boolean
          sensitivity_flags?: string[] | null
          updated_at?: string
          user_id?: string
          weight_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_batch_id_fkey"
            columns: ["active_batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_product_id_fkey"
            columns: ["active_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_strain_id_fkey"
            columns: ["active_strain_id"]
            isOneToOne: false
            referencedRelation: "strains_canonical"
            referencedColumns: ["id"]
          },
        ]
      }
      session_logs: {
        Row: {
          batch_id: string | null
          caffeine: boolean
          canonical_strain_id: string | null
          coa_attached: boolean
          comfort_score: number | null
          created_at: string
          custom_effects: Json | null
          dose: string
          dose_amount_mg: number | null
          dose_count: number | null
          dose_level: Database["public"]["Enums"]["dose_level"] | null
          dose_normalized_score: number | null
          dose_unit: string | null
          effect_anxiety: number | null
          effect_body_heaviness: number | null
          effect_body_mind: number | null
          effect_dry_eyes: number | null
          effect_dry_mouth: number | null
          effect_duration_bucket: string | null
          effect_euphoria: number | null
          effect_focus: number | null
          effect_pain_relief: number | null
          effect_relaxation: number | null
          effect_sleepiness: number | null
          effect_throat_irritation: number | null
          effects: string[] | null
          hydration: string | null
          id: string
          intent: string
          intent_match_score: number | null
          local_time: string | null
          method: string
          mood_before: string | null
          notes: string | null
          outcome: string | null
          outcome_preference: string | null
          product_id: string | null
          setting: string | null
          sleep_quality: string | null
          stomach: string | null
          strain_id: string | null
          strain_name_text: string
          strain_type: string | null
          stress_before: string | null
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          caffeine?: boolean
          canonical_strain_id?: string | null
          coa_attached?: boolean
          comfort_score?: number | null
          created_at?: string
          custom_effects?: Json | null
          dose: string
          dose_amount_mg?: number | null
          dose_count?: number | null
          dose_level?: Database["public"]["Enums"]["dose_level"] | null
          dose_normalized_score?: number | null
          dose_unit?: string | null
          effect_anxiety?: number | null
          effect_body_heaviness?: number | null
          effect_body_mind?: number | null
          effect_dry_eyes?: number | null
          effect_dry_mouth?: number | null
          effect_duration_bucket?: string | null
          effect_euphoria?: number | null
          effect_focus?: number | null
          effect_pain_relief?: number | null
          effect_relaxation?: number | null
          effect_sleepiness?: number | null
          effect_throat_irritation?: number | null
          effects?: string[] | null
          hydration?: string | null
          id?: string
          intent: string
          intent_match_score?: number | null
          local_time?: string | null
          method: string
          mood_before?: string | null
          notes?: string | null
          outcome?: string | null
          outcome_preference?: string | null
          product_id?: string | null
          setting?: string | null
          sleep_quality?: string | null
          stomach?: string | null
          strain_id?: string | null
          strain_name_text: string
          strain_type?: string | null
          stress_before?: string | null
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          caffeine?: boolean
          canonical_strain_id?: string | null
          coa_attached?: boolean
          comfort_score?: number | null
          created_at?: string
          custom_effects?: Json | null
          dose?: string
          dose_amount_mg?: number | null
          dose_count?: number | null
          dose_level?: Database["public"]["Enums"]["dose_level"] | null
          dose_normalized_score?: number | null
          dose_unit?: string | null
          effect_anxiety?: number | null
          effect_body_heaviness?: number | null
          effect_body_mind?: number | null
          effect_dry_eyes?: number | null
          effect_dry_mouth?: number | null
          effect_duration_bucket?: string | null
          effect_euphoria?: number | null
          effect_focus?: number | null
          effect_pain_relief?: number | null
          effect_relaxation?: number | null
          effect_sleepiness?: number | null
          effect_throat_irritation?: number | null
          effects?: string[] | null
          hydration?: string | null
          id?: string
          intent?: string
          intent_match_score?: number | null
          local_time?: string | null
          method?: string
          mood_before?: string | null
          notes?: string | null
          outcome?: string | null
          outcome_preference?: string | null
          product_id?: string | null
          setting?: string | null
          sleep_quality?: string | null
          stomach?: string | null
          strain_id?: string | null
          strain_name_text?: string
          strain_type?: string | null
          stress_before?: string | null
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_canonical_strain_id_fkey"
            columns: ["canonical_strain_id"]
            isOneToOne: false
            referencedRelation: "strains_canonical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains"
            referencedColumns: ["id"]
          },
        ]
      }
      strain_aliases: {
        Row: {
          alias_name: string
          created_at: string
          id: string
          strain_id: string
        }
        Insert: {
          alias_name: string
          created_at?: string
          id?: string
          strain_id: string
        }
        Update: {
          alias_name?: string
          created_at?: string
          id?: string
          strain_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strain_aliases_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains"
            referencedColumns: ["id"]
          },
        ]
      }
      strain_aliases_canonical: {
        Row: {
          alias_name: string
          confidence: number
          created_at: string
          id: string
          source: string
          strain_id: string
        }
        Insert: {
          alias_name: string
          confidence?: number
          created_at?: string
          id?: string
          source?: string
          strain_id: string
        }
        Update: {
          alias_name?: string
          confidence?: number
          created_at?: string
          id?: string
          source?: string
          strain_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strain_aliases_canonical_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains_canonical"
            referencedColumns: ["id"]
          },
        ]
      }
      strains: {
        Row: {
          cbd_max: number | null
          cbd_min: number | null
          cbd_range: string | null
          common_effects: string[] | null
          common_negatives: string[] | null
          created_at: string
          description: string | null
          id: string
          is_pending: boolean | null
          name: string
          submitted_by: string | null
          thc_max: number | null
          thc_min: number | null
          thc_range: string | null
          type: string
        }
        Insert: {
          cbd_max?: number | null
          cbd_min?: number | null
          cbd_range?: string | null
          common_effects?: string[] | null
          common_negatives?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_pending?: boolean | null
          name: string
          submitted_by?: string | null
          thc_max?: number | null
          thc_min?: number | null
          thc_range?: string | null
          type: string
        }
        Update: {
          cbd_max?: number | null
          cbd_min?: number | null
          cbd_range?: string | null
          common_effects?: string[] | null
          common_negatives?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_pending?: boolean | null
          name?: string
          submitted_by?: string | null
          thc_max?: number | null
          thc_min?: number | null
          thc_range?: string | null
          type?: string
        }
        Relationships: []
      }
      strains_canonical: {
        Row: {
          canonical_name: string
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          strain_type: string | null
        }
        Insert: {
          canonical_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          strain_type?: string | null
        }
        Update: {
          canonical_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          strain_type?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      strain_community_stats: {
        Row: {
          avg_anxiety: number | null
          avg_euphoria: number | null
          avg_focus: number | null
          avg_pain_relief: number | null
          avg_relaxation: number | null
          avg_sleepiness: number | null
          percent_positive_outcome: number | null
          strain_id: string | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_approve_batch: { Args: { _batch_id: string }; Returns: undefined }
      admin_pending_batches: {
        Args: never
        Returns: {
          batch_code: string
          brand_name: string
          coa_file_path: string
          coa_reject_reason: string
          coa_status: string
          coa_url: string
          created_at: string
          created_by_user_id: string
          id: string
          is_public_library: boolean
          lab_name: string
          lab_panel_common: Json
          lab_panel_custom: Json
          product_id: string
          product_name: string
          strain_name: string
          tested_at: string
        }[]
      }
      admin_reject_batch: {
        Args: { _batch_id: string; _reason: string }
        Returns: undefined
      }
      admin_update_lab_panel: {
        Args: {
          _batch_id: string
          _lab_panel_common: Json
          _lab_panel_custom: Json
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      refresh_community_strain_stats: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      dose_level: "low" | "medium" | "high"
      session_intent:
        | "sleep"
        | "relaxation"
        | "creativity"
        | "focus"
        | "pain_relief"
        | "social"
        | "recreation"
        | "learning"
      session_method:
        | "smoke"
        | "vape"
        | "edible"
        | "tincture"
        | "topical"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      dose_level: ["low", "medium", "high"],
      session_intent: [
        "sleep",
        "relaxation",
        "creativity",
        "focus",
        "pain_relief",
        "social",
        "recreation",
        "learning",
      ],
      session_method: [
        "smoke",
        "vape",
        "edible",
        "tincture",
        "topical",
        "other",
      ],
    },
  },
} as const
