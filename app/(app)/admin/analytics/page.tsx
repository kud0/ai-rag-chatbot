'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/admin/stats-card';
import { VectorSearchTest } from '@/components/admin/vector-search-test';
import {
  FileText,
  Database,
  HardDrive,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { getAnalyticsStats } from '@/app/actions/admin';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const result = await getAnalyticsStats();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          System metrics and performance overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Documents"
          value={stats?.totalDocuments || 0}
          description="Documents in knowledge base"
          icon={FileText}
        />
        <StatsCard
          title="Total Chunks"
          value={stats?.totalChunks || 0}
          description="Vector embeddings stored"
          icon={Database}
        />
        <StatsCard
          title="Storage Used"
          value={formatBytes(stats?.totalStorage || 0)}
          description="Total file storage"
          icon={HardDrive}
        />
        <StatsCard
          title="Avg Chunks/Doc"
          value={
            stats?.totalDocuments > 0
              ? Math.round(stats.totalChunks / stats.totalDocuments)
              : 0
          }
          description="Average chunking ratio"
          icon={TrendingUp}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {doc.metadata?.mimeType?.split('/')[1]?.toUpperCase() || 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>

      {/* Search Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Search Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Query Time</p>
              <p className="text-2xl font-bold">~250ms</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
              <p className="text-2xl font-bold">92%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Similarity Threshold</p>
              <p className="text-2xl font-bold">0.7</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Note: Real-time metrics will be available in future updates
          </p>
        </CardContent>
      </Card>

      {/* Vector Search Test */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Test Vector Search</h2>
        <VectorSearchTest />
      </div>
    </div>
  );
}
