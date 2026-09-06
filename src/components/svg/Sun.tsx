'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface SunProps {
  size?: number;
  className?: string;
  rays?: number;
  animate?: boolean;
}

export const Sun: React.FC<SunProps> = ({ size = 64, className = '', rays = 12, animate = false }) => {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;
  
  const center = size / 2;
  const radius = size * 0.25;
  const innerRay = size * 0.32;
  const outerRay = size * 0.45;

  const rayElements = Array.from({ length: rays }).map((_, i) => {
    const angle = (i * 360) / rays;
    const rad = (angle * Math.PI) / 180;
    
    const x1 = center + innerRay * Math.cos(rad);
    const y1 = center + innerRay * Math.sin(rad);
    const x2 = center + outerRay * Math.cos(rad);
    const y2 = center + outerRay * Math.sin(rad);

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth={Math.max(1, size * 0.03)}
        strokeLinecap="round"
      />
    );
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Sun"
      animate={shouldAnimate ? { rotate: 360 } : {}}
      transition={shouldAnimate ? { duration: 20, repeat: Infinity, ease: 'linear' } : undefined}
    >
      <title>Sun</title>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={Math.max(1, size * 0.04)}
      />
      {rayElements}
    </motion.svg>
  );
};
