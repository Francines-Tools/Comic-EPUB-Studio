/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('comic-epub-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('comic-epub-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('comic-epub-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className={`group relative inline-flex h-9 w-18 items-center rounded-full bg-slate-200 dark:bg-slate-800 p-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 border border-slate-300 dark:border-slate-700/80 cursor-pointer ${className}`}
    >
      {/* Background Icons */}
      <span className="flex w-full justify-between px-1.5 text-xs select-none">
        <Sun className="h-4 w-4 text-amber-500 transition-opacity" />
        <Moon className="h-4 w-4 text-indigo-400 transition-opacity" />
      </span>

      {/* Sliding Knob */}
      <span
        className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-md transition-transform duration-200 ease-out border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 ${
          isDark ? 'translate-x-9' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <span className="text-xs font-bold leading-none select-none" aria-hidden="true">
            🌙
          </span>
        ) : (
          <span className="text-xs font-bold leading-none select-none" aria-hidden="true">
            🔆
          </span>
        )}
      </span>
    </button>
  );
};
