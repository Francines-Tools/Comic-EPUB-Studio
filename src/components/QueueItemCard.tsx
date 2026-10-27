/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Download,
  Trash2,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  ZoomIn,
  Book,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { QueueItem } from '../types';
import { formatBytes } from '../utils/comicConverter';
import { triggerDownload } from '../utils/fileSystemExport';

interface QueueItemCardProps {
  item: QueueItem;
  onConvert: (id: string) => void;
  onRemove: (id: string) => void;
  onInspectCover: (item: QueueItem) => void;
  onEditMetadata: (item: QueueItem) => void;
}

export const QueueItemCard: React.FC<QueueItemCardProps> = ({
  item,
  onConvert,
  onRemove,
  onInspectCover,
  onEditMetadata,
}) => {
  const isDone = item.status === 'done';
  const isProcessing =
    item.status === 'extracting' ||
    item.status === 'processing' ||
    item.status === 'packaging';
  const isError = item.status === 'error';

  const handleDownload = () => {
    if (item.epubBlob) {
      triggerDownload(item.epubBlob, item.meta.outputFilename);
    }
  };

  return (
    <div
      className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-200 ${
        isDone
          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/15'
          : isError
          ? 'border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/15'
          : isProcessing
          ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Left: Thumbnail & Meta info */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {/* Cover Thumbnail Container */}
        <div
          onClick={() => onInspectCover(item)}
          className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-xs cursor-pointer group-hover:ring-2 group-hover:ring-indigo-500/50 transition-all flex items-center justify-center"
          title="Click to inspect cover & metadata"
        >
          {item.coverUrl ? (
            <>
              <img
                src={item.coverUrl}
                alt={`Cover for ${item.meta.title}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-4 w-4 text-white" />
              </div>
            </>
          ) : (
            <Book className="h-6 w-6 text-slate-400" />
          )}

          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] font-medium text-slate-200 text-center py-0.5 tracking-tight backdrop-blur-xs">
            Cover
          </span>
        </div>

        {/* Text metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {item.meta.title}
            </h4>
            {item.meta.series && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                ({item.meta.series})
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{item.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{formatBytes(item.size)}</span>
            {item.meta.pageCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{item.meta.pageCount} pages</span>
              </>
            )}
            {item.meta.writer && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[120px]">{item.meta.writer}</span>
              </>
            )}
            {isDone && item.epubSize && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  EPUB: {formatBytes(item.epubSize)}
                </span>
              </>
            )}
          </div>

          {/* Metadata Detection & Edit Prompt */}
          <div className="mt-1 flex items-center gap-2">
            {!item.meta.hasDetectedMetadata ? (
              <button
                type="button"
                onClick={() => onEditMetadata(item)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer"
                title="ComicInfo.xml not found. Click to review or provide metadata."
              >
                <Sparkles className="h-3 w-3" />
                <span>Guessed from filename · Provide metadata</span>
              </button>
            ) : item.meta.isCustomized ? (
              <button
                type="button"
                onClick={() => onEditMetadata(item)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <Edit3 className="h-3 w-3" />
                <span>Customized metadata · Edit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onEditMetadata(item)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit metadata</span>
              </button>
            )}
          </div>

          {/* Status Message / Progress */}
          <div className="mt-1.5 flex items-center gap-2">
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{item.statusMessage || 'Processing...'}</span>
              </div>
            )}
            {isDone && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Converted with EPUB 3 cover & thumbnail</span>
              </div>
            )}
            {isError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{item.errorMsg || 'Failed to convert archive'}</span>
              </div>
            )}
            {item.status === 'queued' && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Ready to convert
              </span>
            )}
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, item.progress)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => onEditMetadata(item)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          title="Edit Comic Metadata"
          aria-label="Edit comic metadata"
        >
          <Edit3 className="h-4 w-4" />
        </button>

        {item.status === 'queued' && (
          <button
            type="button"
            onClick={() => onConvert(item.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-xs cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Convert
          </button>
        )}

        {isDone && item.epubBlob && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Download EPUB
          </button>
        )}

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onRemove(item.id)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40 cursor-pointer"
          aria-label="Remove comic from queue"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
