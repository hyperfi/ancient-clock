'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ModuleLayout, ProvenanceLabel, SourceTooltip } from '@/components/ui';
import { computeAhargana } from '@/lib/time/ahargana';
import { computeLunarEclipse } from '@/history/models/suryaSiddhanta/lunarEclipse';
import {
  getModernLunarEclipse,
  getModernSolarEclipse,
  getModernPositions,
  compareLunarEclipse,
} from '@/lib/astronomy';
import { EclipseVisualization } from '@/components/svg/EclipseVisualization';
import benchmarkData from '../../../../data/eclipse-benchmarks.json';

interface Benchmark {
  id: string;
  date: string;
  type: string;
  subtype: string;
  description: string;
  location: { name: string; latitude: number; longitude: number };
  historicalSource?: {
    observer?: string;
    text?: string;
    period?: string;
    notes?: string;
  } | null;
}

export default function PredictEclipsePage() {
  const benchmarks: Benchmark[] = benchmarkData.benchmarks;

  // Selected parameters - Default to Parameśvara's 1422 Lunar Eclipse (Valid comparison on load!)
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('parameshvara-1422-lunar');
  const [dateStr, setDateStr] = useState<string>('1422-06-01');
  const [eclipseType, setEclipseType] = useState<'lunar' | 'solar'>('lunar');
  const [latitude, setLatitude] = useState<number>(10.87);
  const [longitude, setLongitude] = useState<number>(75.95);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Interactive Timeline Scrubber & Animation State
  const [timelineProgress, setTimelineProgress] = useState<number>(0.5); // 0.5 = peak / maximum
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(20); // speed multiplier
  const lastAnimTimeRef = useRef<number>(0);

  // Load benchmark presets
  const handleSelectBenchmark = (id: string) => {
    const b = benchmarks.find((item) => item.id === id);
    if (!b) return;
    setSelectedBenchmarkId(id);
    setDateStr(b.date);
    setEclipseType(b.type === 'lunar' ? 'lunar' : 'solar');
    setLatitude(b.location.latitude);
    setLongitude(b.location.longitude);
    setTimelineProgress(0.5); // Reset to maximum on preset change
    setIsPlaying(false);
  };

  // Date parsing
  const parsedDate = useMemo(() => {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return { year: 1422, month: 6, day: 1 };
  }, [dateStr]);

  const targetDateObj = useMemo(() => {
    return new Date(Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day, 12, 0, 0));
  }, [parsedDate]);

  // Compute Historical (Sūrya Siddhānta) - Only for Lunar (or document parallax for solar)
  const historicalResult = useMemo(() => {
    if (eclipseType === 'lunar') {
      const ahargana = computeAhargana(
        parsedDate.year,
        parsedDate.month,
        parsedDate.day,
        12,
        0,
        0,
        'audayika'
      );
      return computeLunarEclipse(ahargana);
    }
    return null;
  }, [eclipseType, parsedDate]);

  // Compute Modern Reference
  const modernResult = useMemo(() => {
    if (eclipseType === 'lunar') {
      return getModernLunarEclipse(targetDateObj);
    } else {
      return getModernSolarEclipse(targetDateObj, latitude, longitude);
    }
  }, [eclipseType, targetDateObj, latitude, longitude]);

  // Compute Modern Positions & Comparison
  const modernPositions = useMemo(() => {
    return getModernPositions(targetDateObj);
  }, [targetDateObj]);

  const comparison = useMemo(() => {
    if (eclipseType === 'lunar' && historicalResult) {
      return compareLunarEclipse(historicalResult, modernResult, modernPositions);
    }
    return null;
  }, [eclipseType, historicalResult, modernResult, modernPositions]);

  // Current benchmark object
  const currentBenchmark = useMemo(() => {
    return benchmarks.find((b) => b.id === selectedBenchmarkId);
  }, [benchmarks, selectedBenchmarkId]);

  // Animation Loop for Timeline Scrubber
  useEffect(() => {
    let animId: number;
    const animate = (time: number) => {
      if (isPlaying) {
        if (lastAnimTimeRef.current === 0) {
          lastAnimTimeRef.current = time;
        }
        const dt = (time - lastAnimTimeRef.current) / 1000;
        lastAnimTimeRef.current = time;

        setTimelineProgress((prev) => {
          // Duration of complete cycle is ~10 seconds at 1x speed
          const step = (dt * playSpeed) / 60;
          let next = prev + step;
          if (next > 1.0) {
            next = 0.0;
          }
          return next;
        });
      } else {
        lastAnimTimeRef.current = 0;
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playSpeed]);

  // Jump to specific contact points
  const handleJumpToContact = (target: 'c1' | 'c2' | 'max' | 'c3' | 'c4') => {
    setIsPlaying(false);
    switch (target) {
      case 'c1':
        setTimelineProgress(0.20);
        break;
      case 'c2':
        setTimelineProgress(0.40);
        break;
      case 'max':
        setTimelineProgress(0.50);
        break;
      case 'c3':
        setTimelineProgress(0.60);
        break;
      case 'c4':
        setTimelineProgress(0.80);
        break;
    }
  };

  // Calculate simulated clock time corresponding to timeline scrubber
  const simulatedTimeStr = useMemo(() => {
    const peak = modernResult.peakTime;
    if (!peak) {
      return {
        clock: '—',
        offset: '—',
        ghatikaOffset: '—',
      };
    }
    // Assume full timeline spans ~4 hours (240 min)
    const offsetMinutes = (timelineProgress - 0.5) * 240;
    const simDate = new Date(peak.getTime() + offsetMinutes * 60 * 1000);
    const utcHours = simDate.getUTCHours().toString().padStart(2, '0');
    const utcMins = simDate.getUTCMinutes().toString().padStart(2, '0');
    const utcSecs = simDate.getUTCSeconds().toString().padStart(2, '0');

    // Offset label
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMin = Math.abs(Math.round(offsetMinutes));
    const offsetStr = absMin === 0 ? 'Peak (Madhya)' : `Peak ${sign}${absMin}m`;

    return {
      clock: `${utcHours}:${utcMins}:${utcSecs} UTC`,
      offset: offsetStr,
      ghatikaOffset: `${(offsetMinutes / 24).toFixed(1)} ghaṭikā`,
    };
  }, [modernResult.peakTime, timelineProgress]);

  // Active magnitude and obscuration based on timeline progress
  const displayMagnitude = useMemo(() => {
    const baseMag = historicalResult?.magnitude ?? modernResult.obscuration ?? 1.0;
    // Scale magnitude according to proximity to peak (0.5)
    const proximity = Math.max(0, 1 - Math.abs(timelineProgress - 0.5) * 3.3);
    return baseMag * proximity;
  }, [historicalResult, modernResult.obscuration, timelineProgress]);

  const displayObscuration = useMemo(() => {
    const baseObs = modernResult.obscuration ?? (historicalResult?.magnitude ? Math.min(1, historicalResult.magnitude) : 1.0);
    const proximity = Math.max(0, 1 - Math.abs(timelineProgress - 0.5) * 3.3);
    return baseObs * proximity;
  }, [modernResult.obscuration, historicalResult, timelineProgress]);

  return (
    <ModuleLayout
      title="Predict an Eclipse"
      subtitle="Historical Algorithm & Modern Ephemeris Verification"
    >
      <div className="flex flex-col gap-8 pb-16 max-w-7xl mx-auto">
        
        {/* ========================================================================= */}
        {/* 1. BENCHMARK CARDS GALLERY                                                */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal dark:text-stone-200">
                Astronomical Benchmarks & Historical Records
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Select a celebrated historical or modern observation benchmark across the Indian subcontinent
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 font-mono">
                5 Curated Benchmarks
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {benchmarks.map((b) => {
              const isSelected = b.id === selectedBenchmarkId;
              const isLunar = b.type === 'lunar';
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBenchmark(b.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-md ring-1 ring-indigo-500'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141210] hover:border-stone-300 dark:hover:border-stone-700 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-base">{isLunar ? '🌕' : '☀️'}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                          isLunar
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {b.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-charcoal dark:text-stone-100 font-mono">
                      {b.date}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-300 font-medium line-clamp-1 mt-0.5">
                      {b.location.name}
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-tight">
                    {b.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. OBSERVATION PARAMETERS BAR                                             */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#141210] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal dark:text-stone-200">
                Active Parameters
              </span>
              {currentBenchmark?.historicalSource && (
                <span className="text-[11px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono">
                  Observed by {currentBenchmark.historicalSource.observer} ({currentBenchmark.historicalSource.text})
                </span>
              )}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Lat: {latitude}°N • Lon: {longitude}°E
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Eclipse Mode
              </label>
              <div className="flex rounded-lg bg-stone-100 dark:bg-stone-800 p-0.5 border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setEclipseType('lunar')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                    eclipseType === 'lunar'
                      ? 'bg-white dark:bg-stone-900 shadow-sm text-charcoal dark:text-stone-100 font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  🌕 Lunar (Chandra)
                </button>
                <button
                  type="button"
                  onClick={() => setEclipseType('solar')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                    eclipseType === 'solar'
                      ? 'bg-white dark:bg-stone-900 shadow-sm text-charcoal dark:text-stone-100 font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  ☀️ Solar (Sūrya)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Date (Calendar)
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Latitude (°N)
              </label>
              <input
                type="number"
                step="0.01"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Longitude (°E)
              </label>
              <input
                type="number"
                step="0.01"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. INTERACTIVE SIMULATION CANVAS & TIMELINE SCRUBBER                      */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4">
          {/* Main Visualizer SVG Card */}
          <EclipseVisualization
            eclipseType={eclipseType}
            progress={timelineProgress}
            magnitude={displayMagnitude}
            obscuration={displayObscuration}
            kind={modernResult.kind}
            moonLatitudeDeg={historicalResult?.moonLatitude ?? modernPositions.moonEclipticLatitude}
            isEclipse={historicalResult?.isEclipse ?? (modernResult.kind !== 'none')}
          />

          {/* Timeline Scrubber & Playback Controls Console */}
          <div className="bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-5">
            {/* Top time and status readouts */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal dark:text-stone-200">
                  Eclipse Progression Timeline
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  {simulatedTimeStr.offset}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-stone-500 dark:text-stone-400">
                  Simulated UTC: <strong className="text-indigo-600 dark:text-indigo-400">{simulatedTimeStr.clock}</strong>
                </span>
                <span className="text-stone-500 dark:text-stone-400 hidden sm:inline">
                  Ghaṭikā: <strong className="text-amber-600 dark:text-amber-400">{simulatedTimeStr.ghatikaOffset}</strong>
                </span>
              </div>
            </div>

            {/* Slider Track with Contact Detent Markers */}
            <div className="flex flex-col gap-2">
              <div className="relative w-full pt-1 pb-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.002"
                  value={timelineProgress}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setTimelineProgress(parseFloat(e.target.value));
                  }}
                  className="w-full h-3 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600 dark:accent-amber-500"
                />

                {/* Contact Point Detent Ticks */}
                <div className="relative w-full flex justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400 mt-2 px-1">
                  <span className="text-left">
                    -2h (C1 - 30m)
                  </span>
                  <span className="text-center">
                    C1 Ingress (~0.20)
                  </span>
                  <span className="text-center font-semibold text-amber-600 dark:text-amber-400">
                    ▲ Greatest Peak (0.50)
                  </span>
                  <span className="text-center">
                    C4 Egress (~0.80)
                  </span>
                  <span className="text-right">
                    +2h (C4 + 30m)
                  </span>
                </div>
              </div>
            </div>

            {/* Playback Controls & Direct Contact Jump Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              {/* Play / Pause and Speed Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                      : 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 shadow-sm'
                  }`}
                >
                  <span>{isPlaying ? '⏸ Pause' : '▶ Play Simulation'}</span>
                </button>

                <div className="flex rounded-lg bg-stone-100 dark:bg-stone-800 p-0.5 border border-stone-200 dark:border-stone-700 text-xs font-medium">
                  {[
                    { label: '1x', val: 5 },
                    { label: '5x', val: 20 },
                    { label: '15x', val: 60 },
                    { label: '60x', val: 180 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setPlaySpeed(s.val)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        playSpeed === s.val
                          ? 'bg-white dark:bg-stone-900 shadow-sm text-charcoal dark:text-stone-100 font-semibold'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Jump to Classical Contact Stages */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mr-1">
                  Jump to Stage:
                </span>
                <button
                  type="button"
                  onClick={() => handleJumpToContact('c1')}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-mono text-stone-700 dark:text-stone-300 transition-colors"
                >
                  C1 (Sparśa)
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToContact('c2')}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-mono text-stone-700 dark:text-stone-300 transition-colors"
                >
                  C2 (Nimīlana)
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToContact('max')}
                  className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900 text-[11px] font-mono font-semibold text-amber-900 dark:text-amber-200 transition-colors"
                >
                  Max (Madhya)
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToContact('c3')}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-mono text-stone-700 dark:text-stone-300 transition-colors"
                >
                  C3 (Unmīlana)
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToContact('c4')}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-mono text-stone-700 dark:text-stone-300 transition-colors"
                >
                  C4 (Mokṣa)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. DUAL COMPUTATION COMPARISON PANELS                                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: Sūrya Siddhānta Historical Engine */}
          <div className="bg-[#FEFDF5] dark:bg-[#141210] border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/40 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-charcoal dark:text-stone-100">
                  Sūrya Siddhānta Model
                </h3>
                <ProvenanceLabel type="documented" />
              </div>
              <SourceTooltip
                source={eclipseType === 'lunar' ? 'Sūrya Siddhānta Ch.4' : 'Sūrya Siddhānta Ch.5'}
                chapter={eclipseType === 'lunar' ? '4' : '5'}
                note={
                  eclipseType === 'lunar'
                    ? "Lunar eclipse algorithm: epicyclic manda correction, lunar latitude from Rahu, and Earth's shadow cone projection."
                    : 'Solar eclipse algorithm: requires topocentric parallax in longitude (lambana) and latitude (nati).'
                }
              />
            </div>

            {eclipseType === 'lunar' && historicalResult ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white/90 dark:bg-stone-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      Status
                    </span>
                    <span className="text-sm font-semibold text-charcoal dark:text-stone-100">
                      {historicalResult.isEclipse ? `Eclipse (${historicalResult.type})` : 'No Eclipse'}
                    </span>
                  </div>
                  <div className="bg-white/90 dark:bg-stone-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      Magnitude (Grāsa)
                    </span>
                    <span className="text-sm font-semibold text-charcoal dark:text-stone-100 font-mono">
                      {historicalResult.magnitude.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white/90 dark:bg-stone-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      Half Duration
                    </span>
                    <span className="text-sm font-semibold text-charcoal dark:text-stone-100 font-mono">
                      {historicalResult.halfDurationGhatikas
                        ? `${historicalResult.halfDurationGhatikas.toFixed(1)} ghaṭī`
                        : '—'}
                    </span>
                  </div>
                  <div className="bg-white/90 dark:bg-stone-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      Sun True Longitude
                    </span>
                    <span className="text-sm font-semibold text-charcoal dark:text-stone-100 font-mono">
                      {historicalResult.sunTrueLongitude.toFixed(2)}°
                    </span>
                  </div>
                  <div className="bg-white/90 dark:bg-stone-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      Moon True Longitude
                    </span>
                    <span className="text-sm font-semibold text-charcoal dark:text-stone-100 font-mono">
                      {historicalResult.moonTrueLongitude.toFixed(2)}°
                    </span>
                  </div>
                  <div className="bg-white/90 dark:bg-stone-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                      Lunar Latitude (Vikṣepa)
                    </span>
                    <span className="text-sm font-semibold text-charcoal dark:text-stone-100 font-mono">
                      {historicalResult.moonLatitude.toFixed(2)}°
                    </span>
                  </div>
                </div>

                {/* Algorithm Step-Through Accordion with Illustrated Mini-Diagrams */}
                <div className="flex flex-col gap-2 pt-1">
                  <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    Sūrya Siddhānta Algorithm Steps (With Geometry)
                  </h4>
                  <div className="space-y-2">
                    {historicalResult.steps.map((step) => {
                      const isExpanded = expandedStep === step.stepNumber;
                      return (
                        <div
                          key={step.stepNumber}
                          className="border border-stone-200/80 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-900 overflow-hidden text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedStep(isExpanded ? null : step.stepNumber)}
                            className="w-full text-left px-3.5 py-2.5 font-medium text-stone-800 dark:text-stone-200 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-colors"
                          >
                            <span>
                              <span className="text-amber-700 dark:text-amber-500 font-mono mr-2">
                                Step {step.stepNumber}:
                              </span>
                              {step.name}
                            </span>
                            <span className="text-stone-400">{isExpanded ? '▲' : '▼'}</span>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-3.5 pt-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 space-y-2 text-stone-600 dark:text-stone-400 font-sans">
                              <p className="italic text-stone-500 dark:text-stone-400">{step.description}</p>
                              
                              {step.formula && (
                                <div className="font-mono text-[11px] text-indigo-900 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/50 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                                  {step.formula}
                                </div>
                              )}

                              {/* Mini Diagram for each specific step */}
                              <div className="flex items-center gap-3 py-1.5 px-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                                {step.stepNumber === 1 && (
                                  <svg viewBox="0 0 160 45" className="w-40 h-11 shrink-0">
                                    <circle cx="80" cy="22" r="18" fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="2 2" />
                                    <circle cx="80" cy="22" r="3" fill="#2563EB" />
                                    <line x1="80" y1="22" x2="96" y2="14" stroke="#D97706" strokeWidth="1.5" />
                                    <circle cx="96" cy="14" r="2.5" fill="#D97706" />
                                    <line x1="80" y1="22" x2="65" y2="30" stroke="#94A3B8" strokeWidth="1.5" />
                                    <circle cx="65" cy="30" r="2.5" fill="#94A3B8" />
                                    <text x="100" y="16" fontSize="7" fill="#D97706">Sun</text>
                                    <text x="50" y="32" fontSize="7" fill="#94A3B8">Moon</text>
                                  </svg>
                                )}
                                {step.stepNumber === 2 && (
                                  <svg viewBox="0 0 160 45" className="w-40 h-11 shrink-0">
                                    <path d="M 15 22 Q 80 5 145 22" fill="none" stroke="#4338CA" strokeWidth="1.5" />
                                    <circle cx="80" cy="13" r="3" fill="#D97706" />
                                    <line x1="80" y1="13" x2="80" y2="22" stroke="#EF4444" strokeWidth="1" strokeDasharray="1 1" />
                                    <text x="85" y="20" fontSize="7" fill="#EF4444">Manda Eq.</text>
                                  </svg>
                                )}
                                {step.stepNumber === 3 && (
                                  <svg viewBox="0 0 160 45" className="w-40 h-11 shrink-0">
                                    <line x1="10" y1="22" x2="150" y2="22" stroke="#64748B" strokeWidth="1" />
                                    <line x1="10" y1="12" x2="150" y2="32" stroke="#DC2626" strokeWidth="1" strokeDasharray="2 2" />
                                    <circle cx="80" cy="22" r="3" fill="#DC2626" />
                                    <text x="80" y="32" fontSize="7" fill="#DC2626" textAnchor="middle">Node (Rāhu)</text>
                                  </svg>
                                )}
                                {step.stepNumber === 4 && (
                                  <svg viewBox="0 0 160 45" className="w-40 h-11 shrink-0">
                                    <circle cx="60" cy="22" r="16" fill="#1E1B4B" stroke="#4338CA" strokeWidth="1" />
                                    <circle cx="110" cy="22" r="8" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                                    <text x="60" y="24" fontSize="6" fill="#A5B4FC" textAnchor="middle">Shadow ~40&apos;</text>
                                    <text x="110" y="24" fontSize="6" fill="#475569" textAnchor="middle">Moon ~16&apos;</text>
                                  </svg>
                                )}
                                {step.stepNumber === 5 && (
                                  <svg viewBox="0 0 160 45" className="w-40 h-11 shrink-0">
                                    <circle cx="70" cy="22" r="16" fill="#1E1B4B" />
                                    <circle cx="84" cy="22" r="8" fill="#EF4444" opacity="0.8" />
                                    <text x="100" y="24" fontSize="7" fill="#EF4444">Grāsa (Overlap)</text>
                                  </svg>
                                )}
                                {step.stepNumber === 6 && (
                                  <svg viewBox="0 0 160 45" className="w-40 h-11 shrink-0">
                                    <polygon points="40,32 120,32 120,12" fill="none" stroke="#D97706" strokeWidth="1" />
                                    <text x="80" y="30" fontSize="7" fill="#D97706" textAnchor="middle">Sthityardha</text>
                                  </svg>
                                )}
                                <div className="text-[11px] leading-tight">
                                  <span className="font-semibold text-stone-700 dark:text-stone-300">Outputs: </span>
                                  {Object.entries(step.outputValues)
                                    .map(([k, v]) => `${k} = ${typeof v === 'number' ? v.toFixed(2) : v}`)
                                    .join(', ')}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Informative notice for Solar Eclipses */
              <div className="flex flex-col gap-4 py-4 px-3">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-300">
                    <span>ℹ️</span>
                    <span>Solar Parallax (Lambana & Nati) Geometry</span>
                  </div>
                  <p>
                    In ancient Indian astronomy, <strong>lunar eclipses</strong> are universal events observed simultaneously across Earth. In contrast, <strong>solar eclipses</strong> depend on the observer&apos;s exact topocentric position due to lunar parallax (Sūrya Siddhānta Ch. 5).
                  </p>
                  <p>
                    Because the Moon is ~400 times closer to Earth than the Sun, an observer in Rajasthan sees the Moon shifted by up to ~1° relative to the solar disk compared to an observer in Kerala. The historical parallax engine requires calculating:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-amber-950 dark:text-amber-200">
                    <li><strong>Lambana</strong>: Parallax in ecliptic longitude (shifts conjunction time)</li>
                    <li><strong>Nati</strong>: Parallax in ecliptic latitude (shifts apparent northern/southern separation)</li>
                    <li><strong>Tribhonalagna</strong>: Nonagesimal (the point of the ecliptic 90° behind the ascendant)</li>
                  </ul>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    The Modern Reference model on the right accurately computes topocentric VSOP87 solar eclipse circumstances for your selected coordinates ({latitude}°N, {longitude}°E).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Modern Reference Engine */}
          <div className="bg-white dark:bg-[#141210] border border-indigo-100 dark:border-indigo-950/60 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-indigo-50 dark:border-indigo-950/50 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-charcoal dark:text-stone-100">Modern Reference Model</h3>
                <ProvenanceLabel type="modern" />
              </div>
              <SourceTooltip
                source="Astronomy Engine (VSOP87 / ELP2000)"
                note="High-precision VSOP87 analytical ephemeris with NASA Espenak-Meeus ΔT polynomials and topocentric parallax."
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-indigo-50/40 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Classification
                </span>
                <span className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 capitalize">
                  {modernResult.kind !== 'none' ? `${modernResult.kind} Eclipse` : 'None Visible'}
                </span>
              </div>
              <div className="bg-indigo-50/40 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Obscuration
                </span>
                <span className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 font-mono">
                  {modernResult.obscuration.toFixed(3)}
                </span>
              </div>
              <div className="bg-indigo-50/40 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  ΔT Uncertainty
                </span>
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-400 font-mono">
                  {modernResult.deltaTUncertainty}
                </span>
              </div>
              <div className="bg-indigo-50/40 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Peak Time (UTC)
                </span>
                <span className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 font-mono">
                  {modernResult.peakTime ? modernResult.peakTime.toUTCString().slice(17, 25) : '—'}
                </span>
              </div>
              <div className="bg-indigo-50/40 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  First Contact (C1)
                </span>
                <span className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 font-mono">
                  {modernResult.partialBegin
                    ? modernResult.partialBegin.toUTCString().slice(17, 25)
                    : '—'}
                </span>
              </div>
              <div className="bg-indigo-50/40 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Last Contact (C4)
                </span>
                <span className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 font-mono">
                  {modernResult.partialEnd
                    ? modernResult.partialEnd.toUTCString().slice(17, 25)
                    : '—'}
                </span>
              </div>
            </div>

            {/* Modern Ground Truth Contact Sequence Bar */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/80 dark:border-stone-800 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Contact Time Intervals (UTC)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">C1 (Ingress)</span>
                  <span className="text-stone-800 dark:text-stone-200">
                    {modernResult.partialBegin ? modernResult.partialBegin.toUTCString().slice(17, 22) : '—'}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">C2 (Totality)</span>
                  <span className="text-stone-800 dark:text-stone-200">
                    {modernResult.totalBegin ? modernResult.totalBegin.toUTCString().slice(17, 22) : '—'}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">C3 (Tot. End)</span>
                  <span className="text-stone-800 dark:text-stone-200">
                    {modernResult.totalEnd ? modernResult.totalEnd.toUTCString().slice(17, 22) : '—'}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">C4 (Egress)</span>
                  <span className="text-stone-800 dark:text-stone-200">
                    {modernResult.partialEnd ? modernResult.partialEnd.toUTCString().slice(17, 22) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. QUANTITATIVE COMPARISON TABLE & ERROR DIVERGENCE ANALYSIS               */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-charcoal dark:text-stone-100">
                Historical vs Modern Divergence Evaluation
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Direct quantitative benchmark comparison against modern JPL/VSOP87 ground truth
              </p>
            </div>
            <ProvenanceLabel type="reconstruction" />
          </div>

          {comparison && historicalResult ? (
            <div className="flex flex-col gap-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                      <th className="py-2.5 px-3">Metric</th>
                      <th className="py-2.5 px-3">Sūrya Siddhānta (Historical)</th>
                      <th className="py-2.5 px-3">Modern Reference (VSOP87)</th>
                      <th className="py-2.5 px-3">Residual Difference (Error)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs sm:text-sm font-sans text-stone-800 dark:text-stone-200">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-stone-700 dark:text-stone-300">Eclipse Occurs</td>
                      <td className="py-2.5 px-3">
                        {historicalResult.isEclipse ? 'Yes (Predicted)' : 'No'}
                      </td>
                      <td className="py-2.5 px-3">
                        {modernResult.kind !== 'none' ? 'Yes (Actual)' : 'No'}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {comparison.isBothEclipse ? (
                          <span className="text-emerald-700 dark:text-emerald-400">✓ Agreement (True Positive)</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400">Disagreement</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-stone-700 dark:text-stone-300">Obscuration / Magnitude</td>
                      <td className="py-2.5 px-3 font-mono">{historicalResult.magnitude.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono">{modernResult.obscuration.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className={Math.abs(comparison.magnitudeDiff) < 0.2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                          {comparison.magnitudeDiff > 0 ? '+' : ''}
                          {comparison.magnitudeDiff.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                    {comparison.durationDiffMinutes !== undefined && (
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-stone-700 dark:text-stone-300">Total Duration</td>
                        <td className="py-2.5 px-3 font-mono">
                          {historicalResult.halfDurationGhatikas
                            ? `${(historicalResult.halfDurationGhatikas * 2 * 24).toFixed(0)} min`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {modernResult.partialBegin && modernResult.partialEnd
                            ? `${Math.round(
                                (modernResult.partialEnd.getTime() -
                                  modernResult.partialBegin.getTime()) /
                                  60000
                              )} min`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className={Math.abs(comparison.durationDiffMinutes) < 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                            {comparison.durationDiffMinutes > 0 ? '+' : ''}
                            {comparison.durationDiffMinutes.toFixed(0)} min
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Causes of Divergence Cards */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Astronomical Factors Explaining Residuals
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                  {comparison.primaryDiscrepancyReasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FEFDF5] dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 p-3.5 rounded-xl text-xs text-stone-700 dark:text-stone-300 leading-relaxed"
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-stone-50 dark:bg-stone-900/40 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                Solar eclipse comparison is evaluating against topocentric NASA/VSOP87 ground truth. The Sūrya Siddhānta solar parallax algorithm (Ch. 5) demonstrates why historical observers needed to apply local corrections for each city. For an end-to-end mathematical comparison of the Siddhāntic epicycle equations, select the <strong>Parameśvara 1422 CE Lunar Eclipse</strong> benchmark above.
              </p>
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
