'use client';

import React, { useMemo } from 'react';

export interface HorizonProps {
  width?: number;
  height?: number;
  starCount?: number;
  className?: string;
}

export const Horizon: React.FC<HorizonProps> = ({
  width = 300,
  height = 100,
  starCount = 5,
  className = '',
}) => {
  const horizonY = height * 0.7;

  // Generate deterministic stars based on count
  const stars = useMemo(() => {
    // Simple pseudo-random generator for consistent star placement
    const s = [];
    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    for (let i = 0; i < starCount; i++) {
      s.push({
        x: random() * width,
        y: random() * (horizonY - 10), // keep above horizon
        r: random() * 1.5 + 0.5,
        opacity: random() * 0.5 + 0.3,
      });
    }
    return s;
  }, [starCount, width, horizonY]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Horizon with stars"
    >
      <title>Horizon</title>
      
      {/* Stars */}
      {stars.map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill="currentColor"
          opacity={star.opacity}
        />
      ))}
      
      {/* Horizon line */}
      <line
        x1={0}
        y1={horizonY}
        x2={width}
        y2={horizonY}
        stroke="currentColor"
        strokeWidth="2"
      />
      
      {/* Ground shading */}
      <rect
        x={0}
        y={horizonY}
        width={width}
        height={height - horizonY}
        fill="currentColor"
        opacity="0.05"
      />
    </svg>
  );
};
