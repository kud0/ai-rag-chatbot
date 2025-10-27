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
          'max-w-[75%] rounded-2xl px-4 py-2.5',
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
        <div className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          "[&_p]:my-1 [&_p]:leading-relaxed",
          "[&_ul]:my-1 [&_ol]:my-1",
          "[&_pre]:my-2 [&_pre]:text-sm"
        )}>
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
                    className="!my-2 !rounded-md !text-sm"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className={cn(
                      'rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-sm font-mono',
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
                    className="text-blue-500 hover:text-blue-600 underline underline-offset-2"
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
                  <p className="leading-relaxed" {...props}>
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
            'mt-1 text-[11px] opacity-60',
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
