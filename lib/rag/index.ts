/**
 * RAG (Retrieval-Augmented Generation) Module
 * Main export file for all RAG functionality
 */

// Embeddings
export {
  generateEmbedding,
  generateBatchEmbeddings,
  validateEmbedding,
  normalizeEmbedding,
  cosineSimilarity,
  generateEmbeddingWithRetry,
} from './embeddings';

// Retrieval
export {
  semanticSearch,
  hybridSearch,
  retrieveContext,
  formatSources,
  findSimilarChunks,
  getChunkWithContext,
} from './retrieval';

export type {
  SearchFilters,
  SearchOptions,
  SemanticSearchResult,
  HybridSearchResult,
} from './retrieval';

// Prompt Building
export {
  buildRAGPrompt,
  formatContextChunks,
  formatSourceCitations,
  buildQueryRefinementPrompt,
  buildConversationWithContext,
  estimateTokenCount,
  truncateContextToTokenLimit,
  buildVerificationPrompt,
  formatRAGResponse,
} from './prompt-builder';

export type {
  RAGPromptConfig,
} from './prompt-builder';
