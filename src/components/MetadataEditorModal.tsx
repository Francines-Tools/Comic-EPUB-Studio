/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  User,
  Building,
  Globe,
  Tag,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { QueueItem, ComicMetadata } from '../types';
import { COMMON_GENRES, COMMON_LANGUAGES } from '../utils/filenameGuesser';

interface MetadataEditorModalProps {
  item: QueueItem | null;
  totalQueueCount: number;
  onClose: () => void;
  onSave: (itemId: string, updatedMeta: ComicMetadata) => void;
  onCopyToAll: (field: keyof ComicMetadata, value: any) => void;
  onCopyAllCommonFields: (fields: Partial<ComicMetadata>) => void;
}

export const MetadataEditorModal: React.FC<MetadataEditorModalProps> = ({
  item,
  totalQueueCount,
  onClose,
  onSave,
  onCopyToAll,
  onCopyAllCommonFields,
}) => {
  const [formData, setFormData] = useState<ComicMetadata | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAllCommon, setCopiedAllCommon] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...item.meta });
    }
  }, [item]);

  if (!item || !formData) return null;

  const handleChange = (field: keyof ComicMetadata, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      // Auto-update output filename if title changes
      if (field === 'title' && value) {
        updated.outputFilename = `${String(value).replace(/[\/\\?%*:|"<>]/g, '_')}.epub`;
      }
      return updated;
    });
  };

  const handleCopySingleField = (field: keyof ComicMetadata, label: string) => {
    const value = formData[field];
    if (value === undefined || value === '') return;
    onCopyToAll(field, value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyCommonToAll = () => {
    const commonFields: Partial<ComicMetadata> = {};
    if (formData.writer) commonFields.writer = formData.writer;
    if (formData.publisher) commonFields.publisher = formData.publisher;
    if (formData.language) commonFields.language = formData.language;
    if (formData.genre) commonFields.genre = formData.genre;
    if (formData.series) commonFields.series = formData.series;

    onCopyAllCommonFields(commonFields);
    setCopiedAllCommon(true);
    setTimeout(() => setCopiedAllCommon(false), 2500);
  };

  const handleSaveAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      formData.title = item.file.name.replace(/\.[^/.]+$/, '');
    }
    onSave(item.id, {
      ...formData,
      isCustomized: true,
    });
    onClose();
  };

  const hasDetectedMetadata = item.meta.hasDetectedMetadata;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="metadata-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div>
            <h3
              id="metadata-editor-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Comic Metadata Editor</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
              File: <span className="font-mono">{item.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status notice banner */}
        <div className="px-6 pt-4">
          {!hasDetectedMetadata ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold">No ComicInfo.xml detected in archive.</span>
                <p className="text-amber-800/90 dark:text-amber-300/80 mt-0.5 text-[11px]">
                  Fields have been prefilled with best guesses from the filename. You can edit any details below and copy common values to all books.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Metadata imported from embedded ComicInfo.xml. You can customize it below.</span>
            </div>
          )}
        </div>

        {/* Feedback pill banner when copied */}
        {copiedField && (
          <div className="mx-6 mt-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-indigo-500" />
            <span>Copied {copiedField} to all {totalQueueCount} books in queue!</span>
          </div>
        )}
        {copiedAllCommon && (
          <div className="mx-6 mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>Applied common fields (Author, Publisher, Language, Genre) to all {totalQueueCount} books!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSaveAndClose} className="p-6 space-y-4 max-h-[62vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Book Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g. Batman - Year One #01"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Series, Volume, Issue, Year Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Series
                </label>
                {totalQueueCount > 1 && formData.series && (
                  <button
                    type="button"
                    onClick={() => handleCopySingleField('series', 'Series')}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Copy Series to all books in queue"
                  >
                    <Copy className="h-3 w-3" />
                    Copy to all
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.series || ''}
                onChange={e => handleChange('series', e.target.value)}
                placeholder="e.g. Batman - Year One"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Volume
              </label>
              <input
                type="text"
                value={formData.volume || ''}
                onChange={e => handleChange('volume', e.target.value)}
                placeholder="e.g. 1"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Issue #
              </label>
              <input
                type="text"
                value={formData.number || ''}
                onChange={e => handleChange('number', e.target.value)}
                placeholder="e.g. 01"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Author / Writer & Publisher Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Author / Writer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Author / Writer
                </label>
                {totalQueueCount > 1 && formData.writer && (
                  <button
                    type="button"
                    onClick={() => handleCopySingleField('writer', 'Author')}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Copy Author to all books in queue"
                  >
                    <Copy className="h-3 w-3" />
                    Copy to all
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.writer || ''}
                onChange={e => handleChange('writer', e.target.value)}
                placeholder="e.g. Frank Miller"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Publisher */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  Publisher
                </label>
                {totalQueueCount > 1 && formData.publisher && (
                  <button
                    type="button"
                    onClick={() => handleCopySingleField('publisher', 'Publisher')}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Copy Publisher to all books in queue"
                  >
                    <Copy className="h-3 w-3" />
                    Copy to all
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.publisher || ''}
                onChange={e => handleChange('publisher', e.target.value)}
                placeholder="e.g. DC Comics, Marvel, Image"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Genre, Language & Year Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Genre */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  Genre
                </label>
                {totalQueueCount > 1 && formData.genre && (
                  <button
                    type="button"
                    onClick={() => handleCopySingleField('genre', 'Genre')}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Copy Genre to all books in queue"
                  >
                    <Copy className="h-3 w-3" />
                    Copy to all
                  </button>
                )}
              </div>
              <input
                list="genres-list"
                type="text"
                value={formData.genre || ''}
                onChange={e => handleChange('genre', e.target.value)}
                placeholder="e.g. Superhero, Sci-Fi"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <datalist id="genres-list">
                {COMMON_GENRES.map(g => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            {/* Language */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  Language
                </label>
                {totalQueueCount > 1 && formData.language && (
                  <button
                    type="button"
                    onClick={() => handleCopySingleField('language', 'Language')}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    title="Copy Language to all books in queue"
                  >
                    <Copy className="h-3 w-3" />
                    Copy to all
                  </button>
                )}
              </div>
              <select
                value={formData.language || 'en'}
                onChange={e => handleChange('language', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {COMMON_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Publication Year */}
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Year
              </label>
              <input
                type="text"
                value={formData.year || ''}
                onChange={e => handleChange('year', e.target.value)}
                placeholder="e.g. 1986"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Summary / Description */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Summary / Synopsis (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.summary || ''}
              onChange={e => handleChange('summary', e.target.value)}
              placeholder="Brief summary or description of the comic..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Common Bulk Copy Helper */}
          {totalQueueCount > 1 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Bulk propagate:
                </span>{' '}
                Copy Author ({formData.writer || '—'}), Publisher ({formData.publisher || '—'}), Language ({formData.language}), and Genre to all {totalQueueCount} books.
              </div>
              <button
                type="button"
                onClick={handleCopyCommonToAll}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Common to All</span>
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              Save Metadata
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
