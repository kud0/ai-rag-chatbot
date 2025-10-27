# RAG (Retrieval-Augmented Generation) System

Complete implementation of vector search and RAG retrieval for the AI Chatbot application.

## 📁 Architecture

```
lib/rag/
├── embeddings.ts       # OpenAI embedding generation
├── retrieval.ts        # Vector search and RAG retrieval
├── prompt-builder.ts   # LLM prompt construction
└── index.ts           # Main exports

app/api/search/
└── route.ts           # Test API endpoint
```

## 🚀 Features

### Embeddings (`embeddings.ts`)
- ✅ Single embedding generation with OpenAI
- ✅ Batch embedding processing (up to 100 per batch)
- ✅ Automatic retry with exponential backoff
- ✅ Embedding validation (dimensions, NaN check)
- ✅ Vector normalization for cosine similarity
- ✅ Cosine similarity calculation

### Retrieval (`retrieval.ts`)
- ✅ **Semantic search** - Pure vector similarity using `match_documents`
- ✅ **Hybrid search** - Combined semantic + keyword using `hybrid_search`
- ✅ **RAG context retrieval** - Full pipeline with formatting
- ✅ **Source formatting** - Citation-ready output
- ✅ Find similar chunks across documents
- ✅ Get chunks with surrounding context

### Prompt Builder (`prompt-builder.ts`)
- ✅ Build RAG prompts with context injection
- ✅ Format context chunks for readability
- ✅ Generate source citations
- ✅ Conversation history with context
- ✅ Token estimation and truncation
- ✅ Query refinement prompts
- ✅ Context verification prompts

### API Endpoint (`/api/search`)
- ✅ Test semantic search
- ✅ Test hybrid search (if enabled)
- ✅ Test full RAG pipeline
- ✅ Filter by user and document
- ✅ Configurable topK and threshold

## 📝 Usage Examples

### Basic Semantic Search

```typescript
import { semanticSearch } from '@/lib/rag';

const results = await semanticSearch('What is machine learning?', {
  topK: 5,
  similarityThreshold: 0.7,
  filters: {
    userId: 'user-uuid',
  },
});

// Returns: SemanticSearchResult[]
// - id, documentId, content, similarity, chunkIndex, metadata
```

### Hybrid Search (Semantic + Keyword)

```typescript
import { hybridSearch } from '@/lib/rag';

const results = await hybridSearch('machine learning algorithms', {
  topK: 5,
  similarityThreshold: 0.7,
  filters: {
    userId: 'user-uuid',
  },
});

// Returns: HybridSearchResult[]
// Includes hybridScore, semanticSimilarity, keywordRank
```

### Full RAG Context Retrieval

```typescript
import { retrieveContext } from '@/lib/rag';

const { context, sources, totalChunks } = await retrieveContext(
  'Explain neural networks',
  {
    topK: 5,
    filters: { userId: 'user-uuid' },
  }
);

// context: Formatted string ready for LLM prompt
// sources: Array of DocumentSearchResult with metadata
// totalChunks: Total matching chunks found
```

### Build RAG Prompt for LLM

```typescript
import { buildRAGPrompt, formatRAGResponse } from '@/lib/rag';
import OpenAI from 'openai';

// 1. Retrieve context
const { context, sources } = await retrieveContext(userQuery);

// 2. Build prompt with context
const messages = buildRAGPrompt(userQuery, context, sources, {
  includeSourceAttribution: true,
});

// 3. Call OpenAI
const openai = new OpenAI();
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
});

// 4. Format response with citations
const answer = completion.choices[0].message.content;
const response = formatRAGResponse(answer, sources);

console.log(response);
// Includes answer + "Sources: 1. Document Title (Chunk 1, Relevance: 89.2%)"
```

### Generate Embeddings

```typescript
import { generateEmbedding, generateBatchEmbeddings } from '@/lib/rag';

// Single embedding
const embedding = await generateEmbedding('Hello world');
// Returns: number[] (1536 dimensions)

// Batch embeddings
const texts = ['First text', 'Second text', 'Third text'];
const embeddings = await generateBatchEmbeddings(texts);
// Returns: number[][] (array of embeddings)

// With retry
import { generateEmbeddingWithRetry } from '@/lib/rag';
const embedding = await generateEmbeddingWithRetry('Text', 3);
```

### Format Sources for Citations

```typescript
import { formatSources, formatSourceCitations } from '@/lib/rag';

// Simple format
const sourcesText = formatSources(sources);
console.log(sourcesText);
// "Sources:
// 1. "Document Title" (Chunk 1, Relevance: 89.2%)
// 2. "Another Doc" (Chunk 3, Relevance: 82.5%)"

// Markdown format with details
const citations = formatSourceCitations(sources);
console.log(citations);
// "**Sources:**
// 1. **Document Title** (Chunk 1/10, Relevance: 89.2%)"
```

### Find Similar Content

```typescript
import { findSimilarChunks } from '@/lib/rag';

// Find chunks similar to a specific chunk
const similar = await findSimilarChunks('chunk-uuid', {
  topK: 5,
  similarityThreshold: 0.75,
});
```

### Get Chunk with Context

```typescript
import { getChunkWithContext } from '@/lib/rag';

// Get chunk with 2 chunks before and after
const contextChunks = await getChunkWithContext('chunk-uuid', 2);
// Returns chunks at positions [index-2, index-1, index, index+1, index+2]
```

## 🧪 Testing with API

### Test Semantic Search

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "searchType": "semantic",
    "topK": 5,
    "similarityThreshold": 0.7,
    "includeContext": true
  }'
```

### Test Hybrid Search

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "neural networks deep learning",
    "searchType": "hybrid",
    "topK": 5,
    "userId": "user-uuid"
  }'
```

### Test Full RAG Pipeline

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain transformers architecture",
    "searchType": "rag",
    "topK": 5,
    "includeContext": true
  }'
```

### Get API Documentation

```bash
curl http://localhost:3000/api/search
```

## ⚙️ Configuration

All configuration is centralized in `/config/ai.ts`:

```typescript
export const RAG_CONFIG = {
  topK: 5,                      // Number of results to retrieve
  similarityThreshold: 0.7,     // Minimum similarity (0-1)
  maxContextChunks: 3,          // Max chunks in context
  maxContextLength: 2000,       // Max characters in context
  enableReranking: true,        // Use hybrid search
  includeSources: true,         // Add citations
};

export const VECTOR_SEARCH_CONFIG = {
  distanceMetric: 'cosine',
  enableHybridSearch: false,    // Enable keyword + semantic
  indexType: 'ivfflat',
  lists: 100,
};

export const CACHE_CONFIG = {
  enableEmbeddingCache: true,
  embeddingCacheTTL: 86400,    // 24 hours
};
```

## 🗄️ Database Functions Used

The implementation leverages Supabase functions created in migrations:

1. **`match_documents`** - Semantic similarity search
   - Input: `query_embedding`, `match_threshold`, `match_count`, `filter_user_id`
   - Output: Ranked chunks with similarity scores

2. **`hybrid_search`** - Combined semantic + keyword
   - Input: `query_embedding`, `query_text`, weights, filters
   - Output: Chunks ranked by hybrid score

3. **`get_related_chunks`** - Surrounding context
   - Input: `source_chunk_id`, `context_window`
   - Output: Chunks before and after source

4. **`search_with_sources`** - Search with formatted references
   - Input: `query_embedding`, filters
   - Output: Results with JSONB source references

## 🔒 Security & Privacy

- ✅ All searches respect user isolation via RLS policies
- ✅ Filters by `user_id` to prevent data leakage
- ✅ API validates input with Zod schemas
- ✅ Error messages don't expose sensitive data
- ✅ OpenAI API key stored securely in env vars

## 📊 Performance Optimizations

1. **Batch Processing** - Embeddings generated in batches of 100
2. **Context Truncation** - Respects `maxContextLength` to avoid token limits
3. **Early Termination** - Stops processing when context is full
4. **Index Usage** - Leverages pgvector IVFFlat index
5. **Caching** - Optional embedding caching (24h TTL)

## 🐛 Error Handling

All functions include comprehensive error handling:

- ✅ OpenAI API errors with status codes
- ✅ Database errors with descriptive messages
- ✅ Input validation with Zod
- ✅ Empty result handling
- ✅ Token limit warnings

## 🧩 Type Safety

All functions are fully typed using:

- `/types/document.ts` - Document and chunk types
- `/types/openai.ts` - OpenAI API types
- Zod schemas for runtime validation
- Explicit return types

## 🔗 Integration Points

### In Chat API

```typescript
// app/api/chat/route.ts
import { retrieveContext, buildRAGPrompt } from '@/lib/rag';

export async function POST(request: Request) {
  const { message, userId } = await request.json();

  // 1. Retrieve relevant context
  const { context, sources } = await retrieveContext(message, {
    filters: { userId },
  });

  // 2. Build prompt
  const messages = buildRAGPrompt(message, context, sources);

  // 3. Call OpenAI with context
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  return Response.json({ answer: completion.choices[0].message.content, sources });
}
```

### In Document Processing

```typescript
// After chunking documents
import { generateBatchEmbeddings } from '@/lib/rag';

const chunks = chunkDocument(document);
const embeddings = await generateBatchEmbeddings(
  chunks.map(c => c.content)
);

// Store chunks with embeddings in Supabase
```

## 📈 Next Steps

1. **Enable Hybrid Search** - Set `enableHybridSearch: true` in config
2. **Add Caching** - Implement Redis for embedding cache
3. **Implement Reranking** - Add cross-encoder for result reranking
4. **Query Expansion** - Use query refinement for better results
5. **Analytics** - Track search quality and performance

## 🤝 Contributing

When modifying RAG components:

1. Update types in `/types/`
2. Update config in `/config/ai.ts`
3. Add tests for new functions
4. Update this README with examples

## 📚 References

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-databases)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
