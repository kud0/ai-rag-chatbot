/**
 * File type detection and validation utilities
 */

export const SUPPORTED_FILE_TYPES = {
  'application/pdf': { ext: '.pdf', type: 'pdf' },
  'text/plain': { ext: '.txt', type: 'text' },
  'text/markdown': { ext: '.md', type: 'markdown' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: '.docx',
    type: 'docx'
  },
} as const;

export type SupportedMimeType = keyof typeof SUPPORTED_FILE_TYPES;
export type FileType = typeof SUPPORTED_FILE_TYPES[SupportedMimeType]['type'];

/**
 * Check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return mimeType in SUPPORTED_FILE_TYPES;
}

/**
 * Get file type from MIME type
 */
export function getFileType(mimeType: string): FileType | null {
  if (isSupportedMimeType(mimeType)) {
    return SUPPORTED_FILE_TYPES[mimeType].type;
  }
  return null;
}

/**
 * Detect file type from file extension
 */
export function detectFileTypeFromExtension(filename: string): FileType | null {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext) return null;

  for (const [, value] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (value.ext === ext) {
      return value.type;
    }
  }

  return null;
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate a safe filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^a-z0-9._-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Extract file extension
 */
export function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Validate file based on MIME type and size
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: FileType;
}

export function validateFile(
  file: { type: string; size: number; name: string },
  maxSize: number
): FileValidationResult {
  // Check MIME type
  if (!isSupportedMimeType(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, TXT, MD, DOCX`,
    };
  }

  // Check file size
  if (!validateFileSize(file.size, maxSize)) {
    return {
      valid: false,
      error: `File size must be between 1 byte and ${formatFileSize(maxSize)}`,
    };
  }

  const fileType = getFileType(file.type);
  if (!fileType) {
    return {
      valid: false,
      error: 'Could not determine file type',
    };
  }

  return {
    valid: true,
    fileType,
  };
}
