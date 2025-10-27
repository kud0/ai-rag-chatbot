import { z } from 'zod';

/**
 * Message role types for chat conversations
 */
export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export type MessageRole = typeof MessageRole[keyof typeof MessageRole];

/**
 * Source reference for RAG responses
 */
export const SourceReferenceSchema = z.object({
  documentId: z.string().uuid(),
  documentTitle: z.string(),
  chunkContent: z.string(),
  similarity: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SourceReference = z.infer<typeof SourceReferenceSchema>;

/**
 * Chat message schema with Zod validation
 */
export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  createdAt: z.date(),
  sources: z.array(SourceReferenceSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Chat session schema
 */
export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(255),
  createdAt: z.date(),
  updatedAt: z.date(),
  messages: z.array(MessageSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

/**
 * Stream response chunk for real-time chat updates
 */
export const StreamResponseSchema = z.object({
  id: z.string(),
  type: z.enum(['content', 'sources', 'done', 'error']),
  content: z.string().optional(),
  sources: z.array(SourceReferenceSchema).optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type StreamResponse = z.infer<typeof StreamResponseSchema>;

/**
 * Request payload for creating a new chat message
 */
export const CreateMessageRequestSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  role: z.enum(['user', 'system']).default('user'),
  includeRag: z.boolean().default(true),
});

export type CreateMessageRequest = z.infer<typeof CreateMessageRequestSchema>;

/**
 * Request payload for creating a new chat session
 */
export const CreateChatSessionRequestSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  initialMessage: z.string().min(1).max(10000).optional(),
});

export type CreateChatSessionRequest = z.infer<typeof CreateChatSessionRequestSchema>;
