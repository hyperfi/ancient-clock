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
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-full p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        aria-label="View source details"
        aria-expanded={isOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 mt-2 -left-2 rounded-md bg-[#FEFDF5] p-4 text-sm text-[#1C1917] shadow-lg ring-1 ring-black/5 sm:w-80">
          <h4 className="font-semibold text-base mb-1">{source}</h4>
          {author && <div className="text-stone-600 mb-2">{author} {period ? `(${period})` : ''}</div>}
          
          <div className="space-y-2 mt-3">
            {(chapter || verse) && (
              <div className="text-xs text-stone-500 font-mono bg-stone-100 px-2 py-1 rounded">
                {chapter && <span>Ch: {chapter}</span>}
                {chapter && verse && <span className="mx-1">•</span>}
                {verse && <span>Verse: {verse}</span>}
              </div>
            )}
            
            {translation && (
              <div className="border-l-2 border-[#B87333] pl-3 italic text-stone-700">
                "{translation}"
              </div>
            )}
            
            {note && (
              <div className="text-stone-600 mt-2">
                {note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
