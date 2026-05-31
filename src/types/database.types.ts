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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anonymous_imports: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          url?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          cuisine_metadata: Json | null
          id: string
          model_used: string | null
          role: string
          suggestions: Json | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          cuisine_metadata?: Json | null
          id?: string
          model_used?: string | null
          role: string
          suggestions?: Json | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          cuisine_metadata?: Json | null
          id?: string
          model_used?: string | null
          role?: string
          suggestions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cuisine_profiles: {
        Row: {
          created_at: string
          cuisine_name: string
          display_order: number
          id: string
          is_active: boolean
          keywords: string[]
          profile_data: Json
          style_focus: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuisine_name: string
          display_order?: number
          id?: string
          is_active?: boolean
          keywords?: string[]
          profile_data: Json
          style_focus: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuisine_name?: string
          display_order?: number
          id?: string
          is_active?: boolean
          keywords?: string[]
          profile_data?: Json
          style_focus?: string
          updated_at?: string
        }
        Relationships: []
      }
      llm_models: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          is_default: boolean
          model_identifier: string
          model_name: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          model_identifier: string
          model_name: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          model_identifier?: string
          model_name?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      meal_feedback: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          rating: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          rating: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          rating?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_recipes: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          meal_id: string
          recipe_id: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meal_id: string
          recipe_id: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meal_id?: string
          recipe_id?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_recipes_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_archived: boolean | null
          is_event: boolean
          meal_type: string
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_event?: boolean
          meal_type?: string
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_event?: boolean
          meal_type?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recipe_ratings: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          rating: string
          recipe_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating: string
          recipe_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating?: string
          recipe_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cocktail_metadata: Json | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: Json | null
          is_shared: boolean
          notes: string | null
          recipe_type: string
          servings: number | null
          source_url: string | null
          tags: string[] | null
          title: string
          total_time: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cocktail_metadata?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_shared?: boolean
          notes?: string | null
          recipe_type?: string
          servings?: number | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          total_time?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cocktail_metadata?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_shared?: boolean
          notes?: string | null
          recipe_type?: string
          servings?: number | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          total_time?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          created_at: string
          display_text: string | null
          id: string
          is_checked: boolean
          list_id: string
          meta_data: Json | null
          name: string
          product_id: string | null
          quantity: number
          recipe_id: string | null
          unit: string
          upc: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_text?: string | null
          id?: string
          is_checked?: boolean
          list_id: string
          meta_data?: Json | null
          name: string
          product_id?: string | null
          quantity?: number
          recipe_id?: string | null
          unit?: string
          upc?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_text?: string | null
          id?: string
          is_checked?: boolean
          list_id?: string
          meta_data?: Json | null
          name?: string
          product_id?: string | null
          quantity?: number
          recipe_id?: string | null
          unit?: string
          upc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suggested_recipes: {
        Row: {
          carb: string | null
          created_at: string
          id: string
          method: string | null
          protein: string | null
          recipe_name: string
          user_id: string
        }
        Insert: {
          carb?: string | null
          created_at?: string
          id?: string
          method?: string | null
          protein?: string | null
          recipe_name: string
          user_id: string
        }
        Update: {
          carb?: string | null
          created_at?: string
          id?: string
          method?: string | null
          protein?: string | null
          recipe_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          additional_notes: string | null
          cooking_equipment: string[] | null
          created_at: string | null
          dietary_style: string | null
          favorite_cuisines: string[] | null
          favorite_dishes: string[] | null
          food_restrictions: string[] | null
          household_size: number | null
          id: string
          skill_level: string | null
          spice_preference: string | null
          time_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          cooking_equipment?: string[] | null
          created_at?: string | null
          dietary_style?: string | null
          favorite_cuisines?: string[] | null
          favorite_dishes?: string[] | null
          food_restrictions?: string[] | null
          household_size?: number | null
          id?: string
          skill_level?: string | null
          spice_preference?: string | null
          time_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          cooking_equipment?: string[] | null
          created_at?: string | null
          dietary_style?: string | null
          favorite_cuisines?: string[] | null
          favorite_dishes?: string[] | null
          food_restrictions?: string[] | null
          household_size?: number | null
          id?: string
          skill_level?: string | null
          spice_preference?: string | null
          time_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          assigned_model_id: string | null
          created_at: string
          full_name: string
          has_seen_onboarding: boolean | null
          id: string
          is_admin: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_model_id?: string | null
          created_at?: string
          full_name: string
          has_seen_onboarding?: boolean | null
          id?: string
          is_admin?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_model_id?: string | null
          created_at?: string
          full_name?: string
          has_seen_onboarding?: boolean | null
          id?: string
          is_admin?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_assigned_model_id_fkey"
            columns: ["assigned_model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_meal_sets: {
        Row: {
          created_at: string
          id: string
          recipes: Json
          user_id: string | null
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipes?: Json
          user_id?: string | null
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          recipes?: Json
          user_id?: string | null
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_user_logins: { Args: { target_user_id: string }; Returns: number }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_user_approved: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
