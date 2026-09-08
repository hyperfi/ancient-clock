'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ProvenanceLabel } from '@/components/ui/ProvenanceLabel';
import { SourceTooltip } from '@/components/ui/SourceTooltip';
import { WaterBowl } from '@/components/svg/WaterBowl';
import { WaterBowl3D } from '@/components/three/WaterBowl3D';
import { playGhatikaChime } from '@/lib/water-clock/chime';
import { 
  simulateWaterClock, 
  SimulationResult 
} from '@/lib/water-clock/simulation';
import { 
  HISTORICAL_PARAMS, 
  WaterClockParams,
  TARGET_SINK_TIME
} from '@/lib/water-clock/constants';

// Formatting helpers
const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number) => {
  const sign = seconds < 0 ? '-' : '+';
  const abs = Math.abs(seconds);
  return `${sign}${abs.toFixed(1)}s`;
};

export default function WaterClockPage() {
  const [activeTab, setActiveTab] = useState<'historical' | 'calibrate' | 'accuracy'>('historical');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Simulation physical params
  const [params, setParams] = useState<WaterClockParams>(HISTORICAL_PARAMS);
  const [waterTempC, setWaterTempC] = useState<number>(25);
  
  // Simulation pre-computation
  const result = useMemo(() => simulateWaterClock(params), [params]);
  
  // Playback state - default 60x speed so 1s = 1 min (full ghaṭikā sinks in 24 seconds)
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(60);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [ghatikas, setGhatikas] = useState<number>(0);
  const [sinkAlert, setSinkAlert] = useState<boolean>(false);
  
  const lastUpdateRef = useRef<number>(0);
  const reqRef = useRef<number>(0);

  // Derive current state from time using O(1) indexed lookup
  const currentState = useMemo(() => {
    if (!result.states.length) return null;
    const idx = Math.min(Math.max(0, Math.floor(currentTime)), result.states.length - 1);
    return result.states[idx] || result.states[result.states.length - 1];
  }, [result, currentTime]);

  // Robust animation frame loop
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(reqRef.current);
      lastUpdateRef.current = 0;
      return;
    }
    
    lastUpdateRef.current = performance.now();
    
    const tick = (now: number) => {
      if (!lastUpdateRef.current) {
        lastUpdateRef.current = now;
      }
      // Clamp dt to maximum 100ms to avoid huge leaps if tab sleeps or lags
      const dt = Math.min((now - lastUpdateRef.current) / 1000, 0.1);
      lastUpdateRef.current = now;
      
      setCurrentTime(prev => {
        const nextTime = prev + dt * speed;
        if (nextTime >= result.sinkTime) {
          // Bowl has sunk! Trigger visual chime, sound chime, increment counter, reset cycle
          setGhatikas(g => g + 1);
          setSinkAlert(true);
          if (soundEnabled) {
            playGhatikaChime(0.6);
          }
          setTimeout(() => setSinkAlert(false), 3200);
          return 0;
        }
        return nextTime;
      });
      
      reqRef.current = requestAnimationFrame(tick);
    };
    
    reqRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(reqRef.current);
      lastUpdateRef.current = 0;
    };
  }, [isPlaying, speed, result.sinkTime, soundEnabled]);

  // Handle reset
  const handleReset = () => {
    setCurrentTime(0);
    setGhatikas(0);
    setIsPlaying(false);
    setSinkAlert(false);
  };

  // Jump to 95% to immediately test sinking physics and chime
  const handleJumpToNearSink = () => {
    setCurrentTime(Math.max(0, result.sinkTime - 15));
    setIsPlaying(true);
  };

  // Extract variables for visualization
  const subDepth = (currentState?.submersionDepth || 0) * 100; // cm
  const freeboard = Math.max(0, (currentState?.freeboard || 0) * 100); // cm
  const fillRatio = result.sinkTime > 0 ? Math.min(1, currentTime / result.sinkTime) : 0;
  const isSinking = currentState?.isSinking || currentTime >= result.sinkTime;
  const flowRateMlS = currentState ? currentState.flowRate * 1e6 : 0;
  const vinadisElapsed = (fillRatio * 60);

  return (
    <div className="min-h-screen bg-[#FEFDF5] dark:bg-[#0C0A09] text-[#1C1917] dark:text-[#F5F5F4] flex flex-col md:flex-row overflow-x-hidden md:overflow-hidden transition-colors duration-300">
      
      {/* Left / Main: The Simulation Canvas */}
      <div className="w-full md:w-3/5 min-h-[480px] md:h-screen relative flex flex-col justify-between p-3 sm:p-4 md:p-6 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800">
        
        {/* Top Header & Breadcrumb & View Mode Switcher */}
        <div className="z-10 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Link 
              href="/observe/measure-time" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tracking-wide uppercase"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Measure Time Hub
            </Link>
            
            <div className="flex items-center gap-2">
              {/* 3D vs 2D View Mode Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
                    viewMode === '3d'
                      ? 'bg-white dark:bg-stone-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <span>🌐</span>
                  <span>3D Interactive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
                    viewMode === '2d'
                      ? 'bg-white dark:bg-stone-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <span>📐</span>
                  <span>2D CAD</span>
                </button>
              </div>

              <ProvenanceLabel type="documented" />
              <SourceTooltip 
                source="Sūrya Siddhānta"
                chapter="13"
                verse="23"
                translation="A copper vessel, shaped like a hemisphere, having a small hole at the bottom..."
                note="Also codified in Āryabhaṭīya and Brahmagupta's Brāhmasphuṭasiddhānta (Ch.22)."
              />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-serif text-[#1C1917] dark:text-stone-100 flex items-baseline gap-2">
                <span>Ghaṭīyantra</span>
                <span className="text-stone-400 font-light text-lg">(घटीयन्त्र)</span>
              </h1>
              <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400">
                Self-sinking hemispherical copper water bowl (nimīlikā) calibrated to sink in 1 ghaṭikā (24 min = 60 vināḍīs).
              </p>
            </div>

            {/* Sound Mute/Unmute */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playGhatikaChime(0.4);
              }}
              className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                soundEnabled
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                  : 'border-stone-200 dark:border-stone-800 text-stone-400'
              }`}
              title={soundEnabled ? 'Bell chime enabled on sink' : 'Sound muted'}
            >
              <span>{soundEnabled ? '🔔' : '🔕'}</span>
              <span className="hidden sm:inline text-[10px] font-medium">{soundEnabled ? 'Bell On' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {/* Central Visualization Viewport */}
        <div className="flex-1 w-full relative flex items-center justify-center my-2 min-h-0">
          {viewMode === '3d' ? (
            <div className="w-full h-full relative">
              <WaterBowl3D
                fillLevel={fillRatio}
                submersionDepthCm={subDepth}
                freeboardCm={freeboard}
                isSinking={isSinking}
                flowActive={isPlaying && !isSinking}
                viewMode={viewMode}
                onToggleViewMode={setViewMode}
                className="w-full h-full shadow-inner"
              />

              {/* Completion Chime Alert Banner */}
              {sinkAlert && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-amber-500/95 text-white px-5 py-2.5 rounded-full shadow-xl text-sm font-semibold flex items-center gap-2.5 animate-bounce z-20 border border-amber-300">
                  <span className="text-xl">🔔</span>
                  <div>
                    <div className="leading-tight">1 Ghaṭikā Complete!</div>
                    <div className="text-[10px] font-normal text-amber-100">Ghaṇṭā gong struck • 24 minutes elapsed</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-b from-stone-100/60 to-stone-200/40 dark:from-stone-900/60 dark:to-[#0c0a09]/80 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 overflow-hidden">
              {/* Floating 2D/3D Mode Switcher */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-1 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm z-10 text-xs">
                <div className="flex rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 p-0.5 border border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('3d')}
                    className="px-2.5 py-1 rounded font-medium transition-all text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1"
                    title="Switch to 3D Interactive Simulation"
                  >
                    <span>🌐</span>
                    <span>3D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('2d')}
                    className="px-2.5 py-1 rounded font-medium transition-all bg-indigo-600 text-white shadow-xs flex items-center gap-1"
                    title="2D CAD Technical Diagram Active"
                  >
                    <span>📐</span>
                    <span className="font-semibold">2D CAD</span>
                  </button>
                </div>
              </div>

              <WaterBowl
                fillLevel={fillRatio}
                isSinking={isSinking}
                flowActive={isPlaying && !isSinking}
                showBasin={true}
                showLabels={true}
                freeboardCm={freeboard}
                submersionCm={subDepth}
                size="100%"
                className="w-full max-w-xl drop-shadow-xl"
              />

              {sinkAlert && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white px-5 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 animate-bounce">
                  <span>🔔</span>
                  <span>1 Ghaṭikā Complete! (24 minutes elapsed)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Scrubbable Time Bar & Primary Playback Controls */}
        <div className="bg-white/95 dark:bg-[#141210]/95 backdrop-blur-md p-3 md:p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-md flex flex-col gap-2.5 z-10">
          
          {/* Time Scrubber Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800 dark:text-stone-200">Interactive Scrubber:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {formatTime(currentTime)} / {formatTime(result.sinkTime)}
                </span>
                <span className="text-[11px] text-stone-400">
                  ({vinadisElapsed.toFixed(1)} vināḍīs • {(fillRatio * 100).toFixed(0)}% full)
                </span>
              </div>

              <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                Freeboard: <strong className={freeboard <= 0 ? 'text-rose-500' : 'text-amber-600 dark:text-amber-400'}>{freeboard.toFixed(2)} cm</strong>
              </div>
            </div>

            {/* Range Scrubber */}
            <input 
              type="range"
              min="0"
              max={result.sinkTime}
              step="1"
              value={currentTime}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTime(parseFloat(e.target.value));
              }}
              className="w-full accent-indigo-600 h-2 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
              title="Drag slider to scrub simulation forward or backward"
            />

            {/* Key Marker Legend */}
            <div className="flex justify-between text-[10px] text-stone-400 dark:text-stone-500 px-0.5">
              <span>0m (Empty / Floating)</span>
              <span>6m (15 vināḍīs)</span>
              <span>12m (Half Full)</span>
              <span>18m (45 vināḍīs)</span>
              <span className="font-semibold text-rose-500 dark:text-rose-400">24m (Sinks!)</span>
            </div>
          </div>

          {/* Controls Strip: Play / Pause, Reset, Fast-Forward, Speed, Telemetry */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
            
            {/* Play, Reset & Jump Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 min-h-[42px] ${
                  isPlaying 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <span>{isPlaying ? '⏸ Pause' : '▶ Start Clock'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700 min-h-[42px]"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleJumpToNearSink}
                className="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors border border-rose-200 dark:border-rose-800 flex items-center gap-1 min-h-[42px]"
                title="Jump directly to 15 seconds before the bowl sinks to test the sinking physics"
              >
                <span>⏩</span>
                <span>Test Sink</span>
              </button>

              <button
                type="button"
                onClick={() => playGhatikaChime(0.7)}
                className="px-3 py-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors border border-amber-200 dark:border-amber-800 min-h-[42px]"
                title="Play test temple bell chime"
              >
                🔔 Bell
              </button>
            </div>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-400 uppercase font-semibold">Speed:</span>
              <div className="flex rounded-md overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 p-0.5">
                {[1, 10, 60, 120, 300].map(s => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded transition-colors min-h-[36px] ${
                      speed === s
                        ? 'bg-white dark:bg-stone-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    {s === 1 ? '1x' : s === 60 ? '60x' : `${s}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* Ghaṭikā Count Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-serif text-sm font-bold text-[#D97706] dark:text-amber-400">
                {ghatikas}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                <strong className="block text-stone-800 dark:text-stone-200">Ghaṭikās Sunk</strong>
                <span>{ghatikas * 24} min total</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Right: Control, Calibration & Metrology Panel */}
      <div className="w-full md:w-2/5 bg-white dark:bg-[#141210] flex flex-col md:h-screen overflow-y-auto">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap border-b border-stone-200 dark:border-stone-800 px-4 pt-2 sm:pt-3 sticky top-0 bg-white dark:bg-[#141210] z-20">
          {[
            { id: 'historical', label: 'Classical Specs' },
            { id: 'calibrate', label: 'Calibration Lab' },
            { id: 'accuracy', label: 'Metrology & Physics' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id 
                  ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-semibold' 
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6 flex-1 space-y-6">
          
          {/* TAB 1: HISTORICAL SPECIFICATIONS */}
          {activeTab === 'historical' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  Classical Engineering Specifications
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 leading-relaxed">
                  The Sūrya Siddhānta specifies a copper vessel of 10 palas weight, 6 aṅgulas depth, and 12 aṅgulas mouth diameter, pierced by a needle made of 3+1/3 māṣas of gold, 4 aṅgulas long.
                </p>
              </div>

              {/* Dimensions Card */}
              <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-2">
                  <span className="text-stone-500 dark:text-stone-400">Vessel Material</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Tāmra (Hammered Copper)</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-2">
                  <span className="text-stone-500 dark:text-stone-400">Rim Diameter (Vyāsa)</span>
                  <span className="font-mono font-medium">12 aṅgulas (~21.2 cm)</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-2">
                  <span className="text-stone-500 dark:text-stone-400">Depth (Utsedha)</span>
                  <span className="font-mono font-medium">6 aṅgulas (~10.6 cm)</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-2">
                  <span className="text-stone-500 dark:text-stone-400">Empty Mass (Bhāra)</span>
                  <span className="font-mono font-medium">10 palas (~400 grams)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400">Calibrated Needle Orifice</span>
                  <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">~1.00 mm (Gold Needle)</span>
                </div>
              </div>

              {/* Telemetry Summary Card */}
              <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
                <h4 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Live Physics Telemetry</h4>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <span className="text-stone-400 block text-[10px]">Current Submersion</span>
                    <span className="text-sm font-mono font-semibold text-stone-800 dark:text-stone-100">{subDepth.toFixed(2)} cm</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <span className="text-stone-400 block text-[10px]">Remaining Freeboard</span>
                    <span className={`text-sm font-mono font-semibold ${freeboard <= 0 ? 'text-rose-500' : 'text-amber-600 dark:text-amber-400'}`}>
                      {freeboard.toFixed(2)} cm
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <span className="text-stone-400 block text-[10px]">Inflow Rate (Q)</span>
                    <span className="text-sm font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {isPlaying && !isSinking ? `${flowRateMlS.toFixed(2)} mL/s` : '0.00 mL/s'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <span className="text-stone-400 block text-[10px]">Target Sink Time</span>
                    <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatTime(result.sinkTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Classical Verse Card */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl">
                <p className="text-xs text-amber-900 dark:text-amber-300 italic leading-relaxed">
                  "A copper vessel shaped like a hemisphere, having a mouth diameter of 12 aṅgulas and depth of 6 aṅgulas, perforated at the bottom by a circular gold needle... sinks 60 times in a day and night."
                </p>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-2 text-right">
                  — Sūrya Siddhānta, 13.23
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CALIBRATION LAB */}
          {activeTab === 'calibrate' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  Calibrate Physical Parameters
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 leading-relaxed">
                  Torricellian outflow and Archimedean buoyancy dictate sink time: t_sink ∝ M / (ρ A √(2gh)). Adjust dimensions to evaluate sensitivity.
                </p>
              </div>
              
              {/* Sliders */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="font-medium text-stone-700 dark:text-stone-300">Orifice Diameter</label>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {(params.holeDiameterM * 1000).toFixed(2)} mm
                    </span>
                  </div>
                  <input 
                    type="range" min="0.6" max="1.8" step="0.02" 
                    value={params.holeDiameterM * 1000} 
                    onChange={e => setParams({...params, holeDiameterM: parseFloat(e.target.value) / 1000})}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[10px] text-stone-400 block">Slight orifice variation produces quadratic changes in inflow rate.</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="font-medium text-stone-700 dark:text-stone-300">Empty Bowl Mass</label>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {(params.bowlMassKg * 1000).toFixed(0)} g
                    </span>
                  </div>
                  <input 
                    type="range" min="200" max="700" step="10" 
                    value={params.bowlMassKg * 1000} 
                    onChange={e => setParams({...params, bowlMassKg: parseFloat(e.target.value) / 1000})}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[10px] text-stone-400 block">Heavier bowl sits deeper initially (lower initial freeboard).</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="font-medium text-stone-700 dark:text-stone-300">Bowl Radius</label>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {(params.bowlRadiusM * 100).toFixed(1)} cm
                    </span>
                  </div>
                  <input 
                    type="range" min="6" max="15" step="0.2" 
                    value={params.bowlRadiusM * 100} 
                    onChange={e => {
                      const r = parseFloat(e.target.value) / 100;
                      setParams({...params, bowlRadiusM: r, bowlDepthM: r});
                    }}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[10px] text-stone-400 block">Radius changes internal hemisphere volume V = (2/3)π r³.</span>
                </div>
              </div>
              
              {/* Calibration Feedback Card */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-3">
                  Calibration Scorecard
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Current Sink Time</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{formatTime(result.sinkTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Error vs 1 Ghaṭikā (1440s)</span>
                    <span className={`font-mono font-semibold ${Math.abs(result.error) < 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {formatDuration(result.error)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">Projected 24-Hour Drift</span>
                    <span className="font-mono font-medium text-stone-800 dark:text-stone-200">{formatDuration(result.driftPer24h)}</span>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => { setParams(HISTORICAL_PARAMS); handleReset(); }}
                  className="mt-4 w-full py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-stone-900 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                >
                  Reset to Classical Sūrya Siddhānta Specs
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: METROLOGY & PHYSICS */}
          {activeTab === 'accuracy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  Metrological Sensitivity & Error Sources
                  <ProvenanceLabel type="reconstruction" />
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 leading-relaxed">
                  How accurate was a medieval Indian water clock in practice? Classical texts acknowledge variations due to temperature, surface tension, and human reset time.
                </p>
              </div>

              {/* Temperature Sensitivity Slider */}
              <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex justify-between text-xs">
                  <label className="font-medium text-stone-700 dark:text-stone-300">Ambient Water Temperature</label>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{waterTempC}°C</span>
                </div>
                <input 
                  type="range" min="10" max="45" step="1" 
                  value={waterTempC} 
                  onChange={e => setWaterTempC(parseInt(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Winter Morning (10°C)</span>
                  <span>Summer Midday (45°C)</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 pt-1 leading-relaxed">
                  Water viscosity decreases from 1.307 mPa·s at 10°C to 0.596 mPa·s at 45°C. In laminar/orifice transition flow, warmer water sinks up to ~25–40 seconds faster per ghaṭikā.
                </p>
              </div>

              {/* Error Source Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
                  <div className="font-semibold text-stone-800 dark:text-stone-200 mb-1">1. Orifice Burr & Calcification</div>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                    Why a <i>gold</i> needle? S.R. Sarma notes gold does not oxidize, preventing microscopic corrosion from altering the orifice diameter over months of immersion.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
                  <div className="font-semibold text-stone-800 dark:text-stone-200 mb-1">2. Human Reset Latency</div>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                    When the bowl sank, the attendant (ghaṭikā-pāla) had to strike a gong and empty the bowl. A 3-second delay per cycle accumulates to 3 minutes of lag after 60 cycles.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
                  <div className="font-semibold text-stone-800 dark:text-stone-200 mb-1">3. Daily Solar Re-zeroing</div>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                    Ancient observatories did not let errors compound indefinitely. At solar noon each day, the śaṅku (gnomon) shadow re-calibrated the water clock to true solar time.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
