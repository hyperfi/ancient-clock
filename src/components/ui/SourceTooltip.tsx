'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface SourceTooltipProps {
  source: string;
  author?: string;
  period?: string;
  chapter?: string;
  verse?: string;
  translation?: string;
  note?: string;
  className?: string;
}

export function SourceTooltip({
  source,
  author,
  period,
  chapter,
  verse,
  translation,
  note,
  className = '',
}: SourceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [align, setAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Calculate smart alignment so the tooltip never overflows viewport edges
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        // If the button is in the right 40% of the screen or within 340px of right margin
        if (screenWidth - rect.left < 340 || rect.left > screenWidth * 0.6) {
          setAlign('right');
        } else {
          setAlign('left');
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-full p-1 text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        aria-label={`View source details for ${source}`}
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-[100] mt-2 p-4 text-sm rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10 w-72 sm:w-80 max-w-[calc(100vw-2rem)] 
            bg-[#FEFDF5] dark:bg-[#18181B] text-[#1C1917] dark:text-[#F5F5F4] border border-stone-200 dark:border-stone-700
            ${align === 'right' ? 'right-0' : 'left-0 sm:-left-2'}`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-base text-charcoal dark:text-stone-100">{source}</h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {author && (
            <div className="text-xs text-stone-600 dark:text-stone-400 mb-2">
              {author} {period ? `(${period})` : ''}
            </div>
          )}

          <div className="space-y-2 mt-3 text-xs leading-relaxed">
            {(chapter || verse) && (
              <div className="text-[11px] text-stone-600 dark:text-stone-300 font-mono bg-stone-100 dark:bg-stone-800/80 px-2 py-1 rounded">
                {chapter && <span>Chapter: {chapter}</span>}
                {chapter && verse && <span className="mx-1.5">•</span>}
                {verse && <span>Verse: {verse}</span>}
              </div>
            )}

            {translation && (
              <div className="border-l-2 border-[#B87333] dark:border-amber-600 pl-3 italic text-stone-700 dark:text-stone-300">
                &ldquo;{translation}&rdquo;
              </div>
            )}

            {note && (
              <div className="text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                {note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
