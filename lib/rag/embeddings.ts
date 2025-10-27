/**
 * OpenAI Embeddings Module
 * Handles embedding generation, validation, and batch processing
 */

import OpenAI from 'openai';
import { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, OPENAI_CONFIG } from '@/config/ai';
import type { EmbeddingResponse } from '@/types/openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: OPENAI_CONFIG.timeout,
  maxRetries: OPENAI_CONFIG.maxRetries,
});

/**
 * Generate embedding for a single text query
 * Includes automatic retry logic and validation
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  // Truncate text if too long (OpenAI has 8191 token limit for embeddings)
  const maxLength = 8000; // Conservative limit in characters
  const truncatedText = text.slice(0, maxLength);

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: truncatedText,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI API');
    }

    const embedding = response.data[0].embedding;

    // Validate embedding
    validateEmbedding(embedding);

    return embedding;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message} (Status: ${error.status})`);
    }
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    throw new Error('Cannot generate embeddings for empty array');
  }

  // Filter out empty texts
  const validTexts = texts.filter(text => text && text.trim().length > 0);

  if (validTexts.length === 0) {
    throw new Error('No valid texts provided for embedding generation');
  }

  // OpenAI batch limit is typically 2048 inputs, but we'll use a conservative limit
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  // Process in batches
  for (let i = 0; i < validTexts.length; i += batchSize) {
    const batch = validTexts.slice(i, i + batchSize);

    // Truncate each text in batch
    const maxLength = 8000;
    const truncatedBatch = batch.map(text => text.slice(0, maxLength));

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: truncatedBatch,
        encoding_format: 'float',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embeddings returned from OpenAI API');
      }

      // Sort by index to ensure correct order
      const sortedEmbeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map(item => item.embedding);

      // Validate all embeddings
      sortedEmbeddings.forEach(validateEmbedding);

      allEmbeddings.push(...sortedEmbeddings);
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API error in batch ${i / batchSize + 1}: ${error.message} (Status: ${error.status})`);
      }
      throw error;
    }
  }

  return allEmbeddings;
}

/**
 * Validate embedding dimensions and values
 * Throws error if embedding is invalid
 */
export function validateEmbedding(embedding: number[]): void {
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Embedding must be a non-empty array');
  }

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding dimension: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
    );
  }

  // Check for NaN or Infinity
  const hasInvalidValues = embedding.some(
    value => !isFinite(value) || isNaN(value)
  );

  if (hasInvalidValues) {
    throw new Error('Embedding contains invalid values (NaN or Infinity)');
  }
}

/**
 * Normalize embedding vector to unit length
 * Useful for cosine similarity calculations
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  validateEmbedding(embedding);

  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );

  if (magnitude === 0) {
    throw new Error('Cannot normalize zero-magnitude embedding');
  }

  return embedding.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns value between -1 (opposite) and 1 (identical)
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  validateEmbedding(embedding1);
  validateEmbedding(embedding2);

  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Retry wrapper for embedding generation with exponential backoff
 */
export async function generateEmbeddingWithRetry(
  text: string,
  maxRetries: number = OPENAI_CONFIG.maxRetries
): Promise<number[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = OPENAI_CONFIG.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to generate embedding after ${maxRetries} retries: ${lastError?.message}`
  );
}
