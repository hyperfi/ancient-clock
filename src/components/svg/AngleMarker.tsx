'use client';

import React from 'react';

export interface AngleMarkerProps {
  angle: number; // degrees
  size?: number; // size of the marker itself
  className?: string;
}

export const AngleMarker: React.FC<AngleMarkerProps> = ({
  angle,
  size = 16,
  className = '',
}) => {
  // If it's a right angle (90 or close to 90 due to floats), draw a square marker
  // Otherwise draw an arc
  
  const isRightAngle = Math.abs(angle - 90) < 0.1;
  
  // We assume the vertex is at (0, size), baseline goes right, and the other line goes up/right.
  // The SVG needs a viewBox big enough to contain it. 
  // Let's position the vertex at (size, size) for a standard marker.
  const padding = 2;
  const totalSize = size + padding * 2;
  
  const vX = padding;
  const vY = totalSize - padding;

  const rad = (angle * Math.PI) / 180;
  // Second line end point
  const endX = vX + size * Math.cos(rad);
  const endY = vY - size * Math.sin(rad); // negative because y goes down

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      className={className}
      role="img"
      aria-label={`${angle} degree angle marker`}
    >
      <title>Angle Marker</title>
      
      {/* Base line (x-axis) */}
      <line
        x1={vX}
        y1={vY}
        x2={vX + size}
        y2={vY}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      
      {/* Angle line */}
      <line
        x1={vX}
        y1={vY}
        x2={endX}
        y2={endY}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      
      {/* Marker */}
      {isRightAngle ? (
        <path
          d={`M ${vX + size * 0.6} ${vY} L ${vX + size * 0.6} ${vY - size * 0.6} L ${vX} ${vY - size * 0.6}`}
          fill="none"
          stroke="var(--color-copper, currentColor)"
          strokeWidth="1.5"
        />
      ) : (
        <path
          d={`M ${vX + size * 0.8} ${vY} A ${size * 0.8} ${size * 0.8} 0 0 0 ${vX + size * 0.8 * Math.cos(rad)} ${vY - size * 0.8 * Math.sin(rad)}`}
          fill="none"
          stroke="var(--color-copper, currentColor)"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
};
