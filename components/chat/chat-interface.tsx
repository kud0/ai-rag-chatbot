/**
 * Chat Interface Component
 * Main chat UI with streaming support and session management
 */

'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { SessionSidebar } from './session-sidebar';
import {
  createSession,
  deleteSession,
  updateSessionTitle,
  getSessionMessages,
  saveMessage,
} from '@/app/actions/chat';
import type { ChatSession, Message } from '@/types/chat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface ChatInterfaceProps {
  initialSessions: ChatSession[];
  userId: string;
  className?: string;
}

export function ChatInterface({
  initialSessions,
  userId,
  className,
}: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    initialSessions[0]?.id || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Helper to extract text from AI SDK v5 parts array
  const extractTextFromParts = (message: any): string => {
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part?.type === 'text')
        .map((part: any) => part.text || '')
        .join('\n');
    }
    if (typeof message.content === 'string') {
      return message.content;
    }
    return '';
  };

  // Use Vercel AI SDK v5's useChat hook
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (error) => {
      console.error('[Chat] Error:', error);
      toast.error('Failed to send message', {
        description: error.message,
      });
    },
    onFinish: async (message) => {
      console.log('[Chat] onFinish called:', {
        role: message.role,
        hasContent: !!message.content,
        hasParts: !!message.parts,
        sessionId: currentSessionId,
      });

      // Save assistant response to database
      if (currentSessionId && message.role === 'assistant') {
        const content = extractTextFromParts(message);
        console.log('[Chat] Saving assistant message, content length:', content.length);

        if (content) {
          const result = await saveMessage(currentSessionId, 'assistant', content);
          if (result.error) {
            console.error('[Chat] Save error:', result.error);
            toast.error('Failed to save response', { description: result.error });
          } else {
            console.log('[Chat] Saved successfully:', result.message?.id);
          }
        } else {
          console.warn('[Chat] No content to save');
        }
      }
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    } else {
      setMessages([]);
      setLocalMessages([]);
    }
  }, [currentSessionId, setMessages]);

  // Save assistant messages when they're done streaming
  useEffect(() => {
    const saveLatestAssistant = async () => {
      if (!currentSessionId || isLoading) return;

      // Get the last message
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'assistant') return;

      // Check if it's already saved in localMessages
      const alreadySaved = localMessages.some(m => m.id === lastMessage.id);
      if (alreadySaved) return;

      // Extract and save content
      const content = extractTextFromParts(lastMessage);
      if (!content) {
        console.warn('[Chat] No content to save for message:', lastMessage.id);
        return;
      }

      console.log('[Chat] Saving latest assistant message:', lastMessage.id, 'Content length:', content.length);

      const result = await saveMessage(currentSessionId, 'assistant', content);
      if (result.error) {
        console.error('[Chat] Save error:', result.error);
      } else {
        console.log('[Chat] Saved successfully, reloading messages');
        await loadSessionMessages(currentSessionId);
      }
    };

    saveLatestAssistant();
  }, [messages, isLoading, currentSessionId, localMessages]);

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const { messages: sessionMessages, error } = await getSessionMessages(sessionId);

      if (error) {
        toast.error('Failed to load messages', { description: error });
        return;
      }

      // Convert DB messages (content: string) to UIMessage format (parts array)
      const uiMessages = sessionMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        parts: [{ type: 'text' as const, text: msg.content || '' }],
        createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
      }));

      setMessages(uiMessages as any);
      setLocalMessages(sessionMessages);
    } catch (error) {
      console.error('[Chat] Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleCreateSession = async () => {
    try {
      const { session, error } = await createSession();

      if (error || !session) {
        toast.error('Failed to create session', { description: error });
        return;
      }

      setSessions([session, ...sessions]);
      setCurrentSessionId(session.id);
      toast.success('New chat created');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { success, error } = await deleteSession(sessionId);

      if (error || !success) {
        toast.error('Failed to delete session', { description: error });
        return;
      }

      // Remove from list
      setSessions(sessions.filter((s) => s.id !== sessionId));

      // If deleted current session, switch to another
      if (sessionId === currentSessionId) {
        const remainingSessions = sessions.filter((s) => s.id !== sessionId);
        setCurrentSessionId(remainingSessions[0]?.id || null);
      }

      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    try {
      const { success, error } = await updateSessionTitle(sessionId, newTitle);

      if (error || !success) {
        toast.error('Failed to rename session', { description: error });
        return;
      }

      // Update in list
      setSessions(
        sessions.map((s) =>
          s.id === sessionId ? { ...s, title: newTitle } : s
        )
      );

      toast.success('Chat renamed');
    } catch (error) {
      console.error('Error renaming session:', error);
      toast.error('Failed to rename session');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) {
      // Create a new session if none exists
      const { session } = await createSession();
      if (session) {
        setSessions([session, ...sessions]);
        setCurrentSessionId(session.id);

        // Save user message to the new session
        await saveMessage(session.id, 'user', content);

        // Send message using AI SDK
        await sendMessage({ text: content });
      }
      return;
    }

    // Save user message to database
    await saveMessage(currentSessionId, 'user', content);

    // Send message using AI SDK
    await sendMessage({ text: content });
  };

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <div
        className={cn(
          'h-full w-80 transition-all',
          sidebarOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId || undefined}
          onSelectSession={handleSelectSession}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b p-4 lg:hidden">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-lg font-semibold">
            {sessions.find((s) => s.id === currentSessionId)?.title || 'Chat'}
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Messages */}
        <MessageList
          messages={messages.map((msg, index) => ({
            id: msg.id || `msg-${index}`,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: extractTextFromParts(msg),
            createdAt: localMessages[index]?.createdAt || new Date(),
            sources: localMessages[index]?.sources,
          }))}
          isLoading={isLoading}
          className="flex-1"
        />

        {/* Input */}
        <div className="border-t p-4">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder={
              currentSessionId
                ? 'Ask me anything...'
                : 'Create a session to start chatting'
            }
          />
        </div>
      </div>
    </div>
  );
}
