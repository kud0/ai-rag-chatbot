import OpenAI from 'openai';
import { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, OPENAI_CONFIG } from '@/config/ai';

/**
 * Embedding result
 */
export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return new OpenAI({
    apiKey,
    timeout: OPENAI_CONFIG.timeout,
    maxRetries: OPENAI_CONFIG.maxRetries,
  });
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const client = getOpenAIClient();

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI');
    }

    const embedding = response.data[0].embedding;

    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Expected embedding dimension ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
      );
    }

    return {
      embedding,
      tokenCount: response.usage.total_tokens,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
    throw new Error('Failed to generate embedding: Unknown error');
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<EmbeddingResult[]> {
  try {
    const client = getOpenAIClient();

    // OpenAI API has a limit on batch size (typically 2048 inputs)
    const batchSize = 100;
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        encoding_format: 'float',
      });

      if (!response.data || response.data.length !== batch.length) {
        throw new Error('Incomplete batch response from OpenAI');
      }

      // Sort by index to ensure correct order
      const sortedData = response.data.sort((a, b) => a.index - b.index);

      for (const item of sortedData) {
        const embedding = item.embedding;

        // Validate embedding dimensions
        if (embedding.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Expected embedding dimension ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
          );
        }

        results.push({
          embedding,
          tokenCount: response.usage.total_tokens / batch.length, // Average per text
        });
      }
    }

    return results;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
    throw new Error('Failed to generate embeddings: Unknown error');
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Validate embedding vector
 */
export function isValidEmbedding(embedding: number[]): boolean {
  // Check length
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    return false;
  }

  // Check for NaN or Infinity
  for (const value of embedding) {
    if (!Number.isFinite(value)) {
      return false;
    }
  }

  // Check if all zeros (invalid embedding)
  const isAllZeros = embedding.every(v => v === 0);
  if (isAllZeros) {
    return false;
  }

  return true;
}
