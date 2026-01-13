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
      booking_holds: {
        Row: {
          calendar_id: string | null
          created_at: string
          end_time: string
          expires_at: string
          hold_key: string
          id: string
          package_id: string | null
          service_id: string | null
          staff_id: string | null
          start_time: string
        }
        Insert: {
          calendar_id?: string | null
          created_at?: string
          end_time: string
          expires_at: string
          hold_key: string
          id?: string
          package_id?: string | null
          service_id?: string | null
          staff_id?: string | null
          start_time: string
        }
        Update: {
          calendar_id?: string | null
          created_at?: string
          end_time?: string
          expires_at?: string
          hold_key?: string
          id?: string
          package_id?: string | null
          service_id?: string | null
          staff_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_holds_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_holds_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_holds_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bookings: {
        Row: {
          client_email: string
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          end_time: string
          google_calendar_event_id: string | null
          id: string
          notes: string | null
          package_id: string | null
          service_id: string | null
          staff_id: string | null
          start_time: string
          status: string
          timezone: string | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          client_email: string
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          end_time: string
          google_calendar_event_id?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          service_id?: string | null
          staff_id?: string | null
          start_time: string
          status?: string
          timezone?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          client_email?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          end_time?: string
          google_calendar_event_id?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          service_id?: string | null
          staff_id?: string | null
          start_time?: string
          status?: string
          timezone?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      business_hours: {
        Row: {
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          close_time?: string
          created_at?: string
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time?: string
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          calendar_id: string | null
          created_at: string
          id: string
          is_active: boolean
          provider: string
          staff_id: string | null
          sync_enabled: boolean | null
          timezone: string
          updated_at: string
        }
        Insert: {
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          staff_id?: string | null
          sync_enabled?: boolean | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          staff_id?: string | null
          sync_enabled?: boolean | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          channel: string
          created_at: string
          id: string
          name: string
          primary_kpi: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          updated_at: string
          utm_campaign: string | null
        }
        Insert: {
          budget?: number | null
          channel: string
          created_at?: string
          id?: string
          name: string
          primary_kpi?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          updated_at?: string
          utm_campaign?: string | null
        }
        Update: {
          budget?: number | null
          channel?: string
          created_at?: string
          id?: string
          name?: string
          primary_kpi?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          updated_at?: string
          utm_campaign?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          last_visit_at: string | null
          name: string
          phone: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          last_visit_at?: string | null
          name: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          last_visit_at?: string | null
          name?: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          active: boolean | null
          body: string | null
          created_at: string
          end_at: string | null
          headline: string | null
          id: string
          limit_spots: number | null
          name: string
          package_id: string | null
          price_display: string | null
          service_id: string | null
          start_at: string | null
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          body?: string | null
          created_at?: string
          end_at?: string | null
          headline?: string | null
          id?: string
          limit_spots?: number | null
          name: string
          package_id?: string | null
          price_display?: string | null
          service_id?: string | null
          start_at?: string | null
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          body?: string | null
          created_at?: string
          end_at?: string | null
          headline?: string | null
          id?: string
          limit_spots?: number | null
          name?: string
          package_id?: string | null
          price_display?: string | null
          service_id?: string | null
          start_at?: string | null
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      package_services: {
        Row: {
          id: string
          package_id: string
          quantity: number | null
          service_id: string
        }
        Insert: {
          id?: string
          package_id: string
          quantity?: number | null
          service_id: string
        }
        Update: {
          id?: string
          package_id?: string
          quantity?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_services_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          expires_days: number | null
          id: string
          is_featured: boolean | null
          name: string
          original_price: number | null
          sessions_qty: number
          total_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          expires_days?: number | null
          id?: string
          is_featured?: boolean | null
          name: string
          original_price?: number | null
          sessions_qty?: number
          total_price: number
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          expires_days?: number | null
          id?: string
          is_featured?: boolean | null
          name?: string
          original_price?: number | null
          sessions_qty?: number
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      quiz_options: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          image_url: string | null
          option_text: string
          order_index: number
          points: Json | null
          question_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          option_text: string
          order_index?: number
          points?: Json | null
          question_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          option_text?: string
          order_index?: number
          points?: Json | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_required: boolean
          order_index: number
          question_text: string
          question_type: string
          quiz_id: string
          settings: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_required?: boolean
          order_index?: number
          question_text: string
          question_type?: string
          quiz_id: string
          settings?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_required?: boolean
          order_index?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answers: Json
          calculated_score: Json | null
          client_email: string | null
          client_id: string | null
          client_instagram: string | null
          client_name: string | null
          client_phone: string | null
          completed_at: string | null
          created_at: string
          id: string
          quiz_id: string
          recommended_result_id: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          answers?: Json
          calculated_score?: Json | null
          client_email?: string | null
          client_id?: string | null
          client_instagram?: string | null
          client_name?: string | null
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          quiz_id: string
          recommended_result_id?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          answers?: Json
          calculated_score?: Json | null
          client_email?: string | null
          client_id?: string | null
          client_instagram?: string | null
          client_name?: string | null
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          quiz_id?: string
          recommended_result_id?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_recommended_result_id_fkey"
            columns: ["recommended_result_id"]
            isOneToOne: false
            referencedRelation: "quiz_results"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string | null
          id: string
          image_url: string | null
          max_score: number | null
          min_score: number | null
          offer_id: string | null
          package_id: string | null
          quiz_id: string
          service_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          max_score?: number | null
          min_score?: number | null
          offer_id?: string | null
          package_id?: string | null
          quiz_id: string
          service_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          max_score?: number | null
          min_score?: number | null
          offer_id?: string | null
          package_id?: string | null
          quiz_id?: string
          service_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          settings: Json | null
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          settings?: Json | null
          slug: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json | null
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      scheduling_settings: {
        Row: {
          buffer_minutes: number
          created_at: string
          hold_duration_minutes: number
          id: string
          max_advance_days: number
          slot_interval_minutes: number
          timezone: string
          updated_at: string
        }
        Insert: {
          buffer_minutes?: number
          created_at?: string
          hold_duration_minutes?: number
          id?: string
          max_advance_days?: number
          slot_interval_minutes?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          buffer_minutes?: number
          created_at?: string
          hold_duration_minutes?: number
          id?: string
          max_advance_days?: number
          slot_interval_minutes?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          promo_price: number | null
          status: Database["public"]["Enums"]["service_status"] | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          promo_price?: number | null
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          promo_price?: number | null
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_holds: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin_owner" | "staff" | "marketing"
      booking_status:
        | "requested"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      campaign_status: "draft" | "active" | "paused" | "completed"
      offer_type: "entry_offer" | "package_offer" | "consultation_offer"
      payment_status: "unpaid" | "paid"
      service_status: "entry" | "upsell" | "premium" | "inactive"
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
      app_role: ["admin_owner", "staff", "marketing"],
      booking_status: [
        "requested",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      campaign_status: ["draft", "active", "paused", "completed"],
      offer_type: ["entry_offer", "package_offer", "consultation_offer"],
      payment_status: ["unpaid", "paid"],
      service_status: ["entry", "upsell", "premium", "inactive"],
    },
  },
} as const
