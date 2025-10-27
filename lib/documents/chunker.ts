import { CHUNKING_CONFIG } from '@/config/ai';
import { countTokens } from '@/lib/utils/tokens';

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  startOffset: number;
  endOffset: number;
  tokenCount: number;
}

/**
 * Chunk result
 */
export interface Chunk {
  content: string;
  metadata: ChunkMetadata;
}

/**
 * Chunking options
 */
export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
  minChunkSize?: number;
  maxChunkSize?: number;
}

/**
 * Split text into chunks based on token count
 */
export function chunkText(text: string, options?: ChunkingOptions): Chunk[] {
  const {
    chunkSize = CHUNKING_CONFIG.chunkSize,
    chunkOverlap = CHUNKING_CONFIG.chunkOverlap,
    separators = [...CHUNKING_CONFIG.separators],
    minChunkSize = CHUNKING_CONFIG.minChunkSize,
    maxChunkSize = CHUNKING_CONFIG.maxChunkSize,
  } = options || {};

  // If text is small enough, return single chunk
  const totalTokens = countTokens(text);
  if (totalTokens <= chunkSize) {
    return [{
      content: text,
      metadata: {
        chunkIndex: 0,
        totalChunks: 1,
        startOffset: 0,
        endOffset: text.length,
        tokenCount: totalTokens,
      },
    }];
  }

  const chunks: Chunk[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    // Calculate chunk end position (approximate)
    const estimatedChunkEnd = Math.min(
      currentPosition + chunkSize * 4, // Rough estimate: 1 token ≈ 4 chars
      text.length
    );

    let chunkEnd = estimatedChunkEnd;
    let chunkText = text.slice(currentPosition, chunkEnd);

    // Adjust chunk size to fit token limit
    let tokenCount = countTokens(chunkText);

    // If too many tokens, reduce chunk size
    while (tokenCount > chunkSize && chunkEnd > currentPosition) {
      chunkEnd = Math.max(currentPosition + 1, chunkEnd - 100);
      chunkText = text.slice(currentPosition, chunkEnd);
      tokenCount = countTokens(chunkText);
    }

    // If still too small after reduction, extend it
    while (tokenCount < minChunkSize && chunkEnd < text.length) {
      chunkEnd = Math.min(chunkEnd + 100, text.length);
      chunkText = text.slice(currentPosition, chunkEnd);
      tokenCount = countTokens(chunkText);
    }

    // Try to break at a natural separator
    if (chunkEnd < text.length) {
      chunkEnd = findBestSplitPoint(text, currentPosition, chunkEnd, separators);
      chunkText = text.slice(currentPosition, chunkEnd);
      tokenCount = countTokens(chunkText);
    }

    // Add chunk if it meets minimum size
    if (tokenCount >= minChunkSize || chunkEnd === text.length) {
      chunks.push({
        content: chunkText.trim(),
        metadata: {
          chunkIndex: chunks.length,
          totalChunks: 0, // Will be updated later
          startOffset: currentPosition,
          endOffset: chunkEnd,
          tokenCount,
        },
      });
    }

    // Calculate overlap for next chunk
    const overlapSize = Math.min(chunkOverlap * 4, chunkText.length); // Rough estimate
    const overlapStart = Math.max(currentPosition, chunkEnd - overlapSize);

    // Find a good overlap point at a separator
    const overlapPoint = findBestSplitPoint(
      text,
      overlapStart,
      chunkEnd,
      separators
    );

    currentPosition = overlapPoint;

    // Prevent infinite loop
    if (currentPosition >= text.length) break;
  }

  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

/**
 * Find the best point to split text based on separators
 */
function findBestSplitPoint(
  text: string,
  start: number,
  end: number,
  separators: string[]
): number {
  const searchRange = text.slice(start, end);

  // Try each separator in order of priority
  for (const separator of separators) {
    const lastIndex = searchRange.lastIndexOf(separator);
    if (lastIndex !== -1) {
      return start + lastIndex + separator.length;
    }
  }

  // If no separator found, split at the end
  return end;
}

/**
 * Combine chunks that are too small
 */
export function combineSmallChunks(
  chunks: Chunk[],
  minSize: number = CHUNKING_CONFIG.minChunkSize
): Chunk[] {
  const combined: Chunk[] = [];
  let buffer: Chunk[] = [];

  for (const chunk of chunks) {
    buffer.push(chunk);

    const bufferTokens = buffer.reduce((sum, c) => sum + c.metadata.tokenCount, 0);

    if (bufferTokens >= minSize || chunk === chunks[chunks.length - 1]) {
      // Merge buffer into a single chunk
      const mergedContent = buffer.map(c => c.content).join('\n');
      const mergedTokenCount = countTokens(mergedContent);

      combined.push({
        content: mergedContent,
        metadata: {
          chunkIndex: combined.length,
          totalChunks: 0, // Will be updated later
          startOffset: buffer[0].metadata.startOffset,
          endOffset: buffer[buffer.length - 1].metadata.endOffset,
          tokenCount: mergedTokenCount,
        },
      });

      buffer = [];
    }
  }

  // Update total chunks count
  combined.forEach(chunk => {
    chunk.metadata.totalChunks = combined.length;
  });

  return combined;
}

/**
 * Validate chunks
 */
export function validateChunks(chunks: Chunk[]): boolean {
  if (chunks.length === 0) return false;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Check chunk index
    if (chunk.metadata.chunkIndex !== i) return false;

    // Check total chunks
    if (chunk.metadata.totalChunks !== chunks.length) return false;

    // Check content
    if (!chunk.content || chunk.content.trim().length === 0) return false;

    // Check token count
    if (chunk.metadata.tokenCount <= 0) return false;
  }

  return true;
}
