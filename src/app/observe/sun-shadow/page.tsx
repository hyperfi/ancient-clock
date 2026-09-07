'use client';

import React, { useState, useEffect } from 'react';
import { ModuleLayout, ThenNowToggle, SourceTooltip, ProvenanceLabel } from '@/components/ui';
import { shadowLengthFromAltitude, STANDARD_GNOMON_HEIGHT } from '@/lib/solar/altitude';
import { R } from '@/lib/solar/sineTable';

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function calculateSolarPosition(date: Date, lat: number, hour: number) {
  const dayOfYear = getDayOfYear(date);
  const decDeg = 23.44 * Math.sin((2 * Math.PI / 365) * (284 + dayOfYear));
  const decRad = decDeg * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const hourAngleDeg = (hour - 12) * 15;
  const hourAngleRad = hourAngleDeg * Math.PI / 180;
  
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad);
  const altRad = Math.asin(sinAlt);
  const altDeg = altRad * 180 / Math.PI;
  return { altitude: altDeg, declination: decDeg };
}

export default function SunShadowPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lat, setLat] = useState(28.61);
  const [timeOfDay, setTimeOfDay] = useState(12);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isHistorical, setIsHistorical] = useState(true);
  
  const [challengeMode, setChallengeMode] = useState(false);
  const [guessTime, setGuessTime] = useState(12);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const animate = () => {
      if (isAutoPlay) {
        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        setTimeOfDay((prev) => {
          let next = prev + dt * 2;
          if (next > 24) next = 0;
          return next;
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAutoPlay) {
      lastTime = Date.now();
      animate();
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoPlay]);

  const { altitude } = calculateSolarPosition(new Date(date), lat, timeOfDay);
  const isNight = altitude < 0;
  const clampedAltitude = Math.max(0.001, altitude);
  const shadowLength = isNight ? 0 : shadowLengthFromAltitude(STANDARD_GNOMON_HEIGHT, clampedAltitude);
  const zDistance = 90 - clampedAltitude;
  
  const h = Math.floor(timeOfDay);
  const m = Math.floor((timeOfDay - h) * 60);
  const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  
  const timeSinceSunrise = timeOfDay >= 6 ? timeOfDay - 6 : 0;
  const ghatikas = timeSinceSunrise * 2.5;
  const g = Math.floor(ghatikas);
  const v = Math.floor((ghatikas - g) * 60);
  const ghatikaStr = `${g}g ${v}v`;

  const scale = 15;
  const svgWidth = 800;
  const svgHeight = 400;
  const originX = 150;
  const originY = 320;
  
  const gnomonSvgHeight = STANDARD_GNOMON_HEIGHT * scale;
  const shadowSvgLength = shadowLength * scale;
  const arcRadius = 250;
  const sunX = originX + arcRadius * Math.cos(clampedAltitude * Math.PI / 180);
  const sunY = originY - arcRadius * Math.sin(clampedAltitude * Math.PI / 180);

  // Dynamic sky gradient based on time of day
  const skyGrad = isNight 
    ? 'from-[#0b0f19] to-[#020617]' 
    : (timeOfDay < 7 || timeOfDay > 17)
    ? 'from-[#fdba74]/20 via-[#fca5a5]/15 to-[#38bdf8]/10'
    : 'from-[#bae6fd]/30 via-[#e0f2fe]/20 to-transparent';

  return (
    <ModuleLayout title="Śaṅku — The Gnomon" subtitle="Interactive Gnomon & Solar Altitude Simulator">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-4">
          <div className={`border border-stone-200 dark:border-stone-800 shadow-sm rounded-xl overflow-hidden relative bg-gradient-to-b ${skyGrad} transition-colors duration-700`} style={{ aspectRatio: '2/1' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
              <defs>
                <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#78716c" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#78716c" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Ground Plane */}
              <rect x="0" y={originY} width={svgWidth} height={svgHeight - originY} fill="url(#groundGrad)" />
              <line x1="0" y1={originY} x2={svgWidth} y2={originY} stroke="currentColor" className="text-stone-300 dark:text-stone-700" strokeWidth="2" />
              
              {/* Ground Direction Labels */}
              <text x="30" y={originY + 22} fontSize="11" fill="currentColor" className="text-stone-400 font-mono">
                ← Sūryodaya (East)
              </text>
              <text x={svgWidth - 30} y={originY + 22} fontSize="11" fill="currentColor" className="text-stone-400 font-mono" textAnchor="end">
                Sūryāsta (West) →
              </text>

              {!isNight && (
                <>
                  {/* Altitude arc guide */}
                  <path d={`M ${originX + arcRadius} ${originY} A ${arcRadius} ${arcRadius} 0 0 0 ${originX - arcRadius} ${originY}`} fill="none" stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeWidth="2" strokeDasharray="4 4" />
                  
                  {/* Sun Glow & Disk */}
                  <circle cx={sunX} cy={sunY} r="18" fill="#FBBF24" opacity="0.35" />
                  <circle cx={sunX} cy={sunY} r="12" fill="#D97706" />
                  
                  {/* Solar Ray Hypotenuse (Karṇa) */}
                  <line x1={originX} y1={originY - gnomonSvgHeight} x2={originX + shadowSvgLength} y2={originY} stroke="#4338CA" strokeWidth="1.5" strokeDasharray="5 5" />
                  
                  {/* Altitude Angle Marker */}
                  <path d={`M ${originX + shadowSvgLength - 30} ${originY} A 30 30 0 0 0 ${originX + shadowSvgLength - 30 * Math.cos(clampedAltitude * Math.PI / 180)} ${originY - 30 * Math.sin(clampedAltitude * Math.PI / 180)}`} fill="none" stroke="#4338CA" strokeWidth="2" />
                  <text x={originX + shadowSvgLength - 10} y={originY - 10} fontSize="14" fill="#4338CA" textAnchor="end" fontWeight="500">
                    {clampedAltitude.toFixed(1)}°
                  </text>
                  
                  {/* Shadow Cast on Ground */}
                  <line x1={originX} y1={originY} x2={originX + shadowSvgLength} y2={originY} stroke="currentColor" className="text-stone-800 dark:text-stone-200" strokeWidth="7" strokeLinecap="round" opacity="0.75" />
                  
                  {!challengeMode && (
                    <text x={originX + 18} y={originY - gnomonSvgHeight / 2} fontSize="13" fill="currentColor" className="text-stone-700 dark:text-stone-300 font-mono" opacity="0.9">
                      tan(h) = 12 / chāyā
                    </text>
                  )}
                </>
              )}

              {/* Gnomon Post (12 Angulas) */}
              <line x1={originX} y1={originY} x2={originX} y2={originY - gnomonSvgHeight} stroke="currentColor" className="text-stone-900 dark:text-stone-100" strokeWidth="8" strokeLinecap="round" />
              <circle cx={originX} cy={originY - gnomonSvgHeight} r="4" fill="#D97706" />
              <text x={originX - 12} y={originY - gnomonSvgHeight / 2} fontSize="11" fill="currentColor" className="text-stone-400 font-mono" textAnchor="end">
                12 aṅgulas
              </text>
            </svg>

            <div className="absolute top-4 left-4">
              <ProvenanceLabel type="documented" />
            </div>
            <div className="absolute top-4 right-4">
              <ThenNowToggle mode={isHistorical ? 'historical' : 'modern'} onChange={(m) => setIsHistorical(m === 'historical')} />
            </div>
          </div>

          {/* Direction Finding Lab Sub-Page Link Banner */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                Finding True North (Indian Circles Method)
              </div>
              <div className="text-[11px] text-stone-600 dark:text-stone-400">
                Construct the East-West line and North-South meridian using equal-shadow circle crossings and Timi (fish) arcs.
              </div>
            </div>
            <a
              href="/observe/sun-shadow/find-north"
              className="px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              Launch Direction Lab →
            </a>
          </div>
          
          <div className="bg-white dark:bg-[#141210] p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap gap-6 items-center">
              <label className="flex flex-col gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                Date
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-stone-300 dark:border-stone-700 rounded px-2.5 py-1 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                Latitude (°)
                <input type="number" value={lat} onChange={(e) => setLat(Number(e.target.value))} className="border border-stone-300 dark:border-stone-700 rounded px-2.5 py-1 w-24 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono" step="0.1" />
              </label>
              <button onClick={() => setIsAutoPlay(!isAutoPlay)} className="ml-auto px-4 py-2 bg-[#4338CA] text-white rounded hover:bg-[#3730A3] transition-colors text-sm font-medium">
                {isAutoPlay ? 'Stop' : 'Auto-Play'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm font-medium text-stone-700 dark:text-stone-300">
                <span>Sunrise</span><span className="font-semibold text-indigo-600 dark:text-indigo-400">{challengeMode ? '??:??' : timeStr}</span><span>Sunset</span>
              </div>
              <input type="range" min="4" max="20" step="0.01" value={timeOfDay} onChange={(e) => setTimeOfDay(Number(e.target.value))} className="w-full accent-[#D97706]" />
            </div>
            <label className="flex items-center gap-2 mt-2 text-stone-700 dark:text-stone-300">
              <input type="checkbox" checked={challengeMode} onChange={(e) => setChallengeMode(e.target.checked)} className="rounded text-indigo-600" />
              <span className="text-sm font-medium">Challenge Mode: Can you infer the time from the shadow?</span>
            </label>
            {challengeMode && (
              <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 flex items-center gap-4">
                <input type="range" min="6" max="18" step="0.5" value={guessTime} onChange={(e) => setGuessTime(Number(e.target.value))} className="w-48 accent-[#4338CA]" />
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200">Guess: {Math.floor(guessTime)}:{((guessTime % 1) * 60).toString().padStart(2, '0')}</span>
                <button onClick={() => setShowAnswer(!showAnswer)} className="px-3 py-1 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded text-sm hover:bg-stone-300 dark:hover:bg-stone-700">
                  {showAnswer ? 'Hide Answer' : 'Check Answer'}
                </button>
                {showAnswer && (
                  <span className={`text-sm font-bold ${Math.abs(guessTime - timeOfDay) < 0.5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {Math.abs(guessTime - timeOfDay) < 0.5 ? 'Good job!' : `Actual: ${timeStr}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full lg:w-72 bg-white dark:bg-[#141210] rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 flex flex-col gap-6">
          <h3 className="font-semibold text-[#1C1917] dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2">Measurements</h3>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Time</div>
              <div className="text-xl font-medium text-stone-900 dark:text-stone-100">{challengeMode && !showAnswer ? '??:??' : timeStr}</div>
              <div className="text-sm text-stone-500 dark:text-stone-400">{challengeMode && !showAnswer ? '??g ??v' : ghatikaStr} (Ghaṭikā)</div>
            </div>
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Shadow Length</div>
              <div className="text-xl font-medium text-stone-900 dark:text-stone-100">{isNight ? 'Infinite' : shadowLength.toFixed(2)} aṅgulas</div>
              {isHistorical && !isNight && (
                <div className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Using 12-aṅgula śaṅku
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Solar Altitude (h)</div>
              <div className="text-xl font-medium text-stone-900 dark:text-stone-100">{isNight ? '-' : clampedAltitude.toFixed(1)}°</div>
              {isHistorical && !isNight && (
                <div className="text-sm text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                  Rsine(h) ≈ {((12 * R) / Math.sqrt(144 + shadowLength * shadowLength)).toFixed(0)}
                  <SourceTooltip source="Sūrya Siddhānta Ch.3" note="Rsine is computed as (12 × R) / hypotenuse" />
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Zenith Distance (z)</div>
              <div className="text-xl font-medium text-stone-900 dark:text-stone-100">{isNight ? '-' : zDistance.toFixed(1)}°</div>
            </div>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
