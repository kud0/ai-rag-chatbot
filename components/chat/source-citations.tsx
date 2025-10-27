/**
 * Source Citations Component
 * Displays RAG source references below AI responses
 */

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink } from 'lucide-react';
import type { SourceReference } from '@/types/chat';

interface SourceCitationsProps {
  sources: SourceReference[];
  className?: string;
}

export function SourceCitations({ sources, className }: SourceCitationsProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Sources</h4>
          <Badge variant="secondary" className="ml-auto">
            {sources.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {sources.map((source, index) => {
            const relevancePercent = (source.similarity * 100).toFixed(1);
            const chunkInfo = source.metadata
              ? `Chunk ${source.metadata.chunkIndex + 1}`
              : '';

            return (
              <div
                key={source.documentId + index}
                className="group rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
              >
                {/* Source header */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        [{index + 1}]
                      </span>
                      <h5 className="text-sm font-medium line-clamp-1">
                        {source.documentTitle}
                      </h5>
                    </div>
                    {chunkInfo && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {chunkInfo}
                      </p>
                    )}
                  </div>

                  {/* Relevance badge */}
                  <Badge
                    variant="outline"
                    className="shrink-0"
                  >
                    {relevancePercent}% match
                  </Badge>
                </div>

                {/* Source excerpt */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {source.chunkContent}
                </p>

                {/* View document link */}
                <button
                  className="mt-2 flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    // Handle viewing full document
                    console.log('View document:', source.documentId);
                  }}
                >
                  <span>View document</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
