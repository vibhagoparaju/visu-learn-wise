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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: string
          note: string | null
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string | null
          formulas: Json | null
          id: string
          key_points: Json | null
          status: string | null
          summary: string | null
          topics: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path?: string | null
          formulas?: Json | null
          id?: string
          key_points?: Json | null
          status?: string | null
          summary?: string | null
          topics?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string | null
          formulas?: Json | null
          id?: string
          key_points?: Json | null
          status?: string | null
          summary?: string | null
          topics?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      exam_deadlines: {
        Row: {
          created_at: string
          exam_date: string
          id: string
          notes: string | null
          subject: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          id?: string
          notes?: string | null
          subject?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          id?: string
          notes?: string | null
          subject?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          difficulty: number
          front: string
          id: string
          next_review_at: string
          review_count: number
          topic: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          difficulty?: number
          front: string
          id?: string
          next_review_at?: string
          review_count?: number
          topic: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          difficulty?: number
          front?: string
          id?: string
          next_review_at?: string
          review_count?: number
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_personality: string | null
          created_at: string | null
          difficulty_level: string | null
          display_name: string | null
          id: string
          last_study_date: string | null
          level: number | null
          puppy_enabled: boolean | null
          selected_board: string | null
          selected_grade: string | null
          streak_days: number | null
          tutor_name: string | null
          updated_at: string | null
          voice_enabled: boolean | null
          xp: number | null
        }
        Insert: {
          ai_personality?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          display_name?: string | null
          id: string
          last_study_date?: string | null
          level?: number | null
          puppy_enabled?: boolean | null
          selected_board?: string | null
          selected_grade?: string | null
          streak_days?: number | null
          tutor_name?: string | null
          updated_at?: string | null
          voice_enabled?: boolean | null
          xp?: number | null
        }
        Update: {
          ai_personality?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          display_name?: string | null
          id?: string
          last_study_date?: string | null
          level?: number | null
          puppy_enabled?: boolean | null
          selected_board?: string | null
          selected_grade?: string | null
          streak_days?: number | null
          tutor_name?: string | null
          updated_at?: string | null
          voice_enabled?: boolean | null
          xp?: number | null
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          plan_date: string
          tasks: Json | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          plan_date: string
          tasks?: Json | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          plan_date?: string
          tasks?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      study_progress: {
        Row: {
          created_at: string | null
          id: string
          last_studied_at: string | null
          mastery_pct: number | null
          questions_attempted: number | null
          questions_correct: number | null
          strength: string | null
          subtopic: string | null
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_studied_at?: string | null
          mastery_pct?: number | null
          questions_attempted?: number | null
          questions_correct?: number | null
          strength?: string | null
          subtopic?: string | null
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_studied_at?: string | null
          mastery_pct?: number | null
          questions_attempted?: number | null
          questions_correct?: number | null
          strength?: string | null
          subtopic?: string | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
