import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          System configuration and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vector Search Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Embedding Model</span>
              <Badge variant="outline">text-embedding-3-small</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Chunk Size</span>
              <Badge variant="outline">1000 tokens</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Chunk Overlap</span>
              <Badge variant="outline">200 tokens</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Similarity Threshold</span>
              <Badge variant="outline">0.7</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Max File Size</span>
              <Badge variant="outline">10 MB</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Supported Formats</span>
              <div className="flex gap-2">
                <Badge variant="secondary">PDF</Badge>
                <Badge variant="secondary">DOCX</Badge>
                <Badge variant="secondary">TXT</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-indexing</span>
              <Badge variant="default">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RAG Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Default Top K</span>
              <Badge variant="outline">5</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hybrid Search</span>
              <Badge variant="secondary">Optional</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Context Window</span>
              <Badge variant="outline">4096 tokens</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <Badge variant="outline">Supabase (PostgreSQL)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Vector Extension</span>
              <Badge variant="outline">pgvector</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Version</span>
              <Badge variant="outline">v1.0.0</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Note: Configuration changes will be available in future updates. These
        settings are currently read-only and show the active system
        configuration.
      </p>
    </div>
  );
}
