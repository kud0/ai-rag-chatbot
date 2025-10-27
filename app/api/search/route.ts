/**
 * Vector Search API Endpoint
 * POST /api/search
 *
 * Test endpoint for vector search functionality
 * Used by admin dashboard for testing RAG retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch, hybridSearch, retrieveContext, formatSources } from '@/lib/rag/retrieval';
import { DocumentSearchRequestSchema } from '@/types/document';
import { VECTOR_SEARCH_CONFIG } from '@/config/ai';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Search request body schema
 */
const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  documentId: z.string().uuid().optional(),
  topK: z.number().int().min(1).max(20).optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
  searchType: z.enum(['semantic', 'hybrid', 'rag']).default('semantic'),
  includeContext: z.boolean().default(false),
});

type SearchRequest = z.infer<typeof SearchRequestSchema>;

/**
 * POST /api/search
 * Perform vector search with various options
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const validatedData = SearchRequestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validatedData.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      query,
      documentId,
      topK,
      similarityThreshold,
      searchType,
      includeContext,
    } = validatedData.data;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('[Search API] Query:', query, 'User:', user.id, 'Type:', searchType);

    // Build search options with authenticated user ID
    const searchOptions = {
      topK,
      similarityThreshold,
      filters: {
        userId: user.id,  // Always use authenticated user's ID
        documentId,
      },
    };

    // Perform search based on type
    let results;
    let context = '';
    let sources: any[] = [];
    let totalChunks = 0;

    switch (searchType) {
      case 'semantic':
        results = await semanticSearch(query, searchOptions);
        break;

      case 'hybrid':
        if (!VECTOR_SEARCH_CONFIG.enableHybridSearch) {
          return NextResponse.json(
            {
              error: 'Hybrid search is not enabled',
              message: 'Enable hybrid search in config/ai.ts',
            },
            { status: 400 }
          );
        }
        results = await hybridSearch(query, searchOptions);
        break;

      case 'rag':
        const ragResult = await retrieveContext(query, searchOptions);
        context = ragResult.context;
        sources = ragResult.sources;
        totalChunks = ragResult.totalChunks;
        results = ragResult.sources;
        break;

      default:
        results = await semanticSearch(query, searchOptions);
    }

    // Format response
    const response: any = {
      success: true,
      query,
      searchType,
      resultCount: Array.isArray(results) ? results.length : 0,
      results: Array.isArray(results) ? results : [],
    };

    // Add RAG-specific fields
    if (searchType === 'rag') {
      response.rag = {
        context,
        totalChunks,
        sources,
        formattedSources: formatSources(sources),
      };
    }

    // Add context if requested
    if (includeContext && Array.isArray(results) && results.length > 0) {
      response.contextPreview = results
        .slice(0, 3)
        .map(r => ({
          documentTitle: r.documentTitle,
          content: r.content.slice(0, 200) + '...',
          similarity: r.similarity,
        }));
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Search API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search
 * Returns API documentation and usage examples
 */
export async function GET() {
  return NextResponse.json({
    name: 'Vector Search API',
    version: '1.0.0',
    description: 'Test endpoint for vector search and RAG retrieval',
    endpoints: {
      POST: {
        path: '/api/search',
        description: 'Perform vector search',
        body: {
          query: 'string (required) - Search query',
          userId: 'string (optional) - Filter by user ID',
          documentId: 'string (optional) - Filter by document ID',
          topK: 'number (optional, default: 5) - Number of results',
          similarityThreshold: 'number (optional, default: 0.7) - Minimum similarity',
          searchType: 'string (optional, default: "semantic") - Type: semantic, hybrid, or rag',
          includeContext: 'boolean (optional, default: false) - Include context preview',
        },
        example: {
          query: 'What is machine learning?',
          searchType: 'rag',
          topK: 5,
          similarityThreshold: 0.7,
          includeContext: true,
        },
      },
    },
    searchTypes: {
      semantic: 'Vector similarity search using embeddings',
      hybrid: 'Combined semantic + keyword search (requires enableHybridSearch)',
      rag: 'Full RAG pipeline with formatted context',
    },
  });
}
