/**
 * Message List Component
 * Scrollable list of chat messages with auto-scroll
 */

'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { SourceCitations } from './source-citations';
import { TypingIndicator } from './typing-indicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message } from '@/types/chat';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  className,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6" ref={scrollAreaRef}>
        {messages.length === 0 && !isLoading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-base font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation to see messages here</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <MessageBubble message={message} />

            {/* Show sources for assistant messages if available */}
            {message.role === 'assistant' && message.sources && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <SourceCitations sources={message.sources} />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && <TypingIndicator />}

        {/* Invisible element for auto-scrolling */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
