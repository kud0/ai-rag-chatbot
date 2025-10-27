/**
 * RAG Retrieval Module
 * Handles semantic search, hybrid search, and context retrieval
 */

import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from './embeddings';
import { RAG_CONFIG } from '@/config/ai';
import type { DocumentSearchResult } from '@/types/document';

/**
 * Search filters for retrieval functions
 */
export interface SearchFilters {
  userId?: string;
  documentIds?: string[];
  documentId?: string;
}

/**
 * Search options for retrieval
 */
export interface SearchOptions {
  topK?: number;
  similarityThreshold?: number;
  filters?: SearchFilters;
}

/**
 * Semantic search result with metadata
 */
export interface SemanticSearchResult {
  id: string;
  documentId: string;
  content: string;
  similarity: number;
  chunkIndex: number;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    startOffset: number;
    endOffset: number;
    documentTitle: string;
    documentMetadata?: Record<string, unknown>;
  };
  documentTitle: string;
  documentMetadata?: Record<string, unknown>;
}

/**
 * Hybrid search result with both semantic and keyword scores
 */
export interface HybridSearchResult extends SemanticSearchResult {
  hybridScore: number;
  semanticSimilarity: number;
  keywordRank: number;
}

/**
 * Perform semantic similarity search using vector embeddings
 * Converts query to embedding and calls match_documents function
 */
export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SemanticSearchResult[]> {
  const {
    topK = RAG_CONFIG.topK,
    similarityThreshold = RAG_CONFIG.similarityThreshold,
    filters = {},
  } = options;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Get Supabase client
  const supabase = await createClient();

  // Call match_documents function
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: topK,
    filter_user_id: filters.userId || null,
  });

  if (error) {
    throw new Error(`Semantic search failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Map results to typed format
  return data.map(result => ({
    id: result.id,
    documentId: result.document_id,
    content: result.content,
    similarity: result.similarity,
    chunkIndex: result.chunk_index,
    metadata: result.metadata,
    documentTitle: result.document_title,
    documentMetadata: result.document_metadata,
  }));
}

/**
 * Perform hybrid search combining semantic and keyword matching
 * Uses hybrid_search function for best of both worlds
 */
export async function hybridSearch(
  query: string,
  options: SearchOptions = {}
): Promise<HybridSearchResult[]> {
  const {
    topK = RAG_CONFIG.topK,
    similarityThreshold = RAG_CONFIG.similarityThreshold,
    filters = {},
  } = options;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Get Supabase client
  const supabase = await createClient();

  // Call hybrid_search function
  const { data, error } = await supabase.rpc('hybrid_search', {
    query_embedding: queryEmbedding,
    query_text: query,
    match_threshold: similarityThreshold,
    match_count: topK,
    filter_user_id: filters.userId || null,
    semantic_weight: 0.7,
    keyword_weight: 0.3,
  });

  if (error) {
    throw new Error(`Hybrid search failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Map results to typed format
  return data.map(result => ({
    id: result.id,
    documentId: result.document_id,
    content: result.content,
    similarity: result.hybrid_score,
    hybridScore: result.hybrid_score,
    semanticSimilarity: result.semantic_similarity,
    keywordRank: result.keyword_rank,
    chunkIndex: result.chunk_index,
    metadata: result.metadata,
    documentTitle: result.document_title,
    documentMetadata: result.document_metadata,
  }));
}

/**
 * Main RAG function: search and format context for LLM
 * Returns formatted context string ready for prompt injection
 */
export async function retrieveContext(
  query: string,
  options: SearchOptions = {}
): Promise<{
  context: string;
  sources: DocumentSearchResult[];
  totalChunks: number;
}> {
  // Perform search (hybrid if enabled, otherwise semantic)
  const searchResults = RAG_CONFIG.enableReranking
    ? await hybridSearch(query, options)
    : await semanticSearch(query, options);

  if (searchResults.length === 0) {
    return {
      context: '',
      sources: [],
      totalChunks: 0,
    };
  }

  // Limit chunks based on config
  const maxChunks = Math.min(
    searchResults.length,
    RAG_CONFIG.maxContextChunks
  );

  const selectedChunks = searchResults.slice(0, maxChunks);

  // Format context string
  let contextLength = 0;
  const contextChunks: string[] = [];
  const sources: DocumentSearchResult[] = [];

  for (const chunk of selectedChunks) {
    // Check if adding this chunk would exceed max context length
    if (contextLength + chunk.content.length > RAG_CONFIG.maxContextLength) {
      break;
    }

    // Add to context
    contextChunks.push(
      `[Source: ${chunk.documentTitle} - Chunk ${chunk.chunkIndex + 1}]\n${chunk.content}`
    );
    contextLength += chunk.content.length;

    // Add to sources for citation
    sources.push({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      content: chunk.content,
      similarity: chunk.similarity,
      metadata: chunk.metadata,
    });
  }

  // Join chunks with separator
  const context = contextChunks.join('\n\n---\n\n');

  return {
    context,
    sources,
    totalChunks: searchResults.length,
  };
}

/**
 * Format sources into citation references
 * Returns formatted string with source attributions
 */
export function formatSources(sources: DocumentSearchResult[]): string {
  if (sources.length === 0) {
    return '';
  }

  const sourceLines = sources.map((source, index) => {
    const similarityPercent = (source.similarity * 100).toFixed(1);
    return `${index + 1}. "${source.documentTitle}" (Chunk ${source.metadata.chunkIndex + 1}, Relevance: ${similarityPercent}%)`;
  });

  return `\n\nSources:\n${sourceLines.join('\n')}`;
}

/**
 * Search for similar chunks across all user documents
 * Useful for finding related content
 */
export async function findSimilarChunks(
  chunkId: string,
  options: SearchOptions = {}
): Promise<SemanticSearchResult[]> {
  const supabase = await createClient();

  // Get the source chunk
  const { data: sourceChunk, error: sourceError } = await supabase
    .from('document_chunks')
    .select('content, embedding')
    .eq('id', chunkId)
    .single();

  if (sourceError || !sourceChunk) {
    throw new Error(`Failed to find source chunk: ${sourceError?.message}`);
  }

  // Use the chunk's embedding to find similar chunks
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: sourceChunk.embedding,
    match_threshold: options.similarityThreshold || RAG_CONFIG.similarityThreshold,
    match_count: options.topK || RAG_CONFIG.topK,
    filter_user_id: options.filters?.userId || null,
  });

  if (error) {
    throw new Error(`Failed to find similar chunks: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Filter out the source chunk itself
  return data
    .filter(result => result.id !== chunkId)
    .map(result => ({
      id: result.id,
      documentId: result.document_id,
      content: result.content,
      similarity: result.similarity,
      chunkIndex: result.chunk_index,
      metadata: result.metadata,
      documentTitle: result.document_title,
      documentMetadata: result.document_metadata,
    }));
}

/**
 * Get chunks with surrounding context from the same document
 * Useful for providing more complete information
 */
export async function getChunkWithContext(
  chunkId: string,
  contextWindow: number = 2
): Promise<SemanticSearchResult[]> {
  const supabase = await createClient();

  // Call get_related_chunks function
  const { data, error } = await supabase.rpc('get_related_chunks', {
    source_chunk_id: chunkId,
    context_window: contextWindow,
  });

  if (error) {
    throw new Error(`Failed to get chunk context: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Map results (note: these don't have embeddings or similarity scores)
  return data.map(result => ({
    id: result.id,
    documentId: result.document_id,
    content: result.content,
    similarity: result.is_source ? 1.0 : 0.0, // Mark source with perfect similarity
    chunkIndex: result.chunk_index,
    metadata: result.metadata,
    documentTitle: '',
    documentMetadata: {},
  }));
}
