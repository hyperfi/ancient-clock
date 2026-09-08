'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ModuleLayout, ThenNowToggle, SourceTooltip, ProvenanceLabel } from '@/components/ui';
import { 
  STANDARD_GNOMON_HEIGHT, 
  formatAngulas, 
  mahaShanku, 
  mahaChaya, 
  palabhaFromLatitude,
  hypotenuse,
  zenithDistance
} from '@/lib/solar/altitude';
import { R } from '@/lib/solar/sineTable';

interface CityPreset {
  id: string;
  name: string;
  nameSanskrit: string;
  lat: number;
  note: string;
}

const CITIES: CityPreset[] = [
  { id: 'ujjain', name: 'Ujjain (Avanti)', nameSanskrit: 'उज्जयिनी (अवन्ती)', lat: 23.18, note: 'Prime Meridian of ancient India & Tropic of Cancer' },
  { id: 'varanasi', name: 'Varanasi (Kāśī)', nameSanskrit: 'वाराणसी (काशी)', lat: 25.31, note: 'Ancient seat of Siddhāntic astronomy' },
  { id: 'delhi', name: 'Delhi (Indraprastha)', nameSanskrit: 'इन्द्रप्रस्थ (दिल्ली)', lat: 28.61, note: 'Home of Sawai Jai Singh’s colossal Samrat Yantra' },
  { id: 'patna', name: 'Patna (Pāṭaliputra)', nameSanskrit: 'पाटलिपुत्र (पटना)', lat: 25.60, note: 'Āryabhaṭa’s capital & astronomical observatory' },
];

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
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altDeg = altRad * 180 / Math.PI;

  let cosAz = 0;
  const cosAlt = Math.cos(altRad);
  if (cosAlt > 0.0001) {
    cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * cosAlt);
    cosAz = Math.max(-1, Math.min(1, cosAz));
  }
  let azDeg = Math.acos(cosAz) * 180 / Math.PI;
  if (hourAngleDeg > 0) {
    azDeg = 360 - azDeg;
  }

  return { altitude: altDeg, declination: decDeg, azimuth: azDeg };
}

function getSunriseSunset(date: Date, lat: number) {
  const dayOfYear = getDayOfYear(date);
  const decDeg = 23.44 * Math.sin((2 * Math.PI / 365) * (284 + dayOfYear));
  const decRad = decDeg * Math.PI / 180;
  const latRad = lat * Math.PI / 180;

  const cosH0 = -Math.tan(latRad) * Math.tan(decRad);
  if (cosH0 > 1) return { sunrise: 12, sunset: 12, dayLength: 0 };
  if (cosH0 < -1) return { sunrise: 0, sunset: 24, dayLength: 24 };
  
  const h0Rad = Math.acos(cosH0);
  const h0Deg = h0Rad * 180 / Math.PI;
  const halfDayHours = h0Deg / 15;

  return {
    sunrise: Math.max(0, 12 - halfDayHours),
    sunset: Math.min(24, 12 + halfDayHours),
    dayLength: halfDayHours * 2,
  };
}

function formatHourToTime(h: number) {
  const hr = Math.floor(h);
  const mn = Math.floor((h % 1) * 60);
  return `${hr.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`;
}

function selectedCityNote(id: string) {
  const c = CITIES.find((item) => item.id === id);
  if (!c) return 'Custom Latitude Location';
  return `${c.nameSanskrit} — ${c.note}`;
}

export default function SunShadowPage() {
  const [dateStr, setDateStr] = useState('2026-03-21'); // Equinox default
  const [cityId, setCityId] = useState<string>('ujjain');
  const [lat, setLat] = useState<number>(23.18);
  const [timeOfDay, setTimeOfDay] = useState<number>(12); // Noon default
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [isHistorical, setIsHistorical] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'elevation' | 'ground'>('elevation');
  const [activeTab, setActiveTab] = useState<'time' | 'latitude'>('time');

  // Interactive Challenge Mode
  const [challengeMode, setChallengeMode] = useState<boolean>(false);
  const [guessTime, setGuessTime] = useState<number>(12);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  // Palabhā interactive tool
  const [palabhaSlider, setPalabhaSlider] = useState<number>(() => palabhaFromLatitude(23.18));

  // Update latitude when city preset changes
  const handleCityChange = (id: string) => {
    setCityId(id);
    const found = CITIES.find((c) => c.id === id);
    if (found) {
      setLat(found.lat);
      setPalabhaSlider(palabhaFromLatitude(found.lat));
    }
  };

  const handleCustomLat = (val: number) => {
    setCityId('custom');
    setLat(val);
    setPalabhaSlider(palabhaFromLatitude(val));
  };

  // Date shortcuts
  const handleSeasonShortcut = (date: string) => {
    setDateStr(date);
  };

  const dateObj = useMemo(() => new Date(dateStr + 'T12:00:00'), [dateStr]);
  const { sunrise, sunset } = useMemo(() => getSunriseSunset(dateObj, lat), [dateObj, lat]);

  // Interactive Sun Dragging along Celestial Arc
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingSun, setIsDraggingSun] = useState<boolean>(false);

  // Helper to compute sun coordinates on the celestial arc for a specific hour
  const getSunPosAtHour = useCallback((h: number) => {
    const pos = calculateSolarPosition(dateObj, lat, h);
    const alt = Math.max(0, pos.altitude);
    const rad = (alt * Math.PI) / 180;
    const dayProg = Math.max(0, Math.min(1, (h - sunrise) / (sunset - sunrise || 1)));
    const ewFactor = Math.cos((1 - dayProg) * Math.PI);
    const D_sun = 225 + 40 * Math.cos(rad);
    const sx = Math.max(65, Math.min(735, 400 + D_sun * ewFactor * Math.cos(rad * 0.3)));
    const sy = Math.max(30, Math.min(370, (390 - 150) - D_sun * Math.sin(rad)));
    return { x: sx, y: sy };
  }, [dateObj, lat, sunrise, sunset]);

  // Convert screen client coordinates to SVG viewBox coordinates
  const getSvgCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const transformed = pt.matrixTransform(ctm.inverse());
      return { x: transformed.x, y: transformed.y };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 800,
      y: ((clientY - rect.top) / rect.height) * 500,
    };
  }, []);

  // Find the exact time of day along the diurnal arc closest to pointer position (px, py)
  const findClosestHourOnPath = useCallback((px: number, py: number) => {
    const samples = 48;
    const step = (sunset - sunrise) / samples;
    let bestH = sunrise;
    let bestDistSq = Infinity;

    for (let i = 0; i <= samples; i++) {
      const h = sunrise + i * step;
      const { x, y } = getSunPosAtHour(h);
      const distSq = (x - px) * (x - px) + (y - py) * (y - py);
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestH = h;
      }
    }

    // Binary refinement for smooth high-resolution dragging
    let low = Math.max(sunrise, bestH - step);
    let high = Math.min(sunset, bestH + step);
    for (let iter = 0; iter < 8; iter++) {
      const m1 = low + (high - low) / 3;
      const m2 = high - (high - low) / 3;
      const p1 = getSunPosAtHour(m1);
      const p2 = getSunPosAtHour(m2);
      const d1 = (p1.x - px) * (p1.x - px) + (p1.y - py) * (p1.y - py);
      const d2 = (p2.x - px) * (p2.x - px) + (p2.y - py) * (p2.y - py);
      if (d1 < d2) {
        high = m2;
      } else {
        low = m1;
      }
    }
    return (low + high) / 2;
  }, [sunrise, sunset, getSunPosAtHour]);

  // Pointer drag handlers for Sūrya
  const handleSunPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAutoPlay(false);
    setIsDraggingSun(true);
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleSunPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSun) return;
    const coords = getSvgCoords(e.clientX, e.clientY);
    if (!coords) return;
    const newHour = findClosestHourOnPath(coords.x, coords.y);
    setTimeOfDay(newHour);
  };

  const handleSunPointerUp = (e: React.PointerEvent) => {
    if (isDraggingSun) {
      setIsDraggingSun(false);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Window-level safety drag listener for seamless mouse/touch release outside SVG
  useEffect(() => {
    if (!isDraggingSun) return;

    const onGlobalPointerMove = (e: PointerEvent) => {
      const coords = getSvgCoords(e.clientX, e.clientY);
      if (!coords) return;
      const newHour = findClosestHourOnPath(coords.x, coords.y);
      setTimeOfDay(newHour);
    };

    const onGlobalPointerUp = () => {
      setIsDraggingSun(false);
    };

    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
    };
  }, [isDraggingSun, getSvgCoords, findClosestHourOnPath]);

  // Auto-play animation
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const animate = () => {
      if (isAutoPlay) {
        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        setTimeOfDay((prev) => {
          let next = prev + dt * 0.8;
          const endH = Math.min(20, sunset + 0.2);
          const startH = Math.max(4, sunrise - 0.2);
          if (next > endH) next = startH;
          return next;
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAutoPlay) {
      lastTime = Date.now();
      animationFrameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoPlay, sunrise, sunset]);

  const solar = useMemo(() => calculateSolarPosition(dateObj, lat, timeOfDay), [dateObj, lat, timeOfDay]);

  // Golden celestial daytime arc for the Sun in the elevation sky
  const skyArcD = useMemo(() => {
    const pts: string[] = [];
    const step = Math.max(0.1, (sunset - sunrise) / 60);
    for (let h = sunrise; h <= sunset + 0.02; h += step) {
      const p = Math.max(0, Math.min(1, (h - sunrise) / (sunset - sunrise || 1)));
      const ew = Math.cos((1 - p) * Math.PI);
      const pos = calculateSolarPosition(dateObj, lat, h);
      if (pos.altitude >= 0) {
        const rad = (pos.altitude * Math.PI) / 180;
        const D = 225 + 40 * Math.cos(rad);
        const sx = 400 + D * ew * Math.cos(rad * 0.3);
        const sy = (390 - 150) - D * Math.sin(rad);
        pts.push(`${pts.length === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      }
    }
    return pts.join(' ');
  }, [dateObj, lat, sunrise, sunset]);

  const isNight = solar.altitude <= 0;
  const clampedAltitude = Math.max(0, solar.altitude);
  const zDistance = zenithDistance(clampedAltitude);

  // Shadow length calculation (12-angula gnomon standard)
  const shadowAngulas = useMemo(() => {
    if (clampedAltitude <= 0.1) return 120;
    const rad = (clampedAltitude * Math.PI) / 180;
    return 12 / Math.tan(rad);
  }, [clampedAltitude]);

  const karnsAngulas = hypotenuse(STANDARD_GNOMON_HEIGHT, shadowAngulas);
  const angulaBreakdown = formatAngulas(shadowAngulas);

  // Modern metric equivalents (1.0m gnomon)
  const modernGnomonHeightM = 1.0;
  const modernShadowM = isNight ? 999 : 1.0 / Math.tan((clampedAltitude * Math.PI) / 180);
  const modernHypotenuseM = Math.sqrt(1 + modernShadowM * modernShadowM);

  // Siddhāntic projections (R = 3438')
  const mShanku = mahaShanku(clampedAltitude);
  const mChaya = mahaChaya(clampedAltitude);
  const currentPalabha = palabhaFromLatitude(lat);

  // Ghaṭikā from sunrise
  const ghatikaCalc = useMemo(() => {
    if (timeOfDay < sunrise || timeOfDay > sunset) {
      return { ghatikas: 0, vighatikas: 0, isNight: true, str: 'Rātri (Night)' };
    }
    const hoursSinceSunrise = timeOfDay - sunrise;
    const totalGhatikas = hoursSinceSunrise * 2.5;
    const g = Math.floor(totalGhatikas);
    const v = Math.floor((totalGhatikas - g) * 60);
    return { ghatikas: g, vighatikas: v, isNight: false, str: `${g} gha ${v} vin` };
  }, [timeOfDay, sunrise, sunset]);

  // Shadow coordinates in ground plane
  const shadowAzimuthDeg = (solar.azimuth + 180) % 360;

  // Diurnal shadow path for ground compass view
  const diurnalTrack = useMemo(() => {
    const points: { x: number; y: number; hour: number; alt: number; az: number; sAng: number }[] = [];
    const step = 0.1;
    const startH = Math.max(sunrise + 0.1, 4.5);
    const endH = Math.min(sunset - 0.1, 19.5);

    for (let h = startH; h <= endH; h += step) {
      const pos = calculateSolarPosition(dateObj, lat, h);
      if (pos.altitude > 2) {
        const rad = (pos.altitude * Math.PI) / 180;
        const s = 12 / Math.tan(rad);
        const shAzRad = (((pos.azimuth + 180) % 360) * Math.PI) / 180;
        const x = s * Math.sin(shAzRad);
        const y = s * Math.cos(shAzRad);
        points.push({ x, y, hour: h, alt: pos.altitude, az: pos.azimuth, sAng: s });
      }
    }
    return points;
  }, [dateObj, lat, sunrise, sunset]);

  // Current shadow tip coordinates in ground frame
  const currentShadowGround = useMemo(() => {
    if (isNight) return { x: 0, y: 0 };
    const shAzRad = (shadowAzimuthDeg * Math.PI) / 180;
    return {
      x: shadowAngulas * Math.sin(shAzRad),
      y: shadowAngulas * Math.cos(shAzRad),
    };
  }, [isNight, shadowAzimuthDeg, shadowAngulas]);

  // Time formatted string
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay % 1) * 60);
  const seconds = Math.floor(((timeOfDay * 60) % 1) * 60);
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Palabhā to Latitude solver
  const solvedLatFromPalabha = (Math.atan(palabhaSlider / 12) * 180) / Math.PI;

  return (
    <ModuleLayout 
      title="Śaṅku — The Gnomon & Shadow Laboratory" 
      subtitle="Sūrya Siddhānta Ch. 3 (Tripraśnādhikāra) — Solar Altitude, Shadow Geometry & Time"
    >
      {/* Top Bar: Provenance, Mode Toggle & Find North Shortcut */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-[#141210] p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <ProvenanceLabel type="documented" />
          <SourceTooltip 
            source="Sūrya Siddhānta Ch. 3 (Tripraśna)" 
            note="Tripraśna explores the three fundamental problems of spherical astronomy: Dik (Direction), Deśa (Place/Latitude), and Kāla (Time), derived using the 12-aṅgula śaṅku." 
          />
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/observe/sun-shadow/find-north"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-1.5"
          >
            <span>🧭 Cardinal Direction Lab</span>
            <span className="text-stone-400">→</span>
          </Link>
          
          <ThenNowToggle 
            mode={isHistorical ? 'historical' : 'modern'} 
            onChange={(m) => setIsHistorical(m === 'historical')} 
          />
        </div>
      </div>

      {/* Main Grid: Visualizer + Controls on left (8 cols), Telemetry Sidebar on right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visualizer & Interactive Panels */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Visualizer Card */}
          <div className="bg-[#FEFDF5] dark:bg-[#141210] border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Canvas Header: View Switcher & Scene Metadata */}
            <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-500 dark:text-stone-400">View:</span>
                <div className="inline-flex rounded-lg bg-stone-200/70 dark:bg-stone-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('elevation')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      viewMode === 'elevation'
                        ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    📐 Elevation Triangle
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('ground')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      viewMode === 'ground'
                        ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    🧭 Bha-Maṇḍala (Compass Plane)
                  </button>
                </div>

                {/* Prominent Auto-Play / Pause Button directly in Canvas Header */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                    isAutoPlay
                      ? 'bg-amber-500 text-stone-950 font-bold ring-2 ring-amber-400 shadow-amber-500/20'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700'
                  }`}
                  title={isAutoPlay ? 'Pause sun movement' : 'Play continuous diurnal sun movement'}
                >
                  <span>{isAutoPlay ? '⏸ Pause' : '▶ Auto-Play'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300 font-mono">
                <span>{challengeMode && !showAnswer ? '??:??' : timeStr}</span>
                <span className="text-stone-300 dark:text-stone-700">|</span>
                <span>h = {isNight ? '0.0°' : clampedAltitude.toFixed(1) + '°'}</span>
                <span className="text-stone-300 dark:text-stone-700">|</span>
                <span>z = {isNight ? '90.0°' : zDistance.toFixed(1) + '°'}</span>
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <div className="w-full relative aspect-[16/10] bg-stone-900 select-none overflow-hidden">
              {viewMode === 'elevation' ? (
                <svg 
                  ref={svgRef}
                  viewBox="0 0 800 500" 
                  className={`w-full h-full select-none ${isDraggingSun ? 'cursor-grabbing' : ''}`}
                  onPointerMove={handleSunPointerMove}
                  onPointerUp={handleSunPointerUp}
                  onPointerCancel={handleSunPointerUp}
                >
                  <defs>
                    {/* Sky Gradient with rich celestial depth */}
                    <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                      {isNight ? (
                        <>
                          <stop offset="0%" stopColor="#060814" />
                          <stop offset="100%" stopColor="#111827" />
                        </>
                      ) : clampedAltitude < 12 ? (
                        <>
                          <stop offset="0%" stopColor="#1e1b4b" />
                          <stop offset="40%" stopColor="#7c2d12" />
                          <stop offset="80%" stopColor="#c2410c" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="#0f172a" />
                          <stop offset="35%" stopColor="#1e3a8a" />
                          <stop offset="75%" stopColor="#0284c7" />
                          <stop offset="100%" stopColor="#38bdf8" />
                        </>
                      )}
                    </linearGradient>

                    {/* Ground Gradient */}
                    <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#292524" />
                      <stop offset="100%" stopColor="#1c1917" />
                    </linearGradient>

                    {/* Sun Glow Filter */}
                    <radialGradient id="sunGlow">
                      <stop offset="0%" stopColor="#FDE047" stopOpacity="1" />
                      <stop offset="30%" stopColor="#F59E0B" stopOpacity="0.8" />
                      <stop offset="70%" stopColor="#D97706" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
                    </radialGradient>

                    {/* Gnomon Metal/Wood Gradient */}
                    <linearGradient id="gnomonGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#b45309" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>

                    {/* Shadow Blur Filter */}
                    <filter id="shadowBlur" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="2" />
                    </filter>
                  </defs>

                  {/* Sky background */}
                  <rect x="0" y="0" width="800" height="390" fill="url(#skyGradient)" />

                  {/* Night Stars */}
                  {isNight && (
                    <g fill="#ffffff" opacity="0.6">
                      <circle cx="120" cy="80" r="1.2" />
                      <circle cx="240" cy="60" r="0.9" />
                      <circle cx="380" cy="95" r="1.5" />
                      <circle cx="520" cy="70" r="1.0" />
                      <circle cx="660" cy="110" r="1.4" />
                      <circle cx="710" cy="45" r="0.8" />
                      <circle cx="180" cy="150" r="1.0" />
                      <circle cx="440" cy="140" r="1.2" />
                      <circle cx="600" cy="170" r="1.1" />
                    </g>
                  )}

                  {/* Ground Plane */}
                  <rect x="0" y="390" width="800" height="110" fill="url(#groundGrad)" />
                  <line x1="0" y1="390" x2="800" y2="390" stroke="#78716c" strokeWidth="2" />

                  {/* Gnomon & Shadow Geometry */}
                  {(() => {
                    const gx = 400; // Centered gnomon
                    const gy = 390; // Ground line
                    const gh = 150; // Gnomon height in SVG pixels (12 angulas = 150 px, 12.5 px/ang)
                    const pxPerAngula = gh / 12; // 12.5 px/angula
                    const rad = (clampedAltitude * Math.PI) / 180;

                    // Smooth Diurnal Sun Position in the sky - matching skyArcD with NO jumping:
                    // ewFactor smoothly transitions from -1 (East) -> 0 (Meridian Noon) -> +1 (West)
                    const dayProg = Math.max(0, Math.min(1, (timeOfDay - sunrise) / (sunset - sunrise || 1)));
                    const ewFactor = Math.cos((1 - dayProg) * Math.PI);
                    const D_sun = 225 + 40 * Math.cos(rad);
                    const sunX = Math.max(65, Math.min(735, gx + D_sun * ewFactor * Math.cos(rad * 0.3)));
                    const sunY = Math.max(30, Math.min(370, (gy - gh) - D_sun * Math.sin(rad)));

                    // 100% Collinear Ground Shadow: Directly aligned with the Sun's ray through the Śaṅku tip!
                    // Slope from Sun to Śaṅku tip: dy / dx = ((gy - gh) - sunY) / (gx - sunX)
                    // The ray continues through (gx, gy - gh) to hit ground at (shadowEndX, gy) with identical slope:
                    const dx = gx - sunX;
                    const dy = (gy - gh) - sunY;
                    const shadowSlope = dy / (dx || 0.00001);
                    const rawShadowEndX = gx + gh / shadowSlope;
                    const maxShadowPx = 340;
                    const shadowEndX = Math.max(gx - maxShadowPx, Math.min(gx + maxShadowPx, rawShadowEndX));
                    const currentShadowPx = Math.abs(shadowEndX - gx);
                    const shadowSign = shadowEndX >= gx ? 1 : -1;

                    const isNoon = Math.abs(timeOfDay - 12) < 0.25;
                    const badgeX = Math.max(120, Math.min(680, (gx + shadowEndX) / 2));
                    const R_px = 150;

                    return (
                      <g>
                        {/* Subtle Horizon and Meridian Guides */}
                        <text x="30" y={gy - 10} fontSize="10" fill="#a8a29e" fontWeight="500">
                          Pūrva (East) 🌅
                        </text>
                        <text x="770" y={gy - 10} fontSize="10" fill="#a8a29e" fontWeight="500" textAnchor="end">
                          🌇 Paścima (West)
                        </text>
                        <line x1={gx} y1="35" x2={gx} y2={gy} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
                        <text x={gx} y="22" fontSize="9" fill="#94a3b8" textAnchor="middle" letterSpacing="0.08em">
                          MERIDIAN (NOON)
                        </text>

                        {/* Diurnal Sun Celestial Path Arc in the Sky */}
                        {skyArcD && (
                          <g>
                            {/* Clickable hit track along the diurnal path */}
                            <path 
                              d={skyArcD} 
                              fill="none" 
                              stroke="transparent" 
                              strokeWidth="28" 
                              className="cursor-pointer"
                              onPointerDown={(e) => {
                                const coords = getSvgCoords(e.clientX, e.clientY);
                                if (coords) {
                                  setIsAutoPlay(false);
                                  const newHour = findClosestHourOnPath(coords.x, coords.y);
                                  setTimeOfDay(newHour);
                                }
                              }}
                            />
                            <path d={skyArcD} fill="none" stroke="#fde047" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" pointerEvents="none" />
                          </g>
                        )}

                        {/* Ground Shadow Path */}
                        {!isNight && (currentShadowPx > 2 || isNoon) && (
                          <g>
                            {currentShadowPx > 2 ? (
                              <line 
                                x1={gx} 
                                y1={gy + 2} 
                                x2={shadowEndX} 
                                y2={gy + 2} 
                                stroke="#000000" 
                                strokeWidth="7" 
                                strokeLinecap="round" 
                                opacity="0.8" 
                                filter="url(#shadowBlur)" 
                              />
                            ) : (
                              /* Solar Noon (Palabhā) Meridian Shadow Indicator pointing North */
                              <g opacity="0.9">
                                <line 
                                  x1={gx} 
                                  y1={gy + 2} 
                                  x2={gx + Math.min(180, (palabhaFromLatitude(lat) / 12) * gh * 0.7)} 
                                  y2={gy + 26} 
                                  stroke="#f59e0b" 
                                  strokeWidth="4" 
                                  strokeLinecap="round" 
                                />
                                <text 
                                  x={gx + Math.min(180, (palabhaFromLatitude(lat) / 12) * gh * 0.7) + 6} 
                                  y={gy + 30} 
                                  fontSize="9.5" 
                                  fontWeight="bold" 
                                  fill="#fbbf24" 
                                  fontFamily="monospace"
                                >
                                  Palabhā: {formatAngulas(palabhaFromLatitude(lat)).formatted} (North)
                                </text>
                              </g>
                            )}
                            
                            {/* Minimalist Ground Ruler Ticks (Clean lines & numbers, no heavy boxes) */}
                            {isHistorical ? (
                              [-24, -12, 12, 24].map((ang) => {
                                const tx = gx + (ang / 12) * gh;
                                if (tx < 50 || tx > 750) return null;
                                return (
                                  <g key={ang} opacity="0.7">
                                    <line x1={tx} y1={gy} x2={tx} y2={gy + 6} stroke="#78716c" strokeWidth="1" />
                                    <text x={tx} y={gy + 16} fontSize="9" fill="#a8a29e" textAnchor="middle" fontFamily="monospace">
                                      {Math.abs(ang)}aṅg
                                    </text>
                                  </g>
                                );
                              })
                            ) : (
                              [-2.0, -1.0, 1.0, 2.0].map((distM) => {
                                const tx = gx + (distM / modernGnomonHeightM) * gh;
                                if (tx < 50 || tx > 750) return null;
                                return (
                                  <g key={distM} opacity="0.7">
                                    <line x1={tx} y1={gy} x2={tx} y2={gy + 6} stroke="#78716c" strokeWidth="1" />
                                    <text x={tx} y={gy + 16} fontSize="9" fill="#a8a29e" textAnchor="middle" fontFamily="monospace">
                                      {Math.abs(distM).toFixed(0)}m
                                    </text>
                                  </g>
                                );
                              })
                            )}

                            {/* Essential 1: Shadow Length (Chāyā) Badge */}
                            <g>
                              {currentShadowPx > 2 && (
                                <>
                                  <line x1={gx} y1={gy + 24} x2={shadowEndX} y2={gy + 24} stroke="#f59e0b" strokeWidth="1.5" />
                                  <polygon points={`${shadowEndX},${gy+24} ${shadowEndX - shadowSign * 6},${gy+20} ${shadowEndX - shadowSign * 6},${gy+28}`} fill="#f59e0b" />
                                </>
                              )}
                              <g transform={`translate(${badgeX}, ${gy + 36})`}>
                                <rect 
                                  x={isNoon ? -95 : -70} 
                                  y="-10" 
                                  width={isNoon ? 190 : 140} 
                                  height="20" 
                                  rx="4" 
                                  fill="#1c1917" 
                                  fillOpacity="0.95" 
                                  stroke="#f59e0b" 
                                  strokeWidth="1.2" 
                                />
                                <text 
                                  x="0" 
                                  y="4" 
                                  fontSize="10" 
                                  fontWeight="bold" 
                                  fill="#fef08a" 
                                  textAnchor="middle" 
                                  fontFamily="monospace"
                                >
                                  {isHistorical 
                                    ? (isNoon ? `Chāyā (Palabhā): ${angulaBreakdown.formatted}` : `Chāyā: ${angulaBreakdown.formatted}`) 
                                    : (isNoon ? `Shadow (Palabhā): ${modernShadowM.toFixed(2)} m` : `Shadow: ${modernShadowM.toFixed(2)} m`)}
                                </text>
                              </g>
                            </g>
                          </g>
                        )}

                        {/* Continuous Solar Ray: From Sun center through Gnomon tip to Ground Shadow tip */}
                        {!isNight && (
                          <g>
                            {/* Ray 1: From Surya (sunX, sunY) to Śaṅku tip (gx, gy - gh) */}
                            <line 
                              x1={sunX} 
                              y1={sunY} 
                              x2={gx} 
                              y2={gy - gh} 
                              stroke="#fde047" 
                              strokeWidth="2.5" 
                              strokeDasharray="5 3" 
                              opacity="0.9" 
                            />
                            {/* Ray 2: From Śaṅku tip (gx, gy - gh) through to Shadow tip (shadowEndX, gy) */}
                            <line 
                              x1={gx} 
                              y1={gy - gh} 
                              x2={shadowEndX} 
                              y2={gy} 
                              stroke="#fbbf24" 
                              strokeWidth="2.8" 
                            />
                            {/* Focal point where sunlight hits Śaṅku tip */}
                            <circle cx={gx} cy={gy - gh} r="4" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />

                            {/* Essential 2: Hypotenuse / Karṇa Badge */}
                            {currentShadowPx > 45 && (
                              <g transform={`translate(${(gx + shadowEndX) / 2}, ${gy - gh / 2 - 10})`}>
                                <rect 
                                  x="-55" 
                                  y="-10" 
                                  width="110" 
                                  height="20" 
                                  rx="4" 
                                  fill="#1c1917" 
                                  fillOpacity="0.95" 
                                  stroke="#f59e0b" 
                                  strokeWidth="1.2" 
                                />
                                <text x="0" y="3.5" fontSize="10" fontWeight="bold" fill="#fde68a" textAnchor="middle">
                                  {isHistorical 
                                    ? `Karṇa: ${karnsAngulas.toFixed(1)} aṅg` 
                                    : `Karṇa: ${modernHypotenuseM.toFixed(2)} m`}
                                </text>
                              </g>
                            )}

                            {/* Essential 3: Altitude Angle (Unnatāṅśa) at shadow tip */}
                            {currentShadowPx > 25 && (
                              <g>
                                <path 
                                  d={`M ${shadowEndX - shadowSign * 35} ${gy} A 35 35 0 0 ${shadowSign > 0 ? 0 : 1} ${shadowEndX - shadowSign * 35 * Math.cos(rad)} ${gy - 35 * Math.sin(rad)}`}
                                  fill="none" 
                                  stroke="#38bdf8" 
                                  strokeWidth="2" 
                                />
                                <g transform={`translate(${Math.max(65, Math.min(735, shadowEndX - shadowSign * 52))}, ${gy - 16})`}>
                                  <rect 
                                    x="-38" 
                                    y="-9" 
                                    width="76" 
                                    height="18" 
                                    rx="3" 
                                    fill="#0c1322" 
                                    fillOpacity="0.95" 
                                    stroke="#38bdf8" 
                                    strokeWidth="1" 
                                  />
                                  <text 
                                    x="0" 
                                    y="3.5" 
                                    fontSize="10" 
                                    fontWeight="bold" 
                                    fill="#38bdf8" 
                                    textAnchor="middle"
                                  >
                                    h = {clampedAltitude.toFixed(1)}°
                                  </text>
                                </g>
                              </g>
                            )}
                          </g>
                        )}

                        {/* Essential 4: Gnomon Post (The Śaṅku) Centered at gx = 400 */}
                        <g>
                          <rect x={gx - 20} y={gy - 4} width="40" height="8" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                          <rect x={gx - 4} y={gy - gh} width="8" height={gh} rx="2" fill="url(#gnomonGrad)" stroke="#78350f" strokeWidth="1" />
                          <polygon points={`${gx}, ${gy - gh - 8} ${gx - 5}, ${gy - gh} ${gx + 5}, ${gy - gh}`} fill="#f59e0b" stroke="#78350f" strokeWidth="1" />

                          {/* Subtle Gnomon Scale Notches (Clean lines, no heavy text boxes) */}
                          {Array.from({ length: 5 }).map((_, i) => {
                            const ny = gy - (i * 3) * pxPerAngula;
                            if (i === 0) return null;
                            return (
                              <line 
                                key={i}
                                x1={gx - 7} 
                                y1={ny} 
                                x2={gx + 7} 
                                y2={ny} 
                                stroke="#451a03" 
                                strokeWidth="1.2" 
                              />
                            );
                          })}

                          {/* Clean Gnomon Title Badge */}
                          <g transform={`translate(${gx + 10}, ${gy - gh + 14})`}>
                            <rect 
                              x="-2" 
                              y="-9" 
                              width={isHistorical ? 88 : 96} 
                              height="18" 
                              rx="3" 
                              fill="#1c1917" 
                              fillOpacity="0.9" 
                              stroke="#78350f" 
                              strokeWidth="1" 
                            />
                            <text 
                              x="4" 
                              y="3.5" 
                              fontSize="9.5" 
                              fontWeight="bold" 
                              fill="#fef08a" 
                              textAnchor="start" 
                              className="tracking-wide"
                            >
                              {isHistorical ? 'Śaṅku (12 aṅg)' : 'Gnomon (1.0m)'}
                            </text>
                          </g>
                        </g>

                        {/* Sun Celestial Glyph Tracking Live Diurnal Movement - Interactive Dragging */}
                        {!isNight ? (
                          <g 
                            transform={`translate(${sunX}, ${sunY})`}
                            onPointerDown={handleSunPointerDown}
                            className={`cursor-grab ${isDraggingSun ? 'cursor-grabbing' : ''}`}
                            style={{ touchAction: 'none' }}
                          >
                            {/* Generous hit area for easy mouse/touch grabbing */}
                            <circle cx="0" cy="0" r="38" fill="transparent" />

                            {/* Sun Glow */}
                            <circle cx="0" cy="0" r="30" fill="url(#sunGlow)" pointerEvents="none" />

                            {/* Active dragging dashed halo indicator */}
                            {isDraggingSun && (
                              <circle 
                                cx="0" 
                                cy="0" 
                                r="24" 
                                fill="none" 
                                stroke="#f59e0b" 
                                strokeWidth="2" 
                                strokeDasharray="4 3" 
                                pointerEvents="none" 
                              />
                            )}

                            {/* Sun Core */}
                            <circle cx="0" cy="0" r="15" fill="#FDE047" stroke="#F59E0B" strokeWidth="2" pointerEvents="none" />
                            <text x="0" y="4" fontSize="10" fontWeight="bold" fill="#78350f" textAnchor="middle" pointerEvents="none">
                              {clampedAltitude.toFixed(0)}°
                            </text>

                            {/* Live Floating Time Badge & Drag Handle Indicator */}
                            <g transform="translate(0, -28)" pointerEvents="none">
                              <rect 
                                x="-32" 
                                y="-12" 
                                width="64" 
                                height="18" 
                                rx="9" 
                                fill="#1c1917" 
                                fillOpacity={isDraggingSun ? "0.95" : "0.75"} 
                                stroke={isDraggingSun ? "#f59e0b" : "#78716c"} 
                                strokeWidth={isDraggingSun ? "1.5" : "1"} 
                              />
                              <text 
                                x="0" 
                                y="1" 
                                fontSize="9.5" 
                                fontWeight="bold" 
                                fill={isDraggingSun ? "#fef08a" : "#f1f5f9"} 
                                textAnchor="middle"
                                fontFamily="monospace"
                              >
                                {timeStr}
                              </text>
                            </g>
                          </g>
                        ) : (
                          <g transform="translate(100, 80)">
                            <path d="M 0 0 A 20 20 0 1 0 25 25 A 16 16 0 1 1 0 0" fill="#fef08a" />
                            <rect x="30" y="4" width="136" height="24" rx="4" fill="#1c1917" fillOpacity="0.95" stroke="#94a3b8" strokeWidth="1" />
                            <text x="98" y="20" fontSize="11" fill="#f1f5f9" fontWeight="bold" textAnchor="middle">
                              {isHistorical ? 'Candra / Rātri (Night)' : 'Night Sky'}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </svg>
              ) : (
                /* VIEW 2: Bha-Maṇḍala (Ground Plane Compass & Diurnal Shadow Hyperbola) */
                <svg viewBox="0 0 600 600" className="w-full h-full">
                  <defs>
                    <radialGradient id="compassBg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1c1917" />
                      <stop offset="70%" stopColor="#0c0a09" />
                      <stop offset="100%" stopColor="#000000" />
                    </radialGradient>
                    <radialGradient id="needleGlow">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <rect x="0" y="0" width="600" height="600" fill="url(#compassBg)" />

                  {(() => {
                    const cx = 300;
                    const cy = 300;
                    const angScale = 100 / 12;

                    const rings = isHistorical 
                      ? [
                          { r: 6 * angScale, label: '6 aṅg' },
                          { r: 12 * angScale, label: '12 aṅg (Śaṅku-Samāna)', highlight: true },
                          { r: 18 * angScale, label: '18 aṅg' },
                          { r: 24 * angScale, label: '24 aṅg' },
                          { r: 30 * angScale, label: '30 aṅg' },
                        ]
                      : [
                          { r: (0.5 / 1.0) * 100, label: '0.5 m' },
                          { r: (1.0 / 1.0) * 100, label: '1.0 m (Gnomon H)', highlight: true },
                          { r: (1.5 / 1.0) * 100, label: '1.5 m' },
                          { r: (2.0 / 1.0) * 100, label: '2.0 m' },
                          { r: (2.5 / 1.0) * 100, label: '2.5 m' },
                        ];

                    const trackPathD = diurnalTrack
                      .filter((pt) => {
                        const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y) * angScale;
                        return dist < 280;
                      })
                      .map((pt, idx) => {
                        const sx = cx + pt.x * angScale;
                        const sy = cy - pt.y * angScale;
                        return `${idx === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
                      })
                      .join(' ');

                    const noonPt = diurnalTrack.reduce((prev, curr) => 
                      Math.abs(curr.hour - 12) < Math.abs(prev.hour - 12) ? curr : prev
                    , diurnalTrack[0]);

                    const noonSvgX = noonPt ? cx + noonPt.x * angScale : cx;
                    const noonSvgY = noonPt ? cy - noonPt.y * angScale : cy - 50;

                    const currSvgX = cx + currentShadowGround.x * angScale;
                    const currSvgY = cy - currentShadowGround.y * angScale;

                    return (
                      <g>
                        <circle cx={cx} cy={cy} r="275" fill="none" stroke="#44403c" strokeWidth="2" />
                        <circle cx={cx} cy={cy} r="265" fill="none" stroke="#292524" strokeWidth="1" />
                        
                        {Array.from({ length: 36 }).map((_, i) => {
                          const deg = i * 10;
                          const rad = (deg * Math.PI) / 180;
                          const isMajor = deg % 30 === 0;
                          const r1 = 265;
                          const r2 = isMajor ? 250 : 258;
                          return (
                            <line
                              key={deg}
                              x1={cx + r1 * Math.sin(rad)}
                              y1={cy - r1 * Math.cos(rad)}
                              x2={cx + r2 * Math.sin(rad)}
                              y2={cy - r2 * Math.cos(rad)}
                              stroke={isMajor ? '#a8a29e' : '#57534e'}
                              strokeWidth={isMajor ? 1.5 : 0.8}
                            />
                          );
                        })}

                        <line x1={cx} y1="20" x2={cx} y2="580" stroke="#78716c" strokeWidth="1.5" strokeDasharray="4 3" />
                        <line x1="20" y1={cy} x2="580" y2={cy} stroke="#78716c" strokeWidth="1.5" strokeDasharray="4 3" />

                        {rings.map((ring, idx) => (
                          <g key={idx}>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={ring.r}
                              fill="none"
                              stroke={ring.highlight ? '#f59e0b' : '#44403c'}
                              strokeWidth={ring.highlight ? 1.8 : 0.8}
                              strokeDasharray={ring.highlight ? 'none' : '3 3'}
                              opacity={ring.highlight ? 0.9 : 0.5}
                            />
                            <text
                              x={cx + 6}
                              y={cy - ring.r + 12}
                              fontSize="9"
                              fill={ring.highlight ? '#fbbf24' : '#78716c'}
                              fontFamily="monospace"
                            >
                              {ring.label}
                            </text>
                          </g>
                        ))}

                        {/* Clean Cardinal Direction Titles */}
                        <text x={cx} y="32" fontSize="12" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
                          {isHistorical ? 'उत्तर (NORTH 0°)' : 'NORTH (0°)'}
                        </text>

                        <text x={cx} y="575" fontSize="12" fontWeight="bold" fill="#f87171" textAnchor="middle">
                          {isHistorical ? 'दक्षिण (SOUTH 180°)' : 'SOUTH (180°)'}
                        </text>

                        <text x="565" y={cy + 4} fontSize="12" fontWeight="bold" fill="#fbbf24" textAnchor="end">
                          {isHistorical ? 'पूर्व (EAST 90°)' : 'EAST (90°)'}
                        </text>

                        <text x="35" y={cy + 4} fontSize="12" fontWeight="bold" fill="#fbbf24" textAnchor="start">
                          {isHistorical ? 'पश्चिम (WEST 270°)' : 'WEST (270°)'}
                        </text>

                        {/* Diurnal Shadow Track (Hyperbola) */}
                        {trackPathD && (
                          <g>
                            <path
                              d={trackPathD}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="2.5"
                              strokeDasharray="4 2"
                              opacity="0.85"
                            />
                            {noonPt && (
                              <g transform={`translate(${noonSvgX}, ${noonSvgY})`}>
                                <polygon points="0,-6 6,0 0,6 -6,0" fill="#38bdf8" />
                                <text x="10" y="4" fontSize="10" fontWeight="bold" fill="#38bdf8">
                                  {isHistorical ? 'Madhyāhna-Chāyā (Noon)' : 'Solar Noon Shadow'}
                                </text>
                              </g>
                            )}
                          </g>
                        )}

                        <circle cx={cx} cy={cy} r="6" fill="#d97706" stroke="#78350f" strokeWidth="2" />
                        <circle cx={cx} cy={cy} r="2" fill="#fef08a" />

                        {/* Current Shadow Vector */}
                        {!isNight ? (
                          <g>
                            <line
                              x1={cx}
                              y1={cy}
                              x2={currSvgX}
                              y2={currSvgY}
                              stroke="#ffffff"
                              strokeWidth="4"
                              strokeLinecap="round"
                              opacity="0.9"
                            />
                            <line
                              x1={cx}
                              y1={cy}
                              x2={currSvgX}
                              y2={currSvgY}
                              stroke="#000000"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />

                            <circle cx={currSvgX} cy={currSvgY} r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                            <circle cx={currSvgX} cy={currSvgY} r="16" fill="url(#needleGlow)" pointerEvents="none" />

                            <g transform={`translate(${currSvgX + (currentShadowGround.x >= 0 ? 14 : -14)}, ${currSvgY - 14})`}>
                              <rect
                                x={currentShadowGround.x >= 0 ? 0 : -130}
                                y="-12"
                                width="130"
                                height="26"
                                rx="5"
                                fill="#1c1917"
                                stroke="#f59e0b"
                                strokeWidth="1"
                              />
                              <text
                                x={currentShadowGround.x >= 0 ? 65 : -65}
                                y="5"
                                fontSize="11"
                                fontWeight="bold"
                                fill="#fef08a"
                                textAnchor="middle"
                              >
                                {isHistorical 
                                  ? `${shadowAngulas.toFixed(1)} aṅg @ ${shadowAzimuthDeg.toFixed(0)}°`
                                  : `${modernShadowM.toFixed(2)} m @ ${shadowAzimuthDeg.toFixed(0)}°`}
                              </text>
                            </g>

                            {/* Sun Azimuth Direction Pointer */}
                            {(() => {
                              const sunAzRad = (solar.azimuth * Math.PI) / 180;
                              const sunEdgeDist = 265;
                              const sx = cx + sunEdgeDist * Math.sin(sunAzRad);
                              const sy = cy - sunEdgeDist * Math.cos(sunAzRad);
                              return (
                                <g transform={`translate(${sx}, ${sy})`}>
                                  <circle cx="0" cy="0" r="12" fill="#f59e0b" stroke="#fde047" strokeWidth="2" />
                                  <text x="0" y="3" fontSize="9" fontWeight="bold" fill="#78350f" textAnchor="middle">
                                    ☀️
                                  </text>
                                  <text x="0" y="20" fontSize="9" fill="#fde047" fontWeight="bold" textAnchor="middle">
                                    Sun {solar.azimuth.toFixed(0)}°
                                  </text>
                                </g>
                              );
                            })()}
                          </g>
                        ) : (
                          <g transform={`translate(${cx}, ${cy + 40})`}>
                            <text x="0" y="0" fontSize="13" fill="#94a3b8" textAnchor="middle" fontWeight="500">
                              {isHistorical ? 'सूर्य अस्त (Sun below horizon — No Shadow)' : 'Sun Below Horizon'}
                            </text>
                          </g>
                        )}

                        <g transform="translate(25, 545)" className="text-[10px]">
                          <rect x="0" y="0" width="170" height="40" rx="6" fill="#1c1917" stroke="#44403c" strokeWidth="1" />
                          <line x1="12" y1="14" x2="32" y2="14" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
                          <text x="38" y="17" fill="#e7e5e4" fontSize="9">Diurnal Track (Day path)</text>
                          <circle cx="22" cy="28" r="4" fill="#ef4444" />
                          <text x="38" y="31" fill="#e7e5e4" fontSize="9">Current Shadow Tip</text>
                        </g>
                      </g>
                    );
                  })()}
                </svg>
              )}
            </div>

            {/* Explanation Strip Below Canvas */}
            <div className="px-5 py-3 bg-stone-100 dark:bg-[#181614] border-t border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex flex-wrap items-center justify-between gap-3">
              <div>
                {isHistorical ? (
                  <span>
                    <strong className="text-amber-700 dark:text-amber-400">Sūrya Siddhānta 3.1–4:</strong> Standard 12-aṅgula gnomon. Karṇa = √(144 + Chāyā²). Mahā-Śaṅku = (12 × 3438) / Karṇa.
                  </span>
                ) : (
                  <span>
                    <strong className="text-indigo-600 dark:text-indigo-400">Modern Trigonometry:</strong> Standard 1m gnomon. tan(h) = 1 / Shadow. Hypotenuse = √(1 + S²). Altitude h = arctan(1/S).
                  </span>
                )}
              </div>
              <div className="text-stone-500">
                {selectedCityNote(cityId)}
              </div>
            </div>
          </div>

          {/* Interactive Pedagogical Tabs */}
          <div className="bg-white dark:bg-[#141210] border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm flex flex-col gap-6">
            
            {/* Tab Buttons */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 gap-4 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('time')}
                className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'time'
                    ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                ⏳ 1. Kāla-Jñāna (Time from Shadow)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('latitude')}
                className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'latitude'
                    ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                🌐 2. Deśa-Jñāna (Latitude from Palabhā)
              </button>
            </div>

            {/* TAB 1: KĀLA-JÑĀNA */}
            {activeTab === 'time' && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="font-medium text-stone-900 dark:text-stone-100 text-base">Diurnal Sun & Shadow Simulator</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Scrub through the day or run the animation to observe the shadow sweep across the quadrant.
                  </p>
                </div>

                {/* Unified Player & Diurnal Time Scrubber Bar */}
                <div className="flex flex-col gap-3 bg-stone-50 dark:bg-stone-900/50 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsAutoPlay(!isAutoPlay)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                          isAutoPlay 
                            ? 'bg-amber-500 text-stone-950 font-bold ring-2 ring-amber-400 shadow-amber-500/20' 
                            : 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                        }`}
                        title={isAutoPlay ? 'Pause diurnal animation' : 'Start continuous diurnal sun movement'}
                      >
                        <span>{isAutoPlay ? '⏸ Pause' : '▶ Auto-Play'}</span>
                      </button>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {isAutoPlay ? 'Simulating diurnal cycle...' : 'Manual time control'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Time:</span>
                      <span className="text-sm text-amber-700 dark:text-amber-400 font-mono font-bold bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        {challengeMode && !showAnswer ? '??:??' : timeStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-medium text-stone-500 dark:text-stone-400 pt-1">
                    <span className="flex items-center gap-1">🌅 Sunrise ({formatHourToTime(sunrise)})</span>
                    <span className="flex items-center gap-1">🌇 Sunset ({formatHourToTime(sunset)})</span>
                  </div>

                  <input
                    type="range"
                    min="4.5"
                    max="19.5"
                    step="0.02"
                    value={timeOfDay}
                    onChange={(e) => {
                      setIsAutoPlay(false);
                      setTimeOfDay(Number(e.target.value));
                    }}
                    className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 dark:bg-stone-700 rounded-lg"
                  />

                  {/* Quick Snap Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
                    <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">Snap to:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setIsAutoPlay(false); setTimeOfDay(sunrise + 0.2); }}
                        className="px-2 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                      >
                        🌅 Sunrise
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAutoPlay(false); setTimeOfDay(9.0); }}
                        className="px-2 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                      >
                        ☀️ 9:00 AM (Prātaḥ)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAutoPlay(false); setTimeOfDay(12.0); }}
                        className="px-2 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                      >
                        🕛 Noon (Madhyāhna)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAutoPlay(false); setTimeOfDay(15.0); }}
                        className="px-2 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                      >
                        🌤️ 3:00 PM (Aparāhna)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAutoPlay(false); setTimeOfDay(sunset - 0.2); }}
                        className="px-2 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                      >
                        🌇 Sunset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Challenge Mode Box */}
                <div className="border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={challengeMode}
                        onChange={(e) => {
                          setChallengeMode(e.target.checked);
                          setShowAnswer(false);
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-medium text-sm text-indigo-950 dark:text-indigo-200">
                        🎯 Interactive Challenge: Can you infer the civil time purely from the shadow?
                      </span>
                    </label>
                  </div>

                  {challengeMode && (
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-stone-600 dark:text-stone-400">Your Time Guess:</span>
                        <input
                          type="range"
                          min="6"
                          max="18"
                          step="0.25"
                          value={guessTime}
                          onChange={(e) => setGuessTime(Number(e.target.value))}
                          className="w-48 accent-indigo-600"
                        />
                      </div>

                      <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                        Guess: {formatHourToTime(guessTime)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
                      >
                        {showAnswer ? 'Hide Result' : 'Check My Guess'}
                      </button>

                      {showAnswer && (
                        <div className="text-xs font-semibold">
                          {Math.abs(guessTime - timeOfDay) <= 0.5 ? (
                            <span className="text-green-600 dark:text-green-400">
                              🎉 Brilliant! Accurate within {Math.round(Math.abs(guessTime - timeOfDay) * 60)} minutes. (Actual: {timeStr})
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">
                              Off by {Math.round(Math.abs(guessTime - timeOfDay) * 60)} mins. Actual: {timeStr}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DEŚA-JÑĀNA */}
            {activeTab === 'latitude' && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="font-medium text-stone-900 dark:text-stone-100 text-base">
                    Deśa-Jñāna: Determining Terrestrial Latitude from Equinoctial Noon Shadow (Palabhā)
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    In Indian astronomy, local latitude (<em>akṣāṅśa</em>, φ) was measured by erecting the 12-aṅgula gnomon on the day of the equinox (<em>Viṣuvad-dina</em>). 
                    Because the Sun&apos;s declination is zero (δ = 0°), the midday zenith distance is exactly equal to the observer&apos;s latitude (z = φ). 
                    The midday equinoctial shadow is termed <strong>Palabhā</strong> (पलभा) or <strong>Akṣabhā</strong>.
                  </p>
                </div>

                <div className="bg-amber-50/70 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs">
                  <div className="font-serif text-amber-900 dark:text-amber-200 font-semibold mb-1">
                    Sūrya Siddhānta 3.13–14:
                  </div>
                  <blockquote className="italic text-stone-700 dark:text-stone-300">
                    &ldquo;विषुवत्ययने चैव मध्यन्दिनगते रवौ। या छाया सा पलभा ज्ञेया तयाऽक्षः साध्यते बुधैः॥&rdquo;
                  </blockquote>
                  <p className="text-stone-600 dark:text-stone-400 mt-1">
                    &ldquo;At the equinox when the Sun reaches the meridian at noon, the shadow of the gnomon is known as <strong>Palabhā</strong>. By this shadow, the wise determine their latitude.&rdquo;
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 dark:bg-stone-900/50 p-5 rounded-xl border border-stone-200 dark:border-stone-800">
                  <div className="flex flex-col gap-3">
                    <h4 className="font-semibold text-xs text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                      Fundamental Equation
                    </h4>
                    <div className="font-mono text-sm bg-white dark:bg-stone-950 p-3 rounded-lg border border-stone-200 dark:border-stone-800 text-amber-800 dark:text-amber-300">
                      Palabhā = 12 × tan(φ) aṅgulas
                      <br />
                      φ = arctan(Palabhā / 12)
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Current location ({lat.toFixed(2)}° N) produces an equinoctial noon shadow of{' '}
                      <strong className="text-stone-800 dark:text-stone-200">
                        {currentPalabha.toFixed(2)} aṅgulas ({formatAngulas(currentPalabha).formatted})
                      </strong>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Slider 1: Palabhā */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-medium text-stone-700 dark:text-stone-300">
                        <span>Equinoctial Noon Shadow (Palabhā):</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {palabhaSlider.toFixed(2)} aṅg ({formatAngulas(palabhaSlider).formatted})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="18"
                        step="0.05"
                        value={palabhaSlider}
                        onChange={(e) => {
                          const pVal = Number(e.target.value);
                          setPalabhaSlider(pVal);
                          const newLat = (Math.atan(pVal / 12) * 180) / Math.PI;
                          setLat(newLat);
                          setCityId('custom');
                        }}
                        className="w-full accent-amber-600 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Slider 2: Latitude */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-medium text-stone-700 dark:text-stone-300">
                        <span>Geographical Latitude (Akṣāṁśa φ):</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          φ = {lat.toFixed(2)}° N
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.1"
                        value={lat}
                        onChange={(e) => handleCustomLat(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="p-3 bg-white dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 text-xs flex justify-between items-center">
                      <span className="text-stone-600 dark:text-stone-400">Mathematical Relation:</span>
                      <span className="font-mono font-semibold text-xs text-stone-700 dark:text-stone-300">
                        tan({lat.toFixed(1)}°) = {(palabhaSlider / 12).toFixed(3)} → Palabhā = {palabhaSlider.toFixed(2)} aṅg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historical City Palabhā Comparison Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
                    <thead className="bg-stone-100 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
                      <tr>
                        <th className="p-2.5">Historical Center</th>
                        <th className="p-2.5">Latitude (φ)</th>
                        <th className="p-2.5">Palabhā (Aṅgulas)</th>
                        <th className="p-2.5">Sanskrit Notation</th>
                        <th className="p-2.5">Astronomical Significance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                      {CITIES.map((c) => {
                        const p = palabhaFromLatitude(c.lat);
                        const fmt = formatAngulas(p);
                        return (
                          <tr key={c.id} className={c.id === cityId ? 'bg-amber-50/50 dark:bg-amber-950/20 font-medium' : ''}>
                            <td className="p-2.5 text-stone-900 dark:text-stone-100">{c.name}</td>
                            <td className="p-2.5 font-mono">{c.lat}° N</td>
                            <td className="p-2.5 font-mono text-amber-700 dark:text-amber-400">{p.toFixed(2)} aṅg</td>
                            <td className="p-2.5 text-stone-600 dark:text-stone-400">{fmt.formatted}</td>
                            <td className="p-2.5 text-stone-500 dark:text-stone-400">{c.note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Parameters & Telemetry Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Observation Parameters Panel */}
          <div className="bg-white dark:bg-[#141210] border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2 text-sm flex items-center justify-between">
              <span>Observation Controls</span>
              <span className="text-xs text-stone-400 font-normal">Deśa & Kāla</span>
            </h3>

            {/* City Preset Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">Observatory Location (Deśa):</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCityChange(c.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left border transition-all truncate ${
                      cityId === c.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Latitude Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Latitude (Akṣāṅśa):</span>
                <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">{lat.toFixed(2)}° N</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.1"
                value={lat}
                onChange={(e) => handleCustomLat(Number(e.target.value))}
                className="w-full accent-amber-600 h-1.5 bg-stone-200 dark:bg-stone-700 rounded cursor-pointer"
              />
            </div>

            {/* Date Selection & Season Shortcuts */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-stone-600 dark:text-stone-400">Date (Tithi/Date):</label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="text-xs px-2 py-1 border border-stone-200 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Season Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSeasonShortcut('2026-03-21')}
                  className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                    dateStr === '2026-03-21'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900'
                  }`}
                >
                  🌸 Equinox (Viṣuvant)
                </button>
                <button
                  type="button"
                  onClick={() => handleSeasonShortcut('2026-06-21')}
                  className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                    dateStr === '2026-06-21'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900'
                  }`}
                >
                  ☀️ Summer Solstice
                </button>
                <button
                  type="button"
                  onClick={() => handleSeasonShortcut('2026-12-21')}
                  className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                    dateStr === '2026-12-21'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900'
                  }`}
                >
                  ❄️ Winter Solstice
                </button>
              </div>
            </div>
          </div>

          {/* Measurements & Telemetry Panel */}
          <div className="bg-white dark:bg-[#141210] border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                {isHistorical ? 'Siddhāntic Telemetry' : 'Modern Astrometry'}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {isHistorical ? 'Śaṅku-Māna' : 'SI Metric'}
              </span>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Time Section */}
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800">
                <div className="text-stone-500 uppercase tracking-wider font-semibold mb-1 text-[10px]">
                  {isHistorical ? 'Iṣṭakāla (Time from Sunrise)' : 'Civil & Solar Time'}
                </div>
                <div className="text-lg font-bold text-stone-900 dark:text-stone-100 font-mono">
                  {challengeMode && !showAnswer ? '??:??' : timeStr}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                  {challengeMode && !showAnswer ? '?? gha ?? vin' : ghatikaCalc.str}
                </div>
              </div>

              {/* Gnomon & Shadow Dimension Section */}
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 flex flex-col gap-2">
                <div className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                  {isHistorical ? 'Gnomon & Ground Shadow' : 'Instrument Dimensions'}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">
                    {isHistorical ? 'Śaṅku Height:' : 'Gnomon Height (H):'}
                  </span>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    {isHistorical ? '12.00 aṅgulas' : '1.00 m (100 cm)'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">
                    {isHistorical ? 'Chāyā (Shadow):' : 'Shadow Length (S):'}
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {isNight ? '∞ (Night)' : isHistorical ? angulaBreakdown.formatted : `${modernShadowM.toFixed(2)} m`}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">
                    {isHistorical ? 'Karṇa (Hypotenuse):' : 'Hypotenuse (L):'}
                  </span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {isNight ? '—' : isHistorical ? `${karnsAngulas.toFixed(2)} aṅg` : `${modernHypotenuseM.toFixed(2)} m`}
                  </span>
                </div>
              </div>

              {/* Angles & Celestial Trigonometry */}
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 flex flex-col gap-2">
                <div className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                  {isHistorical ? 'Māhā-Śaṅku & Celestial Sines' : 'Solar Angles & Trigonometry'}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">
                    {isHistorical ? 'Unnatāṅśa (Altitude):' : 'Solar Altitude (h):'}
                  </span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {isNight ? '0.0°' : `${clampedAltitude.toFixed(1)}°`}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">
                    {isHistorical ? 'Natāṅśa (Zenith Angle):' : 'Zenith Distance (θz):'}
                  </span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {isNight ? '90.0°' : `${zDistance.toFixed(1)}°`}
                  </span>
                </div>

                {isHistorical ? (
                  <>
                    <div className="flex justify-between items-center border-t border-stone-200 dark:border-stone-800 pt-2">
                      <span className="text-stone-600 dark:text-stone-400">Mahā-Śaṅku (R sin h):</span>
                      <span className="font-mono font-bold text-pink-600 dark:text-pink-400">
                        {isNight ? '0\'' : `${mShanku}\'`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600 dark:text-stone-400">Mahā-Chāyā (R cos h):</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {isNight ? '3438\'' : `${mChaya}\'`}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-t border-stone-200 dark:border-stone-800 pt-2">
                      <span className="text-stone-600 dark:text-stone-400">sin(h):</span>
                      <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                        {Math.sin((clampedAltitude * Math.PI) / 180).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600 dark:text-stone-400">cos(h):</span>
                      <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                        {Math.cos((clampedAltitude * Math.PI) / 180).toFixed(4)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Local Latitude & Equinox Constants */}
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 flex flex-col gap-1.5">
                <div className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                  Local Geographical Invariants
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">Palabhā (Equinox Shadow):</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {currentPalabha.toFixed(2)} aṅg
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">Solar Declination (δ):</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {solar.declination >= 0 ? '+' : ''}{solar.declination.toFixed(2)}°
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
