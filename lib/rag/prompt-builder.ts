/**
 * RAG Prompt Builder Module
 * Constructs optimized prompts with retrieved context for LLM queries
 */

import { SYSTEM_PROMPT, CHAT_CONFIG } from '@/config/ai';
import type { DocumentSearchResult } from '@/types/document';
import type { OpenAIChatMessage } from '@/types/openai';

/**
 * RAG prompt configuration
 */
export interface RAGPromptConfig {
  includeSourceAttribution?: boolean;
  maxContextLength?: number;
  systemPromptOverride?: string;
  instructionSuffix?: string;
}

/**
 * Build complete RAG prompt with system message and context
 * Returns array of messages ready for OpenAI API
 */
export function buildRAGPrompt(
  userQuery: string,
  context: string,
  sources: DocumentSearchResult[],
  config: RAGPromptConfig = {}
): OpenAIChatMessage[] {
  const {
    includeSourceAttribution = true,
    systemPromptOverride,
    instructionSuffix = '',
  } = config;

  // Build system message with context instructions
  const systemMessage: OpenAIChatMessage = {
    role: 'system',
    content: systemPromptOverride || buildSystemPromptWithContext(context),
  };

  // Build user message
  let userContent = userQuery;

  // Add instruction suffix if provided
  if (instructionSuffix) {
    userContent += `\n\n${instructionSuffix}`;
  }

  const userMessage: OpenAIChatMessage = {
    role: 'user',
    content: userContent,
  };

  return [systemMessage, userMessage];
}

/**
 * Build system prompt with embedded context
 * Optimized for GPT-4o-mini context window
 */
function buildSystemPromptWithContext(context: string): string {
  if (!context || context.trim().length === 0) {
    return SYSTEM_PROMPT;
  }

  return `${SYSTEM_PROMPT}

You have access to the following relevant information from the knowledge base:

<context>
${context}
</context>

Use this context to provide accurate and relevant answers. Always cite your sources when using information from the context.`;
}

/**
 * Format document chunks into readable context string
 * Optimized for clarity and source tracking
 */
export function formatContextChunks(
  chunks: DocumentSearchResult[],
  config: RAGPromptConfig = {}
): string {
  const { maxContextLength = 2000 } = config;

  if (!chunks || chunks.length === 0) {
    return '';
  }

  const formattedChunks: string[] = [];
  let totalLength = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkNumber = i + 1;

    // Build chunk header with source info
    const header = `[Source ${chunkNumber}: ${chunk.documentTitle}]`;
    const separator = '---';

    const formattedChunk = `${header}\n${chunk.content}\n${separator}`;
    const chunkLength = formattedChunk.length;

    // Check if adding this chunk would exceed max length
    if (totalLength + chunkLength > maxContextLength) {
      // Add truncation notice
      formattedChunks.push(
        `\n[Additional sources available but truncated for length...]`
      );
      break;
    }

    formattedChunks.push(formattedChunk);
    totalLength += chunkLength;
  }

  return formattedChunks.join('\n\n');
}

/**
 * Format source citations for inclusion in responses
 * Creates numbered list of sources with relevance scores
 */
export function formatSourceCitations(
  sources: DocumentSearchResult[]
): string {
  if (!sources || sources.length === 0) {
    return '';
  }

  const citations = sources.map((source, index) => {
    const chunkNum = source.metadata.chunkIndex + 1;
    const totalChunks = source.metadata.totalChunks;
    const relevance = (source.similarity * 100).toFixed(1);

    return `${index + 1}. **${source.documentTitle}** (Chunk ${chunkNum}/${totalChunks}, Relevance: ${relevance}%)`;
  });

  return `\n\n**Sources:**\n${citations.join('\n')}`;
}

/**
 * Build prompt for query refinement
 * Helps improve search results by reformulating queries
 */
export function buildQueryRefinementPrompt(
  originalQuery: string
): OpenAIChatMessage[] {
  const systemMessage: OpenAIChatMessage = {
    role: 'system',
    content: `You are a query refinement assistant. Your task is to improve search queries for better document retrieval.

Given a user query, rewrite it to:
1. Be more specific and clear
2. Include relevant keywords
3. Remove ambiguity
4. Maintain the original intent

Return only the refined query without any explanation.`,
  };

  const userMessage: OpenAIChatMessage = {
    role: 'user',
    content: `Original query: "${originalQuery}"\n\nRefined query:`,
  };

  return [systemMessage, userMessage];
}

/**
 * Build conversation history with context injection
 * Maintains conversation flow while adding RAG context
 */
export function buildConversationWithContext(
  conversationHistory: OpenAIChatMessage[],
  context: string,
  currentQuery: string
): OpenAIChatMessage[] {
  // Start with existing history (excluding the last user message if it exists)
  const history = conversationHistory.slice();

  // Inject context into system message or add new one
  if (history.length > 0 && history[0].role === 'system') {
    // Update existing system message
    history[0] = {
      role: 'system',
      content: buildSystemPromptWithContext(context),
    };
  } else {
    // Add new system message at the beginning
    history.unshift({
      role: 'system',
      content: buildSystemPromptWithContext(context),
    });
  }

  // Add current user query
  history.push({
    role: 'user',
    content: currentQuery,
  });

  return history;
}

/**
 * Estimate token count for prompt (rough approximation)
 * Useful for staying within model context limits
 */
export function estimateTokenCount(messages: OpenAIChatMessage[]): number {
  // Rough approximation: 1 token ≈ 4 characters
  const totalChars = messages.reduce(
    (sum, msg) => sum + msg.content.length,
    0
  );

  // Add some overhead for message structure
  const overhead = messages.length * 10;

  return Math.ceil(totalChars / 4) + overhead;
}

/**
 * Truncate context to fit within token limit
 * Ensures prompt doesn't exceed model's context window
 */
export function truncateContextToTokenLimit(
  context: string,
  maxTokens: number = 1500
): string {
  // Rough approximation: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;

  if (context.length <= maxChars) {
    return context;
  }

  // Truncate and add notice
  const truncated = context.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf('\n\n');

  // Try to truncate at a clean boundary
  if (lastNewline > maxChars * 0.8) {
    return truncated.slice(0, lastNewline) + '\n\n[Context truncated...]';
  }

  return truncated + '...\n\n[Context truncated...]';
}

/**
 * Build prompt for source verification
 * Checks if retrieved context actually answers the query
 */
export function buildVerificationPrompt(
  query: string,
  context: string
): OpenAIChatMessage[] {
  const systemMessage: OpenAIChatMessage = {
    role: 'system',
    content: `You are a verification assistant. Determine if the provided context contains information relevant to answering the user's question.

Respond with only "YES" if the context is relevant, or "NO" if it's not relevant.`,
  };

  const userMessage: OpenAIChatMessage = {
    role: 'user',
    content: `Question: ${query}

Context:
${context}

Is this context relevant?`,
  };

  return [systemMessage, userMessage];
}

/**
 * Format a complete RAG response with sources
 * Combines answer with source citations in user-friendly format
 */
export function formatRAGResponse(
  answer: string,
  sources: DocumentSearchResult[],
  includeSourceDetails: boolean = true
): string {
  if (!includeSourceDetails || sources.length === 0) {
    return answer;
  }

  return `${answer}${formatSourceCitations(sources)}`;
}
