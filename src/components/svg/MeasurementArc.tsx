'use client';

import React from 'react';

export interface MeasurementArcProps {
  angle: number; // degrees
  radius?: number;
  label?: string;
  className?: string;
}

export const MeasurementArc: React.FC<MeasurementArcProps> = ({
  angle,
  radius = 50,
  label,
  className = '',
}) => {
  // SVG coordinate system: 0 degrees is right (x-axis)
  // Let's make 0 degrees point right, and positive angle goes counter-clockwise 
  // (which means negative y in SVG coordinates)
  
  const size = radius * 2.5; // Enough space for arc, label and ticks
  const center = size / 2;
  
  // Calculate end point
  const rad = (angle * Math.PI) / 180;
  // Using standard math coordinates but inverted Y for SVG
  const endX = center + radius * Math.cos(-rad);
  const endY = center + radius * Math.sin(-rad);
  
  const startX = center + radius;
  const startY = center;

  const largeArcFlag = angle > 180 ? 1 : 0;
  // Sweep flag 0 for counter-clockwise in standard math (which means negative Y direction in SVG)
  const sweepFlag = angle >= 0 ? 0 : 1; 

  // Label position (in the middle of the arc, slightly outside)
  const labelRad = (angle / 2 * Math.PI) / 180;
  const labelRadius = radius + 15;
  const labelX = center + labelRadius * Math.cos(-labelRad);
  const labelY = center + labelRadius * Math.sin(-labelRad);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`Measurement arc of ${angle} degrees`}
    >
      <title>Measurement Arc</title>
      
      {/* Base lines (0 degrees and angle degrees) */}
      <line
        x1={center}
        y1={center}
        x2={startX + 10}
        y2={startY}
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      <line
        x1={center}
        y1={center}
        x2={center + (radius + 10) * Math.cos(-rad)}
        y2={center + (radius + 10) * Math.sin(-rad)}
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      
      {/* Arc */}
      {angle !== 0 && (
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`}
          fill="none"
          stroke="var(--color-saffron, currentColor)"
          strokeWidth="2"
        />
      )}
      
      {/* Start and End Ticks */}
      <circle cx={startX} cy={startY} r="2" fill="var(--color-saffron, currentColor)" />
      {angle !== 0 && (
        <circle cx={endX} cy={endY} r="2" fill="var(--color-saffron, currentColor)" />
      )}
      
      {/* Label */}
      {label && (
        <text
          x={labelX}
          y={labelY}
          fill="currentColor"
          fontSize="12"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="monospace"
        >
          {label}
        </text>
      )}
    </svg>
  );
};
