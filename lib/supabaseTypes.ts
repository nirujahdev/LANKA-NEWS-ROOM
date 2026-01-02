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
      agent_metrics: {
        Row: {
          agent_type: string
          avg_duration_ms: number | null
          avg_quality_score: number | null
          created_at: string | null
          date: string
          failed_operations: number | null
          hour: number | null
          id: string
          successful_operations: number | null
          total_cost_usd: number | null
          total_operations: number | null
          total_tokens: number | null
          updated_at: string | null
        }
        Insert: {
          agent_type: string
          avg_duration_ms?: number | null
          avg_quality_score?: number | null
          created_at?: string | null
          date: string
          failed_operations?: number | null
          hour?: number | null
          id?: string
          successful_operations?: number | null
          total_cost_usd?: number | null
          total_operations?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_type?: string
          avg_duration_ms?: number | null
          avg_quality_score?: number | null
          created_at?: string | null
          date?: string
          failed_operations?: number | null
          hour?: number | null
          id?: string
          successful_operations?: number | null
          total_cost_usd?: number | null
          total_operations?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_operations: {
        Row: {
          agent_type: string
          agent_version: string | null
          cluster_id: string
          completed_at: string | null
          cost_usd: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          operation_status: string
          output_data: Json | null
          quality_breakdown: Json | null
          quality_score: number | null
          started_at: string | null
          summary_id: string | null
          token_count: number | null
        }
        Insert: {
          agent_type: string
          agent_version?: string | null
          cluster_id: string
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          operation_status: string
          output_data?: Json | null
          quality_breakdown?: Json | null
          quality_score?: number | null
          started_at?: string | null
          summary_id?: string | null
          token_count?: number | null
        }
        Update: {
          agent_type?: string
          agent_version?: string | null
          cluster_id?: string
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          operation_status?: string
          output_data?: Json | null
          quality_breakdown?: Json | null
          quality_score?: number | null
          started_at?: string | null
          summary_id?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_operations_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_operations_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      article_feedback: {
        Row: {
          article_id: string
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          comment?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          cluster_id: string | null
          content_excerpt: string | null
          content_html: string | null
          content_text: string | null
          created_at: string | null
          district: string | null
          engagement_score: number | null
          error_message: string | null
          fact_check_status: string | null
          fetched_at: string | null
          guid: string | null
          hash: string | null
          id: string
          image_extraction_method: string | null
          image_relevance_score: number | null
          image_url: string | null
          image_urls: string[] | null
          lang: Database["public"]["Enums"]["lang_code"] | null
          last_quality_check_at: string | null
          processed_at: string | null
          published_at: string | null
          quality_score: number | null
          readability_score: number | null
          report_count: number | null
          source_id: string
          status: string | null
          title: string
          url: string
        }
        Insert: {
          cluster_id?: string | null
          content_excerpt?: string | null
          content_html?: string | null
          content_text?: string | null
          created_at?: string | null
          district?: string | null
          engagement_score?: number | null
          error_message?: string | null
          fact_check_status?: string | null
          fetched_at?: string | null
          guid?: string | null
          hash?: string | null
          id?: string
          image_extraction_method?: string | null
          image_relevance_score?: number | null
          image_url?: string | null
          image_urls?: string[] | null
          lang?: Database["public"]["Enums"]["lang_code"] | null
          last_quality_check_at?: string | null
          processed_at?: string | null
          published_at?: string | null
          quality_score?: number | null
          readability_score?: number | null
          report_count?: number | null
          source_id: string
          status?: string | null
          title: string
          url: string
        }
        Update: {
          cluster_id?: string | null
          content_excerpt?: string | null
          content_html?: string | null
          content_text?: string | null
          created_at?: string | null
          district?: string | null
          engagement_score?: number | null
          error_message?: string | null
          fact_check_status?: string | null
          fetched_at?: string | null
          guid?: string | null
          hash?: string | null
          id?: string
          image_extraction_method?: string | null
          image_relevance_score?: number | null
          image_url?: string | null
          image_urls?: string[] | null
          lang?: Database["public"]["Enums"]["lang_code"] | null
          last_quality_check_at?: string | null
          processed_at?: string | null
          published_at?: string | null
          quality_score?: number | null
          readability_score?: number | null
          report_count?: number | null
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
      cluster_engagement: {
        Row: {
          avg_time_spent_seconds: number | null
          cluster_id: string
          comment_count: number | null
          last_viewed_at: string | null
          share_count: number | null
          unique_viewers: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          avg_time_spent_seconds?: number | null
          cluster_id: string
          comment_count?: number | null
          last_viewed_at?: string | null
          share_count?: number | null
          unique_viewers?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          avg_time_spent_seconds?: number | null
          cluster_id?: string
          comment_count?: number | null
          last_viewed_at?: string | null
          share_count?: number | null
          unique_viewers?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cluster_engagement_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: true
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          agent_cost: number | null
          agent_error: string | null
          agent_quality_score: number | null
          agent_time: number | null
          agent_used: boolean | null
          agent_version: string | null
          article_count: number | null
          category: string | null
          city: string | null
          created_at: string | null
          district: string | null
          event_type: string | null
          expires_at: string | null
          first_seen_at: string | null
          headline: string
          headline_en: string | null
          headline_si: string | null
          headline_ta: string | null
          headline_translation_quality_en: number | null
          headline_translation_quality_si: number | null
          headline_translation_quality_ta: number | null
          helpful_count: number | null
          id: string
          image_quality_score: number | null
          image_relevance_score: number | null
          image_url: string | null
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
          primary_topic: string | null
          published_at: string | null
          report_count: number | null
          slug: string | null
          source_count: number | null
          status: Database["public"]["Enums"]["cluster_status"] | null
          topic: string | null
          topics: string[] | null
          tweet_id: string | null
          tweet_status: string | null
          tweeted_at: string | null
          updated_at: string | null
        }
        Insert: {
          agent_cost?: number | null
          agent_error?: string | null
          agent_quality_score?: number | null
          agent_time?: number | null
          agent_used?: boolean | null
          agent_version?: string | null
          article_count?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          event_type?: string | null
          expires_at?: string | null
          first_seen_at?: string | null
          headline: string
          headline_en?: string | null
          headline_si?: string | null
          headline_ta?: string | null
          headline_translation_quality_en?: number | null
          headline_translation_quality_si?: number | null
          headline_translation_quality_ta?: number | null
          helpful_count?: number | null
          id?: string
          image_quality_score?: number | null
          image_relevance_score?: number | null
          image_url?: string | null
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
          primary_topic?: string | null
          published_at?: string | null
          report_count?: number | null
          slug?: string | null
          source_count?: number | null
          status?: Database["public"]["Enums"]["cluster_status"] | null
          topic?: string | null
          topics?: string[] | null
          tweet_id?: string | null
          tweet_status?: string | null
          tweeted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_cost?: number | null
          agent_error?: string | null
          agent_quality_score?: number | null
          agent_time?: number | null
          agent_used?: boolean | null
          agent_version?: string | null
          article_count?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          event_type?: string | null
          expires_at?: string | null
          first_seen_at?: string | null
          headline?: string
          headline_en?: string | null
          headline_si?: string | null
          headline_ta?: string | null
          headline_translation_quality_en?: number | null
          headline_translation_quality_si?: number | null
          headline_translation_quality_ta?: number | null
          helpful_count?: number | null
          id?: string
          image_quality_score?: number | null
          image_relevance_score?: number | null
          image_url?: string | null
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
          primary_topic?: string | null
          published_at?: string | null
          report_count?: number | null
          slug?: string | null
          source_count?: number | null
          status?: Database["public"]["Enums"]["cluster_status"] | null
          topic?: string | null
          topics?: string[] | null
          tweet_id?: string | null
          tweet_status?: string | null
          tweeted_at?: string | null
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
          city: string
          created_at: string | null
          district: string | null
          email: string | null
          id: string
          language: string
          name: string
        }
        Insert: {
          city: string
          created_at?: string | null
          district?: string | null
          email?: string | null
          id: string
          language: string
          name: string
        }
        Update: {
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
          avg_article_quality: number | null
          avg_response_time_ms: number | null
          created_at: string | null
          error_type: string | null
          feed_url: string
          http_status: number | null
          id: string
          items_found: number | null
          last_checked_at: string | null
          last_success_at: string | null
          last_success_rate: number | null
          reliability_score: number | null
          source_id: string | null
          source_name: string
          total_articles_fetched: number | null
          total_articles_published: number | null
        }
        Insert: {
          avg_article_quality?: number | null
          avg_response_time_ms?: number | null
          created_at?: string | null
          error_type?: string | null
          feed_url: string
          http_status?: number | null
          id?: string
          items_found?: number | null
          last_checked_at?: string | null
          last_success_at?: string | null
          last_success_rate?: number | null
          reliability_score?: number | null
          source_id?: string | null
          source_name: string
          total_articles_fetched?: number | null
          total_articles_published?: number | null
        }
        Update: {
          avg_article_quality?: number | null
          avg_response_time_ms?: number | null
          created_at?: string | null
          error_type?: string | null
          feed_url?: string
          http_status?: number | null
          id?: string
          items_found?: number | null
          last_checked_at?: string | null
          last_success_at?: string | null
          last_success_rate?: number | null
          reliability_score?: number | null
          source_id?: string | null
          source_name?: string
          total_articles_fetched?: number | null
          total_articles_published?: number | null
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
          api_config: Json | null
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
          api_config?: Json | null
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
          api_config?: Json | null
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
          agent_cost: number | null
          agent_error: string | null
          agent_quality_score: number | null
          agent_time: number | null
          agent_used: boolean | null
          agent_version: string | null
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
          summary_quality_score: number | null
          summary_quality_score_en: number | null
          summary_quality_score_si: number | null
          summary_quality_score_ta: number | null
          summary_si: string | null
          summary_ta: string | null
          translation_status: Json | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          agent_cost?: number | null
          agent_error?: string | null
          agent_quality_score?: number | null
          agent_time?: number | null
          agent_used?: boolean | null
          agent_version?: string | null
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
          summary_quality_score?: number | null
          summary_quality_score_en?: number | null
          summary_quality_score_si?: number | null
          summary_quality_score_ta?: number | null
          summary_si?: string | null
          summary_ta?: string | null
          translation_status?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          agent_cost?: number | null
          agent_error?: string | null
          agent_quality_score?: number | null
          agent_time?: number | null
          agent_used?: boolean | null
          agent_version?: string | null
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
          summary_quality_score?: number | null
          summary_quality_score_en?: number | null
          summary_quality_score_si?: number | null
          summary_quality_score_ta?: number | null
          summary_si?: string | null
          summary_ta?: string | null
          translation_status?: Json | null
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
      user_activity_summary: {
        Row: {
          favorite_sources: string[] | null
          favorite_topics: string[] | null
          last_active_at: string | null
          streak_days: number | null
          total_articles_read: number | null
          total_time_spent_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          favorite_sources?: string[] | null
          favorite_topics?: string[] | null
          last_active_at?: string | null
          streak_days?: number | null
          total_articles_read?: number | null
          total_time_spent_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          favorite_sources?: string[] | null
          favorite_topics?: string[] | null
          last_active_at?: string | null
          streak_days?: number | null
          total_articles_read?: number | null
          total_time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          article_id: string | null
          cluster_id: string | null
          created_at: string
          id: string
          notes: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          article_id?: string | null
          cluster_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          article_id?: string | null
          cluster_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarks_cluster_id_fkey"
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
          blocked_sources: string[] | null
          favourite_topics: string[]
          language_preference: string | null
          location_preferences: string[] | null
          notification_preferences: Json | null
          preferred_sources: string[] | null
          reading_preferences: Json | null
          topic_interests: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blocked_sources?: string[] | null
          favourite_topics: string[]
          language_preference?: string | null
          location_preferences?: string[] | null
          notification_preferences?: Json | null
          preferred_sources?: string[] | null
          reading_preferences?: Json | null
          topic_interests?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blocked_sources?: string[] | null
          favourite_topics?: string[]
          language_preference?: string | null
          location_preferences?: string[] | null
          notification_preferences?: Json | null
          preferred_sources?: string[] | null
          reading_preferences?: Json | null
          topic_interests?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reading_history: {
        Row: {
          article_id: string | null
          cluster_id: string | null
          device_type: string | null
          id: string
          read_at: string
          referrer: string | null
          scroll_depth: number | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          article_id?: string | null
          cluster_id?: string | null
          device_type?: string | null
          id?: string
          read_at?: string
          referrer?: string | null
          scroll_depth?: number | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          article_id?: string | null
          cluster_id?: string | null
          device_type?: string | null
          id?: string
          read_at?: string
          referrer?: string | null
          scroll_depth?: number | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_history_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_views: {
        Row: {
          article_id: string | null
          cluster_id: string | null
          device_type: string | null
          id: string
          referrer: string | null
          time_spent_seconds: number | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          article_id?: string | null
          cluster_id?: string | null
          device_type?: string | null
          id?: string
          referrer?: string | null
          time_spent_seconds?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          article_id?: string | null
          cluster_id?: string | null
          device_type?: string | null
          id?: string
          referrer?: string | null
          time_spent_seconds?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_views_cluster_id_fkey"
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
      get_clusters_by_topic: {
        Args: {
          limit_count?: number
          status_filter?: Database["public"]["Enums"]["cluster_status"]
          topic_slug: string
        }
        Returns: {
          article_count: number
          category: string
          city: string
          event_type: string
          headline: string
          headline_si: string
          headline_ta: string
          id: string
          image_url: string
          keywords: string[] | null
          language: Database["public"]["Enums"]["lang_code"]
          meta_description_en: string
          meta_description_si: string
          meta_description_ta: string
          meta_title_en: string
          meta_title_si: string
          meta_title_ta: string
          primary_entity: string
          published_at: string
          slug: string
          source_count: number
          status: Database["public"]["Enums"]["cluster_status"]
          topic: string
          topics: string[] | null
          updated_at: string
        }[]
      }
      get_search_filter_options: {
        Args: never
        Returns: {
          cities: string[] | null
          date_max: string | null
          date_min: string | null
          event_types: string[] | null
          topics: string[] | null
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
          date_from?: string
          date_to?: string
          district_filter?: string
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
