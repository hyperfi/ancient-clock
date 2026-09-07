'use client';

import React from 'react';

export type ProvenanceType = 'documented' | 'scholarly' | 'reconstruction' | 'modern';

export interface ProvenanceLabelProps {
  type: ProvenanceType;
  className?: string;
}

const config: Record<ProvenanceType, { label: string; classes: string }> = {
  documented: {
    label: 'Documented',
    classes:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  scholarly: {
    label: 'Scholarly Interpretation',
    classes:
      'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  reconstruction: {
    label: 'Engineering Reconstruction',
    classes:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  modern: {
    label: 'Modern Comparison',
    classes:
      'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
};

export function ProvenanceLabel({ type, className = '' }: ProvenanceLabelProps) {
  const { label, classes } = config[type];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors ${classes} ${className}`}
      title={`Provenance: ${label}`}
    >
      {label}
    </span>
  );
}
