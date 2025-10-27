# Document Ingestion - Quick Reference

## Installation

```bash
npm install pdf-parse mammoth tiktoken
```

## Environment Variables

Add to `.env.local`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Key Imports

```typescript
// Document processing
import { parseDocument, cleanText } from '@/lib/documents/parser';
import { chunkText } from '@/lib/documents/chunker';
import { generateEmbedding, generateEmbeddings } from '@/lib/documents/embedder';
import { saveDocument, saveDocumentChunks } from '@/lib/documents/storage';

// Utilities
import { countTokens } from '@/lib/utils/tokens';
import { validateFile } from '@/lib/utils/file';

// Server actions
import { uploadDocument, getDocuments, deleteDocument } from '@/app/actions/documents';
```

## Quick Usage

### Upload a Document
```typescript
const formData = new FormData();
formData.append('file', file);
const result = await uploadDocument(formData);
```

### Process Text Directly
```typescript
const result = await processText({
  title: 'Document Title',
  content: 'Your text content here...',
});
```

### Get User's Documents
```typescript
const result = await getDocuments();
if (result.success) {
  const documents = result.data;
}
```

### Delete a Document
```typescript
await deleteDocument(documentId);
```

## API Endpoints

### Upload
```
POST /api/documents/upload
Content-Type: multipart/form-data
Body: { file: File }
```

### Configuration
```
GET /api/documents/upload
Returns: Upload limits and supported formats
```

## Supported File Types

| Format | MIME Type | Extension |
|--------|-----------|-----------|
| PDF | application/pdf | .pdf |
| Text | text/plain | .txt |
| Markdown | text/markdown | .md |
| Word | application/vnd.openxmlformats-officedocument.wordprocessingml.document | .docx |

## Configuration (config/ai.ts)

```typescript
CHUNKING_CONFIG = {
  chunkSize: 512,        // tokens per chunk
  chunkOverlap: 50,      // overlap between chunks
}

DOCUMENT_LIMITS = {
  maxFileSize: 5MB,
  maxContentLength: 1M characters,
}

EMBEDDING_MODEL = 'text-embedding-3-small'
EMBEDDING_DIMENSIONS = 1536
```

## Database Tables

### documents
- id (UUID, PK)
- title (TEXT)
- content (TEXT)
- user_id (UUID, FK)
- metadata (JSONB)
- is_active (BOOLEAN)
- created_at, updated_at

### document_chunks
- id (UUID, PK)
- document_id (UUID, FK)
- content (TEXT)
- embedding (vector(1536))
- metadata (JSONB)
- created_at

## Common Operations

### Parse a Document
```typescript
const buffer = Buffer.from(arrayBuffer);
const result = await parseDocument(buffer, 'pdf');
// result = { text, metadata: { pageCount, wordCount, charCount } }
```

### Chunk Text
```typescript
const chunks = chunkText(text);
// chunks = [{ content, metadata: { chunkIndex, tokenCount, ... } }]
```

### Generate Embedding
```typescript
const { embedding, tokenCount } = await generateEmbedding(text);
// embedding = [1536 dimensions]
```

### Count Tokens
```typescript
const tokens = countTokens(text);
```

## Error Handling

All functions return either:
```typescript
{ success: true, data: T }
// or
{ success: false, error: string }
```

Example:
```typescript
const result = await uploadDocument(formData);
if (!result.success) {
  console.error(result.error);
  return;
}
console.log('Document ID:', result.data.documentId);
```

## Cost Estimation

```typescript
import { estimateEmbeddingCost } from '@/lib/utils/tokens';

const tokens = countTokens(text);
const cost = estimateEmbeddingCost(tokens);
// text-embedding-3-small: $0.00002 per 1K tokens
```

## File Structure

```
lib/
├── documents/
│   ├── parser.ts      - Extract text from files
│   ├── chunker.ts     - Split text into chunks
│   ├── embedder.ts    - Generate embeddings
│   └── storage.ts     - Save to database
└── utils/
    ├── tokens.ts      - Token counting
    └── file.ts        - File validation

app/
├── api/documents/upload/
│   └── route.ts       - Upload endpoint
└── actions/
    └── documents.ts   - Server actions
```

## Testing Checklist

- [ ] Install dependencies: `npm install pdf-parse mammoth tiktoken`
- [ ] Set OPENAI_API_KEY in .env.local
- [ ] Create database tables (documents, document_chunks)
- [ ] Enable pgvector extension in Supabase
- [ ] Test file upload with different formats
- [ ] Verify chunks are created correctly
- [ ] Check embeddings are saved to database
- [ ] Test error handling (invalid files, large files)
- [ ] Test authentication/authorization

## Next Steps

1. Create database migration for tables
2. Build UI components for upload
3. Implement vector search for retrieval
4. Add progress indicators
5. Create document management page
