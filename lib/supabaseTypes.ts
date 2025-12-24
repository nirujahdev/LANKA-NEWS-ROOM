export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: {
          id: string;
          name: string;
          type: 'rss' | 'x' | 'facebook';
          feed_url: string;
          language: 'en' | 'si' | 'ta' | 'unk' | null;
          enabled: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'rss' | 'x' | 'facebook';
          feed_url: string;
          language?: 'en' | 'si' | 'ta' | 'unk' | null;
          enabled?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sources']['Insert']>;
        Relationships: [];
      };
      clusters: {
        Row: {
          id: string;
          headline: string;
          status: 'draft' | 'published';
          category: 'politics' | 'economy' | 'sports' | 'technology' | 'health' | 'education' | null;
          first_seen_at: string | null;
          last_seen_at: string | null;
          source_count: number | null;
          article_count: number | null;
          updated_at: string | null;
          created_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          headline: string;
          status?: 'draft' | 'published';
          category?: 'politics' | 'economy' | 'sports' | 'technology' | 'health' | 'education' | null;
          first_seen_at?: string | null;
          last_seen_at?: string | null;
          source_count?: number | null;
          article_count?: number | null;
          updated_at?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['clusters']['Insert']>;
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          source_id: string;
          title: string;
          url: string;
          guid: string | null;
          published_at: string | null;
          fetched_at: string | null;
          content_text: string | null;
          content_excerpt: string | null;
          lang: 'en' | 'si' | 'ta' | 'unk';
          cluster_id: string | null;
          hash: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          source_id: string;
          title: string;
          url: string;
          guid?: string | null;
          published_at?: string | null;
          fetched_at?: string | null;
          content_text?: string | null;
          content_excerpt?: string | null;
          lang?: 'en' | 'si' | 'ta' | 'unk';
          cluster_id?: string | null;
          hash?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'articles_cluster_id_fkey';
            columns: ['cluster_id'];
            referencedRelation: 'clusters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'articles_source_id_fkey';
            columns: ['source_id'];
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
      cluster_articles: {
        Row: {
          id: string;
          cluster_id: string;
          article_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          cluster_id: string;
          article_id: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['cluster_articles']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'cluster_articles_article_id_fkey';
            columns: ['article_id'];
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cluster_articles_cluster_id_fkey';
            columns: ['cluster_id'];
            referencedRelation: 'clusters';
            referencedColumns: ['id'];
          }
        ];
      };
      summaries: {
        Row: {
          id: string;
          cluster_id: string;
          summary_en: string | null;
          summary_si: string | null;
          summary_ta: string | null;
          model: string | null;
          prompt_version: string | null;
          version: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          cluster_id: string;
          summary_en?: string | null;
          summary_si?: string | null;
          summary_ta?: string | null;
          model?: string | null;
          prompt_version?: string | null;
          version?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['summaries']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'summaries_cluster_id_fkey';
            columns: ['cluster_id'];
            referencedRelation: 'clusters';
            referencedColumns: ['id'];
          }
        ];
      };
      pipeline_runs: {
        Row: {
          id: string;
          started_at: string | null;
          finished_at: string | null;
          status: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          started_at?: string | null;
          finished_at?: string | null;
          status?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['pipeline_runs']['Insert']>;
        Relationships: [];
      };
      pipeline_errors: {
        Row: {
          id: string;
          run_id: string | null;
          source_id: string | null;
          stage: string | null;
          error_message: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          run_id?: string | null;
          source_id?: string | null;
          stage?: string | null;
          error_message?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['pipeline_errors']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'pipeline_errors_run_id_fkey';
            columns: ['run_id'];
            referencedRelation: 'pipeline_runs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pipeline_errors_source_id_fkey';
            columns: ['source_id'];
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
    };
  };
}

