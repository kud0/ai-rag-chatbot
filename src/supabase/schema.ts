/**
 * TypeScript type definitions for Supabase database schema
 * Auto-generated types for AI Chatbot RAG Application
 *
 * Usage:
 *   import { Database, Tables, Enums } from '@/supabase/schema'
 *   type Document = Tables<'documents'>
 *   type NewDocument = TablesInsert<'documents'>
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          file_name: string | null
          file_type: string | null
          file_size: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          file_name?: string | null
          file_type?: string | null
          file_size?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          file_name?: string | null
          file_type?: string | null
          file_size?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          content: string
          embedding: number[] | null
          chunk_index: number
          token_count: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          content: string
          embedding?: number[] | null
          chunk_index: number
          token_count?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          content?: string
          embedding?: number[] | null
          chunk_index?: number
          token_count?: number | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          sources: Json
          token_count: number | null
          model: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          sources?: Json
          token_count?: number | null
          model?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          sources?: Json
          token_count?: number | null
          model?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      vector_search_stats: {
        Row: {
          total_documents_with_embeddings: number | null
          total_chunks: number | null
          chunks_with_embeddings: number | null
          embedding_coverage_percent: number | null
          avg_tokens_per_chunk: number | null
          table_size: string | null
          index_size: string | null
        }
      }
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
          filter_user_id?: string | null
        }
        Returns: Array<{
          id: string
          document_id: string
          content: string
          similarity: number
          chunk_index: number
          metadata: Json
          document_title: string
          document_metadata: Json
        }>
      }
      hybrid_search: {
        Args: {
          query_embedding: number[]
          query_text: string
          match_threshold?: number
          match_count?: number
          filter_user_id?: string | null
          semantic_weight?: number
          keyword_weight?: number
        }
        Returns: Array<{
          id: string
          document_id: string
          content: string
          hybrid_score: number
          semantic_similarity: number
          keyword_rank: number
          chunk_index: number
          metadata: Json
          document_title: string
          document_metadata: Json
        }>
      }
      get_related_chunks: {
        Args: {
          source_chunk_id: string
          context_window?: number
        }
        Returns: Array<{
          id: string
          document_id: string
          content: string
          chunk_index: number
          metadata: Json
          is_source: boolean
        }>
      }
      get_user_document_stats: {
        Args: {
          target_user_id: string
        }
        Returns: Array<{
          total_documents: number
          total_chunks: number
          total_size_bytes: number
          avg_chunks_per_document: number
          earliest_document: string
          latest_document: string
        }>
      }
      search_with_sources: {
        Args: {
          query_embedding: number[]
          query_text: string
          match_threshold?: number
          match_count?: number
          filter_user_id?: string | null
        }
        Returns: Array<{
          chunk_id: string
          document_id: string
          content: string
          score: number
          source_reference: Json
        }>
      }
    }
    Enums: {
      message_role: 'user' | 'assistant' | 'system'
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]

// Convenience types for common entities
export type Document = Tables<'documents'>
export type DocumentChunk = Tables<'document_chunks'>
export type ChatSession = Tables<'chat_sessions'>
export type ChatMessage = Tables<'chat_messages'>

export type NewDocument = TablesInsert<'documents'>
export type NewDocumentChunk = TablesInsert<'document_chunks'>
export type NewChatSession = TablesInsert<'chat_sessions'>
export type NewChatMessage = TablesInsert<'chat_messages'>

export type DocumentUpdate = TablesUpdate<'documents'>
export type DocumentChunkUpdate = TablesUpdate<'document_chunks'>
export type ChatSessionUpdate = TablesUpdate<'chat_sessions'>
export type ChatMessageUpdate = TablesUpdate<'chat_messages'>

// Function return types
export type MatchDocumentsResult = Functions<'match_documents'>['Returns'][0]
export type HybridSearchResult = Functions<'hybrid_search'>['Returns'][0]
export type RelatedChunksResult = Functions<'get_related_chunks'>['Returns'][0]
export type UserDocumentStats = Functions<'get_user_document_stats'>['Returns'][0]
export type SearchWithSourcesResult = Functions<'search_with_sources'>['Returns'][0]

// Source reference type for RAG citations
export interface SourceReference {
  document_id: string
  document_title: string
  chunk_index: number
  file_name?: string
  created_at: string
  similarity: number
}

// Enhanced message type with typed sources
export interface ChatMessageWithSources extends ChatMessage {
  sources: SourceReference[]
}

// Query options type for search functions
export interface SearchOptions {
  query_embedding: number[]
  query_text?: string
  match_threshold?: number
  match_count?: number
  filter_user_id?: string | null
  semantic_weight?: number
  keyword_weight?: number
}

// Document metadata interface (extend as needed)
export interface DocumentMetadata {
  source?: string
  author?: string
  tags?: string[]
  language?: string
  [key: string]: any
}

// Chunk metadata interface (extend as needed)
export interface ChunkMetadata {
  page_number?: number
  section?: string
  heading?: string
  [key: string]: any
}

// Chat session metadata interface (extend as needed)
export interface ChatSessionMetadata {
  model?: string
  temperature?: number
  system_prompt?: string
  [key: string]: any
}
