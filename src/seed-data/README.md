# Seed Data for AI RAG Chatbot

This directory contains demo documentation and seed scripts for the AI RAG (Retrieval Augmented Generation) chatbot showcase.

## Overview

The seed data provides realistic documentation content that clients can use to test the chatbot's capabilities. The demo covers popular web development topics including Next.js, React, TypeScript, and AI/RAG concepts.

## Demo Documents

The `/documents` directory contains 7 comprehensive documentation files:

1. **nextjs-routing.md** - Complete guide to Next.js App Router
   - File-system routing
   - Dynamic routes
   - Layouts and loading states
   - Server and Client Components

2. **react-server-components.md** - React Server Components explained
   - Server vs Client Components
   - Data fetching patterns
   - Composition patterns
   - Best practices

3. **typescript-basics.md** - TypeScript essentials
   - Basic types and interfaces
   - Generics and utility types
   - Classes and type guards
   - Best practices

4. **rag-concepts.md** - RAG (Retrieval Augmented Generation) guide
   - Complete RAG pipeline
   - Embeddings and vector search
   - Advanced RAG patterns
   - Evaluation metrics

5. **vector-databases.md** - Vector database overview
   - How vector databases work
   - Distance metrics and indexing
   - Popular solutions (Pinecone, Supabase, etc.)
   - Performance optimization

6. **openai-api.md** - OpenAI API developer guide
   - Chat completions
   - Embeddings generation
   - Function calling
   - Best practices

7. **supabase-auth.md** - Supabase authentication guide
   - Email/password auth
   - OAuth providers
   - Session management
   - Row Level Security (RLS)

Each document is:
- **500-1500 words** of realistic, useful content
- **Markdown formatted** with code examples
- **Educational** - covers common questions
- **Production-ready** - actual documentation quality

## Seed Script

The `seed-database.ts` script automates the ingestion of demo documents into your database.

### What It Does

1. **Creates Demo User**
   - Email: `demo@example.com`
   - Password: `demo-password-123`
   - Or uses existing demo user if found

2. **Cleans Existing Data** (optional)
   - Removes previous seed data
   - Prevents duplicate documents

3. **Processes Documents**
   - Reads all markdown files from `/documents`
   - Extracts titles and content
   - Creates document records in database

4. **Generates Chunks**
   - Splits documents into optimal chunks
   - Typically 512 tokens per chunk
   - 50 tokens overlap for context

5. **Creates Embeddings**
   - Generates vector embeddings using OpenAI
   - Uses `text-embedding-3-small` model
   - Stores in Supabase pgvector

6. **Provides Summary**
   - Shows total documents and chunks created
   - Displays demo user credentials
   - Reports execution time

## Running the Seed Script

### Prerequisites

Make sure you have the required environment variables set:

```bash
# Required for embeddings
OPENAI_API_KEY=your_openai_api_key

# Required for database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For service key access (better for seeding)
SUPABASE_SERVICE_KEY=your_service_key
```

### Install Dependencies

First, make sure you have `tsx` installed:

```bash
npm install
```

### Run the Script

Execute the seed script:

```bash
npm run seed
```

Or directly with tsx:

```bash
npx tsx scripts/seed-database.ts
```

### Expected Output

```
🌱 Seeding Database with Demo Documents

ℹ Initializing Supabase client...
✓ Supabase initialized
▸ Creating/fetching demo user...
✓ Demo user exists: demo@example.com
▸ Cleaning existing seed data...
✓ Deleted 7 existing documents
▸ Reading document files...
ℹ Found 7 markdown files
✓ Read 7 documents

📄 Processing Documents

▸ Processing: Next.js App Router: Complete Guide
ℹ   Created document: 123e4567-e89b-12d3-a456-426614174000
ℹ   Generated 12 chunks
ℹ   Generated 12 embeddings
ℹ   Saved chunks 1-12
✓   ✓ Completed: Next.js App Router: Complete Guide

[... other documents ...]

📊 Seed Summary

ℹ Total documents: 7
ℹ Total chunks: 78
ℹ Demo user: demo@example.com
ℹ Password: demo-password-123

✅ Seeding completed successfully in 45.32s

You can now:
1. Sign in with the demo user credentials
2. Try asking questions about Next.js, React, TypeScript, RAG, etc.
3. Test the semantic search and chat functionality
```

## Testing the Seeded Data

After seeding, you can test the chatbot:

### Example Questions

Try asking these questions to see the RAG system in action:

**Next.js Questions:**
- "How do I create dynamic routes in Next.js?"
- "What's the difference between server and client components?"
- "How do layouts work in the App Router?"

**React Questions:**
- "When should I use Server Components?"
- "How do I handle streaming with Suspense?"
- "What are the benefits of Server Components?"

**TypeScript Questions:**
- "How do I create a generic function in TypeScript?"
- "What are utility types?"
- "Explain TypeScript interfaces vs type aliases"

**RAG/AI Questions:**
- "What is Retrieval Augmented Generation?"
- "How does vector similarity search work?"
- "What embedding models does OpenAI provide?"

**Database Questions:**
- "What are vector databases used for?"
- "How does HNSW indexing work?"
- "Compare Pinecone vs Supabase pgvector"

**Authentication Questions:**
- "How do I implement OAuth with Supabase?"
- "What is Row Level Security?"
- "How do I enable multi-factor authentication?"

### Viewing Documents

1. Sign in with the demo user credentials
2. Navigate to the documents page
3. View uploaded documents and their chunks
4. See embedding statistics

## Resetting the Database

To clean the database and re-seed:

```bash
# Simply run seed again - it cleans existing data automatically
npm run seed
```

Or manually delete data:

```sql
-- Delete all chunks for demo user's documents
DELETE FROM document_chunks
WHERE document_id IN (
  SELECT id FROM documents
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@example.com')
);

-- Delete all documents for demo user
DELETE FROM documents
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@example.com');
```

## Customizing Demo Content

### Adding More Documents

1. Create a new `.md` file in `/documents`
2. Add a title (first `# Heading`)
3. Write realistic content (500-1500 words)
4. Run `npm run seed` to process it

### Modifying Existing Documents

1. Edit any file in `/documents`
2. Run `npm run seed` to update
3. The script will regenerate chunks and embeddings

### Changing Demo User

Edit `scripts/seed-database.ts`:

```typescript
const DEMO_USER_EMAIL = 'your-email@example.com';
const DEMO_USER_PASSWORD = 'your-password';
```

## Troubleshooting

### Error: "OPENAI_API_KEY environment variable is not set"

Make sure your `.env.local` file contains:
```bash
OPENAI_API_KEY=sk-...
```

### Error: "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL"

Ensure your Supabase environment variables are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Error: "Failed to generate embedding"

- Check your OpenAI API key is valid
- Verify you have sufficient credits
- Check rate limits on your OpenAI account

### Error: "Failed to save document"

- Verify database tables exist (run migrations)
- Check RLS policies allow insert operations
- Ensure SUPABASE_SERVICE_KEY is set for admin access

### Slow Embedding Generation

Embedding generation can take time:
- ~2-5 seconds per document
- Depends on document size and API response time
- Total time: 30-60 seconds for 7 documents

### Database Connection Issues

If you're behind a firewall or VPN:
- Check Supabase dashboard for connection issues
- Verify your IP is allowed in Supabase settings
- Try using service key instead of anon key

## Script Architecture

The seed script follows a clean architecture:

```
main()
  ├─ initSupabase()          // Initialize client
  ├─ ensureDemoUser()        // Create/fetch user
  ├─ cleanExistingData()     // Clean old seed data
  ├─ readDocumentFiles()     // Read markdown files
  ├─ processDocument()       // For each document:
  │   ├─ Save to database
  │   ├─ chunkText()         // Generate chunks
  │   ├─ generateEmbeddings() // Create vectors
  │   └─ Save chunks + embeddings
  └─ displaySummary()        // Show results
```

## Performance

Typical performance metrics:

- **7 documents**: ~45 seconds
- **78 chunks** generated
- **78 embeddings** created
- **~50,000 tokens** processed
- **Cost**: ~$0.01 per run (OpenAI embeddings)

## Production Considerations

When adapting for production:

1. **Batch Processing**: Process large document sets in batches
2. **Error Handling**: Add retry logic for API failures
3. **Progress Tracking**: Store processing state for resumption
4. **Validation**: Validate embeddings before storing
5. **Monitoring**: Log metrics and errors
6. **Rate Limiting**: Respect OpenAI rate limits
7. **Cost Tracking**: Monitor embedding costs

## Related Files

- `/scripts/seed-database.ts` - Main seed script
- `/lib/documents/chunker.ts` - Text chunking logic
- `/lib/documents/embedder.ts` - Embedding generation
- `/lib/documents/storage.ts` - Database operations
- `/types/document.ts` - TypeScript types

## Support

For issues or questions:
1. Check error messages in console output
2. Verify environment variables are set
3. Review Supabase logs in dashboard
4. Check OpenAI API usage and errors

---

**Happy Testing!** 🚀

Use this seed data to demonstrate the power of RAG-based chatbots to clients and stakeholders.
