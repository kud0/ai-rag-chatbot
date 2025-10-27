-- =====================================================
-- AI Chatbot RAG Application - Initial Schema
-- =====================================================
-- This migration creates the core tables for document storage,
-- vector embeddings, and chat functionality with multi-user support.
-- =====================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
-- Stores uploaded documents with metadata
-- Each document belongs to a specific user
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);

-- Add comment
COMMENT ON TABLE documents IS 'Stores uploaded documents with user ownership and metadata';

-- =====================================================
-- DOCUMENT_CHUNKS TABLE
-- =====================================================
-- Stores document chunks with vector embeddings
-- Uses OpenAI text-embedding-3-small (1536 dimensions)
-- Optimized for semantic search with pgvector
-- =====================================================

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    chunk_index INTEGER NOT NULL,
    token_count INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for document_chunks table
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON document_chunks USING GIN(metadata);

-- Vector similarity search index using IVFFlat
-- lists = rows/1000 (optimal for datasets, will be efficient up to 1M chunks)
-- Using cosine distance for semantic similarity
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add comment
COMMENT ON TABLE document_chunks IS 'Stores text chunks with vector embeddings for semantic search';
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding (1536 dimensions) from OpenAI text-embedding-3-small';

-- =====================================================
-- CHAT_SESSIONS TABLE
-- =====================================================
-- Stores chat sessions for each user
-- Each session represents a conversation thread
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for chat_sessions table
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_metadata ON chat_sessions USING GIN(metadata);

-- Add comment
COMMENT ON TABLE chat_sessions IS 'Stores chat conversation sessions for each user';

-- =====================================================
-- CHAT_MESSAGES TABLE
-- =====================================================
-- Stores individual messages within chat sessions
-- Includes role (user/assistant/system), content, and sources
-- Sources reference the document chunks used for RAG
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    token_count INTEGER,
    model TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for chat_messages table
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- Add comment
COMMENT ON TABLE chat_messages IS 'Stores individual messages in chat sessions with RAG source references';
COMMENT ON COLUMN chat_messages.sources IS 'JSONB array of document chunks used to generate the response';

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Auto-update updated_at timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for documents table
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for chat_sessions table
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONSTRAINTS
-- =====================================================
-- Additional check constraints for data integrity
-- =====================================================

-- Ensure content is not empty
ALTER TABLE documents ADD CONSTRAINT documents_content_not_empty
    CHECK (length(trim(content)) > 0);

ALTER TABLE document_chunks ADD CONSTRAINT document_chunks_content_not_empty
    CHECK (length(trim(content)) > 0);

ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_content_not_empty
    CHECK (length(trim(content)) > 0);

-- Ensure positive values
ALTER TABLE document_chunks ADD CONSTRAINT document_chunks_chunk_index_positive
    CHECK (chunk_index >= 0);

ALTER TABLE documents ADD CONSTRAINT documents_file_size_positive
    CHECK (file_size IS NULL OR file_size >= 0);

-- Ensure valid token counts
ALTER TABLE document_chunks ADD CONSTRAINT document_chunks_token_count_positive
    CHECK (token_count IS NULL OR token_count > 0);

ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_token_count_positive
    CHECK (token_count IS NULL OR token_count > 0);
-- =====================================================
-- AI Chatbot RAG Application - Row Level Security
-- =====================================================
-- This migration enables RLS and creates policies to ensure:
-- 1. Users can only access their own data
-- 2. Authenticated users can perform CRUD operations
-- 3. Data privacy and security across multi-user system
-- =====================================================

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- DOCUMENT_CHUNKS POLICIES
-- =====================================================

-- Policy: Users can view chunks from their own documents
CREATE POLICY "Users can view own document chunks" ON document_chunks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- Policy: Users can insert chunks for their own documents
CREATE POLICY "Users can insert own document chunks" ON document_chunks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- Policy: Users can update chunks from their own documents
CREATE POLICY "Users can update own document chunks" ON document_chunks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- Policy: Users can delete chunks from their own documents
CREATE POLICY "Users can delete own document chunks" ON document_chunks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- =====================================================
-- CHAT_SESSIONS POLICIES
-- =====================================================

-- Policy: Users can view their own chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat sessions
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chat sessions
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- CHAT_MESSAGES POLICIES
-- =====================================================

-- Policy: Users can view messages from their own chat sessions
CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Policy: Users can insert messages into their own chat sessions
CREATE POLICY "Users can insert own chat messages" ON chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Policy: Users can update messages in their own chat sessions
CREATE POLICY "Users can update own chat messages" ON chat_messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Policy: Users can delete messages from their own chat sessions
CREATE POLICY "Users can delete own chat messages" ON chat_messages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- =====================================================
-- ADMIN OVERRIDE POLICIES (Optional)
-- =====================================================
-- Uncomment these if you want to create admin users
-- who can access all data regardless of ownership
-- =====================================================

-- Create a custom claim check function (requires Supabase Auth to set custom claims)
-- CREATE OR REPLACE FUNCTION auth.is_admin()
-- RETURNS BOOLEAN AS $$
-- BEGIN
--     RETURN (
--         SELECT COALESCE(
--             (auth.jwt() -> 'app_metadata' -> 'role')::text = '"admin"',
--             false
--         )
--     );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policy examples (uncomment if needed):
-- CREATE POLICY "Admins can view all documents" ON documents
--     FOR SELECT
--     TO authenticated
--     USING (auth.is_admin());

-- CREATE POLICY "Admins can modify all documents" ON documents
--     FOR ALL
--     TO authenticated
--     USING (auth.is_admin())
--     WITH CHECK (auth.is_admin());

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All policies use auth.uid() to identify the current user
-- 2. Cascading deletes handle cleanup automatically
-- 3. document_chunks inherit security from parent documents table
-- 4. chat_messages inherit security from parent chat_sessions table
-- 5. Only authenticated users can access any data
-- 6. Unauthenticated users have no access to any tables
-- =====================================================
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
