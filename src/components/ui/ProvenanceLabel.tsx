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
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  scholarly: {
    label: 'Scholarly Interpretation',
    classes: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  reconstruction: {
    label: 'Engineering Reconstruction',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  modern: {
    label: 'Modern Comparison',
    classes: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
};

export function ProvenanceLabel({ type, className = '' }: ProvenanceLabelProps) {
  const { label, classes } = config[type];
  
  return (
    <span 
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tracking-wide ${classes} ${className}`}
      title={`Provenance: ${label}`}
    >
      {label}
    </span>
  );
}
