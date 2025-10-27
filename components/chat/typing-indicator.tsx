/**
 * Typing Indicator Component
 * Animated loading indicator for AI responses
 */

'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-start',
        className
      )}
    >
      <div className="max-w-[80%] rounded-lg bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/40" />
        </div>
      </div>
    </div>
  );
}
