'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchResult {
  documentTitle: string;
  content: string;
  similarity: number;
  chunkIndex?: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  searchType: string;
  resultCount: number;
  results: SearchResult[];
  rag?: {
    context: string;
    totalChunks: number;
    sources: any[];
  };
  error?: string;
}

export function VectorSearchTest() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'hybrid' | 'rag'>('semantic');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          searchType,
          topK: 5,
          similarityThreshold: 0.7,
          includeContext: true,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        query,
        searchType,
        resultCount: 0,
        results: [],
        error: error instanceof Error ? error.message : 'Search failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vector Search Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Select
              value={searchType}
              onValueChange={(value: any) => setSearchType(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semantic">Semantic</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="rag">RAG</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Semantic:</strong> Vector similarity search
              <br />
              <strong>Hybrid:</strong> Combined semantic + keyword search
              <br />
              <strong>RAG:</strong> Full RAG pipeline with context
            </p>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Results</CardTitle>
              <div className="flex gap-2">
                <Badge variant={results.success ? 'default' : 'destructive'}>
                  {results.success ? 'Success' : 'Error'}
                </Badge>
                <Badge variant="outline">
                  {results.resultCount} results
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!results.success && results.error && (
              <Alert variant="destructive">
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            )}

            {results.success && results.rag && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold">RAG Context</h4>
                <p className="text-sm text-muted-foreground">
                  {results.rag.totalChunks} chunks retrieved
                </p>
                <div className="bg-background p-3 rounded border text-sm">
                  {results.rag.context.substring(0, 500)}
                  {results.rag.context.length > 500 && '...'}
                </div>
              </div>
            )}

            {results.success && results.results.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Search Results</h4>
                {results.results.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">{result.documentTitle}</h5>
                      <Badge variant="outline">
                        {(result.similarity * 100).toFixed(1)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.content.substring(0, 200)}
                      {result.content.length > 200 && '...'}
                    </p>
                    {result.chunkIndex !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Chunk #{result.chunkIndex}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.success && results.resultCount === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No results found for your query
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
