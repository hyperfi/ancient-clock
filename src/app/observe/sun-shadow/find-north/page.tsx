'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ModuleLayout, ThenNowToggle, SourceTooltip, ProvenanceLabel } from '@/components/ui';
import { STANDARD_GNOMON_HEIGHT } from '@/lib/solar/altitude';

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getShadowPoint(date: Date, lat: number, hourOfDay: number) {
  const dayOfYear = getDayOfYear(date);
  const decDeg = 23.44 * Math.sin((2 * Math.PI / 365) * (284 + dayOfYear));
  const decRad = decDeg * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const hourAngleDeg = (hourOfDay - 12) * 15;
  const hourAngleRad = hourAngleDeg * Math.PI / 180;
  
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad);
  const altRad = Math.asin(sinAlt);
  
  if (altRad <= 0) return null;
  
  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * Math.cos(altRad));
  let azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (hourAngleDeg > 0) azRad = 2 * Math.PI - azRad;
  
  const shadowLength = STANDARD_GNOMON_HEIGHT / Math.tan(altRad);
  const shadowAzRad = azRad + Math.PI;
  
  const x = shadowLength * Math.sin(shadowAzRad);
  const y = shadowLength * Math.cos(shadowAzRad);
  
  return { x, y, hour: hourOfDay };
}

type Point = { x: number; y: number; hour?: number };

export default function FindNorthPage() {
  const [date, setDate] = useState(() => {
    // Equinox is default as declination changing is clear then? 
    // Actually solstices show the error best. Let's use a day in June.
    const d = new Date();
    d.setMonth(5); d.setDate(21);
    return d.toISOString().split('T')[0];
  });
  const [lat, setLat] = useState(28.61);
  const [circleRadius, setCircleRadius] = useState(30); // in angulas
  
  const [mode, setMode] = useState<'construction'|'try'>('construction');
  const [step, setStep] = useState(0);
  
  // Calculate shadow path
  const shadowPath = useMemo(() => {
    const path: Point[] = [];
    const d = new Date(date);
    for (let h = 4; h <= 20; h += 0.1) {
      const pt = getShadowPoint(d, lat, h);
      if (pt) path.push(pt);
    }
    return path;
  }, [date, lat]);
  
  // Find crossings
  const crossings = useMemo(() => {
    let morning: Point | null = null;
    let afternoon: Point | null = null;
    
    for (let i = 1; i < shadowPath.length; i++) {
      const p1 = shadowPath[i-1];
      const p2 = shadowPath[i];
      const r1 = Math.sqrt(p1.x*p1.x + p1.y*p1.y);
      const r2 = Math.sqrt(p2.x*p2.x + p2.y*p2.y);
      
      if (r1 > circleRadius && r2 <= circleRadius) {
        // approx crossing
        morning = { x: (p1.x+p2.x)/2, y: (p1.y+p2.y)/2, hour: (p1.hour! + p2.hour!)/2 };
      }
      if (r1 <= circleRadius && r2 > circleRadius) {
        afternoon = { x: (p1.x+p2.x)/2, y: (p1.y+p2.y)/2, hour: (p1.hour! + p2.hour!)/2 };
      }
    }
    return { morning, afternoon };
  }, [shadowPath, circleRadius]);

  // Derive EW line
  const ewLine = useMemo(() => {
    if (!crossings.morning || !crossings.afternoon) return null;
    const dx = crossings.afternoon.x - crossings.morning.x;
    const dy = crossings.afternoon.y - crossings.morning.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return { angle, dx, dy };
  }, [crossings]);
  
  const nsAngle = ewLine ? ewLine.angle - 90 : 0;
  const angularError = Math.abs(nsAngle - -90) > 180 ? (nsAngle - -90) % 180 : nsAngle - -90; // True north is -90 in our SVG space if +y is down?
  // Wait, +x is East, +y is South (SVG standard)
  // If +y is South, -y is North. True north is pointing up (0, -1), angle is -90.
  // East is (1, 0), angle is 0.

  const scale = 5;
  const originX = 400;
  const originY = 300;
  const rad = circleRadius * scale;

  const toSvg = (pt: Point) => ({
    x: originX + pt.x * scale,
    y: originY + pt.y * scale // wait, +y is North in our logic? 
    // In our logic: y = length * cos(shadowAz). If az=0 (South shadow), y is positive. So +y is South.
  });

  const pathD = shadowPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvg(p).x} ${toSvg(p).y}`).join(' ');

  const steps = [
    "Place the gnomon on level ground",
    "Draw a circle centered at the gnomon",
    "Mark where the morning shadow enters the circle",
    "Mark where the afternoon shadow leaves the circle",
    "Connect the two marks to form the East-West line",
    "Construct intersecting arcs (Timi/Fish figure)",
    "Draw line through arc intersections to find North-South"
  ];

  return (
    <ModuleLayout title="Finding North — The Equal-Shadow Method" subtitle="Sūrya Siddhānta, Chapter 3">
      <div className="flex flex-col lg:flex-row gap-8">
        
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-[#FEFDF5] dark:bg-[#141210] border border-stone-200 dark:border-stone-800 shadow-sm rounded-xl overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
            <svg viewBox="0 0 800 600" className="w-full h-full">
              {/* True N-S / E-W crosshairs */}
              {/* Crosshair */}
              <line x1="400" y1="0" x2="400" y2="600" stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="300" x2="800" y2="300" stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeWidth="1" strokeDasharray="4 4" />
              <text x="405" y="20" fontSize="12" fill="currentColor" className="text-stone-400 dark:text-stone-500">True N</text>

              {/* Circle */}
              {step >= 1 && (
                <circle cx={originX} cy={originY} r={rad} fill="none" stroke="currentColor" className="text-stone-300 dark:text-stone-700" strokeWidth="2" />
              )}
              
              {/* Shadow Path */}
              {mode === 'construction' ? (
                 <path d={pathD} fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 3" opacity={step >= 2 ? 0.8 : 0} />
              ) : (
                 <path d={pathD} fill="none" stroke="#D97706" strokeWidth="1.5" />
              )}

              {/* Gnomon base */}
              {step >= 0 && <circle cx={originX} cy={originY} r="4" fill="currentColor" className="text-stone-900 dark:text-stone-100" />}

              {/* Crossings */}
              {step >= 2 && crossings.morning && (
                <circle cx={toSvg(crossings.morning).x} cy={toSvg(crossings.morning).y} r="5" fill="#4338CA" />
              )}
              {step >= 3 && crossings.afternoon && (
                <circle cx={toSvg(crossings.afternoon).x} cy={toSvg(crossings.afternoon).y} r="5" fill="#4338CA" />
              )}

              {/* E-W Line */}
              {step >= 4 && crossings.morning && crossings.afternoon && (
                <line 
                  x1={toSvg(crossings.morning).x - ewLine!.dx * 0.5 * scale} 
                  y1={toSvg(crossings.morning).y - ewLine!.dy * 0.5 * scale} 
                  x2={toSvg(crossings.afternoon).x + ewLine!.dx * 0.5 * scale} 
                  y2={toSvg(crossings.afternoon).y + ewLine!.dy * 0.5 * scale} 
                  stroke="#4338CA" strokeWidth="2" 
                />
              )}

              {/* Fish figure (Timi) */}
              {step >= 5 && crossings.morning && crossings.afternoon && (
                <>
                  <circle cx={toSvg(crossings.morning).x} cy={toSvg(crossings.morning).y} r={rad * 1.5} fill="none" stroke="currentColor" className="text-stone-400 dark:text-stone-600" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx={toSvg(crossings.afternoon).x} cy={toSvg(crossings.afternoon).y} r={rad * 1.5} fill="none" stroke="currentColor" className="text-stone-400 dark:text-stone-600" strokeWidth="1" strokeDasharray="4 4" />
                </>
              )}

              {/* N-S Line */}
              {step >= 6 && ewLine && (
                <line 
                  x1={originX} y1={originY} 
                  x2={originX + 1000 * Math.cos((nsAngle) * Math.PI / 180)} 
                  y2={originY + 1000 * Math.sin((nsAngle) * Math.PI / 180)} 
                  stroke="currentColor" className="text-stone-900 dark:text-stone-100" strokeWidth="2.5" 
                />
              )}
              {step >= 6 && ewLine && (
                <line 
                  x1={originX} y1={originY} 
                  x2={originX - 1000 * Math.cos((nsAngle) * Math.PI / 180)} 
                  y2={originY - 1000 * Math.sin((nsAngle) * Math.PI / 180)} 
                  stroke="currentColor" className="text-stone-900 dark:text-stone-100" strokeWidth="2.5" 
                />
              )}
            </svg>
            <div className="absolute top-4 left-4">
              <ProvenanceLabel type="documented" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#141210] p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
            <div className="flex gap-4 mb-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <button 
                onClick={() => setMode('construction')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${mode === 'construction' ? 'bg-[#4338CA] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
              >
                Show Construction
              </button>
              <button 
                onClick={() => { setMode('try'); setStep(6); }}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${mode === 'try' ? 'bg-[#4338CA] text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
              >
                Try Yourself (Full View)
              </button>
            </div>
            
            {mode === 'construction' ? (
              <div className="flex flex-col gap-4">
                <div className="h-12 flex items-center justify-center bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 font-medium text-stone-800 dark:text-stone-200 px-4 text-center text-sm">
                  Step {step + 1}: {steps[step]}
                </div>
                <div className="flex justify-between">
                  <button disabled={step === 0} onClick={() => setStep(s => s - 1)} className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg disabled:opacity-50 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">Previous</button>
                  <button disabled={step === steps.length - 1} onClick={() => setStep(s => s + 1)} className="px-4 py-2 bg-[#4338CA] text-white rounded-lg disabled:opacity-50 text-sm hover:bg-[#3730A3] transition-colors">Next</button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-xs text-indigo-900 dark:text-indigo-200">
                <strong>Exploration Mode:</strong> All geometrical lines are active. Adjust the date and circle radius below to test how seasonal solar declination affects the derived North meridian.
              </div>
            )}

            <div className="flex flex-wrap gap-6 items-center mt-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                Date
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-stone-300 dark:border-stone-700 rounded px-2.5 py-1 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
              </label>
              
              <label className="flex flex-col gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                Latitude (°)
                <input type="number" value={lat} onChange={(e) => setLat(Number(e.target.value))} className="border border-stone-300 dark:border-stone-700 rounded px-2.5 py-1 w-24 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100" step="0.1" />
              </label>
              
              <label className="flex flex-col gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                Circle Radius (aṅgulas)
                <input type="range" min="20" max="60" value={circleRadius} onChange={(e) => setCircleRadius(Number(e.target.value))} className="w-32 accent-indigo-600" />
              </label>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-72 bg-white dark:bg-[#141210] rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 flex flex-col gap-6">
          <h3 className="font-semibold text-[#1C1917] dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2">Results</h3>
          
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Derived North (Azimuth)</div>
              <div className="text-xl font-medium text-stone-900 dark:text-stone-100">{ewLine ? (nsAngle + 90).toFixed(2) : '-'}°</div>
            </div>
            
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">True North</div>
              <div className="text-xl font-medium text-stone-900 dark:text-stone-100">0.00°</div>
            </div>
            
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Angular Error (Deviation)</div>
              <div className="text-xl font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                {ewLine ? Math.abs(nsAngle + 90).toFixed(2) : '-'}°
                <SourceTooltip source="Sūrya Siddhānta Ch.3" note="Error is caused by the Sun's declination changing during the day, which makes the morning and afternoon shadows slightly asymmetrical." />
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-[#FEFDF5] dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-lg text-sm text-stone-700 dark:text-stone-300">
              <p className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Historical Note</p>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">The Sūrya Siddhānta describes this method for finding the cardinal directions. However, Indian astronomers later recognized that the change in solar declination over the course of the day introduces an error.</p>
            </div>
          </div>
        </div>
        
      </div>
    </ModuleLayout>
  );
}
