/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, BookOpen, Monitor, Image as ImageIcon, Palette } from 'lucide-react';
import { ConversionOptions } from '../types';

interface SettingsPanelProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
  isProcessing: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  options,
  onChange,
  isProcessing,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Conversion & Reader Settings</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          EPUB 3 Standard with Embedded Cover Metadata
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reading Direction */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reading-direction"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            Reading Direction
          </label>
          <select
            id="reading-direction"
            disabled={isProcessing}
            value={options.direction}
            onChange={e =>
              onChange({
                ...options,
                direction: e.target.value as ConversionOptions['direction'],
              })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          >
            <option value="auto">Auto-detect (from ComicInfo.xml)</option>
            <option value="ltr">Left-to-Right (Western Comics)</option>
            <option value="rtl">Right-to-Left (Manga / Manhwa)</option>
          </select>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Sets EPUB page-progression-direction
          </span>
        </div>

        {/* Layout Mode */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="layout-mode"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            Layout Mode
          </label>
          <select
            id="layout-mode"
            disabled={isProcessing}
            value={options.layout}
            onChange={e =>
              onChange({
                ...options,
                layout: e.target.value as ConversionOptions['layout'],
              })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          >
            <option value="pre-paginated">Fixed Layout (Recommended for Comics)</option>
            <option value="reflowable">Reflowable (Responsive Scaled)</option>
          </select>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Rendition viewport preserving aspect ratio
          </span>
        </div>

        {/* Image Resolution */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="max-res"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            Max Image Resolution
          </label>
          <select
            id="max-res"
            disabled={isProcessing}
            value={options.maxRes}
            onChange={e =>
              onChange({
                ...options,
                maxRes: parseInt(e.target.value, 10),
              })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          >
            <option value={0}>Original Quality (Fastest, Lossless)</option>
            <option value={1920}>Max 1920px (Kindle Oasis & Kobo Sage)</option>
            <option value={1440}>Max 1440px (Standard 6" E-ink 300 PPI)</option>
            <option value={1080}>Max 1080px (Compact File Size)</option>
          </select>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Scales down pages if exceeding threshold
          </span>
        </div>

        {/* Color Mode */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="color-mode"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            Color Optimization
          </label>
          <select
            id="color-mode"
            disabled={isProcessing}
            value={options.colorMode}
            onChange={e =>
              onChange({
                ...options,
                colorMode: e.target.value as ConversionOptions['colorMode'],
              })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          >
            <option value="original">Preserve Original Full Color</option>
            <option value="grayscale">Grayscale (Optimized for E-ink)</option>
          </select>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Contrast curves adjusted for monochrome displays
          </span>
        </div>
      </div>
    </div>
  );
};
