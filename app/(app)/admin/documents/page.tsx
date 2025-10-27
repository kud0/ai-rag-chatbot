'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DocumentUpload } from '@/components/admin/document-upload';
import { DocumentTable } from '@/components/admin/document-table';
import { Search, RefreshCw, Upload } from 'lucide-react';
import { getAllDocuments } from '@/app/actions/admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const result = await getAllDocuments();
      if (result.success) {
        setDocuments(result.data);
        setFilteredDocuments(result.data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = documents.filter((doc) =>
      doc.title.toLowerCase().includes(query) ||
      doc.metadata?.mimeType?.toLowerCase().includes(query)
    );
    setFilteredDocuments(filtered);
  }, [searchQuery, documents]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadDocuments();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">
          Manage and search your document knowledge base
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
        <Button variant="outline" onClick={loadDocuments} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {loading && documents.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
          <DocumentTable
            documents={filteredDocuments}
            onDocumentDelete={loadDocuments}
            onDocumentView={(id) => {
              const doc = documents.find((d) => d.id === id);
              setSelectedDocument(doc);
            }}
          />
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </DialogContent>
      </Dialog>

      {/* Document Details Dialog */}
      <Dialog
        open={!!selectedDocument}
        onOpenChange={() => setSelectedDocument(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Metadata</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Type:</dt>
                <dd>{selectedDocument?.metadata?.mimeType || 'N/A'}</dd>
                <dt className="text-muted-foreground">Size:</dt>
                <dd>
                  {selectedDocument?.metadata?.fileSize
                    ? `${(selectedDocument.metadata.fileSize / 1024 / 1024).toFixed(2)} MB`
                    : 'N/A'}
                </dd>
                <dt className="text-muted-foreground">Created:</dt>
                <dd>
                  {selectedDocument?.created_at
                    ? new Date(selectedDocument.created_at).toLocaleString()
                    : 'N/A'}
                </dd>
              </dl>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Content Preview</h4>
              <div className="bg-muted p-4 rounded-lg text-sm max-h-60 overflow-y-auto">
                {selectedDocument?.content?.substring(0, 1000) || 'No content available'}
                {selectedDocument?.content?.length > 1000 && '...'}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
