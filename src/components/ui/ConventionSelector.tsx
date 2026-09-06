'use client';

import React from 'react';

export interface Convention {
  id: string;
  label: string;
  description?: string;
}

export interface ConventionSelectorProps {
  conventions: Convention[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}

export function ConventionSelector({
  conventions,
  value,
  onChange,
  label = 'Convention',
  className = '',
}: ConventionSelectorProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor="convention-select" className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id="convention-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-md border border-stone-300 bg-[#FEFDF5] py-2 pl-3 pr-10 text-sm text-[#1C1917] focus:border-[#4338CA] focus:outline-none focus:ring-1 focus:ring-[#4338CA]"
        >
          {conventions.map((conv) => (
            <option key={conv.id} value={conv.id}>
              {conv.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {/* Show description for the selected convention */}
      {conventions.find((c) => c.id === value)?.description && (
        <p className="text-xs text-stone-500 mt-1">
          {conventions.find((c) => c.id === value)?.description}
        </p>
      )}
    </div>
  );
}
