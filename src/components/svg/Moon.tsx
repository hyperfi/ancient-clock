'use client';

import React from 'react';

export interface MoonProps {
  size?: number;
  phase?: number; // 0 (new) to 1 (full), 0.5 is half
  className?: string;
}

export const Moon: React.FC<MoonProps> = ({ size = 64, phase = 0.5, className = '' }) => {
  const center = size / 2;
  const radius = size * 0.4;
  const clampedPhase = Math.max(0, Math.min(1, phase));
  
  // Phase mapped to x-radius of the ellipse
  // phase = 0 -> rx = radius, sweep = left (but it's empty)
  // phase = 0.25 -> rx = radius/2, sweep = left
  // phase = 0.5 -> rx = 0, sweep = line
  // phase = 0.75 -> rx = radius/2, sweep = right
  // phase = 1.0 -> rx = radius, sweep = right
  
  // Actually, to make it simple and accurate:
  const rx = radius * Math.abs(1 - clampedPhase * 2);
  const sweepInner = clampedPhase < 0.5 ? 0 : 1;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`Moon phase ${Math.round(clampedPhase * 100)}%`}
    >
      <title>Moon phase</title>
      
      {/* Base outline */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={Math.max(1, size * 0.04)}
      />
      
      {/* Illuminated portion */}
      {clampedPhase > 0 && (
        <path
          d={`
            M ${center} ${center - radius}
            A ${radius} ${radius} 0 0 1 ${center} ${center + radius}
            A ${rx} ${radius} 0 0 ${sweepInner} ${center} ${center - radius}
            Z
          `}
          fill="currentColor"
        />
      )}
    </svg>
  );
};
