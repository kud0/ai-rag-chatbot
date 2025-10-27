/**
 * Streaming Chat API Route with RAG Integration
 * Handles chat message processing with real-time streaming responses
 */

import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { retrieveContext } from '@/lib/rag/retrieval';
import { buildConversationWithContext } from '@/lib/rag/prompt-builder';
import { GPT_MODEL, CHAT_CONFIG } from '@/config/ai';
import type { OpenAIChatMessage } from '@/types/openai';
import type { DocumentSearchResult } from '@/types/document';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/chat
 * Processes chat messages with RAG context and returns streaming response
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { messages, sessionId, userId, includeRag = true } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1];
    if (!latestUserMessage || latestUserMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Save user message to database
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: latestUserMessage.content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
    }

    // Retrieve RAG context if enabled
    let context = '';
    let sources: DocumentSearchResult[] = [];

    if (includeRag) {
      try {
        const ragResult = await retrieveContext(latestUserMessage.content, {
          filters: { userId: user.id },
        });
        context = ragResult.context;
        sources = ragResult.sources;
      } catch (error) {
        console.error('RAG retrieval error:', error);
        // Continue without RAG if retrieval fails
      }
    }

    // Build conversation with RAG context
    const conversationHistory: OpenAIChatMessage[] = messages.slice(0, -1);
    const promptMessages = buildConversationWithContext(
      conversationHistory,
      context,
      latestUserMessage.content
    );

    // Create streaming response from OpenAI
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: promptMessages,
      temperature: CHAT_CONFIG.temperature,
      max_tokens: CHAT_CONFIG.maxTokens,
      stream: true,
    });

    // Track the complete response for saving
    let fullResponse = '';

    // Transform the stream to collect the full response
    const stream = OpenAIStream(response, {
      onToken(token) {
        fullResponse += token;
      },
      async onFinal() {
        // Save assistant message to database after streaming completes
        try {
          const { error: assistantMessageError } = await supabase
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              role: 'assistant',
              content: fullResponse,
              sources: sources.length > 0 ? sources : null,
              created_at: new Date().toISOString(),
            });

          if (assistantMessageError) {
            console.error('Error saving assistant message:', assistantMessageError);
          }

          // Update session's updated_at timestamp
          await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);
        } catch (error) {
          console.error('Error in onFinal:', error);
        }
      },
    });

    // Return streaming response with sources in headers
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Sources': JSON.stringify(sources),
    });

    return new StreamingTextResponse(stream, { headers });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Chat API is running',
    timestamp: new Date().toISOString(),
  });
}
