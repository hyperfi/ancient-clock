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
      className={`inline-flex rounded-lg bg-stone-100 p-1 shadow-inner border border-stone-200 ${className}`}
      role="group"
      aria-label="Toggle between historical and modern mode"
    >
      <button
        type="button"
        onClick={() => onChange('historical')}
        className={`relative flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:z-10 ${
          mode === 'historical'
            ? 'bg-[#FEFDF5] text-[#D97706] shadow-sm ring-1 ring-stone-200'
            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
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
            ? 'bg-[#FEFDF5] text-[#4338CA] shadow-sm ring-1 ring-stone-200'
            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
        }`}
        aria-pressed={mode === 'modern'}
      >
        Modern
      </button>
    </div>
  );
}
