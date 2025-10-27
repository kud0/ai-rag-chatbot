# Document Ingestion Pipeline Implementation

## Overview
A complete document ingestion and embedding pipeline for the RAG chatbot, supporting PDF, TXT, MD, and DOCX files.

## Files Created

### 1. Document Processing Library (`/lib/documents/`)

#### `/lib/documents/parser.ts`
**Purpose**: Extract text from different file formats
**Key Functions**:
- `parseDocument(buffer, fileType)` - Main parser function that routes to specific parsers
- `parsePDF(buffer)` - Extract text from PDF using pdf-parse
- `parseDOCX(buffer)` - Extract text from DOCX using mammoth
- `parseText(buffer)` - Parse plain text files
- `parseMarkdown(buffer)` - Parse Markdown files
- `cleanText(text)` - Clean and normalize extracted text

**Features**:
- Supports PDF, DOCX, TXT, MD formats
- Returns text with metadata (page count, word count, char count)
- Error handling with custom ParseError class
- Text cleaning utilities

#### `/lib/documents/chunker.ts`
**Purpose**: Split documents into chunks for embedding
**Key Functions**:
- `chunkText(text, options)` - Main chunking function
- `findBestSplitPoint(text, start, end, separators)` - Smart text splitting at natural boundaries
- `combineSmallChunks(chunks, minSize)` - Merge chunks that are too small
- `validateChunks(chunks)` - Validate chunk structure

**Features**:
- Token-based chunking (512 tokens per chunk from config)
- 50 token overlap between chunks
- Smart splitting at natural boundaries (paragraphs, sentences, words)
- Respects min/max chunk size limits
- Includes chunk metadata (index, offset, token count)

#### `/lib/documents/embedder.ts`
**Purpose**: Generate embeddings via OpenAI API
**Key Functions**:
- `generateEmbedding(text)` - Generate embedding for single text
- `generateEmbeddings(texts)` - Batch generate embeddings (up to 100 at a time)
- `cosineSimilarity(a, b)` - Calculate similarity between embeddings
- `isValidEmbedding(embedding)` - Validate embedding vector

**Features**:
- Uses text-embedding-3-small model (1536 dimensions)
- Batch processing for efficiency (100 texts per batch)
- Automatic retry with exponential backoff
- Embedding validation
- Token usage tracking

#### `/lib/documents/storage.ts`
**Purpose**: Save documents and chunks to Supabase
**Key Functions**:
- `saveDocument(data)` - Save document to database
- `saveDocumentChunks(documentId, chunks)` - Save chunks with embeddings
- `getDocument(documentId)` - Get single document
- `getDocumentsByUser(userId)` - Get all user's documents
- `getDocumentChunks(documentId)` - Get document's chunks
- `deleteDocument(documentId)` - Soft delete document
- `reindexDocument(documentId, chunks)` - Regenerate embeddings

**Features**:
- Batch insertion of chunks (50 at a time)
- Soft delete for documents
- Ownership verification
- Error handling with custom StorageError class

### 2. Utility Libraries (`/lib/utils/`)

#### `/lib/utils/tokens.ts`
**Purpose**: Token counting and management using tiktoken
**Key Functions**:
- `countTokens(text)` - Count tokens in text
- `truncateToTokenLimit(text, maxTokens)` - Truncate text to token limit
- `splitTextByTokens(text, maxTokens, overlap)` - Split text by token count
- `estimateEmbeddingCost(tokenCount)` - Estimate API cost

**Features**:
- Uses cl100k_base encoding (GPT-4/GPT-3.5 compatible)
- Lazy encoder initialization
- Fallback to character-based estimation
- Cost calculation for embeddings

#### `/lib/utils/file.ts`
**Purpose**: File type detection and validation
**Key Functions**:
- `isSupportedMimeType(mimeType)` - Check if MIME type is supported
- `getFileType(mimeType)` - Get file type from MIME type
- `detectFileTypeFromExtension(filename)` - Detect type from extension
- `validateFileSize(size, maxSize)` - Validate file size
- `formatFileSize(bytes)` - Format size for display
- `sanitizeFilename(filename)` - Generate safe filename
- `validateFile(file, maxSize)` - Complete file validation

**Supported Types**:
- `application/pdf` → PDF
- `text/plain` → TXT
- `text/markdown` → MD
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → DOCX

### 3. API Route (`/app/api/documents/upload/route.ts`)

**Endpoints**:

#### POST `/api/documents/upload`
Upload and process a document

**Request**: `multipart/form-data` with `file` field

**Response**:
```json
{
  "success": true,
  "documentId": "uuid",
  "metadata": {
    "fileName": "document.pdf",
    "fileSize": 1234567,
    "mimeType": "application/pdf",
    "wordCount": 5000,
    "charCount": 30000,
    "pageCount": 10,
    "chunkCount": 25
  }
}
```

**Process Flow**:
1. Authenticate user
2. Validate file (type, size)
3. Parse document
4. Clean extracted text
5. Save document to database
6. Chunk text
7. Generate embeddings
8. Save chunks to database
9. Return document ID and metadata

#### GET `/api/documents/upload`
Get upload configuration

**Response**:
```json
{
  "maxFileSize": 5242880,
  "maxContentLength": 1000000,
  "allowedMimeTypes": ["text/plain", "text/markdown", "application/pdf"],
  "supportedFormats": ["PDF", "TXT", "MD", "DOCX"]
}
```

### 4. Server Actions (`/app/actions/documents.ts`)

**Available Actions**:

#### `uploadDocument(formData)`
Upload a document via the API
- Returns: `{ success: true, data: { documentId } }` or error

#### `getDocuments()`
Get all user's documents
- Returns: Array of documents with metadata

#### `getDocumentById(documentId)`
Get single document by ID
- Verifies ownership
- Returns: Document object or error

#### `getChunks(documentId)`
Get document's chunks
- Verifies ownership
- Returns: Array of chunks with embeddings

#### `deleteDocument(documentId)`
Delete a document (soft delete)
- Verifies ownership
- Deletes associated chunks
- Revalidates cache

#### `reindexDocument(documentId)`
Regenerate chunks and embeddings
- Verifies ownership
- Re-chunks content
- Generates new embeddings
- Useful when changing chunk settings

#### `processText(params)`
Process text directly without file upload
- Accepts: `{ title, content, fileType }`
- Useful for pasted text or API imports

## Database Schema Requirements

### `documents` Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_is_active ON documents(is_active);
```

### `document_chunks` Table
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Dependencies Installed

```bash
npm install pdf-parse mammoth tiktoken
```

### Package Details:
- **pdf-parse** (v1.1.1): Extract text from PDF files
- **mammoth** (v1.6.0): Extract text from DOCX files
- **tiktoken** (v1.0.7): OpenAI's token counting library

## Configuration

All settings are defined in `/config/ai.ts`:

```typescript
// Chunking settings
CHUNKING_CONFIG = {
  chunkSize: 512,           // tokens per chunk
  chunkOverlap: 50,         // overlap between chunks
  separators: ['\n\n', '\n', '. ', ' '],
  minChunkSize: 100,
  maxChunkSize: 1000,
}

// Document limits
DOCUMENT_LIMITS = {
  maxFileSize: 5 * 1024 * 1024,  // 5MB
  maxContentLength: 1_000_000,    // 1M characters
  allowedMimeTypes: ['text/plain', 'text/markdown', 'application/pdf']
}

// Embedding settings
EMBEDDING_MODEL = 'text-embedding-3-small'
EMBEDDING_DIMENSIONS = 1536
```

## Usage Examples

### 1. Upload Document via API
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData,
});

const { documentId, metadata } = await response.json();
```

### 2. Use Server Actions
```typescript
import { uploadDocument, getDocuments, deleteDocument } from '@/app/actions/documents';

// Upload
const result = await uploadDocument(formData);
if (result.success) {
  console.log('Document ID:', result.data.documentId);
}

// List documents
const docs = await getDocuments();
if (docs.success) {
  console.log('Documents:', docs.data);
}

// Delete
await deleteDocument(documentId);
```

### 3. Direct Text Processing
```typescript
import { processText } from '@/app/actions/documents';

const result = await processText({
  title: 'My Notes',
  content: 'This is my document content...',
  fileType: 'text',
});
```

## Error Handling

All functions include comprehensive error handling:

1. **ParseError**: File parsing failures
2. **StorageError**: Database operation failures
3. **Validation errors**: File type, size, format issues
4. **Authentication errors**: Unauthorized access
5. **OpenAI API errors**: Embedding generation failures

## Performance Considerations

1. **Batch Processing**: Chunks are processed in batches of 50-100
2. **Token Counting**: Uses efficient tiktoken library
3. **Smart Chunking**: Splits at natural boundaries (paragraphs, sentences)
4. **Lazy Initialization**: Encoder initialized only when needed
5. **Progress Tracking**: Metadata includes chunk counts and processing stats

## Next Steps

To complete the RAG pipeline, you'll need to:

1. Create the database tables (documents, document_chunks)
2. Enable pgvector extension in Supabase
3. Set up OPENAI_API_KEY environment variable
4. Implement vector search functionality
5. Create UI components for document upload
6. Add progress indicators for large files

## Testing

Test the pipeline with:

```typescript
// Test file upload
const file = new File(['Hello world'], 'test.txt', { type: 'text/plain' });
const formData = new FormData();
formData.append('file', file);
const result = await uploadDocument(formData);

// Test chunking
import { chunkText } from '@/lib/documents/chunker';
const chunks = chunkText('Your long document text here...');

// Test token counting
import { countTokens } from '@/lib/utils/tokens';
const tokens = countTokens('Your text here');
```

## File Paths Summary

```
/lib/documents/parser.ts       - Document parsing
/lib/documents/chunker.ts      - Text chunking
/lib/documents/embedder.ts     - Embedding generation
/lib/documents/storage.ts      - Database operations
/lib/utils/tokens.ts           - Token counting
/lib/utils/file.ts             - File validation
/app/api/documents/upload/route.ts - Upload API
/app/actions/documents.ts      - Server actions
```
