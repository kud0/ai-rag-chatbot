import { OpenAIModel, EmbeddingDimensions } from '@/types/openai';

/**
 * AI Configuration Constants
 * Central configuration for all AI-related settings
 */

// ============================================================================
// Model Configuration
// ============================================================================

/**
 * Primary GPT model for chat completions
 */
export const GPT_MODEL = OpenAIModel.GPT_4O_MINI;

/**
 * Embedding model for document vectorization
 */
export const EMBEDDING_MODEL = OpenAIModel.TEXT_EMBEDDING_3_SMALL;

/**
 * Embedding vector dimensions (model-specific)
 */
export const EMBEDDING_DIMENSIONS = EmbeddingDimensions[EMBEDDING_MODEL];

// ============================================================================
// Chat Configuration
// ============================================================================

/**
 * Chat completion parameters
 */
export const CHAT_CONFIG = {
  /** Temperature for response generation (0 = deterministic, 2 = very creative) */
  temperature: 0.7,

  /** Maximum tokens in chat completion response */
  maxTokens: 2000,

  /** Presence penalty to encourage topic diversity */
  presencePenalty: 0.0,

  /** Frequency penalty to reduce repetition */
  frequencyPenalty: 0.0,

  /** Enable streaming responses */
  stream: true,
} as const;

/**
 * System prompt for the AI assistant
 */
export const SYSTEM_PROMPT = `You are a helpful AI assistant with access to a knowledge base.
When answering questions, use the provided context from the knowledge base when relevant.
Always cite your sources when using information from the knowledge base.
If you don't know the answer or if the knowledge base doesn't contain relevant information, say so clearly.
Be concise, accurate, and helpful.`;

// ============================================================================
// Document Processing Configuration
// ============================================================================

/**
 * Text chunking configuration for document processing
 */
export const CHUNKING_CONFIG = {
  /** Size of each text chunk in characters */
  chunkSize: 512,

  /** Overlap between chunks to maintain context */
  chunkOverlap: 50,

  /** Separators for splitting text (in priority order) */
  separators: ['\n\n', '\n', '. ', ' '] as const,

  /** Minimum chunk size to avoid very small chunks */
  minChunkSize: 100,

  /** Maximum chunk size (hard limit) */
  maxChunkSize: 1000,
} as const;

/**
 * Document upload limits
 */
export const DOCUMENT_LIMITS = {
  /** Maximum file size in bytes (5MB) */
  maxFileSize: 5 * 1024 * 1024,

  /** Maximum content length in characters (1MB text) */
  maxContentLength: 1_000_000,

  /** Allowed MIME types for upload */
  allowedMimeTypes: [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/json',
    'text/csv',
  ] as const,
} as const;

// ============================================================================
// RAG (Retrieval-Augmented Generation) Configuration
// ============================================================================

/**
 * RAG search and retrieval settings
 */
export const RAG_CONFIG = {
  /** Number of top similar chunks to retrieve */
  topK: 5,

  /** Minimum similarity score threshold (0-1) */
  similarityThreshold: 0.7,

  /** Maximum number of chunks to include in context */
  maxContextChunks: 3,

  /** Maximum total characters from retrieved chunks */
  maxContextLength: 2000,

  /** Re-rank results by relevance */
  enableReranking: true,

  /** Include source citations in responses */
  includeSources: true,
} as const;

/**
 * Vector search configuration for Supabase pgvector
 */
export const VECTOR_SEARCH_CONFIG = {
  /** Distance metric for similarity search */
  distanceMetric: 'cosine' as const,

  /** Enable hybrid search (vector + full-text) */
  enableHybridSearch: false,

  /** Index type for vector search (IVFFlat recommended for < 1M vectors) */
  indexType: 'ivfflat' as const,

  /** Number of lists for IVFFlat index */
  lists: 100,
} as const;

// ============================================================================
// Performance & Caching Configuration
// ============================================================================

/**
 * Caching settings for embeddings and responses
 */
export const CACHE_CONFIG = {
  /** Enable embedding caching to avoid recomputing */
  enableEmbeddingCache: true,

  /** Cache TTL in seconds (24 hours) */
  embeddingCacheTTL: 86400,

  /** Enable response caching for common queries */
  enableResponseCache: false,

  /** Response cache TTL in seconds (1 hour) */
  responseCacheTTL: 3600,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  /** Maximum requests per user per minute */
  maxRequestsPerMinute: 20,

  /** Maximum tokens per user per day */
  maxTokensPerDay: 100000,

  /** Maximum concurrent requests per user */
  maxConcurrentRequests: 3,
} as const;

// ============================================================================
// API Configuration
// ============================================================================

/**
 * OpenAI API settings
 */
export const OPENAI_CONFIG = {
  /** API timeout in milliseconds */
  timeout: 30000,

  /** Maximum retry attempts for failed requests */
  maxRetries: 3,

  /** Retry delay in milliseconds */
  retryDelay: 1000,

  /** API base URL (can be overridden for proxies) */
  baseURL: 'https://api.openai.com/v1',
} as const;

// ============================================================================
// Error Handling Configuration
// ============================================================================

/**
 * Error handling settings
 */
export const ERROR_CONFIG = {
  /** Show detailed errors in development */
  showDetailedErrors: process.env.NODE_ENV === 'development',

  /** Log errors to console */
  logErrors: true,

  /** Default error message for users */
  defaultErrorMessage: 'An error occurred while processing your request. Please try again.',
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type ChunkingConfig = typeof CHUNKING_CONFIG;
export type RagConfig = typeof RAG_CONFIG;
export type VectorSearchConfig = typeof VECTOR_SEARCH_CONFIG;
export type ChatConfig = typeof CHAT_CONFIG;
