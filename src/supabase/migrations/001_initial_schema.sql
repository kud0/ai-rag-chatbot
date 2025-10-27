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
