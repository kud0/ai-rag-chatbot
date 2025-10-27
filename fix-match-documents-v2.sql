-- ============================================================================
-- FIX: match_documents function with proper user filtering
-- ============================================================================
-- This script recreates the match_documents function to properly filter
-- documents by user_id when performing vector similarity search.
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard
-- 2. Go to SQL Editor (left sidebar)
-- 3. Click "New Query"
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run" (or press Cmd/Ctrl + Enter)
-- 6. You should see "Function created successfully!" message
-- ============================================================================

-- Drop existing function (all possible signatures)
DROP FUNCTION IF EXISTS match_documents(vector, float, int, uuid);
DROP FUNCTION IF EXISTS match_documents(vector(1536), float, int, uuid);

-- Create the corrected function
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

-- Test the function was created successfully
SELECT 'Function created successfully!' as status;

-- Verify function signature
SELECT
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'match_documents';
