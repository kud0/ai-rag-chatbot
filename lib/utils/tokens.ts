import { encode, decode } from 'gpt-tokenizer';

/**
 * Token counting utility for text chunking
 * Uses gpt-tokenizer which is compatible with Next.js server environments
 */

/**
 * Count tokens in a text string
 * @param text - The text to count tokens for
 * @returns Number of tokens
 */
export function countTokens(text: string): number {
  try {
    const tokens = encode(text);
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
    const tokens = encode(text);

    if (tokens.length <= maxTokens) {
      return text;
    }

    const truncatedTokens = tokens.slice(0, maxTokens);
    return decode(truncatedTokens);
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
export function splitIntoTokenChunks(
  text: string,
  maxTokens: number,
  overlap = 0
): string[] {
  try {
    const tokens = encode(text);
    const chunks: string[] = [];

    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(start + maxTokens, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      chunks.push(decode(chunkTokens));

      // Move to next chunk with overlap
      start = end - overlap;
      if (start >= tokens.length) break;
    }

    return chunks;
  } catch (error) {
    console.error('Error splitting text:', error);
    // Fallback: character-based chunking
    const approxCharsPerChunk = maxTokens * 4;
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + approxCharsPerChunk, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap * 4;
    }

    return chunks;
  }
}

/**
 * Estimate cost of API call based on token count
 * @param tokens - Number of tokens
 * @param model - Model name (gpt-4, gpt-3.5-turbo, text-embedding-3-small, etc.)
 * @returns Estimated cost in USD
 */
export function estimateCost(tokens: number, model: string): number {
  // Pricing as of 2024 (per 1K tokens)
  const pricing: Record<string, { input: number; output?: number }> = {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'text-embedding-3-small': { input: 0.00002 },
    'text-embedding-3-large': { input: 0.00013 },
  };

  const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
  const costPer1K = modelPricing.input;

  return (tokens / 1000) * costPer1K;
}

/**
 * Batch token counts for multiple texts
 * @param texts - Array of texts to count tokens for
 * @returns Array of token counts
 */
export function batchCountTokens(texts: string[]): number[] {
  return texts.map(countTokens);
}

/**
 * Get total token count for an array of texts
 * @param texts - Array of texts
 * @returns Total token count
 */
export function getTotalTokens(texts: string[]): number {
  return texts.reduce((total, text) => total + countTokens(text), 0);
}
