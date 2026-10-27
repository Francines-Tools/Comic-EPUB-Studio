/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, FolderDown, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { QueueItem } from '../types';
import { isFileSystemAccessSupported } from '../utils/fileSystemExport';

interface BatchActionBarProps {
  items: QueueItem[];
  isProcessing: boolean;
  isSavingFolder: boolean;
  savingStatusText: string;
  onConvertAll: () => void;
  onDownloadAllFolder: () => void;
  onClearQueue: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  items,
  isProcessing,
  isSavingFolder,
  savingStatusText,
  onConvertAll,
  onDownloadAllFolder,
  onClearQueue,
}) => {
  const queuedCount = items.filter(i => i.status === 'queued').length;
  const doneCount = items.filter(i => i.status === 'done').length;
  const totalCount = items.length;
  const hasCompleted = doneCount > 0;
  const hasDirectoryPicker = isFileSystemAccessSupported();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
      {/* Left: Summary Metrics */}
      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          Queue Overview:
        </span>
        <span className="font-mono tabular-nums">{totalCount} comic{totalCount === 1 ? '' : 's'}</span>
        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-mono tabular-nums">{doneCount}</span> ready
        </span>
        {queuedCount > 0 && (
          <>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums">{queuedCount}</span> pending
            </span>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Start / Convert All */}
        <button
          type="button"
          disabled={isProcessing || queuedCount === 0}
          onClick={onConvertAll}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Converting...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Convert All ({queuedCount})</span>
            </>
          )}
        </button>

        {/* Download All (Target Folder) */}
        <button
          type="button"
          disabled={!hasCompleted || isSavingFolder || isProcessing}
          onClick={onDownloadAllFolder}
          title={
            hasDirectoryPicker
              ? 'Select target folder to write all converted EPUBs directly'
              : 'Download all converted EPUB files together into target folder archive'
          }
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed group relative"
        >
          {isSavingFolder ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{savingStatusText || 'Saving to Folder...'}</span>
            </>
          ) : (
            <>
              <FolderDown className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span>Download All (Target Folder)</span>
            </>
          )}
        </button>

        {/* Clear Queue */}
        <button
          type="button"
          disabled={isProcessing || totalCount === 0}
          onClick={onClearQueue}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
