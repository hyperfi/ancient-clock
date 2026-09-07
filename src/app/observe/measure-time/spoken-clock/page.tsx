'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProvenanceLabel } from '@/components/ui/ProvenanceLabel';
import { SourceTooltip } from '@/components/ui/SourceTooltip';

// Helper for generating normal distribution variations
function gaussianRandom(mean: number, stdev: number) {
  let u = 1 - Math.random(); 
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export default function SpokenClockPage() {
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  
  // State for the ring and timer
  const [activeDots, setActiveDots] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  
  // Historical attempts
  const [attempts, setAttempts] = useState<number[]>([]);
  
  const reqRef = useRef<number>(0);

  // Timer loop for visualization
  useEffect(() => {
    if (startTime !== null && activeDots < 60) {
      const tick = () => {
        setElapsedTime((Date.now() - startTime) / 1000);
        reqRef.current = requestAnimationFrame(tick);
      };
      reqRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [startTime, activeDots]);

  // Handle manual tap
  const handleTap = () => {
    if (activeDots >= 60 || isSimulating) return;
    
    if (activeDots === 0) {
      setStartTime(Date.now());
      setElapsedTime(0);
      setFinalTime(null);
    }
    
    const newDots = activeDots + 1;
    setActiveDots(newDots);
    
    if (newDots === 60) {
      const endT = Date.now();
      const finalS = (endT - (startTime || endT)) / 1000;
      setElapsedTime(finalS);
      setFinalTime(finalS);
      setAttempts(prev => [...prev, finalS]);
    }
  };

  // Handle auto simulation
  const handleSimulate = async () => {
    if (isSimulating) return;
    
    setActiveDots(0);
    setFinalTime(null);
    setIsSimulating(true);
    setMode('auto');
    
    const startT = Date.now();
    setStartTime(startT);
    setElapsedTime(0);
    
    let currentDots = 0;
    
    const nextSyllable = () => {
      currentDots++;
      setActiveDots(currentDots);
      
      if (currentDots < 60) {
        // Mean 400ms, std 30ms
        const delay = Math.max(100, gaussianRandom(400, 30));
        setTimeout(nextSyllable, delay);
      } else {
        const endT = Date.now();
        const finalS = (endT - startT) / 1000;
        setElapsedTime(finalS);
        setFinalTime(finalS);
        setAttempts(prev => [...prev, finalS]);
        setIsSimulating(false);
      }
    };
    
    nextSyllable(); // Start the first one
  };

  const handleReset = () => {
    setActiveDots(0);
    setStartTime(null);
    setElapsedTime(0);
    setFinalTime(null);
    setIsSimulating(false);
  };

  // Calculate histogram for distribution
  const renderHistogram = () => {
    if (attempts.length === 0) return null;
    
    // Group attempts into bins (e.g. 21s, 22s, 23s, 24s, 25s, 26s, 27s)
    const minVal = 20;
    const maxVal = 28;
    const bins = 16; // every 0.5s
    const binCounts = new Array(bins).fill(0);
    
    attempts.forEach(a => {
      let b = Math.floor((a - minVal) / 0.5);
      if (b < 0) b = 0;
      if (b >= bins) b = bins - 1;
      binCounts[b]++;
    });
    
    const maxCount = Math.max(...binCounts, 1);
    
    const mean = attempts.reduce((a,b) => a+b, 0) / attempts.length;
    const stdDev = Math.sqrt(attempts.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / attempts.length);

    return (
      <div className="mt-8">
        <h4 className="text-sm font-semibold mb-4 text-[#1C1917] dark:text-stone-100">Measurement Distribution</h4>
        <div className="relative h-32 w-full border-b border-stone-300 dark:border-stone-700 flex items-end">
          {/* Target Line */}
          <div className="absolute top-0 bottom-0 border-l-2 border-indigo-600 dark:border-indigo-400 border-dashed" style={{ left: '50%', transform: 'translateX(-50%)' }} />
          <div className="absolute -top-6 text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-white dark:bg-[#141210] px-1" style={{ left: '50%', transform: 'translateX(-50%)' }}>
            Target: 24.0s
          </div>
          
          <div className="flex w-full h-full items-end justify-between px-2">
            {binCounts.map((count, i) => (
              <div 
                key={i}
                className="w-full mx-0.5 bg-[#B87333] dark:bg-amber-600 opacity-80 rounded-t-sm transition-all duration-300"
                style={{ height: `${(count / maxCount) * 100}%` }}
                title={`${(minVal + i * 0.5).toFixed(1)}s: ${count} attempts`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mt-2">
          <span>20.0s</span>
          <span>24.0s</span>
          <span>28.0s</span>
        </div>
        
        <div className="mt-4 flex gap-4 text-sm text-stone-600 dark:text-stone-300 justify-center">
          <div><span className="font-semibold">Attempts:</span> {attempts.length}</div>
          <div><span className="font-semibold">Mean:</span> {mean.toFixed(2)}s</div>
          {attempts.length > 1 && <div><span className="font-semibold">Std Dev:</span> ±{stdDev.toFixed(2)}s</div>}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 text-center italic">
          "This is how metrology works — repeated measurement and comparison against a standard."
        </p>
      </div>
    );
  };

  // SVG Ring calculation
  const ringSize = 340;
  const radius = 140;
  const cx = ringSize / 2;
  const cy = ringSize / 2;
  
  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI * 2) / 60 - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const isActive = i < activeDots;
      
      dots.push(
        <circle 
          key={i}
          cx={x} 
          cy={y} 
          r={isActive ? 6 : 4} 
          fill={isActive ? '#D97706' : 'currentColor'} 
          className={`transition-all duration-150 ${isActive ? '' : 'text-stone-200 dark:text-stone-800'}`}
        />
      );
    }
    return dots;
  };

  return (
    <div className="min-h-screen bg-[#FEFDF5] dark:bg-[#0C0A09] text-[#1C1917] dark:text-[#F5F5F4] p-6 md:p-12 flex flex-col items-center transition-colors duration-300">
      
      <div className="max-w-3xl w-full text-center mb-8">
        <div className="flex justify-start mb-4">
          <a 
            href="/observe/measure-time" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Measure Time
          </a>
        </div>
        <h1 className="text-4xl font-serif mb-2 text-[#1C1917] dark:text-stone-100">The Spoken Clock</h1>
        <div className="text-xl text-stone-600 dark:text-stone-400 font-light flex items-center justify-center gap-3 mb-6">
          Calibrating Time with Sanskrit Syllables
          <ProvenanceLabel type="scholarly" />
        </div>
        
        <div className="text-left bg-white dark:bg-[#141210] p-5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-start gap-4">
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Bhāskara I describes calibrating time intervals by reciting long (<i className="text-stone-800 dark:text-stone-200">guru</i>) syllables at a measured pace. 
            60 <i>guru-akṣaras</i> at middling speed should take exactly one <i>pala</i> — 24 seconds. 
            This provides an independent biological method to calibrate a water clock.
          </p>
          <div className="shrink-0 pt-1">
            <SourceTooltip 
              source="Bhāskara I's commentary on Āryabhaṭīya"
              chapter="Kālakriyāpāda"
              verse="2"
              note="Also references S.R. Sarma, 'Measuring Time with Long Syllables' & R.N. Iyengar et al., 'Akṣara the Basic Unit of Time Measure'"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12 w-full max-w-4xl justify-center items-start">
        
        {/* Left: Visualization */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative flex justify-center items-center">
            <svg width={ringSize} height={ringSize} className="relative z-10">
              {renderDots()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <div className="text-sm text-stone-500 uppercase tracking-wider mb-1">Elapsed</div>
              <div className="text-4xl font-mono text-[#D97706] mb-1">
                {elapsedTime.toFixed(2)}s
              </div>
              <div className="text-sm text-stone-400 font-mono">
                Target: 24.00s
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4 w-full justify-center">
            <button 
              onClick={handleTap}
              disabled={isSimulating || (activeDots >= 60 && !finalTime)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {activeDots === 0 ? "Tap to Start (0/60)" : `Tap (${activeDots}/60)`}
            </button>
            <button 
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-6 py-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-lg font-medium shadow-sm hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              Simulate Recitation
            </button>
            <button 
              onClick={handleReset}
              className="px-4 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
              title="Reset"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
          
          {finalTime !== null && (
            <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2">
              <div className="text-lg font-medium mb-1">
                Your time: <span className={Math.abs(finalTime - 24) < 1 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>{finalTime.toFixed(2)}s</span>
              </div>
              <div className="text-sm text-stone-500 dark:text-stone-400">
                Average pace: {((finalTime / 60) * 1000).toFixed(0)} ms per syllable (Target: 400 ms)
              </div>
            </div>
          )}
        </div>
        
        {/* Right: Distribution and Notes */}
        <div className="flex-1 w-full bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          {attempts.length > 0 ? (
            renderHistogram()
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-6 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              Complete a recitation to see your measurement distribution over time.
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
            <h4 className="text-sm font-semibold mb-2 flex items-center justify-between text-[#1C1917] dark:text-stone-100">
              Connection to Water Clock
              <ProvenanceLabel type="documented" />
            </h4>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              If your spoken clock consistently measures 24.0 seconds per 60 syllables, and your water clock sinks every 24 minutes — the two instruments agree to within one part in sixty. The texts describe this exact cross-calibration technique.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
