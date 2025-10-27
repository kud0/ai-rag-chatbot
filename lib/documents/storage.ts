// @ts-nocheck

import { createClient } from '@/lib/supabase/server';
import { Document, DocumentChunk } from '@/types/document';
import { Chunk } from './chunker';
import { generateEmbeddings } from './embedder';

/**
 * Storage error class
 */
export class StorageError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Save document to database
 */
export async function saveDocument(data: {
  title: string;
  content: string;
  userId: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
}): Promise<string> {
  try {
    const supabase = await createClient();

    const { data: document, error } = await (supabase
      .from('documents')
      .insert({
        title: data.title,
        content: data.content,
        user_id: data.userId,
        metadata: data.metadata || {},
      } as any)
      .select('id')
      .single() as any);

    if (error) {
      throw new StorageError(`Failed to save document: ${error.message}`, error.code);
    }

    if (!document) {
      throw new StorageError('No document returned after insert');
    }

    return document.id;
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      `Failed to save document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Save document chunks with embeddings
 */
export async function saveDocumentChunks(
  documentId: string,
  documentTitle: string,
  chunks: Chunk[],
  documentMetadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(c => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);

    // Prepare chunk data for insertion
    const chunkData = chunks.map((chunk, index) => ({
      document_id: documentId,
      content: chunk.content,
      embedding: embeddings[index].embedding,
      chunk_index: chunk.metadata.chunkIndex,  // Store as column, not in metadata
      token_count: Math.round(embeddings[index].tokenCount),  // Round to integer
      metadata: {
        totalChunks: chunk.metadata.totalChunks,
        startOffset: chunk.metadata.startOffset,
        endOffset: chunk.metadata.endOffset,
        documentTitle,
        documentMetadata,
      },
    }));

    // Insert chunks in batches
    const batchSize = 50;
    for (let i = 0; i < chunkData.length; i += batchSize) {
      const batch = chunkData.slice(i, i + batchSize);

      const { error } = await supabase
        .from('document_chunks')
        .insert(batch);

      if (error) {
        throw new StorageError(
          `Failed to save document chunks: ${error.message}`,
          error.code
        );
      }
    }
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      `Failed to save document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get document by ID
 */
export async function getDocument(documentId: string): Promise<Document | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Document not found
      }
      throw new StorageError(`Failed to get document: ${error.message}`, error.code);
    }

    return data as unknown as Document;
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      `Failed to get document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get documents by user ID
 */
export async function getDocumentsByUser(userId: string): Promise<Document[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new StorageError(`Failed to get documents: ${error.message}`, error.code);
    }

    return (data || []) as unknown as Document[];
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      `Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get document chunks by document ID
 */
export async function getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('metadata->chunkIndex', { ascending: true });

    if (error) {
      throw new StorageError(
        `Failed to get document chunks: ${error.message}`,
        error.code
      );
    }

    return (data || []) as unknown as DocumentChunk[];
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      `Failed to get document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete document and its chunks
 */
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Delete the document (chunks will be cascade deleted via foreign key)
    const { error: docError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (docError) {
      throw new StorageError(
        `Failed to delete document: ${docError.message}`,
        docError.code
      );
    }
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Reindex document (regenerate chunks and embeddings)
 */
export async function reindexDocument(
  documentId: string,
  chunks: Chunk[]
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get document details
    const document = await getDocument(documentId);
    if (!document) {
      throw new StorageError('Document not found');
    }

    // Delete existing chunks
    const { error: deleteError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      throw new StorageError(
        `Failed to delete old chunks: ${deleteError.message}`,
        deleteError.code
      );
    }

    // Save new chunks with embeddings
    await saveDocumentChunks(
      documentId,
      document.title,
      chunks,
      document.metadata as Record<string, unknown>
    );
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      `Failed to reindex document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
