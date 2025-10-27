'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Result type for server actions
 */
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get all documents (admin only)
 */
export async function getAllDocuments(): Promise<ActionResult<any[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // TODO: Add admin role check

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: documents || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch documents',
    };
  }
}

/**
 * Get analytics stats (admin only)
 */
export async function getAnalyticsStats(): Promise<ActionResult<{
  totalDocuments: number;
  totalChunks: number;
  totalStorage: number;
  recentActivity: any[];
}>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Get total documents
    const { count: totalDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    // Get total chunks
    const { count: totalChunks } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true });

    // Get total storage (sum of file sizes)
    const { data: documents } = await supabase
      .from('documents')
      .select('metadata');

    const totalStorage = (documents as any[])?.reduce((acc: number, doc: any) => {
      const size = doc.metadata?.fileSize || 0;
      return acc + (typeof size === 'number' ? size : 0);
    }, 0) || 0;

    // Get recent activity (last 10 documents)
    const { data: recentActivity } = await supabase
      .from('documents')
      .select('id, title, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      success: true,
      data: {
        totalDocuments: totalDocuments || 0,
        totalChunks: totalChunks || 0,
        totalStorage,
        recentActivity: recentActivity || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    };
  }
}

/**
 * Get document by ID (admin only)
 */
export async function getDocumentByIdAdmin(documentId: string): Promise<ActionResult<any>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return {
        success: false,
        error: error?.message || 'Document not found',
      };
    }

    // Get chunks for this document
    const { data: chunks } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId);

    return {
      success: true,
      data: {
        ...(document as any),
        chunks: chunks || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch document',
    };
  }
}

/**
 * Delete document (admin only)
 */
export async function deleteDocumentAdmin(documentId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Delete chunks first
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    // Delete document
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

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
