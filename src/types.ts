/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ComicMetadata {
  title: string;
  series?: string;
  number?: string;
  volume?: string;
  year?: string;
  genre?: string;
  writer?: string;
  penciller?: string;
  publisher?: string;
  summary?: string;
  language: string;
  manga?: string; // 'Yes', 'YesAndRightToLeft', 'No'
  pageCount: number;
  outputFilename: string;
  hasDetectedMetadata: boolean;
  isCustomized?: boolean;
}

export type QueueStatus = 'queued' | 'extracting' | 'processing' | 'packaging' | 'done' | 'error';

export interface QueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: QueueStatus;
  progress: number; // 0 - 100
  statusMessage: string;
  epubBlob?: Blob;
  epubSize?: number;
  meta: ComicMetadata;
  coverBlob?: Blob;
  coverUrl?: string;
  coverDimensions?: { width: number; height: number };
  errorMsg?: string;
  processingTimeMs?: number;
}

export interface ConversionOptions {
  direction: 'auto' | 'ltr' | 'rtl';
  layout: 'pre-paginated' | 'reflowable';
  maxRes: number; // 0 for original, or 1920, 1440, 1080
  colorMode: 'original' | 'grayscale';
  quality: number; // 0.85
}

export interface FolderExportResult {
  supported: boolean;
  success: boolean;
  savedCount: number;
  folderName?: string;
  fallbackUsed?: boolean;
  error?: string;
}
