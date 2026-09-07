'use client';

import React from 'react';

export interface WaterBowlProps {
  fillLevel?: number;        // 0.0 (empty) to 1.0 (sinking)
  submersionLevel?: number;  // 0.0 to 1.0 (how deep the bowl sits in basin)
  isSinking?: boolean;       // true if bowl has reached freeboard 0 and is sinking
  flowActive?: boolean;      // true if water is currently jetting into the bowl
  showBasin?: boolean;       // whether to draw outer water basin
  showLabels?: boolean;      // whether to show engineering annotations (freeboard, submersion)
  freeboardCm?: number;      // optional explicit cm value for label
  submersionCm?: number;     // optional explicit cm value for label
  size?: number | string;    // CSS size (width/height)
  className?: string;
}

export const WaterBowl: React.FC<WaterBowlProps> = ({
  fillLevel = 0.35,
  submersionLevel,
  isSinking = false,
  flowActive = false,
  showBasin = true,
  showLabels = false,
  freeboardCm,
  submersionCm,
  size = 320,
  className = '',
}) => {
  const clampedFill = Math.max(0, Math.min(1, fillLevel));
  
  // Natural Archimedean submersion:
  // At empty (fill=0), empty bowl displaces ~25% of its height.
  // At full (fill=1), bowl is submerged 100% (rim at water level).
  // If isSinking, bowl drops to basin floor.
  const effectiveSubmersion = isSinking 
    ? 1.45 
    : (submersionLevel !== undefined ? submersionLevel : 0.22 + clampedFill * 0.78);

  // SVG Coordinate mapping (400 x 300 canvas)
  const vbWidth = 400;
  const vbHeight = 300;
  const cx = 200;
  const basinWaterY = 120; // Reference water level of the outer basin
  
  const bowlRadius = 60; // 120px diameter hemisphere
  const bowlHeight = 60; // depth = radius for hemisphere

  // Rim Y position in the scene:
  // Basin water is at basinWaterY.
  // Bottom of bowl sits at: basinWaterY + (effectiveSubmersion * bowlHeight).
  // Rim sits at: bottom - bowlHeight.
  const bowlBottomY = basinWaterY + effectiveSubmersion * bowlHeight;
  const bowlRimY = bowlBottomY - bowlHeight;

  // Freeboard in pixels: distance from rim to basin water line
  const freeboardPx = Math.max(0, basinWaterY - bowlRimY);

  // Water level inside the bowl:
  // Rises from bottom (bowlBottomY) up towards rim (bowlRimY)
  const innerWaterHeight = clampedFill * bowlHeight;
  const innerWaterY = bowlBottomY - innerWaterHeight;
  
  // Half-width of the internal water surface at height innerWaterHeight in a sphere:
  const dy = Math.max(0, bowlRadius - innerWaterHeight);
  const innerSurfaceHalfWidth = Math.sqrt(Math.max(0, bowlRadius * bowlRadius - dy * dy));

  const uid = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      style={{ width: typeof size === 'number' ? `${size}px` : size, height: 'auto', maxWidth: '100%' }}
      className={`overflow-visible select-none ${className}`}
      role="img"
      aria-label={`Water clock bowl, ${Math.round(clampedFill * 100)}% filled`}
    >
      <defs>
        {/* Outer basin water gradient */}
        <linearGradient id={`basinWater-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
          <stop offset="40%" stopColor="#0284C7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.7" />
        </linearGradient>

        {/* Basin ceramic / terracotta body gradient */}
        <linearGradient id={`basinBody-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#78716C" stopOpacity="0.6" />
          <stop offset="25%" stopColor="#A8A29E" stopOpacity="0.3" />
          <stop offset="75%" stopColor="#D6D3D1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#57534E" stopOpacity="0.7" />
        </linearGradient>

        {/* Rich hammered copper bowl gradient */}
        <radialGradient id={`copperGrad-${uid}`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="35%" stopColor="#EA580C" />
          <stop offset="70%" stopColor="#B45309" />
          <stop offset="95%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </radialGradient>

        {/* Copper rim specular highlight */}
        <linearGradient id={`copperRim-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9A3412" />
          <stop offset="25%" stopColor="#FDBA74" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="75%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#7C2D12" />
        </linearGradient>

        {/* Internal water gradient */}
        <linearGradient id={`innerWaterGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.95" />
        </linearGradient>

        {/* Shading filter for realistic 3D depth */}
        <filter id={`shadow-${uid}`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* 1. OUTER BASIN CONTAINER (Kundikā) */}
      {showBasin && (
        <g className="transition-opacity duration-300">
          {/* Basin Outer Shell */}
          <path
            d={`
              M 40 100
              L 360 100
              Q 370 190 330 255
              Q 300 275 200 275
              Q 100 275 70 255
              Q 30 190 40 100
              Z
            `}
            fill={`url(#basinBody-${uid})`}
            stroke="#78716C"
            strokeWidth="2"
            strokeOpacity="0.4"
            filter={`url(#shadow-${uid})`}
          />

          {/* Basin Pedestal Base */}
          <path
            d="M 130 273 L 270 273 L 285 285 L 115 285 Z"
            fill="#57534E"
            opacity="0.5"
          />

          {/* Basin Water Mass */}
          <path
            d={`
              M 48 ${basinWaterY}
              L 352 ${basinWaterY}
              Q 362 195 325 252
              Q 295 270 200 270
              Q 105 270 75 252
              Q 38 195 48 ${basinWaterY}
              Z
            `}
            fill={`url(#basinWater-${uid})`}
          />

          {/* Basin Water Surface Waves / Shimmer */}
          <path
            d={`
              M 48 ${basinWaterY}
              Q 120 ${basinWaterY - 3} 200 ${basinWaterY}
              T 352 ${basinWaterY}
            `}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />
          <path
            d={`
              M 52 ${basinWaterY + 2}
              Q 130 ${basinWaterY + 5} 210 ${basinWaterY + 2}
              T 348 ${basinWaterY + 2}
            `}
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Basin Lip / Rim */}
          <ellipse
            cx="200"
            cy="100"
            rx="160"
            ry="14"
            fill="none"
            stroke="#A8A29E"
            strokeWidth="3.5"
            strokeOpacity="0.6"
          />
        </g>
      )}

      {/* 2. SINKING COPPER BOWL (Ghaṭikā) */}
      <g 
        className="transition-transform duration-75 ease-out"
        style={{ transform: `translateY(0px)` }}
      >
        {/* Bowl Drop Shadow on Water/Floor */}
        <ellipse
          cx={cx}
          cy={Math.min(270, bowlBottomY + 14)}
          rx={bowlRadius * 0.9}
          ry="10"
          fill="#000000"
          opacity={isSinking ? 0.35 : 0.2}
          filter={`url(#shadow-${uid})`}
        />

        {/* Copper Outer Hemisphere */}
        <path
          d={`
            M ${cx - bowlRadius} ${bowlRimY}
            A ${bowlRadius} ${bowlRadius} 0 0 0 ${cx + bowlRadius} ${bowlRimY}
            Z
          `}
          fill={`url(#copperGrad-${uid})`}
          stroke="#78350F"
          strokeWidth="1.5"
          filter={`url(#shadow-${uid})`}
        />

        {/* Hammered Metal Texture Details */}
        <path
          d={`
            M ${cx - bowlRadius * 0.85} ${bowlRimY + 15}
            Q ${cx} ${bowlRimY + bowlRadius * 0.9} ${cx + bowlRadius * 0.85} ${bowlRimY + 15}
          `}
          fill="none"
          stroke="#FDBA74"
          strokeWidth="1"
          strokeDasharray="2 6"
          opacity="0.35"
        />
        <path
          d={`
            M ${cx - bowlRadius * 0.65} ${bowlRimY + 30}
            Q ${cx} ${bowlRimY + bowlRadius * 0.95} ${cx + bowlRadius * 0.65} ${bowlRimY + 30}
          `}
          fill="none"
          stroke="#FDBA74"
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity="0.25"
        />

        {/* 3. INTERNAL WATER FILLING UP */}
        {clampedFill > 0.01 && (
          <g>
            {/* Water Volume Body inside Hemisphere */}
            <path
              d={`
                M ${cx - innerSurfaceHalfWidth} ${innerWaterY}
                A ${bowlRadius} ${bowlRadius} 0 0 0 ${cx + innerSurfaceHalfWidth} ${innerWaterY}
                Z
              `}
              fill={`url(#innerWaterGrad-${uid})`}
            />

            {/* Inner Water Surface Meniscus (Oval perspective) */}
            <ellipse
              cx={cx}
              cy={innerWaterY}
              rx={Math.max(2, innerSurfaceHalfWidth)}
              ry={Math.max(1, innerSurfaceHalfWidth * 0.2)}
              fill="#93C5FD"
              fillOpacity="0.8"
              stroke="#DBEAFE"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />
          </g>
        )}

        {/* 4. COPPER BOWL RIM (Thickened Metallic Lip) */}
        <ellipse
          cx={cx}
          cy={bowlRimY}
          rx={bowlRadius}
          ry={bowlRadius * 0.22}
          fill="none"
          stroke={`url(#copperRim-${uid})`}
          strokeWidth="4"
        />
        <ellipse
          cx={cx}
          cy={bowlRimY}
          rx={bowlRadius - 2}
          ry={bowlRadius * 0.22 - 1.5}
          fill="none"
          stroke="#FDE047"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />

        {/* 5. BOTTOM ORIFICE & GOLD NEEDLE CALIBRATION HOLE */}
        <circle
          cx={cx}
          cy={bowlBottomY}
          r="4"
          fill="#1C1917"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />
        <circle
          cx={cx}
          cy={bowlBottomY}
          r="1.5"
          fill="#FDE047"
        />

        {/* 6. DYNAMIC INFLOW JET & BUBBLES */}
        {flowActive && !isSinking && (
          <g>
            {/* Water stream entering upward through orifice */}
            <line
              x1={cx}
              y1={bowlBottomY - 2}
              x2={cx}
              y2={Math.max(innerWaterY, bowlBottomY - 26)}
              stroke="#60A5FA"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              className="animate-[pulse_0.6s_ease-in-out_infinite]"
            />
            {/* Fine jet bubbles */}
            <circle cx={cx - 3} cy={bowlBottomY - 8} r="1.5" fill="#BFDBFE" opacity="0.8" />
            <circle cx={cx + 4} cy={bowlBottomY - 14} r="2" fill="#DBEAFE" opacity="0.9" />
            <circle cx={cx - 2} cy={bowlBottomY - 22} r="1.5" fill="#FFFFFF" opacity="0.8" />
          </g>
        )}

        {/* Inflow rush when sinking */}
        {isSinking && (
          <g>
            <circle cx={cx - 25} cy={bowlRimY + 5} r="4" fill="#DBEAFE" opacity="0.7" />
            <circle cx={cx + 30} cy={bowlRimY + 8} r="5" fill="#DBEAFE" opacity="0.8" />
            <path
              d={`M ${cx - bowlRadius - 5} ${basinWaterY} Q ${cx - bowlRadius + 10} ${bowlRimY + 10} ${cx} ${bowlRimY + 15} Q ${cx + bowlRadius - 10} ${bowlRimY + 10} ${cx + bowlRadius + 5} ${basinWaterY}`}
              fill="none"
              stroke="#93C5FD"
              strokeWidth="3"
              strokeDasharray="4 3"
              opacity="0.9"
            />
          </g>
        )}
      </g>

      {/* 7. ANNOTATION LABELS & MEASUREMENT BRACKETS */}
      {showLabels && (
        <g className="font-mono text-[11px] select-none">
          {/* Freeboard dimension line */}
          {freeboardPx > 4 && !isSinking && (
            <g>
              <line
                x1={cx + bowlRadius + 16}
                y1={bowlRimY}
                x2={cx + bowlRadius + 32}
                y2={bowlRimY}
                stroke="#6366F1"
                strokeWidth="1"
              />
              <line
                x1={cx + bowlRadius + 16}
                y1={basinWaterY}
                x2={cx + bowlRadius + 32}
                y2={basinWaterY}
                stroke="#6366F1"
                strokeWidth="1"
              />
              <line
                x1={cx + bowlRadius + 24}
                y1={bowlRimY}
                x2={cx + bowlRadius + 24}
                y2={basinWaterY}
                stroke="#6366F1"
                strokeWidth="1.5"
              />
              <text
                x={cx + bowlRadius + 36}
                y={(bowlRimY + basinWaterY) / 2 + 4}
                fill="#4F46E5"
                className="font-bold fill-indigo-600 dark:fill-indigo-400"
              >
                {freeboardCm !== undefined ? `${freeboardCm.toFixed(1)} cm` : 'Freeboard'}
              </text>
            </g>
          )}

          {/* Submersion depth bracket */}
          <g>
            <line
              x1={cx - bowlRadius - 32}
              y1={basinWaterY}
              x2={cx - bowlRadius - 16}
              y2={basinWaterY}
              stroke="#0284C7"
              strokeWidth="1"
            />
            <line
              x1={cx - bowlRadius - 32}
              y1={bowlBottomY}
              x2={cx - bowlRadius - 16}
              y2={bowlBottomY}
              stroke="#0284C7"
              strokeWidth="1"
            />
            <line
              x1={cx - bowlRadius - 24}
              y1={basinWaterY}
              x2={cx - bowlRadius - 24}
              y2={bowlBottomY}
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <text
              x={cx - bowlRadius - 38}
              y={(basinWaterY + bowlBottomY) / 2 + 4}
              textAnchor="end"
              className="fill-sky-600 dark:fill-sky-400 font-semibold"
            >
              {submersionCm !== undefined ? `${submersionCm.toFixed(1)} cm` : 'Submerged'}
            </text>
          </g>

          {/* Gold needle orifice callout */}
          <path
            d={`M ${cx + 10} ${bowlBottomY + 2} L ${cx + 45} ${bowlBottomY + 22} L ${cx + 85} ${bowlBottomY + 22}`}
            fill="none"
            stroke="#D97706"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x={cx + 90}
            y={bowlBottomY + 26}
            className="fill-amber-700 dark:fill-amber-400 text-[10px]"
          >
            Orifice (~1mm / Gold Needle)
          </text>
        </g>
      )}
    </svg>
  );
};
