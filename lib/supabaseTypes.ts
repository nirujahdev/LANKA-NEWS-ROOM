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
      articles: {
        Row: {
          cluster_id: string | null
          content_excerpt: string | null
          content_text: string | null
          created_at: string | null
          fetched_at: string | null
          guid: string | null
          hash: string | null
          id: string
          lang: Database["public"]["Enums"]["lang_code"] | null
          published_at: string | null
          source_id: string
          title: string
          url: string
        }
        Insert: {
          cluster_id?: string | null
          content_excerpt?: string | null
          content_text?: string | null
          created_at?: string | null
          fetched_at?: string | null
          guid?: string | null
          hash?: string | null
          id?: string
          lang?: Database["public"]["Enums"]["lang_code"] | null
          published_at?: string | null
          source_id: string
          title: string
          url: string
        }
        Update: {
          cluster_id?: string | null
          content_excerpt?: string | null
          content_text?: string | null
          created_at?: string | null
          fetched_at?: string | null
          guid?: string | null
          hash?: string | null
          id?: string
          lang?: Database["public"]["Enums"]["lang_code"] | null
          published_at?: string | null
          source_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      cluster_articles: {
        Row: {
          article_id: string
          cluster_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          article_id: string
          cluster_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          article_id?: string
          cluster_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_articles_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          article_count: number | null
          category: string | null
          created_at: string | null
          expires_at: string | null
          first_seen_at: string | null
          headline: string
          id: string
          last_seen_at: string | null
          source_count: number | null
          status: Database["public"]["Enums"]["cluster_status"] | null
          updated_at: string | null
        }
        Insert: {
          article_count?: number | null
          category?: string | null
          created_at?: string | null
          expires_at?: string | null
          first_seen_at?: string | null
          headline: string
          id?: string
          last_seen_at?: string | null
          source_count?: number | null
          status?: Database["public"]["Enums"]["cluster_status"] | null
          updated_at?: string | null
        }
        Update: {
          article_count?: number | null
          category?: string | null
          created_at?: string | null
          expires_at?: string | null
          first_seen_at?: string | null
          headline?: string
          id?: string
          last_seen_at?: string | null
          source_count?: number | null
          status?: Database["public"]["Enums"]["cluster_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pipeline_errors: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          run_id: string | null
          source_id: string | null
          stage: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          run_id?: string | null
          source_id?: string | null
          stage?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          run_id?: string | null
          source_id?: string | null
          stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_errors_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_errors_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_locks: {
        Row: {
          locked_until: string
          name: string
          updated_at: string
        }
        Insert: {
          locked_until: string
          name: string
          updated_at?: string
        }
        Update: {
          locked_until?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          finished_at: string | null
          id: string
          notes: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          finished_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          finished_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      pipeline_settings: {
        Row: {
          last_successful_run: string | null
          name: string
          updated_at: string
        }
        Insert: {
          last_successful_run?: string | null
          name?: string
          updated_at?: string
        }
        Update: {
          last_successful_run?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          active: boolean | null
          base_domain: string | null
          created_at: string | null
          enabled: boolean | null
          feed_url: string
          id: string
          language: Database["public"]["Enums"]["lang_code"] | null
          name: string
          type: string
        }
        Insert: {
          active?: boolean | null
          base_domain?: string | null
          created_at?: string | null
          enabled?: boolean | null
          feed_url: string
          id?: string
          language?: Database["public"]["Enums"]["lang_code"] | null
          name: string
          type: string
        }
        Update: {
          active?: boolean | null
          base_domain?: string | null
          created_at?: string | null
          enabled?: boolean | null
          feed_url?: string
          id?: string
          language?: Database["public"]["Enums"]["lang_code"] | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          cluster_id: string
          created_at: string | null
          id: string
          model: string | null
          prompt_version: string | null
          summary_en: string | null
          summary_si: string | null
          summary_ta: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          cluster_id: string
          created_at?: string | null
          id?: string
          model?: string | null
          prompt_version?: string | null
          summary_en?: string | null
          summary_si?: string | null
          summary_ta?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          cluster_id?: string
          created_at?: string | null
          id?: string
          model?: string | null
          prompt_version?: string | null
          summary_en?: string | null
          summary_si?: string | null
          summary_ta?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "summaries_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_pipeline_lock: {
        Args: { current_ts: string; lock_name: string; lock_until: string }
        Returns: boolean
      }
    }
    Enums: {
      cluster_status: "draft" | "published"
      lang_code: "en" | "si" | "ta" | "unk"
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
      cluster_status: ["draft", "published"],
      lang_code: ["en", "si", "ta", "unk"],
    },
  },
} as const
