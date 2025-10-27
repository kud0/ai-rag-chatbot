import type { default as PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

// Dynamic import for pdf-parse (CommonJS module)
let pdf: typeof PDFParse;
async function loadPDFParser() {
  if (!pdf) {
    const module = await import('pdf-parse');
    pdf = module.default;
  }
  return pdf;
}
import { FileType } from '@/lib/utils/file';

/**
 * Parse result interface
 */
export interface ParseResult {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    charCount: number;
  };
}

/**
 * Parse error class
 */
export class ParseError extends Error {
  constructor(message: string, public fileType: FileType) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Parse PDF file
 */
async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  try {
    const pdfParser = await loadPDFParser();
    const data = await pdfParser(buffer);

    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        charCount: data.text.length,
      },
    };
  } catch (error) {
    throw new ParseError(
      `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'pdf'
    );
  }
}

/**
 * Parse DOCX file
 */
async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        charCount: text.length,
      },
    };
  } catch (error) {
    throw new ParseError(
      `Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'docx'
    );
  }
}

/**
 * Parse plain text file
 */
async function parseText(buffer: Buffer): Promise<ParseResult> {
  try {
    const text = buffer.toString('utf-8');

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        charCount: text.length,
      },
    };
  } catch (error) {
    throw new ParseError(
      `Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'text'
    );
  }
}

/**
 * Parse Markdown file
 */
async function parseMarkdown(buffer: Buffer): Promise<ParseResult> {
  try {
    const text = buffer.toString('utf-8');

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        charCount: text.length,
      },
    };
  } catch (error) {
    throw new ParseError(
      `Failed to parse Markdown file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'markdown'
    );
  }
}

/**
 * Main parser function - routes to appropriate parser based on file type
 */
export async function parseDocument(
  buffer: Buffer,
  fileType: FileType
): Promise<ParseResult> {
  switch (fileType) {
    case 'pdf':
      return parsePDF(buffer);
    case 'docx':
      return parseDOCX(buffer);
    case 'text':
      return parseText(buffer);
    case 'markdown':
      return parseMarkdown(buffer);
    default:
      throw new ParseError(`Unsupported file type: ${fileType}`, fileType);
  }
}

/**
 * Clean extracted text
 * - Remove excessive whitespace
 * - Normalize line breaks
 * - Remove control characters
 */
export function cleanText(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/ +/g, ' ')
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, '\n\n')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace from start and end
    .trim();
}
