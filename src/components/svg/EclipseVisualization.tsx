'use client';

import React, { useState } from 'react';

export interface EclipseVisualizationProps {
  eclipseType: 'lunar' | 'solar';
  progress: number; // 0.0 to 1.0 (0.5 = greatest eclipse)
  magnitude: number; // 0.0 to >1.0
  obscuration: number; // 0.0 to 1.0
  kind?: 'total' | 'partial' | 'annular' | 'penumbral' | 'none';
  moonLatitudeDeg?: number;
  className?: string;
  isEclipse?: boolean;
  viewMode?: 'sky' | 'chedyaka' | 'space';
  onViewModeChange?: (mode: 'sky' | 'chedyaka' | 'space') => void;
}

export const EclipseVisualization: React.FC<EclipseVisualizationProps> = ({
  eclipseType,
  progress,
  magnitude,
  obscuration,
  kind = 'total',
  moonLatitudeDeg = 0,
  className = '',
  isEclipse = true,
  viewMode: propViewMode,
  onViewModeChange,
}) => {
  const [internalViewMode, setInternalViewMode] = useState<'sky' | 'chedyaka' | 'space'>('chedyaka');
  const activeMode = propViewMode ?? internalViewMode;

  const handleSetViewMode = (mode: 'sky' | 'chedyaka' | 'space') => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
  };

  // SVG dimensions
  const width = 640;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;

  // Clamped progress between 0 and 1
  const p = Math.max(0, Math.min(1, progress));

  // Determine current contact stage for badge
  let contactStage = 'Before First Contact (C1)';
  if (p < 0.15) {
    contactStage = 'Pre-contact (Approaching)';
  } else if (p < 0.35) {
    contactStage = 'First Contact (C1: Ingress / Sparśa)';
  } else if (p < 0.65) {
    if (kind === 'total' && (magnitude >= 1.0 || obscuration >= 0.98)) {
      contactStage = 'Totality (Nimīlana - Madhya - Unmīlana)';
    } else {
      contactStage = 'Greatest Eclipse (Madhya / Peak)';
    }
  } else if (p < 0.85) {
    contactStage = 'Third Contact (C3: Egress / Unmīlana)';
  } else {
    contactStage = 'Fourth Contact (C4: Release / Mokṣa)';
  }

  // Calculate coordinates for SKY VIEW
  // -------------------------------------------------------------
  // For Solar: Sun is stationary at center (cx, cy). Moon moves from left (cx - 170) to right (cx + 170).
  const solarSunR = 56;
  const solarMoonR = 57.5; // Moon appears slightly larger than Sun for total solar eclipse
  
  // Moon movement parameter (-1 to +1)
  const normX = (p - 0.5) * 2; // -1 at p=0, 0 at p=0.5, +1 at p=1
  // Minimum distance at closest approach depends on magnitude:
  const minSeparation = Math.max(0, (1 - Math.min(1, magnitude)) * 50);
  const verticalOffset = (moonLatitudeDeg || 0) * 8 + (minSeparation > 0 ? minSeparation * 0.4 : 0);

  const solarMoonX = cx + normX * 170;
  const solarMoonY = cy + verticalOffset;

  // Calculate distance between Sun and Moon centers
  const sunMoonDist = Math.hypot(solarMoonX - cx, solarMoonY - cy);
  const overlapDistance = Math.max(0, solarSunR + solarMoonR - sunMoonDist);
  const currentObscurationPct = Math.min(100, Math.max(0, (overlapDistance / (2 * solarSunR)) * 100));
  const isCurrentlyTotal = sunMoonDist < Math.abs(solarMoonR - solarSunR) + 3;

  // Sky darkening factor for solar eclipse (0 = normal day sky, 1 = total darkness/stars)
  const skyDarkenFactor = Math.min(1, Math.max(0, (currentObscurationPct - 50) / 48));

  // For Lunar: Earth Umbra is stationary at center (cx, cy).
  // Moon moves from left to right through Earth shadow.
  const lunarUmbraR = 64; // ~40 arcminutes mean
  const lunarPenumbraR = 108; // ~70 arcminutes
  const lunarMoonR = 26; // ~16 arcminutes
  
  const lunarMoonX = cx + normX * 190;
  const lunarMoonY = cy - (moonLatitudeDeg * 14) + (normX * 10);

  const lunarDistToUmbra = Math.hypot(lunarMoonX - cx, lunarMoonY - cy);
  const inUmbraFraction = Math.min(1, Math.max(0, (lunarUmbraR + lunarMoonR - lunarDistToUmbra) / (2 * lunarMoonR)));
  const isDeepTotality = lunarDistToUmbra < lunarUmbraR - lunarMoonR * 0.3;

  return (
    <div className={`relative flex flex-col rounded-2xl border border-stone-200 dark:border-stone-800 bg-[#0c0a09] text-white overflow-hidden shadow-lg ${className}`}>
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-300 font-mono">
            {eclipseType === 'lunar' ? 'Chandra Grahaṇa (Lunar)' : 'Sūrya Grahaṇa (Solar)'} Simulation
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
            {contactStage}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex rounded-lg bg-stone-900 p-0.5 border border-stone-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleSetViewMode('chedyaka')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeMode === 'chedyaka'
                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📐 Chedyaka Projection (SS Ch.6)
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('sky')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeMode === 'sky'
                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            🔭 Observer Sky
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('space')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeMode === 'space'
                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            🪐 2D Ray Geometry
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full h-80 sm:h-88 flex items-center justify-center select-none overflow-hidden">
        {activeMode === 'sky' ? (
          // ==================== SKY VIEW ====================
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Solar Eclipse Gradients */}
              <radialGradient id="solarDiscGrad" cx="45%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="40%" stopColor="#FBBF24" />
                <stop offset="85%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#B45309" />
              </radialGradient>

              {/* Corona Glow for Totality */}
              <radialGradient id="coronaGlow" cx="50%" cy="50%" r="50%">
                <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#E0F2FE" stopOpacity="0.5" />
                <stop offset="85%" stopColor="#93C5FD" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </radialGradient>

              {/* Lunar Eclipse Gradients */}
              <radialGradient id="umbraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1C0A0A" />
                <stop offset="70%" stopColor="#2A0808" />
                <stop offset="90%" stopColor="#450A0A" />
                <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.4" />
              </radialGradient>

              <radialGradient id="penumbraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#171717" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#262626" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#404040" stopOpacity="0" />
              </radialGradient>

              {/* Moon Surface Texture / Shading */}
              <radialGradient id="lunarMoonDisc" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="60%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#94A3B8" />
              </radialGradient>

              {/* Blood Moon Totality Shading */}
              <radialGradient id="bloodMoonDisc" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="40%" stopColor="#B91C1C" />
                <stop offset="75%" stopColor="#7F1D1D" />
                <stop offset="100%" stopColor="#450A0A" />
              </radialGradient>

              {/* Custom Arrow Marker */}
              <marker
                id="arrowMarker"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#D97706" />
              </marker>
            </defs>

            {/* Dynamic Sky Background */}
            {eclipseType === 'solar' ? (
              <rect
                width={width}
                height={height}
                fill={
                  skyDarkenFactor > 0.8
                    ? '#05070e'
                    : skyDarkenFactor > 0.4
                    ? '#111827'
                    : '#1e293b'
                }
                className="transition-colors duration-500"
              />
            ) : (
              <rect width={width} height={height} fill="#0a0a0c" />
            )}

            {/* Background Stars (Visible during total solar eclipse or deep lunar eclipse) */}
            {(skyDarkenFactor > 0.6 || eclipseType === 'lunar') && (
              <g opacity={eclipseType === 'solar' ? skyDarkenFactor * 0.9 : 0.6}>
                <circle cx="80" cy="45" r="1" fill="#fff" opacity="0.8" />
                <circle cx="140" cy="90" r="1.5" fill="#bae6fd" opacity="0.9" />
                <circle cx="210" cy="35" r="1" fill="#fff" opacity="0.6" />
                <circle cx="490" cy="65" r="1.5" fill="#fef08a" opacity="0.8" />
                <circle cx="560" cy="40" r="1" fill="#fff" opacity="0.7" />
                <circle cx="530" cy="220" r="1.2" fill="#fff" opacity="0.8" />
                <circle cx="95" cy="240" r="1" fill="#fff" opacity="0.5" />
                <circle cx="160" cy="270" r="1.5" fill="#bae6fd" opacity="0.9" />
              </g>
            )}

            {/* Ecliptic Reference Guide */}
            <line
              x1="30"
              y1={cy}
              x2={width - 30}
              y2={cy}
              stroke="#334155"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x="40"
              y={cy - 8}
              fontSize="9"
              fill="#64748b"
              fontFamily="monospace"
              letterSpacing="1"
            >
              ECLIPTIC PLANE
            </text>

            {/* SOLAR ECLIPSE RENDERING */}
            {eclipseType === 'solar' && (
              <g>
                {/* Corona Glow (Becomes brilliant during totality) */}
                {currentObscurationPct > 80 && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={solarSunR * 2.1}
                    fill="url(#coronaGlow)"
                    opacity={(currentObscurationPct - 80) / 20}
                  />
                )}

                {/* Corona Streamers during Totality */}
                {isCurrentlyTotal && (
                  <g opacity="0.85">
                    {Array.from({ length: 16 }).map((_, i) => {
                      const angle = (i * 360) / 16;
                      const rad = (angle * Math.PI) / 180;
                      const r1 = solarSunR + 4;
                      const r2 = solarSunR + 32 + (i % 3) * 16;
                      return (
                        <line
                          key={i}
                          x1={cx + r1 * Math.cos(rad)}
                          y1={cy + r1 * Math.sin(rad)}
                          x2={cx + r2 * Math.cos(rad)}
                          y2={cy + r2 * Math.sin(rad)}
                          stroke="#E0F2FE"
                          strokeWidth={2 + (i % 2)}
                          strokeLinecap="round"
                          opacity={0.6 + (i % 3) * 0.15}
                        />
                      );
                    })}
                  </g>
                )}

                {/* The Sun Disc */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={solarSunR}
                  fill="url(#solarDiscGrad)"
                  filter="drop-shadow(0 0 16px rgba(245, 158, 11, 0.45))"
                />

                {/* Diamond Ring / Baily's Beads Effect right at ingress/egress of totality */}
                {isCurrentlyTotal && (
                  <circle
                    cx={cx + solarSunR * 0.9}
                    cy={cy - solarSunR * 0.4}
                    r="4"
                    fill="#FFFFFF"
                    filter="drop-shadow(0 0 10px #FFFFFF)"
                  />
                )}

                {/* The Moon Disc (Silhouette occluding the Sun) */}
                <circle
                  cx={solarMoonX}
                  cy={solarMoonY}
                  r={solarMoonR}
                  fill="#0c0a09"
                  stroke="#1c1917"
                  strokeWidth="1"
                />

                {/* Moon Orbit Motion Arrow */}
                <g opacity="0.6">
                  <line
                    x1={solarMoonX - 35}
                    y1={solarMoonY + solarMoonR + 18}
                    x2={solarMoonX + 35}
                    y2={solarMoonY + solarMoonR + 18}
                    stroke="#D97706"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowMarker)"
                  />
                  <text
                    x={solarMoonX}
                    y={solarMoonY + solarMoonR + 30}
                    fontSize="9"
                    fill="#D97706"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    Chandra Vector →
                  </text>
                </g>
              </g>
            )}

            {/* LUNAR ECLIPSE RENDERING */}
            {eclipseType === 'lunar' && (
              <g>
                {/* Penumbra Ring & Fill */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={lunarPenumbraR}
                  fill="url(#penumbraGrad)"
                  stroke="#475569"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
                <text
                  x={cx}
                  y={cy - lunarPenumbraR + 15}
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  EARTH PENUMBRA (Upacchāyā ~70&apos;)
                </text>

                {/* Umbra Ring & Fill */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={lunarUmbraR}
                  fill="url(#umbraGrad)"
                  stroke="#991B1B"
                  strokeWidth="1.5"
                />
                <text
                  x={cx}
                  y={cy + lunarUmbraR - 10}
                  fontSize="9"
                  fill="#EF4444"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  EARTH UMBRA (Bhūcchāyā ~40&apos;)
                </text>

                {/* Center axis mark */}
                <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="#7F1D1D" strokeWidth="1" />
                <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="#7F1D1D" strokeWidth="1" />

                {/* The Moon Disc traversing shadow */}
                <circle
                  cx={lunarMoonX}
                  cy={lunarMoonY}
                  r={lunarMoonR}
                  fill="url(#lunarMoonDisc)"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />

                {/* Coppery/Blood Moon Red Overlay proportional to umbra entry */}
                {inUmbraFraction > 0 && (
                  <circle
                    cx={lunarMoonX}
                    cy={lunarMoonY}
                    r={lunarMoonR}
                    fill="url(#bloodMoonDisc)"
                    opacity={Math.min(1, inUmbraFraction * 1.2)}
                    filter={isDeepTotality ? 'drop-shadow(0 0 12px rgba(220, 38, 38, 0.6))' : undefined}
                  />
                )}

                {/* Moon label */}
                <text
                  x={lunarMoonX}
                  y={lunarMoonY - lunarMoonR - 8}
                  fontSize="10"
                  fill="#E2E8F0"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                  fontWeight="500"
                >
                  Moon (Chandra)
                </text>

                {/* Motion Vector */}
                <line
                  x1={cx - 160}
                  y1={cy + 75}
                  x2={cx + 160}
                  y2={cy + 75}
                  stroke="#64748B"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <circle cx={lunarMoonX} cy={cy + 75} r="3" fill="#D97706" />
                <text
                  x={cx + 170}
                  y={cy + 78}
                  fontSize="8"
                  fill="#94A3B8"
                  fontFamily="monospace"
                >
                  Orbital Motion East →
                </text>
              </g>
            )}
          </svg>
        ) : activeMode === 'chedyaka' ? (
          // ==================== CHEDYAKA PROJECTION VIEW (SS Ch.6) ====================
          <svg
            viewBox="0 0 640 320"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Dark Slate Astronomy Board Background */}
            <rect width="640" height="320" fill="#08080f" />

            {/* Geometry Construction on Left / Center */}
            {(() => {
              const geomCx = 230;
              const geomCy = 160;
              const shadowR = 64; // ~40'
              const moonR = 25.6; // ~16'
              const sumR = shadowR + moonR; // 89.6px (~56')
              const diffR = Math.max(0, shadowR - moonR); // 38.4px (~24')
              const latOffset = Number(((moonLatitudeDeg || 0) * 20).toFixed(2));
              const trackY = geomCy - latOffset;
              const sthitSq = Math.pow(sumR, 2) - Math.pow(latOffset, 2);
              const sthitBase = sthitSq > 0 ? Math.sqrt(sthitSq) : 0;
              const curMoonX = geomCx + (p - 0.5) * 2 * 140;

              return (
                <g>
                  {/* Subtle Board Axes */}
                  <line x1="30" y1={geomCy} x2="430" y2={geomCy} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1={geomCx} y1="20" x2={geomCx} y2="300" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Cardinal Compass Ticks */}
                  <text x={geomCx} y="15" fontSize="8.5" fill="#475569" textAnchor="middle" fontFamily="sans-serif">North (Uttara)</text>
                  <text x={geomCx} y="312" fontSize="8.5" fill="#475569" textAnchor="middle" fontFamily="sans-serif">South (Dakṣiṇa)</text>
                  <text x="35" y={geomCy - 5} fontSize="8.5" fill="#475569" textAnchor="start" fontFamily="sans-serif">East (Pūrva)</text>
                  <text x="425" y={geomCy - 5} fontSize="8.5" fill="#475569" textAnchor="end" fontFamily="sans-serif">West (Paścima)</text>

                  {/* Outer Contact Circle (Māna-aikya-ardha: rs + rm = 56') */}
                  <circle
                    cx={geomCx}
                    cy={geomCy}
                    r={sumR}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.55"
                  />

                  {/* Totality Limit Circle (Māna-viśleṣa-ardha: rs - rm = 24') */}
                  {diffR > 0 && (
                    <circle
                      cx={geomCx}
                      cy={geomCy}
                      r={diffR}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.4"
                    />
                  )}

                  {/* Earth's Shadow Disc (Bhūcchāyā ~40') */}
                  <circle
                    cx={geomCx}
                    cy={geomCy}
                    r={shadowR}
                    fill="#220606"
                    stroke="#B91C1C"
                    strokeWidth="1.5"
                  />
                  <text x={geomCx} y={geomCy + 3} fontSize="9" fill="#EF4444" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
                    Bhūcchāyā (40&apos;)
                  </text>

                  {/* Moon Orbit Chord Line (Track offset by Vikṣepa) */}
                  <line
                    x1="40"
                    y1={trackY}
                    x2="420"
                    y2={trackY}
                    stroke="#6366F1"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    opacity="0.7"
                  />

                  {/* Right Triangle for Sthityardha (Half-Duration) */}
                  {sthitBase > 0 && (
                    <g>
                      {/* Triangle Shading */}
                      <polygon
                        points={`${geomCx},${geomCy} ${geomCx},${trackY} ${geomCx - sthitBase},${trackY}`}
                        fill="#D97706"
                        fillOpacity="0.15"
                        stroke="#D97706"
                        strokeWidth="0.8"
                      />

                      {/* Hypotenuse: (rs + rm) */}
                      <line x1={geomCx} y1={geomCy} x2={geomCx - sthitBase} y2={trackY} stroke="#F59E0B" strokeWidth="1.6" />

                      {/* Perpendicular: Vikṣepa */}
                      <line x1={geomCx} y1={geomCy} x2={geomCx} y2={trackY} stroke="#EF4444" strokeWidth="1.8" />
                      
                      {/* Base: Sthityardha */}
                      <line x1={geomCx} y1={trackY} x2={geomCx - sthitBase} y2={trackY} stroke="#10B981" strokeWidth="2" />

                      {/* Clean Contact Marker Dots & Non-overlapping labels */}
                      <circle cx={geomCx - sthitBase} cy={trackY} r="3" fill="#D97706" />
                      <text x={geomCx - sthitBase} y={trackY - 12} fontSize="8.5" fill="#FBBF24" fontWeight="600" textAnchor="middle">
                        C1 (Sparśa)
                      </text>

                      <circle cx={geomCx + sthitBase} cy={trackY} r="3" fill="#D97706" />
                      <text x={geomCx + sthitBase} y={trackY - 12} fontSize="8.5" fill="#FBBF24" fontWeight="600" textAnchor="middle">
                        C4 (Mokṣa)
                      </text>

                      <circle cx={geomCx} cy={trackY} r="3" fill="#EF4444" />
                      <text x={geomCx} y={trackY + (latOffset > 0 ? 14 : -8)} fontSize="8.5" fill="#F87171" fontWeight="600" textAnchor="middle">
                        Madhya (Peak)
                      </text>
                    </g>
                  )}

                  {/* Traversing Moon Disc */}
                  <g>
                    <circle
                      cx={curMoonX}
                      cy={trackY}
                      r={moonR}
                      fill="#E2E8F0"
                      stroke="#94A3B8"
                      strokeWidth="1.2"
                      opacity="0.9"
                    />
                    <circle cx={curMoonX} cy={trackY} r="2" fill="#1E293B" />
                    <text x={curMoonX} y={trackY - moonR - 4} fontSize="8.5" fill="#E2E8F0" fontWeight="600" textAnchor="middle">
                      Chandra
                    </text>
                  </g>

                  {/* RIGHT PANEL: Dedicated Siddhāntic Chedyaka Geometry HUD */}
                  <g transform="translate(445, 30)">
                    <rect width="180" height="260" rx="12" fill="#0f111a" stroke="#1e293b" strokeWidth="1" />
                    <text x="14" y="24" fontSize="10" fill="#F8FAFC" fontWeight="bold">
                      Chedyaka Geometry Key
                    </text>
                    <text x="14" y="38" fontSize="8" fill="#64748B" fontFamily="monospace">
                      Sūrya Siddhānta Ch. 6
                    </text>
                    <line x1="14" y1="46" x2="166" y2="46" stroke="#1e293b" strokeWidth="1" />

                    {/* Legend Rows */}
                    <g transform="translate(14, 62)">
                      <circle cx="5" cy="4" r="4" fill="#B91C1C" />
                      <text x="14" y="7" fontSize="8.5" fill="#94A3B8">Bhūcchāyā (Shadow)</text>
                      <text x="150" y="7" fontSize="8.5" fill="#EF4444" fontWeight="600" textAnchor="end" fontFamily="monospace">40.0&apos;</text>
                    </g>

                    <g transform="translate(14, 86)">
                      <circle cx="5" cy="4" r="4" fill="#E2E8F0" />
                      <text x="14" y="7" fontSize="8.5" fill="#94A3B8">Chandra (Moon Disc)</text>
                      <text x="150" y="7" fontSize="8.5" fill="#E2E8F0" fontWeight="600" textAnchor="end" fontFamily="monospace">16.0&apos;</text>
                    </g>

                    <g transform="translate(14, 110)">
                      <circle cx="5" cy="4" r="4" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                      <text x="14" y="7" fontSize="8.5" fill="#94A3B8">Māna-aikya (rs + rm)</text>
                      <text x="150" y="7" fontSize="8.5" fill="#F59E0B" fontWeight="600" textAnchor="end" fontFamily="monospace">56.0&apos;</text>
                    </g>

                    <g transform="translate(14, 134)">
                      <line x1="2" y1="4" x2="9" y2="4" stroke="#EF4444" strokeWidth="2" />
                      <text x="14" y="7" fontSize="8.5" fill="#94A3B8">Vikṣepa (Latitude β)</text>
                      <text x="150" y="7" fontSize="8.5" fill="#EF4444" fontWeight="600" textAnchor="end" fontFamily="monospace">
                        {(Math.abs(moonLatitudeDeg || 0) * 60).toFixed(1)}&apos;
                      </text>
                    </g>

                    <g transform="translate(14, 158)">
                      <line x1="2" y1="4" x2="9" y2="4" stroke="#10B981" strokeWidth="2" />
                      <text x="14" y="7" fontSize="8.5" fill="#94A3B8">Sthityardha Base</text>
                      <text x="150" y="7" fontSize="8.5" fill="#10B981" fontWeight="600" textAnchor="end" fontFamily="monospace">
                        {sthitBase > 0 ? (sthitBase / shadowR * 40).toFixed(1) : '0'}&apos;
                      </text>
                    </g>

                    <line x1="14" y1="178" x2="166" y2="178" stroke="#1e293b" strokeWidth="1" />

                    {/* Half Duration Readout */}
                    <g transform="translate(14, 196)">
                      <text x="0" y="0" fontSize="8" fill="#64748B" letterSpacing="0.5">CALCULATED HALF-DURATION</text>
                      <text x="0" y="16" fontSize="12" fill="#38BDF8" fontWeight="bold" fontFamily="monospace">
                        {sthitBase > 0 ? ((sthitBase / shadowR * 40) / 12.19).toFixed(1) : '0'} ghaṭī
                      </text>
                      <text x="0" y="28" fontSize="8" fill="#94A3B8">
                        ≈ {sthitBase > 0 ? (((sthitBase / shadowR * 40) / 12.19) * 24).toFixed(0) : '0'} minutes
                      </text>
                    </g>

                    {/* Status Pill */}
                    <g transform="translate(14, 234)">
                      <rect width="152" height="18" rx="5" fill={sthitBase > 0 ? '#1e1b4b' : '#1c1917'} />
                      <text x="76" y="12" fontSize="8" fill={sthitBase > 0 ? '#818CF8' : '#78716C'} textAnchor="middle" fontWeight="bold">
                        {sthitBase > 0 ? '✓ Eclipse Contact Formed' : '✗ Clear Miss (No Contact)'}
                      </text>
                    </g>
                  </g>
                </g>
              );
            })()}
          </svg>
        ) : (
          // ==================== SPACE GEOMETRY VIEW ====================
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Dark Space Background */}
            <rect width={width} height={height} fill="#050508" />

            {/* Distant Star field */}
            {Array.from({ length: 24 }).map((_, i) => (
              <circle
                key={i}
                cx={(i * 37) % width}
                cy={(i * 53) % height}
                r={(i % 3 === 0) ? 1.4 : 0.8}
                fill="#FFFFFF"
                opacity={0.3 + (i % 4) * 0.2}
              />
            ))}

            {eclipseType === 'lunar' ? (
              // Lunar Eclipse Space Diagram: Sun (left) -> Earth (middle) -> Shadow cone -> Moon (right)
              <g>
                {/* Sun (partial disk on left) */}
                <circle cx="20" cy={cy} r="65" fill="#F59E0B" opacity="0.9" />
                <text x="25" y={cy + 4} fontSize="11" fill="#FFFFFF" fontWeight="600" textAnchor="middle">
                  Sūrya
                </text>

                {/* Earth at middle */}
                <circle cx="230" cy={cy} r="22" fill="#2563EB" stroke="#60A5FA" strokeWidth="1.5" />
                <text x="230" y={cy + 4} fontSize="9" fill="#FFFFFF" fontWeight="600" textAnchor="middle">
                  Earth
                </text>

                {/* Solar Light Rays forming Umbra cone */}
                <line x1="20" y1={cy - 65} x2="230" y2={cy - 22} stroke="#FBBF24" strokeWidth="1" opacity="0.5" strokeDasharray="3 3" />
                <line x1="20" y1={cy + 65} x2="230" y2={cy + 22} stroke="#FBBF24" strokeWidth="1" opacity="0.5" strokeDasharray="3 3" />

                {/* Umbra Shadow Cone (converging to apex behind Earth) */}
                <polygon
                  points={`230,${cy - 22} 230,${cy + 22} 550,${cy}`}
                  fill="#1E1B4B"
                  opacity="0.85"
                  stroke="#3730A3"
                  strokeWidth="0.8"
                />

                {/* Penumbra Cone (diverging outwards) */}
                <polygon
                  points={`230,${cy - 22} 230,${cy + 22} 600,${cy + 95} 600,${cy - 95}`}
                  fill="#1E293B"
                  opacity="0.25"
                />

                {/* Moon Orbit Arc (Tilted ~5° to ecliptic) */}
                <line
                  x1="390"
                  y1={cy - 70}
                  x2="450"
                  y2={cy + 70}
                  stroke="#64748B"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text x="455" y={cy + 65} fontSize="9" fill="#94A3B8" fontFamily="monospace">
                  Lunar Orbit (5° Tilt)
                </text>

                {/* Nodes: Rahu / Ketu Marker */}
                <circle cx="420" cy={cy} r="4" fill="#DC2626" />
                <text x="420" y={cy - 9} fontSize="9" fill="#EF4444" fontWeight="600" textAnchor="middle">
                  Rāhu (Node)
                </text>

                {/* Orbiting Moon passing through cone */}
                <circle
                  cx={395 + p * 50}
                  cy={cy - 55 + p * 110}
                  r="10"
                  fill={p > 0.35 && p < 0.65 ? '#B91C1C' : '#E2E8F0'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  filter={p > 0.35 && p < 0.65 ? 'drop-shadow(0 0 6px #EF4444)' : undefined}
                />
                <text
                  x={395 + p * 50}
                  y={cy - 70 + p * 110}
                  fontSize="9"
                  fill="#F8FAFC"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  Moon
                </text>

                <text x="480" y={cy - 12} fontSize="10" fill="#A5B4FC" fontFamily="monospace">
                  Earth&apos;s Umbra Cone
                </text>
              </g>
            ) : (
              // Solar Eclipse Space Diagram: Sun (left) -> Moon (center) -> Shadow cone hits Earth (right)
              <g>
                {/* Sun */}
                <circle cx="40" cy={cy} r="65" fill="#F59E0B" opacity="0.9" />
                <text x="45" y={cy + 4} fontSize="11" fill="#FFFFFF" fontWeight="600" textAnchor="middle">
                  Sūrya
                </text>

                {/* Moon in center */}
                <circle cx="280" cy={cy + (normX * 12)} r="12" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
                <text x="280" y={cy + (normX * 12) - 18} fontSize="9" fill="#E2E8F0" fontWeight="600" textAnchor="middle">
                  Chandra
                </text>

                {/* Earth on right */}
                <circle cx="500" cy={cy} r="32" fill="#2563EB" stroke="#60A5FA" strokeWidth="2" />
                <text x="500" y={cy + 4} fontSize="10" fill="#FFFFFF" fontWeight="600" textAnchor="middle">
                  Earth (Bhū)
                </text>

                {/* Moon's shadow cone projecting towards Earth */}
                <polygon
                  points={`280,${cy - 12 + (normX * 12)} 280,${cy + 12 + (normX * 12)} 500,${cy + (normX * 24)}`}
                  fill="#000000"
                  opacity="0.8"
                  stroke="#475569"
                  strokeWidth="0.8"
                />

                {/* Penumbra cone diverging onto Earth */}
                <polygon
                  points={`280,${cy - 12 + (normX * 12)} 280,${cy + 12 + (normX * 12)} 500,${cy + 28 + (normX * 24)} 500,${cy - 28 + (normX * 24)}`}
                  fill="#334155"
                  opacity="0.3"
                />

                {/* Shadow footprint on Earth */}
                {Math.abs(normX) < 0.3 && (
                  <circle
                    cx="472"
                    cy={cy + (normX * 24)}
                    r="4.5"
                    fill="#000000"
                    stroke="#EF4444"
                    strokeWidth="1"
                  />
                )}

                <text x="350" y={cy - 35} fontSize="9" fill="#FBBF24" fontFamily="monospace">
                  Lunar Umbra Spot on Earth →
                </text>
              </g>
            )}
          </svg>
        )}

        {/* Live Telemetry Floating Pill */}
        <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-2 bg-stone-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-800 text-[11px] font-mono text-stone-300">
          <span>Magnitude: <strong className="text-amber-400">{magnitude.toFixed(2)}</strong></span>
          <span className="text-stone-600">|</span>
          <span>Obscuration: <strong className="text-amber-400">{(obscuration * 100).toFixed(1)}%</strong></span>
          <span className="text-stone-600">|</span>
          <span className="capitalize">Type: <strong className="text-indigo-400">{kind}</strong></span>
        </div>
      </div>
    </div>
  );
};
