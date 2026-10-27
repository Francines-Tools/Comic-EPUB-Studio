/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
}

export function AppLogo({ className = 'h-8 w-8', size }: AppLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="appLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="appLogoComic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="appLogoEpub" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="appLogoCurl" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <filter id="appLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#4f46e5" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Squircle Base with Subtle Border */}
      <rect x="24" y="24" width="464" height="464" rx="104" fill="url(#appLogoBg)" stroke="#334155" strokeWidth="6" />

      {/* Main Comic / eBook Container with Glow */}
      <g filter="url(#appLogoGlow)">
        {/* Back Spine / Base Book */}
        <path d="M120 380 C180 370 240 376 256 392 C272 376 332 370 392 380 L392 130 C332 120 272 126 256 142 C240 126 180 120 120 130 Z" fill="#1e1b4b" stroke="#6366f1" strokeWidth="8" strokeLinejoin="round" />

        {/* Right Page: Digital EPUB / E-Reader Page */}
        <path d="M256 142 C272 126 332 120 392 130 L392 380 C332 370 272 376 256 392 Z" fill="url(#appLogoEpub)" />
        {/* E-Reader Digital Comic Lines */}
        <rect x="282" y="166" width="86" height="52" rx="6" fill="#6366f1" fillOpacity="0.85" />
        <line x1="282" y1="236" x2="368" y2="236" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        <line x1="282" y1="258" x2="368" y2="258" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        <line x1="282" y1="280" x2="352" y2="280" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        <line x1="282" y1="302" x2="368" y2="302" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        {/* EPUB 3 Monogram Badge */}
        <path d="M336 336 L348 324 L360 336 L348 348 Z" fill="#6366f1" />
        <circle cx="348" cy="336" r="3" fill="#ffffff" />

        {/* Left Page: Dynamic Curling Comic Panel Page */}
        <path d="M256 142 C240 126 180 120 120 130 L120 380 C180 370 240 376 256 392 Z" fill="url(#appLogoComic)" />
        {/* Comic Grid Panels */}
        <rect x="142" y="156" width="46" height="88" rx="4" fill="#0f172a" fillOpacity="0.4" stroke="#ffffff" strokeWidth="3" />
        <rect x="194" y="156" width="46" height="40" rx="4" fill="#0f172a" fillOpacity="0.4" stroke="#ffffff" strokeWidth="3" />
        <rect x="194" y="202" width="46" height="42" rx="4" fill="#0f172a" fillOpacity="0.4" stroke="#ffffff" strokeWidth="3" />
        <rect x="142" y="252" width="98" height="92" rx="4" fill="#0f172a" fillOpacity="0.4" stroke="#ffffff" strokeWidth="3" />

        {/* Comic Action Burst Graphic */}
        <path d="M191 298 L203 286 L197 302 L212 300 L198 310 L206 322 L193 313 L185 325 L187 311 L172 310 L186 301 L178 288 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />

        {/* Prominent Curling Page Corner (representing conversion in action) */}
        <path d="M120 380 C145 350 170 340 210 345 C185 375 155 385 120 380 Z" fill="url(#appLogoCurl)" stroke="#c7d2fe" strokeWidth="3" />
      </g>

      {/* Central Binding Notch Accent */}
      <ellipse cx="256" cy="392" rx="14" ry="7" fill="#38bdf8" />
    </svg>
  );
}
