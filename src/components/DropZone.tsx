/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, ShieldCheck, FileArchive } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = ''; // Reset for re-selection
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative group rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
          : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".cbz,.cbr,.zip,.rar,application/vnd.comicbook+zip,application/x-cbz,application/x-cbr"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
          <UploadCloud className="h-7 w-7" />
        </div>

        <div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Drop your CBZ & CBR comics here, or{' '}
            <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300 dark:decoration-indigo-700 underline-offset-4">
              browse files
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Accepts <code className="font-mono text-slate-700 dark:text-slate-300">.cbz</code>,{' '}
            <code className="font-mono text-slate-700 dark:text-slate-300">.cbr</code>,{' '}
            <code className="font-mono text-slate-700 dark:text-slate-300">.zip</code>, and{' '}
            <code className="font-mono text-slate-700 dark:text-slate-300">.rar</code> archive batches
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            100% Client-Side Private (Zero Cloud Upload)
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="inline-flex items-center gap-1.5">
            <FileArchive className="h-4 w-4 text-indigo-500" />
            Automatic Cover & Thumbnail Extraction
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span>Batch Processing Ready</span>
        </div>
      </div>
    </div>
  );
};
