/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, User, Building, FileText, CheckCircle2, Edit3, Tag, Calendar, Globe } from 'lucide-react';
import { QueueItem } from '../types';
import { formatBytes } from '../utils/comicConverter';

interface CoverPreviewModalProps {
  item: QueueItem | null;
  onClose: () => void;
  onEditMetadata?: (item: QueueItem) => void;
}

export const CoverPreviewModal: React.FC<CoverPreviewModalProps> = ({ item, onClose, onEditMetadata }) => {
  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div>
            <h3
              id="cover-modal-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Cover & EPUB Metadata Inspection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This image is embedded as the primary EPUB cover and bookshelf thumbnail
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-h-[80vh] overflow-y-auto">
          {/* Cover Image Container */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
            {item.coverUrl ? (
              <img
                src={item.coverUrl}
                alt={`Cover for ${item.meta.title}`}
                className="max-h-[380px] w-auto rounded-lg shadow-md object-contain border border-slate-300 dark:border-slate-700"
              />
            ) : (
              <div className="flex h-64 w-48 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400">
                <span>Cover not extracted yet</span>
              </div>
            )}
            {item.coverDimensions && (
              <span className="mt-3 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {item.coverDimensions.width} × {item.coverDimensions.height} px
              </span>
            )}
          </div>

          {/* Metadata Inspector */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Book Title
                </label>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {item.meta.title}
                </div>
              </div>

              {item.meta.series && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Series / Issue
                  </label>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    {item.meta.series} {item.meta.number ? `#${item.meta.number}` : ''} {item.meta.volume ? `Vol. ${item.meta.volume}` : ''}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <User className="h-3 w-3" /> Author / Artist
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.meta.writer || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Building className="h-3 w-3" /> Publisher
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.meta.publisher || 'Independent'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Tag className="h-3 w-3" /> Genre
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.meta.genre || 'Unspecified'}
                  </span>
                </div>
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Globe className="h-3 w-3" /> Language
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 uppercase">
                    {item.meta.language || 'en'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <BookOpen className="h-3 w-3" /> Pages Detected
                  </span>
                  <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                    {item.meta.pageCount || 'Pending...'}
                  </span>
                </div>
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <FileText className="h-3 w-3" /> Archive Size
                  </span>
                  <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                    {formatBytes(item.size)}
                  </span>
                </div>
              </div>

              {item.meta.summary && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Summary / Synopsis
                  </label>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-h-28 overflow-y-auto pr-1 leading-relaxed">
                    {item.meta.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Standard Compliance Badge */}
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>
                Standard EPUB 3 cover verified: includes{' '}
                <code className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded">
                  properties="cover-image"
                </code>{' '}
                and EPUB 2 landmark metadata for bookshelf thumbnail generation.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-6 py-3 flex items-center justify-between">
          <div>
            {onEditMetadata && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditMetadata(item);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Metadata</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
