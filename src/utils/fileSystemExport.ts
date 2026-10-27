/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { FolderExportResult, QueueItem } from '../types';

/**
 * Checks if File System Access API (showDirectoryPicker) is supported
 */
/**
 * Checks if running inside an iframe (cross-origin or sandboxed)
 */
export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    // Thrown when cross-origin iframe security prevents accessing window.top
    return true;
  }
}

/**
 * Checks if File System Access API (showDirectoryPicker) is supported and permitted.
 * Browsers forbid showDirectoryPicker inside cross-origin or sandboxed iframes,
 * which causes immediate "The operation was aborted" DOMExceptions.
 */
export function isFileSystemAccessSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (isRunningInIframe()) return false;
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

/**
 * Trigger browser download for a single blob safely.
 * Keeps ObjectURL alive for 60 seconds so browser download manager doesn't throw ERR_ABORTED
 * or "The operation was aborted" on large files.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 60000);
}

/**
 * Download all completed EPUB files individually into a user-selected target folder.
 * 
 * 1. On desktop browsers supporting the File System Access API outside an iframe:
 *    Prompts the user to pick a target directory, then writes all converted files directly into it.
 * 
 * 2. In iframes, or on browsers without File System Access API (such as Firefox on Android or Safari):
 *    All converted EPUBs are packaged into a single folder ZIP archive (e.g. Converted_Comics_Folder.zip).
 *    Android prompts once for the destination folder, and all files are saved intact with no dropped files.
 */
export async function downloadAllToTargetFolder(
  items: QueueItem[],
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<FolderExportResult> {
  const completed = items.filter(i => i.status === 'done' && i.epubBlob);

  if (completed.length === 0) {
    return {
      supported: isFileSystemAccessSupported(),
      success: false,
      savedCount: 0,
      error: 'No converted EPUB files are ready to download.',
    };
  }

  // Path 1: Native File System Access API (showDirectoryPicker)
  // Only attempt if supported and not in an iframe
  if (isFileSystemAccessSupported()) {
    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<{
          name: string;
          getFileHandle: (name: string, opts?: { create: boolean }) => Promise<{
            createWritable: () => Promise<{
              write: (data: Blob) => Promise<void>;
              close: () => Promise<void>;
            }>;
          }>;
        }>;
      }).showDirectoryPicker({ mode: 'readwrite' });

      let savedCount = 0;
      for (const item of completed) {
        if (!item.epubBlob) continue;
        const filename = item.meta.outputFilename || `${item.name}.epub`;
        onProgress?.(savedCount + 1, completed.length, filename);

        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(item.epubBlob);
        await writable.close();

        savedCount++;
      }

      return {
        supported: true,
        success: true,
        savedCount,
        folderName: dirHandle.name,
      };
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      // User explicitly clicked "Cancel" on the native directory picker dialog
      if (error?.name === 'AbortError' || error?.message?.toLowerCase().includes('abort')) {
        return {
          supported: true,
          success: false,
          savedCount: 0,
          error: 'Folder selection was cancelled. Click "Download All" to try again.',
        };
      }
      console.warn('Directory Picker unavailable or denied, falling back to batch folder archive packaging:', err);
    }
  }

  // Path 2: Browser/Mobile/Iframe Fallback (Firefox Android, Safari, embedded preview)
  // Package all files into a clean folder archive so the browser prompts once and saves ALL files
  onProgress?.(1, completed.length, 'Packaging all EPUBs into target folder archive...');
  const batchZip = new JSZip();

  for (const item of completed) {
    if (!item.epubBlob) continue;
    const filename = item.meta.outputFilename || `${item.name}.epub`;
    batchZip.file(filename, item.epubBlob);
  }

  const zipBlob = await batchZip.generateAsync(
    {
      type: 'blob',
      compression: 'STORE', // already compressed epubs, store for maximum speed
    },
    metadata => {
      onProgress?.(
        Math.round((metadata.percent / 100) * completed.length),
        completed.length,
        `Building folder archive (${metadata.percent.toFixed(0)}%)...`
      );
    }
  );

  const folderArchiveName = completed.length === 1
    ? `${completed[0].meta.outputFilename}`
    : `Converted_Comics_Folder.zip`;

  triggerDownload(zipBlob, folderArchiveName);

  return {
    supported: isFileSystemAccessSupported(),
    success: true,
    savedCount: completed.length,
    folderName: folderArchiveName,
    fallbackUsed: true,
  };
}
