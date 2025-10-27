import { Tiktoken, encoding_for_model } from 'tiktoken';

/**
 * Token counting utility for text chunking
 * Uses tiktoken to estimate tokens for OpenAI models
 */

let encoder: Tiktoken | null = null;

/**
 * Initialize the token encoder (lazy initialization)
 */
function getEncoder(): Tiktoken {
  if (!encoder) {
    // Use cl100k_base encoding (used by gpt-4, gpt-3.5-turbo, text-embedding-3-small)
    encoder = encoding_for_model('gpt-3.5-turbo');
  }
  return encoder;
}

/**
 * Count tokens in a text string
 * @param text - The text to count tokens for
 * @returns Number of tokens
 */
export function countTokens(text: string): number {
  try {
    const enc = getEncoder();
    const tokens = enc.encode(text);
    return tokens.length;
  } catch (error) {
    console.error('Error counting tokens:', error);
    // Fallback: rough estimate (1 token ≈ 4 characters for English text)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Truncate text to fit within a token limit
 * @param text - The text to truncate
 * @param maxTokens - Maximum number of tokens
 * @returns Truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  try {
    const enc = getEncoder();
    const tokens = enc.encode(text);

    if (tokens.length <= maxTokens) {
      return text;
    }

    const truncatedTokens = tokens.slice(0, maxTokens);
    return enc.decode(truncatedTokens);
  } catch (error) {
    console.error('Error truncating text:', error);
    // Fallback: rough character-based truncation
    const approxChars = maxTokens * 4;
    return text.slice(0, approxChars);
  }
}

/**
 * Split text into chunks that fit within token limit
 * @param text - The text to split
 * @param maxTokens - Maximum tokens per chunk
 * @param overlap - Number of tokens to overlap between chunks
 * @returns Array of text chunks
 */
export function splitTextByTokens(
  text: string,
  maxTokens: number,
  overlap: number = 0
): string[] {
  try {
    const enc = getEncoder();
    const tokens = enc.encode(text);
    const chunks: string[] = [];

    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(start + maxTokens, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      const chunkText = enc.decode(chunkTokens);
      chunks.push(chunkText);

      // Move forward, accounting for overlap
      start = end - overlap;

      // Prevent infinite loop if overlap is too large
      if (start <= 0 && end < tokens.length) {
        start = end;
      }
    }

    return chunks;
  } catch (error) {
    console.error('Error splitting text by tokens:', error);
    // Fallback: character-based splitting
    const approxCharsPerChunk = maxTokens * 4;
    const approxOverlapChars = overlap * 4;
    const chunks: string[] = [];

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + approxCharsPerChunk, text.length);
      chunks.push(text.slice(start, end));
      start = end - approxOverlapChars;
    }

    return chunks;
  }
}

/**
 * Estimate cost of generating embeddings based on token count
 * @param tokenCount - Number of tokens
 * @returns Estimated cost in USD
 */
export function estimateEmbeddingCost(tokenCount: number): number {
  // text-embedding-3-small: $0.00002 per 1K tokens
  const costPerThousandTokens = 0.00002;
  return (tokenCount / 1000) * costPerThousandTokens;
}

/**
 * Clean up token encoder resources
 * Call this when shutting down the application
 */
export function cleanup(): void {
  if (encoder) {
    encoder.free();
    encoder = null;
  }
}
