'use client';

import React from 'react';

export interface WaterBowlProps {
  fillLevel?: number; // 0 to 1
  className?: string;
  size?: number;
}

export const WaterBowl: React.FC<WaterBowlProps> = ({
  fillLevel = 0.5,
  className = '',
  size = 120,
}) => {
  const center = size / 2;
  const radius = size * 0.4;
  const bowlTop = center;
  
  // Outer water level (tank)
  const outerWaterLevel = center - radius * 0.2;
  
  // Inner water level (sinking bowl)
  // fillLevel 0 = bottom, 1 = top
  const clampedFill = Math.max(0, Math.min(1, fillLevel));
  const innerWaterY = bowlTop + radius - (clampedFill * radius);
  
  // Calculate width of inner water surface based on circle equation: x^2 + y^2 = r^2
  // dy is distance from center of circle (which is bowlTop)
  const dy = innerWaterY - bowlTop;
  const surfaceHalfWidth = Math.sqrt(Math.max(0, radius * radius - dy * dy));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Water clock bowl"
    >
      <title>Water clock</title>
      
      {/* Tank water (outer) */}
      <rect
        x={center - radius * 1.1}
        y={outerWaterLevel}
        width={radius * 2.2}
        height={size - outerWaterLevel}
        fill="var(--color-indigo, currentColor)"
        opacity="0.1"
      />
      <line
        x1={center - radius * 1.1}
        y1={outerWaterLevel}
        x2={center + radius * 1.1}
        y2={outerWaterLevel}
        stroke="var(--color-indigo, currentColor)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />

      {/* Bowl interior water */}
      {clampedFill > 0 && (
        <path
          d={`
            M ${center - surfaceHalfWidth} ${innerWaterY}
            A ${radius} ${radius} 0 0 0 ${center + surfaceHalfWidth} ${innerWaterY}
            Z
          `}
          fill="var(--color-indigo, currentColor)"
          opacity="0.3"
        />
      )}
      
      {/* Bowl internal water surface line */}
      {clampedFill > 0 && clampedFill < 1 && (
        <line
          x1={center - surfaceHalfWidth}
          y1={innerWaterY}
          x2={center + surfaceHalfWidth}
          y2={innerWaterY}
          stroke="var(--color-indigo, currentColor)"
          strokeWidth="1"
          opacity="0.5"
        />
      )}

      {/* Hemispherical bowl */}
      <path
        d={`
          M ${center - radius} ${bowlTop}
          A ${radius} ${radius} 0 0 0 ${center + radius} ${bowlTop}
        `}
        fill="none"
        stroke="var(--color-copper, #B87333)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Bowl top rim */}
      <line
        x1={center - radius}
        y1={bowlTop}
        x2={center + radius}
        y2={bowlTop}
        stroke="var(--color-copper, #B87333)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Hole at bottom */}
      <circle
        cx={center}
        cy={bowlTop + radius}
        r="2"
        fill="white"
      />
    </svg>
  );
};
