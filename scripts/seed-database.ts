#!/usr/bin/env tsx

// @ts-nocheck

/**
 * Seed Database Script
 *
 * This script seeds the database with demo documentation for the AI RAG chatbot.
 * It processes markdown files from src/seed-data/documents/ and creates:
 * - Document records
 * - Document chunks with embeddings
 * - Vector embeddings for semantic search
 *
 * Usage:
 *   npm run seed
 *   # or with tsx directly:
 *   tsx scripts/seed-database.ts
 *
 * Environment Requirements:
 *   - OPENAI_API_KEY: For generating embeddings
 *   - SUPABASE_URL: Database connection
 *   - SUPABASE_ANON_KEY: Database authentication
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { chunkText } from '../lib/documents/chunker';
import { generateEmbeddings } from '../lib/documents/embedder';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

// Log helpers
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg: string) => console.log(`${colors.cyan}▸${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`),
};

// Configuration
const DOCUMENTS_DIR = join(process.cwd(), 'src/seed-data/documents');
const DEMO_USER_EMAIL = 'demo@demo.com';
const DEMO_USER_PASSWORD = '123456';

// Supabase client initialization
function initSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create or get demo user
 */
async function ensureDemoUser(supabase: ReturnType<typeof createClient>): Promise<string> {
  log.step('Creating/fetching demo user...');

  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
    });

    if (signInData.user) {
      log.success(`Demo user exists: ${DEMO_USER_EMAIL}`);
      return signInData.user.id;
    }

    // If sign in fails, create new user
    if (signInError) {
      log.info('Demo user not found, creating new user...');

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: DEMO_USER_EMAIL,
        password: DEMO_USER_PASSWORD,
        options: {
          data: {
            full_name: 'Demo User',
            avatar_url: null,
          },
        },
      });

      if (signUpError) {
        throw new Error(`Failed to create demo user: ${signUpError.message}`);
      }

      if (!signUpData.user) {
        throw new Error('No user returned after signup');
      }

      log.success(`Created demo user: ${DEMO_USER_EMAIL}`);
      return signUpData.user.id;
    }

    throw new Error('Unexpected error during user authentication');
  } catch (error) {
    throw new Error(
      `Failed to ensure demo user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Read all markdown files from documents directory
 */
async function readDocumentFiles(): Promise<Array<{ filename: string; title: string; content: string }>> {
  log.step('Reading document files...');

  try {
    const files = await readdir(DOCUMENTS_DIR);
    const markdownFiles = files.filter(f => f.endsWith('.md'));

    log.info(`Found ${markdownFiles.length} markdown files`);

    const documents = await Promise.all(
      markdownFiles.map(async filename => {
        const filepath = join(DOCUMENTS_DIR, filename);
        const content = await readFile(filepath, 'utf-8');

        // Extract title from first heading or filename
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : filename.replace('.md', '').replace(/-/g, ' ');

        return {
          filename,
          title,
          content,
        };
      })
    );

    log.success(`Read ${documents.length} documents`);
    return documents;
  } catch (error) {
    throw new Error(
      `Failed to read document files: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clean existing seed data (optional)
 */
async function cleanExistingData(supabase: ReturnType<typeof createClient>, userId: string) {
  log.step('Cleaning existing seed data...');

  try {
    // Get all documents for the demo user
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id')
      .eq('user_id', userId);

    if (fetchError) {
      log.warning(`Could not fetch existing documents: ${fetchError.message}`);
      return;
    }

    if (!documents || documents.length === 0) {
      log.info('No existing documents to clean');
      return;
    }

    const documentIds = documents.map(d => d.id);

    // Delete chunks first (foreign key constraint)
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .in('document_id', documentIds);

    if (chunksError) {
      log.warning(`Could not delete existing chunks: ${chunksError.message}`);
    }

    // Delete documents
    const { error: docsError } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', userId);

    if (docsError) {
      log.warning(`Could not delete existing documents: ${docsError.message}`);
    } else {
      log.success(`Deleted ${documents.length} existing documents`);
    }
  } catch (error) {
    log.warning(
      `Error cleaning existing data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process and save a single document
 */
async function processDocument(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  doc: { filename: string; title: string; content: string }
): Promise<void> {
  log.step(`Processing: ${doc.title}`);

  try {
    // Save document to database
    const { data: document, error: docError} = await supabase
      .from('documents')
      .insert({
        title: doc.title,
        content: doc.content,
        user_id: userId,
        file_name: doc.filename,
        file_type: 'text/markdown',
        file_size: Buffer.byteLength(doc.content, 'utf-8'),
        metadata: {
          source: 'seed-data',
          originalFilename: doc.filename,
        },
      })
      .select('id')
      .single();

    if (docError) {
      throw new Error(`Failed to save document: ${docError.message}`);
    }

    if (!document) {
      throw new Error('No document returned after insert');
    }

    const documentId = document.id;
    log.info(`  Created document: ${documentId}`);

    // Chunk the document
    const chunks = chunkText(doc.content);
    log.info(`  Generated ${chunks.length} chunks`);

    // Generate embeddings for chunks
    const chunkTexts = chunks.map(c => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);
    log.info(`  Generated ${embeddings.length} embeddings`);

    // Prepare chunk data
    const chunkData = chunks.map((chunk, index) => ({
      document_id: documentId,
      content: chunk.content,
      embedding: JSON.stringify(embeddings[index].embedding), // pgvector needs string format
      chunk_index: chunk.metadata.chunkIndex,
      token_count: chunk.metadata.tokenCount,
      metadata: {
        totalChunks: chunk.metadata.totalChunks,
        startOffset: chunk.metadata.startOffset,
        endOffset: chunk.metadata.endOffset,
        documentTitle: doc.title,
        fileName: doc.filename,
        source: 'seed-data',
      },
    }));

    // Insert chunks in batches
    const batchSize = 50;
    for (let i = 0; i < chunkData.length; i += batchSize) {
      const batch = chunkData.slice(i, i + batchSize);

      const { error: chunkError } = await supabase.from('document_chunks').insert(batch);

      if (chunkError) {
        throw new Error(`Failed to save chunks: ${chunkError.message}`);
      }

      log.info(`  Saved chunks ${i + 1}-${Math.min(i + batchSize, chunkData.length)}`);
    }

    log.success(`  ✓ Completed: ${doc.title}`);
  } catch (error) {
    log.error(
      `  Failed to process ${doc.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

/**
 * Display summary statistics
 */
async function displaySummary(supabase: ReturnType<typeof createClient>, userId: string) {
  log.title('📊 Seed Summary');

  try {
    // Count documents
    const { count: docCount, error: docError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (docError) {
      log.warning(`Could not count documents: ${docError.message}`);
    } else {
      log.info(`Total documents: ${docCount || 0}`);
    }

    // Count chunks
    const { data: documents } = await supabase
      .from('documents')
      .select('id')
      .eq('user_id', userId);

    if (documents && documents.length > 0) {
      const documentIds = documents.map(d => d.id);

      const { count: chunkCount, error: chunkError } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .in('document_id', documentIds);

      if (chunkError) {
        log.warning(`Could not count chunks: ${chunkError.message}`);
      } else {
        log.info(`Total chunks: ${chunkCount || 0}`);
      }
    }

    log.info(`Demo user: ${DEMO_USER_EMAIL}`);
    log.info(`Password: ${DEMO_USER_PASSWORD}`);
  } catch (error) {
    log.warning(
      `Error displaying summary: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();

  log.title('🌱 Seeding Database with Demo Documents');

  try {
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    // Initialize Supabase
    log.step('Initializing Supabase client...');
    const supabase = initSupabase();
    log.success('Supabase initialized');

    // Ensure demo user exists
    const userId = await ensureDemoUser(supabase);

    // Clean existing data
    await cleanExistingData(supabase, userId);

    // Read document files
    const documents = await readDocumentFiles();

    // Process each document
    log.title('📄 Processing Documents');
    for (const doc of documents) {
      await processDocument(supabase, userId, doc);
    }

    // Display summary
    await displaySummary(supabase, userId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.title(`✅ Seeding completed successfully in ${duration}s`);
    log.info('\nYou can now:');
    log.info('1. Sign in with the demo user credentials');
    log.info('2. Try asking questions about Next.js, React, TypeScript, RAG, etc.');
    log.info('3. Test the semantic search and chat functionality\n');

    process.exit(0);
  } catch (error) {
    log.error(
      `\n❌ Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`
    );

    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run the script
main();
