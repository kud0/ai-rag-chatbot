import { NextRequest, NextResponse } from 'next/server';
import { DOCUMENT_LIMITS } from '@/config/ai';
import { validateFile } from '@/lib/utils/file';
import { parseDocument, cleanText } from '@/lib/documents/parser';
import { chunkText } from '@/lib/documents/chunker';
import { saveDocument, saveDocumentChunks } from '@/lib/documents/storage';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/documents/upload
 * Upload and process a document
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(
      {
        type: file.type,
        size: file.size,
        name: file.name,
      },
      DOCUMENT_LIMITS.maxFileSize
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse document
    const parseResult = await parseDocument(buffer, validation.fileType!);

    // Clean extracted text
    const cleanedText = cleanText(parseResult.text);

    // Check content length
    if (cleanedText.length > DOCUMENT_LIMITS.maxContentLength) {
      return NextResponse.json(
        {
          error: `Document content exceeds maximum length of ${DOCUMENT_LIMITS.maxContentLength} characters`,
        },
        { status: 400 }
      );
    }

    // Save document to database
    const documentId = await saveDocument({
      title: file.name,
      content: cleanedText,
      userId: user.id,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    // Chunk the text
    const chunks = chunkText(cleanedText);

    // Save chunks with embeddings
    await saveDocumentChunks(
      documentId,
      file.name,
      chunks,
      {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        pageCount: parseResult.metadata.pageCount,
        wordCount: parseResult.metadata.wordCount,
      }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      documentId,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        wordCount: parseResult.metadata.wordCount,
        charCount: parseResult.metadata.charCount,
        pageCount: parseResult.metadata.pageCount,
        chunkCount: chunks.length,
      },
    });

  } catch (error) {
    console.error('Document upload error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upload document',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/upload
 * Get upload configuration
 */
export async function GET() {
  return NextResponse.json({
    maxFileSize: DOCUMENT_LIMITS.maxFileSize,
    maxContentLength: DOCUMENT_LIMITS.maxContentLength,
    allowedMimeTypes: DOCUMENT_LIMITS.allowedMimeTypes,
    supportedFormats: ['PDF', 'TXT', 'MD', 'DOCX'],
  });
}
