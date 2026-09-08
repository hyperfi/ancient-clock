'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ModuleLayout, ProvenanceLabel, SourceTooltip } from '@/components/ui';
import { getTithiInfo, computeElongation, timeToNextTithi, isEclipsePossible } from '@/lib/lunar';

const MoonOrbit3D = dynamic(
  () => import('@/components/three/MoonOrbit3D').then((m) => m.MoonOrbit3D),
  { ssr: false }
);

const MOON_DAILY_MOTION = 13.17639;
const SUN_DAILY_MOTION = 0.98565;
const NODE_DAILY_MOTION = -0.05295; // Retrograde

export default function MoonCalendarPage() {
  const [timeDays, setTimeDays] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const carouselRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      if (isPlaying) {
        const delta = (time - lastTime) / 1000;
        // 1 second real time = 2 days simulated
        setTimeDays(prev => (prev + delta * 2) % 365);
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Positions
  const startSunLon = 0;
  const startMoonLon = 0;
  const startNodeLon = 345; 
  
  const sunLon = (startSunLon + timeDays * SUN_DAILY_MOTION) % 360;
  const moonLon = (startMoonLon + timeDays * MOON_DAILY_MOTION) % 360;
  let nodeLon = (startNodeLon + timeDays * NODE_DAILY_MOTION) % 360;
  if (nodeLon < 0) nodeLon += 360;
  
  const elongation = computeElongation(moonLon, sunLon);
  const tithiInfo = getTithiInfo(elongation);
  const hrsToNext = timeToNextTithi(elongation);
  
  const isSyzygy = elongation < 12 || elongation > 348 || (elongation > 168 && elongation < 192);
  const isSolar = elongation < 12 || elongation > 348;
  const eclipseWarning = isSyzygy && isEclipsePossible(moonLon, nodeLon, isSolar);
  
  let phaseName = 'Waxing Crescent';
  if (elongation < 12) phaseName = 'New Moon (Amāvasyā)';
  else if (elongation < 84) phaseName = 'Waxing Crescent (Śukla)';
  else if (elongation < 108) phaseName = 'First Quarter (Aṣṭamī)';
  else if (elongation < 168) phaseName = 'Waxing Gibbous';
  else if (elongation < 192) phaseName = 'Full Moon (Pūrṇimā)';
  else if (elongation < 264) phaseName = 'Waning Gibbous';
  else if (elongation < 288) phaseName = 'Last Quarter (Aṣṭamī)';
  else phaseName = 'Waning Crescent (Kṛṣṇa)';

  const cx = 250;
  const cy = 250;
  const r = 160;

  const getPos = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: Number((cx + radius * Math.cos(rad)).toFixed(2)),
      y: Number((cy - radius * Math.sin(rad)).toFixed(2))
    };
  };

  const sunPos = getPos(sunLon, r + 40);
  const moonPos = getPos(moonLon, r);
  const nodePos = getPos(nodeLon, r + 15);
  const descNodePos = getPos((nodeLon + 180) % 360, r + 15);

  // Jump to specific tithi (1 to 30)
  const handleJumpToTithi = (tithiIndex: number) => {
    // Each tithi is 12 degrees elongation
    // Synodic period is ~29.53 days, so ~0.984 days per tithi
    const targetElongation = (tithiIndex - 1) * 12 + 6;
    const currentSynodicDay = timeDays % 29.53059;
    const targetSynodicDay = (targetElongation / 360) * 29.53059;
    const dayDelta = targetSynodicDay - currentSynodicDay;
    setTimeDays((prev) => Math.max(0, prev + dayDelta));
  };

  // Helper function to render an accurate Moon phase thumbnail
  const renderMoonPhaseSvg = (tithiNum: number, size = 28) => {
    const rad = size / 2;
    const el = (tithiNum - 0.5) * 12; // 0 to 360
    const isWaxing = el < 180;
    const cosAngle = Math.cos((el * Math.PI) / 180);
    const rx = Number(Math.max(0.5, rad * Math.abs(cosAngle)).toFixed(2));
    const sweep = (isWaxing && cosAngle < 0) || (!isWaxing && cosAngle >= 0) ? 1 : 0;

    return (
      <svg width={size} height={size} viewBox={`-${rad} -${rad} ${size} ${size}`} className="shrink-0">
        {/* Dark base disc */}
        <circle cx="0" cy="0" r={rad - 1} fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
        {/* Lit portion */}
        {tithiNum === 15 ? (
          <circle cx="0" cy="0" r={rad - 1} fill="#F8FAFC" />
        ) : tithiNum === 30 ? null : isWaxing ? (
          <path
            d={`M 0 -${rad - 1} A ${rad - 1} ${rad - 1} 0 0 1 0 ${rad - 1} A ${rx} ${rad - 1} 0 0 ${sweep} 0 -${rad - 1} Z`}
            fill="#F8FAFC"
          />
        ) : (
          <path
            d={`M 0 -${rad - 1} A ${rad - 1} ${rad - 1} 0 0 0 0 ${rad - 1} A ${rx} ${rad - 1} 0 0 ${sweep} 0 -${rad - 1} Z`}
            fill="#F8FAFC"
          />
        )}
      </svg>
    );
  };

  return (
    <ModuleLayout
      title="Moon & Calendar"
      subtitle="Tithi Explorer & Synodic Lunar Days"
    >
      <div className="flex flex-col gap-8 pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* ========================================================================= */}
          {/* 1. INTERACTIVE ORBITAL TITHI VISUALIZATION (3D / 2D)                       */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-[#141210] rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col items-center overflow-hidden">

            {/* ── 2D / 3D Toggle Bar ── */}
            <div className="w-full flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                {viewMode === '3d' ? 'Interactive 3D Orbit' : '2D Orbital Diagram'}
              </span>
              <div className="flex rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 p-0.5 border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 min-h-[34px] ${
                    viewMode === '3d'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <span>🌐</span> 3D
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 min-h-[34px] ${
                    viewMode === '2d'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <span>📐</span> 2D
                </button>
              </div>
            </div>

            {/* ── 3D View ── */}
            {viewMode === '3d' && (
              <div className="w-full aspect-square max-h-[380px] sm:max-h-[520px]">
                <MoonOrbit3D
                  sunLon={sunLon}
                  moonLon={moonLon}
                  nodeLon={nodeLon}
                  elongation={elongation}
                  tithiNumber={tithiInfo.number}
                />
              </div>
            )}

            {/* ── 2D SVG View (original diagram, preserved exactly) ── */}
            {viewMode === '2d' && (
              <div className="p-3 sm:p-4 w-full flex flex-col items-center">
                <svg viewBox="0 0 500 500" className="w-full h-auto max-w-md select-none">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#D97706" />
                    </marker>
                  </defs>

                  {/* 30 Tithi Radial Wedge Sectors */}
                  {Array.from({ length: 30 }).map((_, i) => {
                    const startAngle = sunLon + i * 12;
                    const endAngle = sunLon + (i + 1) * 12;
                    const isCurrent = i + 1 === tithiInfo.number;
                    
                    const p1 = getPos(startAngle, r);
                    const p2 = getPos(endAngle, r);
                    
                    return (
                      <path 
                        key={i}
                        d={`M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 0 ${p2.x} ${p2.y} Z`}
                        className={`transition-colors duration-300 ${
                          isCurrent 
                            ? 'fill-amber-200 dark:fill-amber-950/80 stroke-[#D97706]' 
                            : (i % 2 === 0 
                              ? 'fill-stone-100/90 dark:fill-stone-900/90 stroke-stone-200 dark:stroke-stone-800' 
                              : 'fill-stone-50/70 dark:fill-stone-900/40 stroke-stone-200 dark:stroke-stone-800')
                        }`}
                        strokeWidth={isCurrent ? "2" : "0.5"}
                      />
                    );
                  })}

                  {/* Orbital guide track */}
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-stone-300 dark:text-stone-700" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

                  {/* Central Earth (Bhū) */}
                  <circle cx={cx} cy={cy} r={10} fill="#2563EB" stroke="#60A5FA" strokeWidth="1.5" />
                  <text x={cx} y={cy + 24} textAnchor="middle" fontSize="13" fill="#2563EB" fontWeight="600">Earth (Bhū)</text>

                  {/* Sun Ray Direction */}
                  <line 
                    x1={cx} y1={cy} 
                    x2={sunPos.x} y2={sunPos.y} 
                    stroke="#D97706" 
                    strokeWidth="2" 
                    strokeDasharray="4 2"
                  />
                  <circle cx={sunPos.x} cy={sunPos.y} r={12} fill="#D97706" />
                  <text 
                    x={sunPos.x > cx ? sunPos.x - 18 : sunPos.x + 18} 
                    y={sunPos.y + 4} 
                    textAnchor={sunPos.x > cx ? "end" : "start"} 
                    fontSize="13" 
                    fill="#D97706" 
                    fontWeight="600"
                  >
                    Sun Vector
                  </text>

                  {/* Elongation Arc */}
                  <path
                    d={`M ${getPos(sunLon, 42).x} ${getPos(sunLon, 42).y} A 42 42 0 ${elongation > 180 ? 1 : 0} 0 ${getPos(moonLon, 42).x} ${getPos(moonLon, 42).y}`}
                    fill="none"
                    stroke="#4338CA"
                    strokeWidth="2.5"
                    opacity="0.8"
                  />

                  {/* Realistic Illuminated Moon Disk */}
                  <g transform={`translate(${moonPos.x}, ${moonPos.y})`}>
                    <circle cx="0" cy="0" r="13" fill="#1E293B" stroke="#94A3B8" strokeWidth="1" />
                    {/* Lit phase path */}
                    {elongation > 5 && elongation < 355 && (
                      <path
                        d={`M 0 -13 A 13 13 0 0 ${elongation < 180 ? 1 : 0} 0 13 A ${Number(Math.max(0.5, 13 * Math.abs(Math.cos((elongation * Math.PI) / 180))).toFixed(2))} 13 0 0 ${
                          (elongation < 180 && Math.cos((elongation * Math.PI) / 180) < 0) ||
                          (elongation >= 180 && Math.cos((elongation * Math.PI) / 180) >= 0)
                            ? 1
                            : 0
                        } 0 -13 Z`}
                        fill="#F8FAFC"
                      />
                    )}
                    {elongation >= 170 && elongation <= 190 && (
                      <circle cx="0" cy="0" r="13" fill="#F8FAFC" />
                    )}
                    <text x="0" y="24" fontSize="13" fill="currentColor" className="text-stone-700 dark:text-stone-300 font-semibold" textAnchor="middle">
                      Chandra
                    </text>
                  </g>
                  
                  {/* Lunar Nodes: Rāhu & Ketu */}
                  <g opacity="0.85">
                    <circle cx={nodePos.x} cy={nodePos.y} r="7" fill="#B91C1C" />
                    <text x={nodePos.x} y={nodePos.y - 11} textAnchor="middle" fontSize="12" fill="#B91C1C" fontWeight="bold">Rāhu</text>
                    
                    <circle cx={descNodePos.x} cy={descNodePos.y} r="7" fill="#B91C1C" />
                    <text x={descNodePos.x} y={descNodePos.y - 11} textAnchor="middle" fontSize="12" fill="#B91C1C" fontWeight="bold">Ketu</text>
                  </g>
                </svg>
              </div>
            )}

            {/* Time Slider & Playback Controls */}
            <div className="w-full px-4 pb-4 sm:px-6 sm:pb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-stone-600 dark:text-stone-400">
                <span className="font-mono text-xs sm:text-sm">Simulated: Day {timeDays.toFixed(1)}</span>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors shadow-sm min-h-[36px]"
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play Orbit'}
                </button>
              </div>

              {/* Slider with Touch Steppers */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimeDays((prev) => Math.max(0, Number((prev - 1).toFixed(1))))}
                  className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded text-xs font-semibold min-h-[36px] min-w-[38px] transition-colors"
                  title="Previous Day"
                >
                  -1d
                </button>
                <input
                  type="range"
                  min="0"
                  max="365"
                  step="0.1"
                  value={timeDays}
                  onChange={(e) => setTimeDays(parseFloat(e.target.value))}
                  className="flex-1 h-2.5 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#4338CA]"
                />
                <button
                  type="button"
                  onClick={() => setTimeDays((prev) => Math.min(365, Number((prev + 1).toFixed(1))))}
                  className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded text-xs font-semibold min-h-[36px] min-w-[38px] transition-colors"
                  title="Next Day"
                >
                  +1d
                </button>
                <button
                  type="button"
                  onClick={() => setTimeDays(0)}
                  className="px-2 py-1.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded text-xs min-h-[36px] transition-colors"
                  title="Reset to Day 0"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. TITHI METROLOGY & EDUCATIONAL SIDEBAR                                 */}
          {/* ========================================================================= */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#141210] rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-200 dark:border-stone-800 space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 gap-2 sm:gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-0.5">
                    Active Tithi
                  </h3>
                  <div className="text-xl sm:text-2xl text-[#D97706] font-medium flex items-baseline gap-2.5">
                    <span>{tithiInfo.name}</span>
                    <span className="text-lg sm:text-xl text-stone-400 font-serif">{tithiInfo.devanagari}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 capitalize mt-0.5">
                    {tithiInfo.paksha} Paksha • Tithi {tithiInfo.number} / 15
                  </div>
                </div>
                <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <ProvenanceLabel type="documented" />
                  <div className="mt-0 sm:mt-1">
                    <SourceTooltip 
                      source="Sūrya Siddhānta"
                      chapter="2"
                      verse="66"
                      translation="The time in which the moon, moving faster, leaves the sun behind by twelve degrees is a tithi."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#FEFDF5] dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
                  <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Elongation Angle</div>
                  <div className="text-xl font-medium text-[#4338CA] dark:text-indigo-400 font-mono">
                    {elongation.toFixed(1)}°
                  </div>
                </div>
                <div className="bg-[#FEFDF5] dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
                  <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Visual Phase</div>
                  <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    {phaseName}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 dark:text-stone-400">Time to next tithi boundary:</span>
                  <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                    ~{hrsToNext.toFixed(1)} hours
                  </span>
                </div>
                
                {eclipseWarning && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 animate-pulse">
                    <span className="text-red-600 dark:text-red-400 text-base">⚠</span>
                    <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                      <strong>Grahaṇa (Eclipse) Hazard Zone:</strong> Syzygy (New/Full Moon) is taking place within the nodal limit of Rāhu/Ketu. An eclipse is geometrically possible this month!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Core Epistemological Points */}
            <div className="bg-white dark:bg-[#141210] rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-800 space-y-4">
              <h3 className="text-base font-semibold text-charcoal dark:text-stone-100">
                Foundations of the Tithi System
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <p>
                    A tithi is <strong>NOT a 24-hour civil day</strong>. It is defined strictly by relative angular motion: the time required for the Moon to advance 12° relative to the Sun.
                  </p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <p>
                    Because the Moon orbits along an eccentric ellipse (modeled with an epicyclic <em>manda</em> correction), its daily motion ranges from 11.8° to 15.3°. Consequently, a tithi can last from <strong>19 to 26 hours</strong>.
                  </p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <p>
                    When a rapid tithi begins after one sunrise and ends before the next sunrise, it does not touch any civil dawn. In the Hindu calendar, this tithi is deemed <strong>Kṣaya (lost / omitted)</strong>.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. 30-TITHI LUNATION CAROUSEL STRIP                                      */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#141210] p-4 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-charcoal dark:text-stone-200">
                Complete 30-Tithi Lunation Cycle (Click Any Tithi to Jump)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                15 Tithis of Śukla Pakṣa (Waxing to Pūrṇimā) followed by 15 Tithis of Kṛṣṇa Pakṣa (Waning to Amāvasyā)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Active: Tithi {tithiInfo.number}
              </span>
            </div>
          </div>

          <div ref={carouselRef} className="overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 min-w-max px-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const tithiIndex = i + 1;
                const isCurrent = tithiIndex === tithiInfo.number;
                const isWaxing = tithiIndex <= 15;
                const dayInPaksha = isWaxing ? tithiIndex : tithiIndex - 15;

                return (
                  <button
                    key={tithiIndex}
                    type="button"
                    data-active={isCurrent ? "true" : "false"}
                    onClick={() => handleJumpToTithi(tithiIndex)}
                    className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all w-16 sm:w-16 text-center min-h-[44px] ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/60 shadow-md ring-2 ring-amber-500/50'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/40 dark:bg-stone-900/40'
                    }`}
                  >
                    {renderMoonPhaseSvg(tithiIndex, 28)}
                    <span className="text-xs font-mono font-semibold text-stone-800 dark:text-stone-200">
                      T{tithiIndex}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                      {isWaxing ? `Ś${dayInPaksha}` : `K${dayInPaksha}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </ModuleLayout>
  );
}
