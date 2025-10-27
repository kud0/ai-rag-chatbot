/**
 * Message Bubble Component
 * Displays individual chat messages with role-based styling
 */

'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  message: Message;
  className?: string;
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isAssistant
            ? 'bg-muted text-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {/* Role label for system messages */}
        {message.role === 'system' && (
          <div className="mb-1 text-xs font-semibold opacity-70">
            System Message
          </div>
        )}

        {/* Message content with markdown support */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom code block rendering with syntax highlighting
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className={cn(
                      'rounded bg-muted px-1 py-0.5 text-sm',
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              // Custom link styling
              a({ node, children, ...props }) {
                return (
                  <a
                    className="text-blue-500 hover:text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // Custom paragraph styling
              p({ node, children, ...props }) {
                return (
                  <p className="mb-2 last:mb-0" {...props}>
                    {children}
                  </p>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            'mt-2 text-xs opacity-70',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {message.createdAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
