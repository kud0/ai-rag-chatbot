/**
 * Streaming Chat API Route with RAG Integration - AI SDK v5
 * Handles chat message processing with real-time streaming responses
 */

import { openai } from '@ai-sdk/openai';
import { streamText, type UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retrieveContext } from '@/lib/rag/retrieval';
import { GPT_MODEL, CHAT_CONFIG } from '@/config/ai';

export const maxDuration = 30;

/**
 * POST /api/chat
 * Processes chat messages with RAG context and returns streaming response
 */
/**
 * Helper function to extract text content from UIMessage
 * AI SDK v5 uses parts array: [{type: 'text', text: '...'}]
 */
function extractMessageContent(msg: any): string {
  // If message has parts array (AI SDK v5 format)
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((part: any) => part?.type === 'text')
      .map((part: any) => part.text || '')
      .join('\n');
  }

  // If content is a string, use it directly
  if (typeof msg.content === 'string') {
    return msg.content;
  }

  return '';
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { messages, includeRag = true }: { messages: UIMessage[]; includeRag?: boolean } = body;

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get latest user message
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Extract text content from user message
    const userMessageText = extractMessageContent(latestMessage);

    // Build system message with RAG context if enabled
    let systemMessage = '';

    if (includeRag && userMessageText) {
      try {
        const ragResult = await retrieveContext(userMessageText, {
          filters: { userId: user.id },
        });

        console.log('[RAG] Search results:', {
          foundContext: !!ragResult.context,
          sourcesCount: ragResult.sources?.length || 0,
          query: userMessageText.substring(0, 50)
        });

        if (ragResult.context && ragResult.sources && ragResult.sources.length > 0) {
          const sourcesText = ragResult.sources.map((s, i) => `[${i + 1}] ${s.documentTitle || 'Unknown'}`).join(', ');

          systemMessage = `You are a strict document-based Q&A assistant. You are FORBIDDEN from using any knowledge outside the context provided below.

ABSOLUTE RULES (VIOLATION WILL RESULT IN ERROR):
1. ONLY answer using information from the CONTEXT below
2. DO NOT use any general knowledge, training data, or external information
3. If the CONTEXT doesn't contain the answer, you MUST respond: "I don't have information about that in the uploaded documents."
4. Always cite the source document number when answering
5. Never make assumptions or inferences beyond what's explicitly in the CONTEXT

CONTEXT FROM UPLOADED DOCUMENTS:
${ragResult.context}

AVAILABLE SOURCES: ${sourcesText}

Remember: Answer ONLY from the context above. If the answer isn't there, say you don't have that information.`;
        } else {
          systemMessage = `You are a document-based Q&A assistant.

The knowledge base search found NO relevant documents for this query.

You MUST respond with EXACTLY this message:
"I don't have information about that in the uploaded documents. Please try rephrasing your question or upload relevant documents first."

DO NOT provide any general knowledge or information outside the document database.`;
        }
      } catch (error) {
        console.error('[RAG] Error:', error);
        systemMessage = `You are a document-based Q&A assistant.

There was an error searching the document database.

You MUST respond with EXACTLY this message:
"I'm having trouble searching the documents right now. Please try again in a moment."`;
      }
    } else {
      // RAG disabled - general assistant mode
      systemMessage = 'You are a helpful AI assistant. Answer questions to the best of your ability.';
    }

    // Convert UIMessages to simple CoreMessage format
    const coreMessages = messages.map(msg => ({
      role: msg.role,
      content: extractMessageContent(msg),
    }));

    // Stream response - streamText accepts CoreMessage format directly
    const result = streamText({
      model: openai(GPT_MODEL),
      system: systemMessage,
      messages: coreMessages,
      temperature: CHAT_CONFIG.temperature,
    });

    // Return streaming UIMessage response
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error:', error);

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
    message: 'Chat API is running (AI SDK v5)',
    timestamp: new Date().toISOString(),
  });
}
