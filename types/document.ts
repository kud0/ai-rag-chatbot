import { z } from 'zod';

/**
 * Document metadata schema
 */
export const DocumentMetadataSchema = z.object({
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  source: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

/**
 * Document schema for knowledge base
 */
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  metadata: DocumentMetadataSchema.optional(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true),
});

export type Document = z.infer<typeof DocumentSchema>;

/**
 * Chunk metadata for storing additional context
 */
export const ChunkMetadataSchema = z.object({
  chunkIndex: z.number().int().min(0),
  totalChunks: z.number().int().min(1),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  documentTitle: z.string(),
  documentMetadata: DocumentMetadataSchema.optional(),
});

export type ChunkMetadata = z.infer<typeof ChunkMetadataSchema>;

/**
 * Document chunk schema with embeddings for vector search
 */
export const DocumentChunkSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  content: z.string().min(1),
  embedding: z.array(z.number()).length(1536), // text-embedding-3-small dimension
  metadata: ChunkMetadataSchema,
  createdAt: z.date(),
});

export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;

/**
 * Document upload request schema
 */
export const DocumentUploadSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(1000000), // 1MB text limit
  userId: z.string().uuid(),
  metadata: DocumentMetadataSchema.optional(),
  autoChunk: z.boolean().default(true),
});

export type DocumentUpload = z.infer<typeof DocumentUploadSchema>;

/**
 * Document search request
 */
export const DocumentSearchRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  userId: z.string().uuid(),
  topK: z.number().int().min(1).max(50).default(5),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
  filters: z.object({
    documentIds: z.array(z.string().uuid()).optional(),
    tags: z.array(z.string()).optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
  }).optional(),
});

export type DocumentSearchRequest = z.infer<typeof DocumentSearchRequestSchema>;

/**
 * Document search result
 */
export const DocumentSearchResultSchema = z.object({
  chunkId: z.string().uuid(),
  documentId: z.string().uuid(),
  documentTitle: z.string(),
  content: z.string(),
  similarity: z.number().min(0).max(1),
  metadata: ChunkMetadataSchema,
});

export type DocumentSearchResult = z.infer<typeof DocumentSearchResultSchema>;

/**
 * Chunking configuration
 */
export const ChunkingConfigSchema = z.object({
  chunkSize: z.number().int().min(100).max(2000).default(512),
  chunkOverlap: z.number().int().min(0).max(500).default(50),
  separators: z.array(z.string()).default(['\n\n', '\n', '. ', ' ']),
});

export type ChunkingConfig = z.infer<typeof ChunkingConfigSchema>;
