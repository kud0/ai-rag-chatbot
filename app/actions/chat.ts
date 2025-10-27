/**
 * Chat Server Actions
 * Server-side functions for managing chat sessions and messages
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ChatSession, Message } from '@/types/chat';

/**
 * Create a new chat session for the user
 */
export async function createSession(title?: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized', session: null };
    }

    // Generate default title if not provided
    const sessionTitle = title || `Chat ${new Date().toLocaleDateString()}`;

    // Create new session
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: sessionTitle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return { error: error.message, session: null };
    }

    revalidatePath('/chat');

    return {
      error: null,
      session: {
        id: session.id,
        userId: session.user_id,
        title: session.title,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
      } as ChatSession,
    };
  } catch (error) {
    console.error('Create session error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create session',
      session: null,
    };
  }
}

/**
 * Get all chat sessions for the authenticated user
 */
export async function getSessions() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized', sessions: [] };
    }

    // Fetch user's sessions ordered by most recent
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return { error: error.message, sessions: [] };
    }

    return {
      error: null,
      sessions: sessions.map(session => ({
        id: session.id,
        userId: session.user_id,
        title: session.title,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
      })) as ChatSession[],
    };
  } catch (error) {
    console.error('Get sessions error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch sessions',
      sessions: [],
    };
  }
}

/**
 * Get all messages for a specific chat session
 */
export async function getSessionMessages(sessionId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized', messages: [] };
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return { error: 'Session not found or unauthorized', messages: [] };
    }

    // Fetch messages for the session
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return { error: error.message, messages: [] };
    }

    return {
      error: null,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.created_at),
        sources: msg.sources || undefined,
      })) as Message[],
    };
  } catch (error) {
    console.error('Get session messages error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch messages',
      messages: [],
    };
  }
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteSession(sessionId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized', success: false };
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return { error: 'Session not found or unauthorized', success: false };
    }

    // Delete messages first (due to foreign key constraint)
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return { error: messagesError.message, success: false };
    }

    // Delete the session
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      return { error: error.message, success: false };
    }

    revalidatePath('/chat');

    return { error: null, success: true };
  } catch (error) {
    console.error('Delete session error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete session',
      success: false,
    };
  }
}

/**
 * Save a message to a chat session
 */
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sources?: any[]
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized', message: null };
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return { error: 'Session not found or unauthorized', message: null };
    }

    // Save the message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        sources: sources || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return { error: error.message, message: null };
    }

    // Update session's updated_at timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return {
      error: null,
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: new Date(message.created_at),
        sources: message.sources || undefined,
      } as Message,
    };
  } catch (error) {
    console.error('Save message error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to save message',
      message: null,
    };
  }
}

/**
 * Update a chat session's title
 */
export async function updateSessionTitle(sessionId: string, title: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized', success: false };
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return { error: 'Session not found or unauthorized', success: false };
    }

    // Update session title
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session title:', error);
      return { error: error.message, success: false };
    }

    revalidatePath('/chat');

    return { error: null, success: true };
  } catch (error) {
    console.error('Update session title error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to update session title',
      success: false,
    };
  }
}
