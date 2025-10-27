'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getDocument,
  getDocumentsByUser,
  getDocumentChunks,
  deleteDocument as deleteDocumentFromDB,
  reindexDocument as reindexDocumentInDB,
} from '@/lib/documents/storage';
import { parseDocument, cleanText } from '@/lib/documents/parser';
import { chunkText } from '@/lib/documents/chunker';
import { FileType } from '@/lib/utils/file';

/**
 * Result type for server actions
 */
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Upload document action
 * Calls the upload API endpoint
 */
export async function uploadDocument(formData: FormData): Promise<ActionResult<{ documentId: string }>> {
  try {
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to upload document',
      };
    }

    revalidatePath('/documents');

    return {
      success: true,
      data: { documentId: data.documentId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    };
  }
}

/**
 * Get user's documents
 */
export async function getDocuments(): Promise<ActionResult<unknown[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const documents = await getDocumentsByUser(user.id);

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get documents',
    };
  }
}

/**
 * Get single document by ID
 */
export async function getDocumentById(documentId: string): Promise<ActionResult<unknown>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const document = await getDocument(documentId);

    if (!document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Verify ownership
    if ((document as { userId: string }).userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    return {
      success: true,
      data: document,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get document',
    };
  }
}

/**
 * Get document chunks
 */
export async function getChunks(documentId: string): Promise<ActionResult<unknown[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify document ownership
    const document = await getDocument(documentId);
    if (!document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    if ((document as { userId: string }).userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const chunks = await getDocumentChunks(documentId);

    return {
      success: true,
      data: chunks,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chunks',
    };
  }
}

/**
 * Delete document
 */
export async function deleteDocument(documentId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify document ownership
    const document = await getDocument(documentId);
    if (!document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    if ((document as { userId: string }).userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    await deleteDocumentFromDB(documentId);

    revalidatePath('/documents');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete document',
    };
  }
}

/**
 * Reindex document (regenerate chunks and embeddings)
 */
export async function reindexDocument(documentId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify document ownership
    const document = await getDocument(documentId);
    if (!document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    if ((document as { userId: string }).userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Re-chunk the document content
    const content = (document as { content: string }).content;
    const chunks = chunkText(content);

    // Reindex with new chunks
    await reindexDocumentInDB(documentId, chunks);

    revalidatePath('/documents');
    revalidatePath(`/documents/${documentId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reindex document',
    };
  }
}

/**
 * Process text directly (without file upload)
 */
export async function processText(params: {
  title: string;
  content: string;
  fileType?: FileType;
}): Promise<ActionResult<{ documentId: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const { title, content, fileType = 'text' } = params;

    // Clean text
    const cleanedText = cleanText(content);

    // Parse if needed (for structured formats)
    let processedText = cleanedText;
    if (fileType !== 'text') {
      const buffer = Buffer.from(content, 'utf-8');
      const parseResult = await parseDocument(buffer, fileType);
      processedText = cleanText(parseResult.text);
    }

    // Import saveDocument and saveDocumentChunks
    const { saveDocument, saveDocumentChunks } = await import('@/lib/documents/storage');

    // Save document
    const documentId = await saveDocument({
      title,
      content: processedText,
      userId: user.id,
      metadata: {
        mimeType: 'text/plain',
      },
    });

    // Chunk and save
    const chunks = chunkText(processedText);
    await saveDocumentChunks(documentId, title, chunks);

    revalidatePath('/documents');

    return {
      success: true,
      data: { documentId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process text',
    };
  }
}
