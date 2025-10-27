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
