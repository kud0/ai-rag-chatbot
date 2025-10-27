/**
 * Chat Interface Component
 * Main chat UI with streaming support and session management
 */

'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { SessionSidebar } from './session-sidebar';
import {
  createSession,
  deleteSession,
  updateSessionTitle,
  getSessionMessages,
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

  // Use Vercel AI SDK's useChat hook for streaming
  const { messages, append, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: {
      sessionId: currentSessionId,
      userId,
    },
    onError: (error) => {
      toast.error('Failed to send message', {
        description: error.message,
      });
    },
    onResponse: (response) => {
      // Parse sources from response headers
      const sourcesHeader = response.headers.get('X-Sources');
      if (sourcesHeader) {
        try {
          const sources = JSON.parse(sourcesHeader);
          console.log('Received sources:', sources);
        } catch (error) {
          console.error('Failed to parse sources:', error);
        }
      }
    },
  });

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    } else {
      setMessages([]);
      setLocalMessages([]);
    }
  }, [currentSessionId, setMessages]);

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const { messages: sessionMessages, error } = await getSessionMessages(
        sessionId
      );

      if (error) {
        toast.error('Failed to load messages', { description: error });
        return;
      }

      // Convert to AI SDK format
      const formattedMessages = sessionMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      }));

      setMessages(formattedMessages);
      setLocalMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
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
      await handleCreateSession();
      // Wait for session to be created before sending
      setTimeout(() => {
        append({ role: 'user', content });
      }, 500);
      return;
    }

    // Send message using AI SDK
    await append({ role: 'user', content });
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
          messages={
            messages.map((msg, index) => ({
              id: msg.id || `msg-${index}`,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
              createdAt: localMessages[index]?.createdAt || new Date(),
              sources: localMessages[index]?.sources,
            }))
          }
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
