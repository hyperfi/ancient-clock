'use client';

import React from 'react';

export interface GnomonSceneProps {
  shadowAngle?: number; // degrees from vertical
  gnomonHeight?: number;
  className?: string;
  width?: number;
  height?: number;
}

export const GnomonScene: React.FC<GnomonSceneProps> = ({
  shadowAngle = 45,
  gnomonHeight = 60,
  className = '',
  width = 200,
  height = 120,
}) => {
  const groundY = height * 0.8;
  const gnomonX = width * 0.3;
  const gnomonTop = groundY - gnomonHeight;
  
  // shadowAngle is from the vertical stick
  // If shadowAngle is 45, shadow goes to the right
  const shadowRad = (shadowAngle * Math.PI) / 180;
  
  // Calculate shadow tip on the ground
  // tan(angle) = shadowLength / gnomonHeight
  const shadowLength = gnomonHeight * Math.tan(shadowRad);
  const shadowTipX = gnomonX + shadowLength;

  // Arc properties
  const arcRadius = gnomonHeight * 0.3;
  
  // Points for the angle arc
  const arcStartY = groundY - arcRadius; // on the gnomon
  const arcStartX = gnomonX;
  
  // Vector of the hypotenuse
  const hypLength = Math.sqrt(shadowLength ** 2 + gnomonHeight ** 2);
  const arcEndX = gnomonX + (shadowLength / hypLength) * arcRadius;
  const arcEndY = gnomonTop + (gnomonHeight / hypLength) * arcRadius;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Gnomon casting a shadow"
    >
      <title>Gnomon shadow</title>
      
      {/* Ground */}
      <line
        x1={0}
        y1={groundY}
        x2={width}
        y2={groundY}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Shadow */}
      <line
        x1={gnomonX}
        y1={groundY}
        x2={shadowTipX}
        y2={groundY}
        stroke="var(--color-charcoal, currentColor)"
        strokeWidth="4"
        strokeOpacity="0.2"
        strokeLinecap="round"
      />
      
      {/* Gnomon */}
      <line
        x1={gnomonX}
        y1={groundY}
        x2={gnomonX}
        y2={gnomonTop}
        stroke="var(--color-copper, currentColor)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Sun ray / Hypotenuse */}
      <line
        x1={shadowTipX}
        y1={groundY}
        x2={gnomonX}
        y2={gnomonTop}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      
      {/* Angle arc */}
      <path
        d={`M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 0 1 ${arcEndX} ${arcEndY}`}
        fill="none"
        stroke="var(--color-saffron, currentColor)"
        strokeWidth="1.5"
      />
    </svg>
  );
};
