'use client';

import React from 'react';

export interface ThenNowToggleProps {
  mode: 'historical' | 'modern';
  onChange: (mode: 'historical' | 'modern') => void;
  className?: string;
}

export function ThenNowToggle({ mode, onChange, className = '' }: ThenNowToggleProps) {
  return (
    <div
      className={`inline-flex rounded-lg bg-stone-100 dark:bg-stone-800/80 p-1 shadow-inner border border-stone-200 dark:border-stone-700 ${className}`}
      role="group"
      aria-label="Toggle between historical and modern mode"
    >
      <button
        type="button"
        onClick={() => onChange('historical')}
        className={`relative flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:z-10 ${
          mode === 'historical'
            ? 'bg-[#FEFDF5] dark:bg-stone-900 text-[#D97706] dark:text-amber-400 shadow-sm ring-1 ring-stone-200 dark:ring-stone-700'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50'
        }`}
        aria-pressed={mode === 'historical'}
      >
        Historical
      </button>
      <button
        type="button"
        onClick={() => onChange('modern')}
        className={`relative flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#4338CA] focus:z-10 ${
          mode === 'modern'
            ? 'bg-[#FEFDF5] dark:bg-stone-900 text-[#4338CA] dark:text-indigo-400 shadow-sm ring-1 ring-stone-200 dark:ring-stone-700'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50'
        }`}
        aria-pressed={mode === 'modern'}
      >
        Modern
      </button>
    </div>
  );
}
