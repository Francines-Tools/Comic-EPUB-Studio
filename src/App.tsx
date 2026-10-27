/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  FolderDown,
  Info,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileArchive,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { SettingsPanel } from './components/SettingsPanel';
import { DropZone } from './components/DropZone';
import { QueueItemCard } from './components/QueueItemCard';
import { BatchActionBar } from './components/BatchActionBar';
import { CoverPreviewModal } from './components/CoverPreviewModal';
import { MetadataEditorModal } from './components/MetadataEditorModal';
import { QueueItem, ConversionOptions, ComicMetadata } from './types';
import {
  peekComicCoverAndMeta,
  extractArchive,
  generateEpub,
} from './utils/comicConverter';
import { guessMetadataFromFilename } from './utils/filenameGuesser';
import { downloadAllToTargetFolder } from './utils/fileSystemExport';

export default function App() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [savingStatusText, setSavingStatusText] = useState('');
  const [inspectingItem, setInspectingItem] = useState<QueueItem | null>(null);
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  const [options, setOptions] = useState<ConversionOptions>({
    direction: 'auto',
    layout: 'pre-paginated',
    maxRes: 0,
    colorMode: 'original',
    quality: 0.85,
  });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 5000);
  };

  /**
   * Handle incoming CBZ/CBR files and generate instant cover thumbnail previews
   */
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const newQueueItems: QueueItem[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['cbz', 'cbr', 'zip', 'rar'].includes(ext)) {
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const guessed = guessMetadataFromFilename(file.name);

      // Create initial item placeholder prefilled with best guesses
      const placeholder: QueueItem = {
        id,
        file,
        name: file.name,
        size: file.size,
        status: 'queued',
        progress: 0,
        statusMessage: 'Reading cover & metadata...',
        meta: {
          ...guessed,
          title: guessed.title || file.name.replace(/\.[^/.]+$/, ''),
          language: guessed.language || 'en',
          outputFilename: guessed.outputFilename || `${(guessed.title || file.name.replace(/\.[^/.]+$/, '')).replace(/[\/\\?%*:|"<>]/g, '_')}.epub`,
          pageCount: 0,
          hasDetectedMetadata: false,
          isCustomized: false,
        },
      };

      newQueueItems.push(placeholder);
    }

    if (newQueueItems.length === 0) return;

    // Append to state
    setItems(prev => [...prev, ...newQueueItems]);

    // Asynchronously peek covers for each item
    for (const item of newQueueItems) {
      try {
        const peekResult = await peekComicCoverAndMeta(item.file);
        setItems(prev =>
          prev.map(i => {
            if (i.id !== item.id) return i;
            return {
              ...i,
              statusMessage: 'Ready to convert',
              meta: {
                ...i.meta,
                ...peekResult.meta,
              },
              coverBlob: peekResult.coverBlob,
              coverUrl: peekResult.coverUrl,
              coverDimensions: peekResult.coverDimensions,
            };
          })
        );
      } catch (err) {
        console.warn('Cover preview peek error:', err);
      }
    }
  };

  /**
   * Convert an individual item
   */
  const convertSingleItem = async (itemId: string) => {
    const target = items.find(i => i.id === itemId);
    if (!target) return;

    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, status: 'extracting', progress: 10, statusMessage: 'Extracting pages & cover image...' }
          : i
      )
    );

    const startTime = performance.now();

    try {
      // 1. Extract archive
      const extracted = await extractArchive(target.file, (percent, msg) => {
        setItems(prev =>
          prev.map(i => (i.id === itemId ? { ...i, progress: percent, statusMessage: msg } : i))
        );
      });

      // Update coverUrl if we got a fresh cover from extraction
      let coverUrl = target.coverUrl;
      let coverBlob = target.coverBlob;
      if (extracted.coverImage && !coverUrl) {
        coverBlob = extracted.coverImage.blob;
        coverUrl = URL.createObjectURL(extracted.coverImage.blob);
      }

      setItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                status: 'processing',
                progress: 45,
                statusMessage: 'Building EPUB 3 spine with cover metadata...',
                coverUrl,
                coverBlob,
                meta: {
                  ...i.meta,
                  pageCount: extracted.images.length,
                },
              }
            : i
        )
      );

      // 2. Build EPUB 3 with cover image embedded as official cover & thumbnail
      const epubBlob = await generateEpub(
        extracted,
        target.meta,
        options,
        (percent, msg) => {
          setItems(prev =>
            prev.map(i =>
              i.id === itemId ? { ...i, progress: percent, statusMessage: msg } : i
            )
          );
        }
      );

      const elapsed = Math.round(performance.now() - startTime);

      setItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                status: 'done',
                progress: 100,
                statusMessage: 'Done! Cover & thumbnail ready',
                epubBlob,
                epubSize: epubBlob.size,
                processingTimeMs: elapsed,
              }
            : i
        )
      );

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name === 'AbortError' || error?.message?.toLowerCase().includes('abort')) {
        console.warn('Conversion cancelled or aborted:', error?.message);
        return;
      }
      console.error('Conversion failed for item:', itemId, error);
      setItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                status: 'error',
                progress: 0,
                statusMessage: 'Error during conversion',
                errorMsg: error?.message || 'Archive processing failed',
              }
            : i
        )
      );
    }
  };

  /**
   * Convert all queued items
   */
  const handleConvertAll = async () => {
    setIsProcessing(true);
    const queuedItems = items.filter(i => i.status === 'queued' || i.status === 'error');

    for (const item of queuedItems) {
      await convertSingleItem(item.id);
    }

    setIsProcessing(false);
    showToast('Batch conversion complete! Ready to download.', 'success');
  };

  /**
   * Download all completed EPUBs to a target folder
   */
  const handleDownloadAllFolder = async () => {
    setIsSavingFolder(true);
    setSavingStatusText('Selecting target folder...');

    try {
      const result = await downloadAllToTargetFolder(items, (current, total, filename) => {
        setSavingStatusText(`Writing ${current} of ${total}: ${filename}...`);
      });

      if (result.success) {
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
        if (result.fallbackUsed) {
          showToast(
            `All ${result.savedCount} EPUB files downloaded together in folder archive "${result.folderName}"!`,
            'success'
          );
        } else if (result.folderName) {
          showToast(
            `Successfully saved ${result.savedCount} EPUB file${result.savedCount === 1 ? '' : 's'} directly to folder "${result.folderName}"!`,
            'success'
          );
        } else {
          showToast(
            `Downloaded all ${result.savedCount} EPUB files!`,
            'success'
          );
        }
      } else if (result.error) {
        showToast(result.error, 'info');
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name === 'AbortError' || error?.message?.toLowerCase().includes('abort')) {
        console.warn('Folder selection was aborted or cancelled:', error?.message);
        showToast('Folder selection was cancelled.', 'info');
        return;
      }
      console.error('Error saving files to target folder:', err);
      showToast('Error saving files to target folder.', 'error');
    } finally {
      setIsSavingFolder(false);
      setSavingStatusText('');
    }
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClearQueue = () => {
    setItems([]);
  };

  const handleSaveMetadata = (itemId: string, updatedMeta: ComicMetadata) => {
    setItems(prev =>
      prev.map(i => {
        if (i.id !== itemId) return i;
        const cleanTitle = updatedMeta.title.trim() || i.name.replace(/\.[^/.]+$/, '');
        const safeFilename = `${cleanTitle.replace(/[\/\\?%*:|"<>]/g, '_')}.epub`;
        return {
          ...i,
          meta: {
            ...i.meta,
            ...updatedMeta,
            title: cleanTitle,
            outputFilename: updatedMeta.outputFilename || safeFilename,
            isCustomized: true,
          },
        };
      })
    );
    showToast('Comic metadata updated.', 'success');
  };

  const handleCopyToAll = (field: keyof ComicMetadata, value: any) => {
    setItems(prev =>
      prev.map(i => ({
        ...i,
        meta: {
          ...i.meta,
          [field]: value,
          isCustomized: true,
        },
      }))
    );
  };

  const handleCopyAllCommonFields = (fields: Partial<ComicMetadata>) => {
    setItems(prev =>
      prev.map(i => ({
        ...i,
        meta: {
          ...i.meta,
          ...fields,
          isCustomized: true,
        },
      }))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Comic to EPUB Studio
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setShowSpecsModal(true)}
              className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Info className="h-3.5 w-3.5" />
              <span>Format Guide</span>
            </button>
            <a
              href="#converter-queue"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              Batch Queue ({items.length})
            </a>
          </nav>

          {/* Zone 3: Actions & ThemeToggle Switch */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 sm:px-8 py-8 space-y-6">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            role="alert"
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-medium transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Hero Pitch Banner */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-500/5 via-transparent to-sky-500/5 p-6 sm:p-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Browser-Side Comic to EPUB Converter
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Convert CBZ and CBR comic archives into reading-ready EPUB 3 eBooks. The first page
              is automatically embedded as the official cover artwork and bookshelf thumbnail. Download
              all files individually to your chosen destination folder.
            </p>
          </div>

          {/* Feature Highlights Row */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <FileArchive className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Cover & Thumbnail</p>
                <p className="text-slate-500 dark:text-slate-400">Embedded for Kindle, Kobo, Apple Books</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Smart Metadata</p>
                <p className="text-slate-500 dark:text-slate-400">Automatic detection & batch prefill</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <FolderDown className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Target Folder Export</p>
                <p className="text-slate-500 dark:text-slate-400">Save all converted files to custom folder</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Settings Panel */}
        <SettingsPanel
          options={options}
          onChange={setOptions}
          isProcessing={isProcessing}
        />

        {/* Drop Zone */}
        <DropZone
          onFilesSelected={handleFilesSelected}
          disabled={isProcessing}
        />

        {/* Queue Section */}
        <section id="converter-queue" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span>Conversion Queue</span>
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {items.length} file{items.length === 1 ? '' : 's'} in queue
            </span>
          </div>

          {/* Action Bar (Download All Target Folder, Convert All, Clear) */}
          {items.length > 0 && (
            <BatchActionBar
              items={items}
              isProcessing={isProcessing}
              isSavingFolder={isSavingFolder}
              savingStatusText={savingStatusText}
              onConvertAll={handleConvertAll}
              onDownloadAllFolder={handleDownloadAllFolder}
              onClearQueue={handleClearQueue}
            />
          )}

          {/* Queue Items List */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                <BookOpen className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Your queue is empty
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Drop or select your CBZ or CBR comic files above to begin conversion.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  onConvert={convertSingleItem}
                  onRemove={handleRemove}
                  onInspectCover={setInspectingItem}
                  onEditMetadata={setEditingItem}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Cover Inspection Modal */}
      <CoverPreviewModal
        item={inspectingItem}
        onClose={() => setInspectingItem(null)}
        onEditMetadata={setEditingItem}
      />

      {/* Metadata Editor Modal */}
      <MetadataEditorModal
        item={editingItem}
        totalQueueCount={items.length}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveMetadata}
        onCopyToAll={handleCopyToAll}
        onCopyAllCommonFields={handleCopyAllCommonFields}
      />

      {/* EPUB Specs Modal */}
      {showSpecsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowSpecsModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-500" />
                <span>EPUB 3 Compatibility & Target Folder Guide</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSpecsModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>1. EPUB 3 Cover Artwork & Bookshelf Thumbnails:</strong>
                <br />
                The converter identifies the cover page from the archive (either named <code>cover.*</code>, <code>folder.*</code>, or the first sequential page). The generated EPUB package complies with both EPUB 3 and EPUB 2 standards so that bookshelf cover art displays properly across:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Amazon Kindle (Send to Kindle & Paperwhite/Oasis/Scribe)</li>
                <li>Kobo e-readers and Kobo desktop apps</li>
                <li>Apple Books (iOS, iPadOS, macOS)</li>
                <li>Calibre, Thorium Reader, and Moon+ Reader</li>
              </ul>

              <p className="pt-2">
                <strong>2. Target Folder Batch Export:</strong>
                <br />
                Save all converted EPUBs directly into a designated folder on your computer or an attached e-reader drive. In browsers supporting folder picking (Chrome, Edge), all files are written simultaneously without prompting for each individual download. On mobile and Firefox, all files are bundled into a single folder archive.
              </p>

              <p className="pt-2">
                <strong>3. Complete Privacy:</strong>
                <br />
                All comic archive extraction, image scaling, and EPUB compilation take place entirely within your browser. No files or metadata are ever transmitted to an external server.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSpecsModal(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Comic to EPUB Studio · Browser-Side Processing · EPUB 3 Compatible
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Web Archive Engine Ready
            </span>
            <span aria-hidden="true">·</span>
            <span>Private & Offline Capable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
