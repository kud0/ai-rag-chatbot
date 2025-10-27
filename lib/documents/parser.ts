import mammoth from 'mammoth';
import { FileType } from '@/lib/utils/file';

// Lazy load pdf-parse to avoid CommonJS import issues
let pdfParserModule: any = null;
async function loadPDFParser() {
  if (!pdfParserModule) {
    try {
      // pdf-parse is a CommonJS module, import it dynamically
      pdfParserModule = await import('pdf-parse') as any;
    } catch (error) {
      console.error('Failed to load pdf-parse module:', error);
      throw new Error('PDF parsing library could not be loaded');
    }
  }
  return pdfParserModule;
}

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
    const pdfModule = await loadPDFParser();

    if (!pdfModule) {
      throw new Error('PDF parser module is not properly initialized');
    }

    // pdf-parse exports a default function that can be called directly
    // Try to get the callable function from the module
    let parseFunction: any;

    // Debug: log what we have
    console.log('pdfModule.default type:', typeof pdfModule.default);
    console.log('pdfModule.default is:', pdfModule.default);
    if (pdfModule.default) {
      console.log('pdfModule.default keys:', Object.keys(pdfModule.default));
      console.log('pdfModule.default.default type:', typeof pdfModule.default.default);
    }

    // Check for default export first (most common)
    if (pdfModule.default) {
      if (typeof pdfModule.default === 'function') {
        parseFunction = pdfModule.default;
      } else if (typeof pdfModule.default.default === 'function') {
        parseFunction = pdfModule.default.default;
      }
    }

    // If no default, try the module itself
    if (!parseFunction && typeof pdfModule === 'function') {
      parseFunction = pdfModule;
    }

    if (!parseFunction) {
      throw new Error('Could not find callable PDF parser function');
    }

    const data = await parseFunction(buffer);
    const text = data.text || '';

    // Validate content is not empty
    if (!text.trim()) {
      throw new Error('PDF file appears to be empty or contains no extractable text');
    }

    return {
      text,
      metadata: {
        pageCount: data.numpages,
        wordCount: text.split(/\s+/).filter((w: string) => w.length > 0).length,
        charCount: text.length,
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
    const text = result.value || '';

    // Validate content is not empty
    if (!text.trim()) {
      throw new Error('DOCX file appears to be empty or contains no extractable text');
    }

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
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

    // Validate content is not empty
    if (!text.trim()) {
      throw new Error('Text file appears to be empty');
    }

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
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

    // Validate content is not empty
    if (!text.trim()) {
      throw new Error('Markdown file appears to be empty');
    }

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
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
