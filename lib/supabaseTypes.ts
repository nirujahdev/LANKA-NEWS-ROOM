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
          error_message: string | null
          fetched_at: string | null
          guid: string | null
          hash: string | null
          id: string
          image_extraction_method: string | null
          image_relevance_score: number | null
          image_url: string | null
          lang: Database["public"]["Enums"]["lang_code"] | null
          processed_at: string | null
          published_at: string | null
          source_id: string
          status: string | null
          title: string
          url: string
        }
        Insert: {
          cluster_id?: string | null
          content_excerpt?: string | null
          content_text?: string | null
          created_at?: string | null
          error_message?: string | null
          fetched_at?: string | null
          guid?: string | null
          hash?: string | null
          id?: string
          image_extraction_method?: string | null
          image_relevance_score?: number | null
          image_url?: string | null
          lang?: Database["public"]["Enums"]["lang_code"] | null
          processed_at?: string | null
          published_at?: string | null
          source_id: string
          status?: string | null
          title: string
          url: string
        }
        Update: {
          cluster_id?: string | null
          content_excerpt?: string | null
          content_text?: string | null
          created_at?: string | null
          error_message?: string | null
          fetched_at?: string | null
          guid?: string | null
          hash?: string | null
          id?: string
          image_extraction_method?: string | null
          image_relevance_score?: number | null
          image_url?: string | null
          lang?: Database["public"]["Enums"]["lang_code"] | null
          processed_at?: string | null
          published_at?: string | null
          source_id?: string
          status?: string | null
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
          city: string | null
          created_at: string | null
          event_type: string | null
          expires_at: string | null
          first_seen_at: string | null
          headline: string
          headline_si: string | null
          headline_ta: string | null
          headline_translation_quality_en: number | null
          headline_translation_quality_si: number | null
          headline_translation_quality_ta: number | null
          helpful_count: number | null
          id: string
          image_url: string | null
          image_quality_score: number | null
          image_relevance_score: number | null
          keywords: string[] | null
          language: string | null
          last_checked_at: string | null
          last_seen_at: string | null
          like_count: number | null
          meta_description_en: string | null
          meta_description_si: string | null
          meta_description_ta: string | null
          meta_title_en: string | null
          meta_title_si: string | null
          meta_title_ta: string | null
          primary_entity: string | null
          published_at: string | null
          report_count: number | null
          slug: string | null
          source_count: number | null
          status: Database["public"]["Enums"]["cluster_status"] | null
          topic: string | null
          topics: string[] | null
          tweet_id: string | null
          tweeted_at: string | null
          tweet_status: string | null
          updated_at: string | null
        }
        Insert: {
          article_count?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          event_type?: string | null
          expires_at?: string | null
          first_seen_at?: string | null
          headline: string
          headline_si?: string | null
          headline_ta?: string | null
          headline_translation_quality_en?: number | null
          headline_translation_quality_si?: number | null
          headline_translation_quality_ta?: number | null
          helpful_count?: number | null
          id?: string
          image_url?: string | null
          image_quality_score?: number | null
          image_relevance_score?: number | null
          keywords?: string[] | null
          language?: string | null
          last_checked_at?: string | null
          last_seen_at?: string | null
          like_count?: number | null
          meta_description_en?: string | null
          meta_description_si?: string | null
          meta_description_ta?: string | null
          meta_title_en?: string | null
          meta_title_si?: string | null
          meta_title_ta?: string | null
          primary_entity?: string | null
          published_at?: string | null
          report_count?: number | null
          slug?: string | null
          source_count?: number | null
          status?: Database["public"]["Enums"]["cluster_status"] | null
          topic?: string | null
          topics?: string[] | null
          tweet_id?: string | null
          tweeted_at?: string | null
          tweet_status?: string | null
          updated_at?: string | null
        }
        Update: {
          article_count?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          event_type?: string | null
          expires_at?: string | null
          first_seen_at?: string | null
          headline?: string
          headline_si?: string | null
          headline_ta?: string | null
          headline_translation_quality_en?: number | null
          headline_translation_quality_si?: number | null
          headline_translation_quality_ta?: number | null
          helpful_count?: number | null
          id?: string
          image_url?: string | null
          image_quality_score?: number | null
          image_relevance_score?: number | null
          keywords?: string[] | null
          language?: string | null
          last_checked_at?: string | null
          last_seen_at?: string | null
          like_count?: number | null
          meta_description_en?: string | null
          meta_description_si?: string | null
          meta_description_ta?: string | null
          meta_title_en?: string | null
          meta_title_si?: string | null
          meta_title_ta?: string | null
          primary_entity?: string | null
          published_at?: string | null
          report_count?: number | null
          slug?: string | null
          source_count?: number | null
          status?: Database["public"]["Enums"]["cluster_status"] | null
          topic?: string | null
          topics?: string[] | null
          tweet_id?: string | null
          tweeted_at?: string | null
          tweet_status?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          city: string
          created_at: string | null
          district: string | null
          email: string | null
          id: string
          language: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          city: string
          created_at?: string | null
          district?: string | null
          email?: string | null
          id: string
          language: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          city?: string
          created_at?: string | null
          district?: string | null
          email?: string | null
          id?: string
          language?: string
          name?: string
        }
        Relationships: []
      }
      source_health: {
        Row: {
          created_at: string | null
          error_type: string | null
          feed_url: string
          http_status: number | null
          id: string
          items_found: number | null
          last_checked_at: string | null
          last_success_at: string | null
          source_id: string | null
          source_name: string
        }
        Insert: {
          created_at?: string | null
          error_type?: string | null
          feed_url: string
          http_status?: number | null
          id?: string
          items_found?: number | null
          last_checked_at?: string | null
          last_success_at?: string | null
          source_id?: string | null
          source_name: string
        }
        Update: {
          created_at?: string | null
          error_type?: string | null
          feed_url?: string
          http_status?: number | null
          id?: string
          items_found?: number | null
          last_checked_at?: string | null
          last_success_at?: string | null
          source_id?: string | null
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_health_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
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
          confirmed_vs_differs_en: string | null
          confirmed_vs_differs_si: string | null
          confirmed_vs_differs_ta: string | null
          created_at: string | null
          id: string
          key_facts_en: string[] | null
          key_facts_si: string[] | null
          key_facts_ta: string[] | null
          model: string | null
          prompt_version: string | null
          summary_en: string | null
          summary_length_en: number | null
          summary_length_si: number | null
          summary_length_ta: number | null
          summary_quality_score_en: number | null
          summary_quality_score_si: number | null
          summary_quality_score_ta: number | null
          summary_si: string | null
          summary_ta: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          cluster_id: string
          confirmed_vs_differs_en?: string | null
          confirmed_vs_differs_si?: string | null
          confirmed_vs_differs_ta?: string | null
          created_at?: string | null
          id?: string
          key_facts_en?: string[] | null
          key_facts_si?: string[] | null
          key_facts_ta?: string[] | null
          model?: string | null
          prompt_version?: string | null
          summary_en?: string | null
          summary_length_en?: number | null
          summary_length_si?: number | null
          summary_length_ta?: number | null
          summary_quality_score_en?: number | null
          summary_quality_score_si?: number | null
          summary_quality_score_ta?: number | null
          summary_si?: string | null
          summary_ta?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          cluster_id?: string
          confirmed_vs_differs_en?: string | null
          confirmed_vs_differs_si?: string | null
          confirmed_vs_differs_ta?: string | null
          created_at?: string | null
          id?: string
          key_facts_en?: string[] | null
          key_facts_si?: string[] | null
          key_facts_ta?: string[] | null
          model?: string | null
          prompt_version?: string | null
          summary_en?: string | null
          summary_length_en?: number | null
          summary_length_si?: number | null
          summary_length_ta?: number | null
          summary_quality_score_en?: number | null
          summary_quality_score_si?: number | null
          summary_quality_score_ta?: number | null
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
      user_feedback: {
        Row: {
          cluster_id: string
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          cluster_id: string
          comment?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          cluster_id?: string
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          favourite_topics: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          favourite_topics: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          favourite_topics?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      get_search_filter_options: {
        Args: never
        Returns: {
          cities: string[]
          date_max: string
          date_min: string
          event_types: string[]
          topics: string[]
        }[]
      }
      pick_articles_for_processing: {
        Args: { batch_limit: number }
        Returns: {
          content_excerpt: string
          content_text: string
          id: string
          lang: string
          published_at: string
          source_id: string
          title: string
          url: string
        }[]
      }
      search_clusters: {
        Args: {
          city_filter?: string
          date_from?: string
          date_to?: string
          event_type_filter?: string
          lang_code?: string
          result_limit?: number
          search_query: string
          topic_filter?: string[]
        }
        Returns: {
          category: string
          city: string
          event_type: string
          headline: string
          id: string
          image_url: string
          published_at: string
          rank: number
          slug: string
          source_count: number
          summary: string
          topic: string
        }[]
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
