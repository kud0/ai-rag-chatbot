# Vector Databases: Complete Guide

## Introduction to Vector Databases

Vector databases are specialized database systems designed to store, index, and query high-dimensional vector embeddings. Unlike traditional databases that store structured data in rows and columns, vector databases store numerical representations (embeddings) of unstructured data like text, images, audio, and video, enabling semantic search and similarity matching.

## Why Vector Databases?

### The Problem with Traditional Databases

Traditional databases excel at exact matching:
```sql
SELECT * FROM products WHERE category = 'electronics'
```

But they struggle with:
- Finding similar items semantically
- Understanding context and meaning
- Ranking results by relevance
- Working with unstructured data

### The Vector Database Solution

Vector databases enable semantic search:
```typescript
// Find products similar to "wireless headphones for running"
const results = await vectorDB.query({
  vector: embedQuery("wireless headphones for running"),
  topK: 10
})
// Returns: Bluetooth earbuds, sports headphones, gym headphones, etc.
```

## How Vector Databases Work

### 1. Vector Embeddings

Convert data into numerical vectors:

```typescript
// Text embedding
const text = "Machine learning is fascinating"
const embedding = await embed(text)
// Result: [0.234, -0.891, 0.445, ..., 0.102] (1536 dimensions)

// Each dimension captures semantic meaning:
// - Dimension 42 might represent "technology"
// - Dimension 108 might represent "education"
// - Dimension 891 might represent "complexity"
```

### 2. Vector Storage

Store vectors with metadata:

```typescript
await vectorDB.upsert({
  id: "doc-123",
  values: [0.234, -0.891, ...], // 1536-dimensional vector
  metadata: {
    text: "Original text content",
    category: "technology",
    author: "John Doe",
    date: "2024-01-15"
  }
})
```

### 3. Similarity Search

Find similar vectors using distance metrics:

```typescript
const query = await embed("Tell me about AI")
const results = await vectorDB.query({
  vector: query,
  topK: 5,
  filter: { category: "technology" }
})
```

## Distance Metrics

Vector databases use various metrics to measure similarity:

### 1. Cosine Similarity

Measures angle between vectors (most common):

```typescript
// Cosine similarity: 1 = identical, 0 = orthogonal, -1 = opposite
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

**Best for**: Text embeddings, normalized vectors

### 2. Euclidean Distance

Measures straight-line distance:

```typescript
// Euclidean distance: 0 = identical, larger = more different
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  )
}
```

**Best for**: Spatial data, image embeddings

### 3. Dot Product

Measures vector alignment:

```typescript
// Dot product: larger = more similar
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0)
}
```

**Best for**: Pre-normalized embeddings

## Indexing Algorithms

Vector databases use specialized indexing for fast searches:

### 1. HNSW (Hierarchical Navigable Small World)

**How it works**:
- Builds a multi-layer graph
- Each node connected to nearby vectors
- Search starts at top layer, navigates down
- Fast and accurate

**Characteristics**:
- Query time: O(log n)
- Memory intensive
- Great for high-dimensional data
- 95-99% recall typical

**Use cases**: Real-time applications, high-accuracy needs

### 2. IVF (Inverted File Index)

**How it works**:
- Partitions space into clusters using k-means
- Each cluster has a centroid
- Searches nearest clusters only
- Trade-off between speed and accuracy

**Characteristics**:
- Query time: O(k + n/c) where k=clusters, c=cluster size
- Less memory than HNSW
- Tunable accuracy via nprobe parameter
- 80-95% recall typical

**Use cases**: Large datasets, balanced speed/accuracy

### 3. LSH (Locality-Sensitive Hashing)

**How it works**:
- Hashes similar vectors to same buckets
- Multiple hash functions for better coverage
- Probabilistic approximate matching

**Characteristics**:
- Query time: O(1) average case
- Lowest memory usage
- Lower accuracy
- 70-85% recall typical

**Use cases**: Massive scale, fuzzy matching

### 4. PQ (Product Quantization)

**How it works**:
- Compresses vectors into smaller representations
- Divides vector into subvectors
- Quantizes each subvector separately
- Trades accuracy for storage

**Characteristics**:
- 8-64x compression ratio
- Slightly lower accuracy
- Great for memory-constrained systems

**Use cases**: Mobile devices, edge computing

## Popular Vector Databases

### 1. Pinecone

**Type**: Managed cloud service

```typescript
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({ apiKey: 'your-key' })
const index = pinecone.index('my-index')

// Upsert vectors
await index.upsert([{
  id: 'doc1',
  values: [0.1, 0.2, 0.3, ...],
  metadata: { text: 'content' }
}])

// Query
const results = await index.query({
  vector: [0.1, 0.2, 0.3, ...],
  topK: 10,
  includeMetadata: true
})
```

**Pros**: Fully managed, easy to use, scalable
**Cons**: Cost, vendor lock-in

### 2. Supabase pgvector

**Type**: PostgreSQL extension

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Insert vector
await supabase.from('documents').insert({
  content: 'text content',
  embedding: [0.1, 0.2, 0.3, ...]
})

// Similarity search
const { data } = await supabase.rpc('match_documents', {
  query_embedding: [0.1, 0.2, 0.3, ...],
  match_threshold: 0.78,
  match_count: 10
})
```

**Pros**: PostgreSQL ecosystem, relational + vector, cost-effective
**Cons**: Self-hosted overhead (unless using Supabase cloud)

### 3. Weaviate

**Type**: Open-source, GraphQL API

```typescript
import weaviate from 'weaviate-ts-client'

const client = weaviate.client({
  scheme: 'https',
  host: 'your-weaviate-instance.com',
})

// Add object
await client.data.creator()
  .withClassName('Document')
  .withProperties({
    content: 'text content',
  })
  .withVector([0.1, 0.2, 0.3, ...])
  .do()

// Search
const result = await client.graphql
  .get()
  .withClassName('Document')
  .withNearVector({ vector: [0.1, 0.2, 0.3, ...] })
  .withLimit(10)
  .do()
```

**Pros**: Feature-rich, GraphQL, hybrid search
**Cons**: More complex setup

### 4. Qdrant

**Type**: Open-source, Rust-based

```typescript
import { QdrantClient } from '@qdrant/js-client-rest'

const client = new QdrantClient({ url: 'http://localhost:6333' })

// Create collection
await client.createCollection('my_collection', {
  vectors: { size: 1536, distance: 'Cosine' }
})

// Insert
await client.upsert('my_collection', {
  points: [{
    id: 1,
    vector: [0.1, 0.2, 0.3, ...],
    payload: { text: 'content' }
  }]
})

// Search
const results = await client.search('my_collection', {
  vector: [0.1, 0.2, 0.3, ...],
  limit: 10
})
```

**Pros**: High performance, filtering, payloads
**Cons**: Smaller community

### 5. Chroma

**Type**: Open-source, Python-first

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("my_collection")

# Add documents
collection.add(
    documents=["This is a document"],
    embeddings=[[0.1, 0.2, 0.3, ...]],
    ids=["id1"]
)

# Query
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3, ...]],
    n_results=10
)
```

**Pros**: Simple API, great for prototyping, local-first
**Cons**: Less production-ready than others

## Advanced Features

### 1. Filtering

Combine vector search with metadata filtering:

```typescript
const results = await vectorDB.query({
  vector: embedding,
  topK: 10,
  filter: {
    category: { $eq: "technology" },
    date: { $gte: "2024-01-01" },
    author: { $in: ["Alice", "Bob"] }
  }
})
```

### 2. Namespaces

Organize vectors into separate namespaces:

```typescript
// Insert into namespace
await index.namespace('production').upsert([...])

// Query specific namespace
await index.namespace('production').query({...})
```

### 3. Hybrid Search

Combine vector search with keyword search:

```typescript
const results = await vectorDB.hybridSearch({
  vector: embedding,
  keywords: ["machine learning", "AI"],
  alpha: 0.5, // 0.5 = equal weight to both
  topK: 10
})
```

### 4. Reranking

Rerank results with cross-encoder:

```typescript
// Initial retrieval
const candidates = await vectorDB.query({ topK: 100 })

// Rerank with cross-encoder
const reranked = await reranker.rank(query, candidates)
const finalResults = reranked.slice(0, 10)
```

## Performance Optimization

### 1. Batch Operations

Process multiple vectors at once:

```typescript
// Batch upsert (faster than individual inserts)
await vectorDB.upsert(vectors.map((v, i) => ({
  id: `doc-${i}`,
  values: v,
  metadata: {...}
})))
```

### 2. Indexing Parameters

Tune index parameters:

```typescript
// HNSW parameters
await vectorDB.createIndex({
  metric: 'cosine',
  parameters: {
    M: 16,              // Number of connections (higher = more accurate, slower)
    efConstruction: 64  // Construction time (higher = better quality, slower build)
  }
})

// Query parameters
const results = await vectorDB.query({
  vector: embedding,
  topK: 10,
  ef: 100 // Search quality (higher = more accurate, slower)
})
```

### 3. Dimension Reduction

Reduce vector dimensions:

```typescript
// Use smaller embedding model
const smallEmbedding = await embed(text, { model: 'text-embedding-3-small' }) // 1536 dims

// Or compress with PCA/t-SNE
const compressed = await pca(largeEmbedding, { dimensions: 512 })
```

### 4. Caching

Cache frequent queries:

```typescript
const cache = new Map()

async function cachedQuery(query: string) {
  if (cache.has(query)) {
    return cache.get(query)
  }

  const embedding = await embed(query)
  const results = await vectorDB.query({ vector: embedding })

  cache.set(query, results)
  return results
}
```

## Use Cases

### 1. Semantic Search

Find relevant documents by meaning:
```typescript
// User searches: "how to make pasta"
// Returns: cooking guides, recipe blogs, Italian food articles
```

### 2. Recommendation Systems

Find similar items:
```typescript
// User likes product A
// Return products with similar embeddings
```

### 3. Question Answering (RAG)

Retrieve relevant context:
```typescript
// Question: "What is machine learning?"
// Retrieve: ML definition, examples, use cases
// Generate: Answer using retrieved context
```

### 4. Duplicate Detection

Find near-duplicate content:
```typescript
// Find documents with >0.95 similarity
const duplicates = await findSimilar(threshold: 0.95)
```

### 5. Image Search

Search images by content:
```typescript
// Embed image
const imageEmbedding = await embedImage(image)

// Find similar images
const similar = await vectorDB.query({ vector: imageEmbedding })
```

## Best Practices

1. **Choose Right Metric**: Cosine for text, Euclidean for images
2. **Normalize Vectors**: For consistent similarity scores
3. **Use Metadata**: Add filters to narrow search space
4. **Batch Operations**: Bulk insert/query when possible
5. **Monitor Performance**: Track query latency and recall
6. **Tune Parameters**: Adjust indexing parameters for use case
7. **Regular Maintenance**: Rebuild indexes periodically
8. **Version Embeddings**: Track embedding model versions

## Comparison Matrix

| Feature | Pinecone | pgvector | Weaviate | Qdrant | Chroma |
|---------|----------|----------|----------|--------|--------|
| Deployment | Managed | Self/Cloud | Self/Cloud | Self/Cloud | Local/Self |
| Scalability | ★★★★★ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | ★★★☆☆ |
| Performance | ★★★★★ | ★★★☆☆ | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| Ease of Use | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★★ |
| Cost | $$$ | $ | $$ | $$ | Free |
| Production | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★☆☆ |

## Conclusion

Vector databases are essential infrastructure for modern AI applications. They enable semantic search, power recommendation systems, and make RAG applications possible. Choosing the right vector database depends on your requirements for scale, performance, cost, and operational complexity. Start with a managed solution like Pinecone for simplicity, or use pgvector if you're already on PostgreSQL. For maximum control and performance at scale, consider Qdrant or Weaviate.
