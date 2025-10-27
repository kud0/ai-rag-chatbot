-- =====================================================
-- AI Chatbot RAG Application - Vector Search Functions
-- =====================================================
-- This migration creates optimized functions for:
-- 1. Semantic similarity search using vector embeddings
-- 2. Hybrid search combining semantic + keyword matching
-- 3. Performance-optimized queries with proper indexing
-- =====================================================

-- =====================================================
-- MATCH_DOCUMENTS FUNCTION
-- =====================================================
-- Performs semantic similarity search using cosine distance
-- Returns the most relevant document chunks for a query embedding
-- Automatically filters by user_id for data privacy
-- =====================================================

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

-- Add comment
COMMENT ON FUNCTION match_documents IS 'Semantic similarity search using cosine distance on vector embeddings';

-- =====================================================
-- HYBRID_SEARCH FUNCTION
-- =====================================================
-- Combines semantic search with keyword matching
-- Uses full-text search (tsvector) for keyword relevance
-- Merges results with configurable weights
-- =====================================================

-- First, add tsvector column for full-text search
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS content_tsvector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_tsvector
    ON document_chunks USING GIN(content_tsvector);

-- Hybrid search function
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
    -- Convert query text to tsquery for full-text search
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

-- Add comment
COMMENT ON FUNCTION hybrid_search IS 'Hybrid search combining semantic similarity and keyword matching with configurable weights';

-- =====================================================
-- GET_RELATED_CHUNKS FUNCTION
-- =====================================================
-- Finds related chunks from the same document
-- Useful for retrieving context around a matched chunk
-- =====================================================

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
    -- Get the source chunk's document and index
    SELECT document_id, chunk_index
    INTO source_doc_id, source_chunk_idx
    FROM document_chunks
    WHERE document_chunks.id = source_chunk_id;

    -- Return chunks within the context window
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

-- Add comment
COMMENT ON FUNCTION get_related_chunks IS 'Retrieves surrounding chunks from the same document for context';

-- =====================================================
-- GET_USER_DOCUMENT_STATS FUNCTION
-- =====================================================
-- Returns statistics about a user's documents
-- Useful for analytics and quota management
-- =====================================================

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

-- Add comment
COMMENT ON FUNCTION get_user_document_stats IS 'Returns document and chunk statistics for a user';

-- =====================================================
-- SEARCH WITH SOURCES FUNCTION
-- =====================================================
-- Enhanced search that returns formatted source references
-- Perfect for RAG responses with citation tracking
-- =====================================================

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

-- Add comment
COMMENT ON FUNCTION search_with_sources IS 'Semantic search with pre-formatted source references for RAG citations';

-- =====================================================
-- PERFORMANCE ANALYSIS VIEW
-- =====================================================
-- View for monitoring vector search performance
-- =====================================================

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

-- Add comment
COMMENT ON VIEW vector_search_stats IS 'Statistics view for monitoring vector search performance and storage';

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All functions respect user_id filtering for data privacy
-- 2. Cosine distance (<=> operator) used for semantic similarity
-- 3. IVFFlat index provides fast approximate nearest neighbor search
-- 4. Hybrid search combines benefits of semantic and keyword search
-- 5. Functions return JSONB for flexible source reference formatting
-- 6. All functions are optimized with proper indexes
-- 7. tsvector provides efficient full-text search capability
-- =====================================================
