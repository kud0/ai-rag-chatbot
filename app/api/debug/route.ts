/**
 * Debug API Endpoint
 * Inspect database state for troubleshooting
 * WARNING: Remove in production or add authentication
 */

// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'overview';

    // Overview: Show counts and recent data
    if (action === 'overview') {
      // Check ALL documents in database (for debugging)
      const { data: allDocs } = await supabase
        .from('documents')
        .select('id, title, user_id')
        .limit(10);

      // Check chunks and their document_id associations
      const { data: chunkSample } = await supabase
        .from('document_chunks')
        .select('id, document_id, chunk_index, content')
        .limit(5);

      // Count documents for current user
      const { count: documentsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count chunks with embeddings
      const { count: chunksWithEmbeddings } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      // Count total chunks
      const { count: totalChunks } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

      // Get recent documents
      const { data: recentDocs } = await supabase
        .from('documents')
        .select('id, title, content_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Count chat sessions
      const { count: sessionsCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count chat messages
      const { count: messagesCount } = await supabase
        .from('chat_messages')
        .select('session_id, chat_sessions!inner(user_id)', { count: 'exact', head: true })
        .eq('chat_sessions.user_id', user.id);

      // Get recent messages
      const { data: recentMessages } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at, session_id')
        .order('created_at', { ascending: false })
        .limit(10);

      return NextResponse.json({
        userId: user.id,
        userEmail: user.email,
        allDocumentsInDB: allDocs || [],
        chunkSample: chunkSample || [],
        documents: {
          total: documentsCount || 0,
          recent: recentDocs || [],
        },
        chunks: {
          total: totalChunks || 0,
          withEmbeddings: chunksWithEmbeddings || 0,
          withoutEmbeddings: (totalChunks || 0) - (chunksWithEmbeddings || 0),
        },
        chat: {
          sessions: sessionsCount || 0,
          messages: messagesCount || 0,
          recentMessages: recentMessages?.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            contentPreview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            contentLength: msg.content.length,
            createdAt: msg.created_at,
            sessionId: msg.session_id,
          })) || [],
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Test RAG search
    if (action === 'test-rag') {
      const query = searchParams.get('query') || 'What is React?';

      // Import embedding function
      const { generateEmbedding } = await import('@/lib/rag/embeddings');

      try {
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(query);

        // Test with NO threshold and NO user filter first
        const { data: rawResults, error: rawError } = await (supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.0,  // Accept ANY match
          match_count: 5,
          filter_user_id: null,  // NO user filter
        } as any) as any);

        // Test WITH user filter
        const { data: userResults, error: userError } = await (supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
          filter_user_id: user.id,
        } as any) as any);

        return NextResponse.json({
          query,
          userId: user.id,
          embeddingGenerated: queryEmbedding.length === 1536,
          testResults: {
            noFilter: {
              success: !rawError,
              error: rawError?.message,
              count: rawResults?.length || 0,
              sample: rawResults?.slice(0, 2),
            },
            withUserFilter: {
              success: !userError,
              error: userError?.message,
              count: userResults?.length || 0,
              sample: userResults?.slice(0, 2),
            },
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return NextResponse.json({
          query,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check vector search details
    if (action === 'check-vectors') {
      try {
        // Get a sample chunk with embedding
        const { data: sampleChunk } = await (supabase
          .from('document_chunks')
          .select('id, content, embedding, document_id, documents!inner(title, user_id)')
          .eq('documents.user_id', user.id)
          .not('embedding', 'is', null)
          .limit(1)
          .single() as any);

        // Generate embedding for "react"
        const { generateEmbedding } = await import('@/lib/rag/embeddings');
        const testEmbedding = await generateEmbedding('react');

        // Test direct similarity calculation
        const { data: similarityTest } = await (supabase.rpc('match_documents', {
          query_embedding: testEmbedding,
          match_threshold: 0.0,  // Accept ANY match
          match_count: 10,
          filter_user_id: user.id,
        } as any) as any);

        return NextResponse.json({
          userId: user.id,
          sampleChunk: sampleChunk ? {
            id: sampleChunk.id,
            contentPreview: sampleChunk.content.substring(0, 100),
            hasEmbedding: !!sampleChunk.embedding,
            embeddingLength: sampleChunk.embedding?.length,
            documentTitle: (sampleChunk.documents as any)?.title,
          } : null,
          testQuery: 'react',
          testEmbeddingGenerated: testEmbedding.length === 1536,
          matchResults: {
            count: similarityTest?.length || 0,
            topResults: similarityTest?.slice(0, 3).map((r: any) => ({
              title: r.document_title,
              similarity: r.similarity,
              contentPreview: r.content.substring(0, 100),
            })),
          },
          diagnosis: {
            hasEmbeddings: !!sampleChunk?.embedding,
            functionWorks: (similarityTest?.length || 0) > 0,
            possibleIssue: !sampleChunk ? 'No chunks with embeddings found'
              : (similarityTest?.length || 0) === 0 ? 'Embeddings exist but similarity scores too low'
              : 'Everything working - check threshold',
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return NextResponse.json({
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        }, { status: 500 });
      }
    }

    // Verify database function exists and has correct signature
    if (action === 'verify-function') {
      try {
        // Test 1: Check if function exists and returns expected columns
        const { data: functionTest, error: functionError } = await (supabase
          .rpc('match_documents', {
            query_embedding: Array(1536).fill(0),  // Dummy embedding
            match_threshold: 0.0,
            match_count: 1,
            filter_user_id: null,
          } as any) as any);

        // Test 2: Check function behavior with user filter
        const { data: withFilter, error: filterError } = await (supabase
          .rpc('match_documents', {
            query_embedding: Array(1536).fill(0),
            match_threshold: 0.0,
            match_count: 1,
            filter_user_id: user.id,
          } as any) as any);

        // Test 3: Check if documents table has user_id column
        const { data: docSample } = await supabase
          .from('documents')
          .select('id, user_id, title')
          .eq('user_id', user.id)
          .limit(1);

        return NextResponse.json({
          functionExists: !functionError,
          functionError: functionError?.message,
          expectedColumns: ['id', 'document_id', 'content', 'similarity', 'chunk_index', 'metadata', 'document_title', 'document_metadata'],
          actualColumns: functionTest && functionTest.length > 0 ? Object.keys(functionTest[0]) : [],
          functionReturnsData: (functionTest?.length || 0) > 0,
          filterWorks: !filterError,
          filterError: filterError?.message,
          userDocumentsExist: (docSample?.length || 0) > 0,
          userDocuments: docSample,
          diagnosis: {
            functionApplied: !functionError && functionTest !== null,
            userFilterIssue: !functionError && filterError !== null,
            noDocuments: !functionError && !filterError && (docSample?.length || 0) === 0,
            possibleCause: !functionError && filterError
              ? 'Function exists but user filter failing - SQL may not be applied correctly'
              : !functionError && (docSample?.length || 0) === 0
              ? 'Function works but no documents found for this user'
              : functionError
              ? 'Function does not exist or has wrong signature - SQL not applied'
              : 'Unknown issue',
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return NextResponse.json({
          error: error instanceof Error ? error.message : String(error),
          diagnosis: 'Failed to verify function - unexpected error',
          timestamp: new Date().toISOString(),
        }, { status: 500 });
      }
    }

    // Check embeddings for a specific document
    if (action === 'check-embeddings') {
      const documentId = searchParams.get('documentId');

      if (!documentId) {
        return NextResponse.json(
          { error: 'documentId parameter required' },
          { status: 400 }
        );
      }

      // Get document info
      const { data: document } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single();

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      // Get chunks with embedding status
      const { data: chunks } = await supabase
        .from('document_chunks')
        .select('id, chunk_index, content, embedding')
        .eq('document_id', documentId)
        .order('chunk_index');

      return NextResponse.json({
        document: {
          id: document.id,
          title: document.title,
          contentType: document.content_type,
          createdAt: document.created_at,
        },
        chunks: chunks?.map(chunk => ({
          id: chunk.id,
          chunkIndex: chunk.chunk_index,
          contentPreview: chunk.content.substring(0, 100) + '...',
          hasEmbedding: !!chunk.embedding,
          embeddingDimensions: chunk.embedding?.length || 0,
        })) || [],
        summary: {
          totalChunks: chunks?.length || 0,
          chunksWithEmbeddings: chunks?.filter(c => c.embedding).length || 0,
          chunksWithoutEmbeddings: chunks?.filter(c => !c.embedding).length || 0,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        error: 'Invalid action',
        availableActions: ['overview', 'test-rag', 'check-embeddings'],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Debug API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
