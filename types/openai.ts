import { z } from 'zod';

/**
 * OpenAI model names
 */
export const OpenAIModel = {
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4O: 'gpt-4o',
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  TEXT_EMBEDDING_3_SMALL: 'text-embedding-3-small',
  TEXT_EMBEDDING_3_LARGE: 'text-embedding-3-large',
} as const;

export type OpenAIModel = typeof OpenAIModel[keyof typeof OpenAIModel];

/**
 * Embedding dimensions by model
 */
export const EmbeddingDimensions = {
  [OpenAIModel.TEXT_EMBEDDING_3_SMALL]: 1536,
  [OpenAIModel.TEXT_EMBEDDING_3_LARGE]: 3072,
} as const;

/**
 * Chat message for OpenAI API
 */
export const OpenAIChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function']),
  content: z.string(),
  name: z.string().optional(),
  function_call: z.record(z.string(), z.unknown()).optional(),
});

export type OpenAIChatMessage = z.infer<typeof OpenAIChatMessageSchema>;

/**
 * Chat completion request to OpenAI API
 */
export const ChatCompletionRequestSchema = z.object({
  model: z.string().default(OpenAIModel.GPT_4O_MINI),
  messages: z.array(OpenAIChatMessageSchema).min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  top_p: z.number().min(0).max(1).optional(),
  n: z.number().int().min(1).max(10).default(1),
  stream: z.boolean().default(false),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  max_tokens: z.number().int().min(1).optional(),
  presence_penalty: z.number().min(-2).max(2).default(0),
  frequency_penalty: z.number().min(-2).max(2).default(0),
  user: z.string().optional(),
});

export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

/**
 * Chat completion response from OpenAI API
 */
export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion'),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: OpenAIChatMessageSchema,
    finish_reason: z.enum(['stop', 'length', 'function_call', 'content_filter', 'null']).nullable(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;

/**
 * Embedding request to OpenAI API
 */
export const EmbeddingRequestSchema = z.object({
  model: z.string().default(OpenAIModel.TEXT_EMBEDDING_3_SMALL),
  input: z.union([z.string(), z.array(z.string())]),
  encoding_format: z.enum(['float', 'base64']).default('float'),
  dimensions: z.number().int().optional(),
  user: z.string().optional(),
});

export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;

/**
 * Embedding response from OpenAI API
 */
export const EmbeddingResponseSchema = z.object({
  object: z.literal('list'),
  data: z.array(z.object({
    object: z.literal('embedding'),
    index: z.number(),
    embedding: z.array(z.number()),
  })),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>;

/**
 * Stream chunk for chat completions
 */
export const ChatCompletionStreamChunkSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion.chunk'),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    delta: z.object({
      role: z.enum(['system', 'user', 'assistant']).optional(),
      content: z.string().optional(),
    }),
    finish_reason: z.enum(['stop', 'length', 'function_call', 'content_filter']).nullable(),
  })),
});

export type ChatCompletionStreamChunk = z.infer<typeof ChatCompletionStreamChunkSchema>;

/**
 * OpenAI API error response
 */
export const OpenAIErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string(),
    param: z.string().nullable(),
    code: z.string().nullable(),
  }),
});

export type OpenAIError = z.infer<typeof OpenAIErrorSchema>;
