-- ============================================================================
-- SUPABASE VECTOR SEARCH SETUP - COMPLETE
-- ============================================================================
-- This script enables pgvector and creates all necessary functions and indexes
-- for vector similarity search in your AI Chatbot RAG application.
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Go to SQL Editor (left sidebar)
-- 3. Click "New Query"
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run" (or press Cmd/Ctrl + Enter)
-- 6. Check for "Setup completed successfully!" message
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable pgvector Extension
-- ============================================================================
-- This is REQUIRED for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is enabled
SELECT 'pgvector extension enabled' as status;

-- ============================================================================
-- STEP 2: Create/Recreate Vector Index
-- ============================================================================
-- Drop existing index if it exists (in case it's corrupted)
DROP INDEX IF EXISTS idx_document_chunks_embedding;

-- Create IVFFlat index for fast vector similarity search
-- Using cosine distance (best for normalized embeddings like OpenAI's)
-- lists = 100 is optimal for datasets with < 100K vectors
CREATE INDEX idx_document_chunks_embedding ON document_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

SELECT 'Vector index created' as status;

-- ============================================================================
-- STEP 3: Analyze Table for Index Optimization
-- ============================================================================
-- This helps PostgreSQL optimize the index
ANALYZE document_chunks;

SELECT 'Table analyzed' as status;

-- ============================================================================
-- STEP 4: Create/Recreate match_documents Function
-- ============================================================================
-- Drop existing function (all possible signatures)
DROP FUNCTION IF EXISTS match_documents(vector, float, int, uuid);
DROP FUNCTION IF EXISTS match_documents(vector(1536), float, int, uuid);

-- Create the match_documents function with proper user filtering
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5,
    filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    content text,
    similarity float,
    chunk_index int,
    metadata jsonb,
    document_title text,
    document_metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        dc.chunk_index,
        dc.metadata,
        d.title AS document_title,
        d.metadata AS document_metadata
    FROM document_chunks dc
    INNER JOIN documents d ON dc.document_id = d.id
    WHERE
        -- KEY FIX: Properly filter by user_id OR allow null for no filter
        (filter_user_id IS NULL OR d.user_id = filter_user_id)
        AND dc.embedding IS NOT NULL
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION match_documents IS 'Semantic similarity search using cosine distance with user filtering support';

SELECT 'match_documents function created' as status;

-- ============================================================================
-- STEP 5: Verify Setup
-- ============================================================================
-- Check extension
SELECT
    'Extension Check' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN '✅ pgvector enabled'
    ELSE '❌ pgvector NOT enabled'
    END as result;

-- Check index
SELECT
    'Index Check' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'document_chunks'
        AND indexname = 'idx_document_chunks_embedding'
    ) THEN '✅ Vector index exists'
    ELSE '❌ Vector index NOT found'
    END as result;

-- Check function
SELECT
    'Function Check' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'match_documents'
    ) THEN '✅ match_documents function exists'
    ELSE '❌ match_documents function NOT found'
    END as result;

-- Count chunks with embeddings
SELECT
    'Embeddings Check' as test_name,
    COUNT(*) || ' chunks with embeddings' as result
FROM document_chunks
WHERE embedding IS NOT NULL;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================
SELECT '✅ Setup completed successfully!' as status;
SELECT 'Your vector search is now ready to use!' as message;
