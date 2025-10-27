-- =====================================================
-- Fix Migration: Add Missing Functions and Policies
-- =====================================================
-- This migration adds vector search functions and RLS policies
-- to an existing database that already has the tables created
-- =====================================================

-- =====================================================
-- ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- RLS POLICIES FOR DOCUMENTS
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Users can view own document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can insert own document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can delete own document chunks" ON document_chunks;

-- Create RLS policies for documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for document_chunks
CREATE POLICY "Users can view own document chunks" ON document_chunks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own document chunks" ON document_chunks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own document chunks" ON document_chunks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- =====================================================
-- VECTOR SEARCH FUNCTIONS
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS match_documents;
DROP FUNCTION IF EXISTS hybrid_search;
DROP FUNCTION IF EXISTS get_related_chunks;
DROP FUNCTION IF EXISTS get_user_document_stats;
DROP FUNCTION IF EXISTS search_with_sources;

-- MATCH_DOCUMENTS FUNCTION
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
        (filter_user_id IS NULL OR d.user_id = filter_user_id)
        AND dc.embedding IS NOT NULL
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_documents IS 'Semantic similarity search using cosine distance on vector embeddings';

-- Add tsvector column for full-text search if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'document_chunks'
        AND column_name = 'content_tsvector'
    ) THEN
        ALTER TABLE document_chunks ADD COLUMN content_tsvector tsvector
            GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

        CREATE INDEX idx_document_chunks_content_tsvector
            ON document_chunks USING GIN(content_tsvector);
    END IF;
END $$;

-- HYBRID_SEARCH FUNCTION
CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding vector(1536),
    query_text text,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5,
    filter_user_id uuid DEFAULT NULL,
    semantic_weight float DEFAULT 0.7,
    keyword_weight float DEFAULT 0.3
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    content text,
    hybrid_score float,
    semantic_similarity float,
    keyword_rank float,
    chunk_index int,
    metadata jsonb,
    document_title text,
    document_metadata jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    query_tsquery tsquery;
BEGIN
    query_tsquery := plainto_tsquery('english', query_text);

    RETURN QUERY
    WITH semantic_search AS (
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
            (filter_user_id IS NULL OR d.user_id = filter_user_id)
            AND dc.embedding IS NOT NULL
    ),
    keyword_search AS (
        SELECT
            dc.id,
            ts_rank(dc.content_tsvector, query_tsquery) AS rank
        FROM document_chunks dc
        INNER JOIN documents d ON dc.document_id = d.id
        WHERE
            (filter_user_id IS NULL OR d.user_id = filter_user_id)
            AND dc.content_tsvector @@ query_tsquery
    )
    SELECT
        ss.id,
        ss.document_id,
        ss.content,
        (COALESCE(ss.similarity, 0) * semantic_weight +
         COALESCE(ks.rank, 0) * keyword_weight) AS hybrid_score,
        ss.similarity AS semantic_similarity,
        COALESCE(ks.rank, 0) AS keyword_rank,
        ss.chunk_index,
        ss.metadata,
        ss.document_title,
        ss.document_metadata
    FROM semantic_search ss
    LEFT JOIN keyword_search ks ON ss.id = ks.id
    WHERE
        (COALESCE(ss.similarity, 0) * semantic_weight +
         COALESCE(ks.rank, 0) * keyword_weight) > match_threshold
    ORDER BY hybrid_score DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION hybrid_search IS 'Hybrid search combining semantic similarity and keyword matching';

-- GET_RELATED_CHUNKS FUNCTION
CREATE OR REPLACE FUNCTION get_related_chunks(
    source_chunk_id uuid,
    context_window int DEFAULT 2
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    content text,
    chunk_index int,
    metadata jsonb,
    is_source boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
    source_doc_id uuid;
    source_chunk_idx int;
BEGIN
    SELECT document_id, chunk_index
    INTO source_doc_id, source_chunk_idx
    FROM document_chunks
    WHERE document_chunks.id = source_chunk_id;

    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.content,
        dc.chunk_index,
        dc.metadata,
        (dc.id = source_chunk_id) AS is_source
    FROM document_chunks dc
    WHERE
        dc.document_id = source_doc_id
        AND dc.chunk_index >= (source_chunk_idx - context_window)
        AND dc.chunk_index <= (source_chunk_idx + context_window)
    ORDER BY dc.chunk_index ASC;
END;
$$;

COMMENT ON FUNCTION get_related_chunks IS 'Retrieves surrounding chunks from the same document';

-- GET_USER_DOCUMENT_STATS FUNCTION
CREATE OR REPLACE FUNCTION get_user_document_stats(
    target_user_id uuid
)
RETURNS TABLE (
    total_documents bigint,
    total_chunks bigint,
    total_size_bytes bigint,
    avg_chunks_per_document numeric,
    earliest_document timestamptz,
    latest_document timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT d.id) AS total_documents,
        COUNT(dc.id) AS total_chunks,
        COALESCE(SUM(d.file_size), 0) AS total_size_bytes,
        CASE
            WHEN COUNT(DISTINCT d.id) > 0
            THEN ROUND(COUNT(dc.id)::numeric / COUNT(DISTINCT d.id), 2)
            ELSE 0
        END AS avg_chunks_per_document,
        MIN(d.created_at) AS earliest_document,
        MAX(d.created_at) AS latest_document
    FROM documents d
    LEFT JOIN document_chunks dc ON d.id = dc.document_id
    WHERE d.user_id = target_user_id;
END;
$$;

COMMENT ON FUNCTION get_user_document_stats IS 'Returns document and chunk statistics for a user';

-- SEARCH_WITH_SOURCES FUNCTION
CREATE OR REPLACE FUNCTION search_with_sources(
    query_embedding vector(1536),
    query_text text,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5,
    filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    chunk_id uuid,
    document_id uuid,
    content text,
    score float,
    source_reference jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id AS chunk_id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS score,
        jsonb_build_object(
            'document_id', d.id,
            'document_title', d.title,
            'chunk_index', dc.chunk_index,
            'file_name', d.file_name,
            'created_at', d.created_at,
            'similarity', 1 - (dc.embedding <=> query_embedding)
        ) AS source_reference
    FROM document_chunks dc
    INNER JOIN documents d ON dc.document_id = d.id
    WHERE
        (filter_user_id IS NULL OR d.user_id = filter_user_id)
        AND dc.embedding IS NOT NULL
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_with_sources IS 'Semantic search with pre-formatted source references';

-- =====================================================
-- PERFORMANCE VIEW
-- =====================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vector_search_stats;

CREATE OR REPLACE VIEW vector_search_stats AS
SELECT
    COUNT(DISTINCT dc.document_id) AS total_documents_with_embeddings,
    COUNT(dc.id) AS total_chunks,
    COUNT(dc.embedding) AS chunks_with_embeddings,
    ROUND(
        100.0 * COUNT(dc.embedding) / NULLIF(COUNT(dc.id), 0),
        2
    ) AS embedding_coverage_percent,
    AVG(dc.token_count) AS avg_tokens_per_chunk,
    pg_size_pretty(pg_total_relation_size('document_chunks')) AS table_size,
    pg_size_pretty(pg_indexes_size('document_chunks')) AS index_size
FROM document_chunks dc;

COMMENT ON VIEW vector_search_stats IS 'Statistics for monitoring vector search performance';

-- =====================================================
-- COMPLETE
-- =====================================================

SELECT 'Migration completed successfully!' AS status;
