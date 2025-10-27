'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Trash2,
  RefreshCw,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteDocumentAdmin } from '@/app/actions/admin';
import { reindexDocument } from '@/app/actions/documents';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  created_at: string;
  metadata?: {
    mimeType?: string;
    fileSize?: number;
  };
  chunks?: any[];
}

interface DocumentTableProps {
  documents: Document[];
  onDocumentDelete?: () => void;
  onDocumentView?: (documentId: string) => void;
}

export function DocumentTable({
  documents,
  onDocumentDelete,
  onDocumentView
}: DocumentTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getFileType = (mimeType?: string) => {
    if (!mimeType) return 'unknown';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word')) return 'docx';
    if (mimeType.includes('text')) return 'txt';
    return 'other';
  };

  const handleDelete = async (documentId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setProcessingId(documentId);
    try {
      const result = await deleteDocumentAdmin(documentId);

      if (result.success) {
        toast.success('Document deleted successfully');
        onDocumentDelete?.();
      } else {
        toast.error(result.error || 'Failed to delete document');
      }
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReindex = async (documentId: string, title: string) => {
    setProcessingId(documentId);
    try {
      const result = await reindexDocument(documentId);

      if (result.success) {
        toast.success(`Reindexed "${title}"`);
      } else {
        toast.error(result.error || 'Failed to reindex document');
      }
    } catch (error) {
      toast.error('Failed to reindex document');
    } finally {
      setProcessingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No documents found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Chunks</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const fileType = getFileType(doc.metadata?.mimeType);
            const isProcessing = processingId === doc.id;

            return (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{fileType.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>{formatSize(doc.metadata?.fileSize)}</TableCell>
                <TableCell>{doc.chunks?.length || 0}</TableCell>
                <TableCell>{formatDate(doc.created_at)}</TableCell>
                <TableCell className="text-right">
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin inline-block" />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onDocumentView?.(doc.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReindex(doc.id, doc.title)}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reindex
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
