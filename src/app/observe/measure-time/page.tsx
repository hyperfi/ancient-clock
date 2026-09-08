'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ModuleLayout } from '@/components/ui/ModuleLayout';
import { ConventionSelector } from '@/components/ui/ConventionSelector';
import { ProvenanceLabel } from '@/components/ui/ProvenanceLabel';
import { SourceTooltip } from '@/components/ui/SourceTooltip';
import { WaterBowl } from '@/components/svg/WaterBowl';
import { WaterBowl3D } from '@/components/three/WaterBowl3D';
import { 
  modernToTraditional, 
  traditionalToModern, 
  formatModernTime, 
  secondsToTraditionalTime,
  secondsToVedangaTime,
  vedangaTimeToSeconds,
  secondsToGurvaksharas,
  type DualTime, 
  type DayReckoning 
} from '@/lib/time';

const CONVENTIONS = [
  { id: 'siddhanta', label: 'Siddhānta Convention', description: '60 ghaṭikā / 60 vināḍī system' },
  { id: 'vedanga', label: 'Vedāṅga Jyotiṣa', description: 'Mātrā / Kāṣṭhā / Kalā system' }
];

export default function MeasureTimePage() {
  const [convention, setConvention] = useState('siddhanta');
  const [dayReckoning, setDayReckoning] = useState<DayReckoning>('audayika');
  const [isRealtime, setIsRealtime] = useState(true);
  const [bowlViewMode, setBowlViewMode] = useState<'3d' | '2d'>('3d');
  
  const [timeState, setTimeState] = useState<DualTime>(() => {
    const now = new Date();
    return modernToTraditional(
      { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds() },
      'audayika'
    );
  });

  const [modernStr, setModernStr] = useState("00:00:00");
  const [tradG, setTradG] = useState("0");
  const [tradV, setTradV] = useState("0");
  const [tradP, setTradP] = useState("0");
  const [tradGurv, setTradGurv] = useState("0");
  const [vedangaN, setVedangaN] = useState("0");
  const [vedangaK, setVedangaK] = useState("0");
  const [vedangaKas, setVedangaKas] = useState("0");
  const [subSecondTime, setSubSecondTime] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
  });

  useEffect(() => {
    if (!isRealtime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const sec = now.getSeconds();
      const totalS = now.getHours() * 3600 + now.getMinutes() * 60 + sec;
      const ms = now.getMilliseconds();
      setSubSecondTime(totalS + ms / 1000);
      setTimeState(modernToTraditional(
        { hours: now.getHours(), minutes: now.getMinutes(), seconds: sec },
        dayReckoning
      ));
    }, 100);
    return () => clearInterval(interval);
  }, [isRealtime, dayReckoning]);

  useEffect(() => {
    if (isRealtime) {
      setModernStr(formatModernTime(timeState.modern));
      setTradG(Math.floor(timeState.traditional.ghatikas).toString());
      setTradV(Math.floor(timeState.traditional.vinadis).toString());
      setTradP(Math.floor(timeState.traditional.pranas).toString());
      const gAksh = secondsToGurvaksharas(timeState.totalSeconds);
      setTradGurv(gAksh.inPrana.toString());
      const vT = secondsToVedangaTime(timeState.totalSeconds);
      setVedangaN(vT.nadikas.toString());
      setVedangaK(vT.kalas.toString());
      setVedangaKas(vT.kasthas.toString());
    }
  }, [timeState, isRealtime]);

  const handleModernInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setModernStr(val);
    const parts = val.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parseInt(parts[2], 10);
      if (!isNaN(h) && !isNaN(m) && !isNaN(s) && h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60) {
        const newTime = modernToTraditional({ hours: h, minutes: m, seconds: s }, dayReckoning);
        setTimeState(newTime);
        setTradG(Math.floor(newTime.traditional.ghatikas).toString());
        setTradV(Math.floor(newTime.traditional.vinadis).toString());
        setTradP(Math.floor(newTime.traditional.pranas).toString());
        setTradGurv(Math.floor(newTime.traditional.fractionalPranas * 10).toString());
        const vT = secondsToVedangaTime(newTime.totalSeconds);
        setVedangaN(vT.nadikas.toString());
        setVedangaK(vT.kalas.toString());
        setVedangaKas(vT.kasthas.toString());
      }
    }
  };

  const handleTraditionalInputChange = (type: 'g' | 'v' | 'p' | 'gurv', val: string) => {
    if (type === 'g') setTradG(val);
    if (type === 'v') setTradV(val);
    if (type === 'p') setTradP(val);
    if (type === 'gurv') setTradGurv(val);

    const g = parseInt(type === 'g' ? val : tradG, 10) || 0;
    const v = parseInt(type === 'v' ? val : tradV, 10) || 0;
    const p = parseInt(type === 'p' ? val : tradP, 10) || 0;
    const gurv = parseInt(type === 'gurv' ? val : tradGurv, 10) || 0;

    const newTime = traditionalToModern({
      ghatikas: g,
      vinadis: v,
      pranas: p,
      fractionalPranas: Math.min(9, Math.max(0, gurv)) / 10
    }, dayReckoning);
    setTimeState(newTime);
    setModernStr(formatModernTime(newTime.modern));
    const vT = secondsToVedangaTime(newTime.totalSeconds);
    setVedangaN(vT.nadikas.toString());
    setVedangaK(vT.kalas.toString());
    setVedangaKas(vT.kasthas.toString());
  };

  const handleVedangaInputChange = (type: 'n' | 'k' | 'kas', val: string) => {
    if (type === 'n') setVedangaN(val);
    if (type === 'k') setVedangaK(val);
    if (type === 'kas') setVedangaKas(val);

    const n = Math.min(59, Math.max(0, parseInt(type === 'n' ? val : vedangaN, 10) || 0));
    const k = Math.min(9, Math.max(0, parseInt(type === 'k' ? val : vedangaK, 10) || 0));
    const kas = Math.min(123, Math.max(0, parseInt(type === 'kas' ? val : vedangaKas, 10) || 0));

    const totalS = vedangaTimeToSeconds({ nadikas: n, kalas: k, kasthas: kas });
    const trad = secondsToTraditionalTime(totalS);
    const newTime = traditionalToModern(trad, dayReckoning);
    setTimeState(newTime);
    setModernStr(formatModernTime(newTime.modern));
    setTradG(Math.floor(trad.ghatikas).toString());
    setTradV(Math.floor(trad.vinadis).toString());
    setTradP(Math.floor(trad.pranas).toString());
    setTradGurv(Math.floor(trad.fractionalPranas * 10).toString());
  };

  const handleDayReckoningChange = (reckoning: DayReckoning) => {
    setDayReckoning(reckoning);
    if (!isRealtime) {
      const newTime = modernToTraditional(timeState.modern, reckoning);
      setTimeState(newTime);
      const vT = secondsToVedangaTime(newTime.totalSeconds);
      setVedangaN(vT.nadikas.toString());
      setVedangaK(vT.kalas.toString());
      setVedangaKas(vT.kasthas.toString());
    }
  };

  // SVG Circular Visualizer properties
  const rotationDegrees = (timeState.totalSeconds / 86400) * 360;
  const currentGhatikaNum = Math.floor(timeState.traditional.ghatikas);
  const currentVinadis = timeState.traditional.vinadis % 60;
  const waterBowlFillRatio = currentVinadis / 60;
  const secondsToNextSink = Math.max(0, Math.round((60 - currentVinadis) * 24));

  // Vedāṅga Jyotiṣa Units
  const currentVedanga = secondsToVedangaTime(timeState.totalSeconds);

  // Gurvakṣara Acoustic Counts (1 syllable = 0.4s; 60 syllables = 1 vināḍī)
  const currentTotalSeconds = isRealtime
    ? (dayReckoning === 'audayika' ? (subSecondTime - 6 * 3600 + 86400) % 86400 : subSecondTime)
    : timeState.totalSeconds;
  const gurvaksharas = secondsToGurvaksharas(currentTotalSeconds);

  return (
    <ModuleLayout
      title="Measure Time"
      subtitle="Ahorātra: The Classical Indian Day"
      controls={
        <div className="flex flex-col gap-6 text-[#1C1917] dark:text-[#F5F5F4]">
          {/* Real-time Toggle */}
          <div className="flex justify-between items-center bg-stone-50 dark:bg-stone-900/70 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
            <div>
              <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">Real-time Clock</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Synchronized to system clock</p>
            </div>
            <button
              onClick={() => {
                if (isRealtime) {
                  setTradGurv(gurvaksharas.inPrana.toString());
                }
                setIsRealtime(!isRealtime);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isRealtime 
                  ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50' 
                  : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
              }`}
            >
              {isRealtime ? 'Freeze' : 'Resume'}
            </button>
          </div>

          {/* Time Converter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between">
              Dual-System Converter
              {!isRealtime && <span className="text-xs text-[#D97706] font-normal px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800">Frozen Mode</span>}
            </h3>
            
            <div className="flex flex-col gap-4 relative">
              {/* Modern Side */}
              <div className="bg-stone-50 dark:bg-stone-900/70 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col gap-2">
                <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Modern Civil Time (HH:MM:SS)</label>
                <input 
                  type="text" 
                  value={modernStr}
                  onChange={handleModernInputChange}
                  disabled={isRealtime}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-lg px-3 py-2 text-center text-lg font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                  placeholder="00:00:00"
                />
              </div>

              {/* Conversion Flow Indicator between cards (in-flow, never blocks title) */}
              <div className="flex justify-center -my-2 z-10 pointer-events-none">
                <div className="bg-white dark:bg-stone-800 rounded-full p-1.5 border border-stone-200 dark:border-stone-700 shadow-xs text-stone-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 10L12 15L17 10" />
                    <path d="M7 14L12 9L17 14" />
                  </svg>
                </div>
              </div>

              {/* Traditional / Vedic Side */}
              {convention === 'siddhanta' ? (
                <div className="bg-stone-50 dark:bg-stone-900/70 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Traditional Siddhāntic Units</label>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 px-1.5 py-0.5 rounded font-medium">60-base</span>
                  </div>
                  <div className="flex gap-1.5 items-center justify-center">
                    <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        value={tradG}
                        onChange={(e) => handleTraditionalInputChange('g', e.target.value)}
                        disabled={isRealtime}
                        className="w-14 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-lg px-1 py-2 text-center text-base font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                        min="0" max="59"
                      />
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-1">ghaṭikā</span>
                    </div>
                    <span className="text-stone-400 font-bold">:</span>
                    <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        value={tradV}
                        onChange={(e) => handleTraditionalInputChange('v', e.target.value)}
                        disabled={isRealtime}
                        className="w-14 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-lg px-1 py-2 text-center text-base font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                        min="0" max="59"
                      />
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-1">vināḍī</span>
                    </div>
                    <span className="text-stone-400 font-bold">:</span>
                    <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        value={tradP}
                        onChange={(e) => handleTraditionalInputChange('p', e.target.value)}
                        disabled={isRealtime}
                        className="w-14 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-lg px-1 py-2 text-center text-base font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                        min="0" max="5"
                      />
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-1">prāṇa</span>
                    </div>
                    <span className="text-stone-400 font-bold">:</span>
                    <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        value={isRealtime ? gurvaksharas.inPrana : tradGurv}
                        onChange={(e) => handleTraditionalInputChange('gurv', e.target.value)}
                        disabled={isRealtime}
                        className="w-14 bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-lg px-1 py-2 text-center text-base font-mono focus:border-amber-600 focus:ring-1 focus:ring-amber-600 disabled:opacity-50"
                        min="0" max="9"
                      />
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mt-1 font-serif">gurvakṣara</span>
                    </div>
                  </div>

                  {/* Gurvakṣara acoustic counter directly inside traditional unit time */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 dark:border-stone-800 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="font-serif font-semibold text-stone-700 dark:text-stone-300">Gurvakṣara Counter:</span>
                    </div>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {gurvaksharas.inVinadi} / 60 <span className="text-[10px] font-normal text-stone-400 font-sans">({gurvaksharas.inPrana + 1}/10 syllable · 0.4s)</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-900/70 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Vedāṅga Jyotiṣa Units</label>
                    <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded font-medium">Vedic System</span>
                  </div>
                  <div className="flex gap-2 items-center justify-center">
                    <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        value={vedangaN}
                        onChange={(e) => handleVedangaInputChange('n', e.target.value)}
                        disabled={isRealtime}
                        className="w-16 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-lg px-2 py-2 text-center text-lg font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                        min="0" max="59"
                      />
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-1">nāḍikā</span>
                    </div>
                    <span className="text-stone-400 font-bold">:</span>
                    <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        value={vedangaK}
                        onChange={(e) => handleVedangaInputChange('k', e.target.value)}
                        disabled={isRealtime}
                        className="w-16 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-lg px-2 py-2 text-center text-lg font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                        min="0" max="9"
                      />
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-1">kalā</span>
                    </div>
                    <span className="text-stone-400 font-bold">:</span>
                    <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        value={vedangaKas}
                        onChange={(e) => handleVedangaInputChange('kas', e.target.value)}
                        disabled={isRealtime}
                        className="w-16 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-lg px-2 py-2 text-center text-lg font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                        min="0" max="123"
                      />
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-1">kāṣṭhā</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unit Breakdown */}
          {convention === 'siddhanta' ? (
            <div className="bg-stone-50 dark:bg-stone-900/70 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Siddhānta Metrology</h4>
                <ProvenanceLabel type="documented" />
              </div>
              <div className="text-xs text-stone-700 dark:text-stone-300 font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 rounded-lg space-y-1.5">
                <p>1 Ahorātra (Day) = 60 ghaṭikā = 30 muhūrta</p>
                <p>1 ghaṭikā = 60 vināḍī = 24 minutes</p>
                <p>1 vināḍī = 6 prāṇa = 24 seconds</p>
                <p>1 prāṇa (breath) = 10 gurvakṣara = 4 seconds</p>
              </div>
              <div className="mt-3 flex justify-end">
                <SourceTooltip 
                  source="Sūryasiddhānta"
                  chapter="14"
                  author="Various"
                  note="Standard sexagesimal time divisions documented across major siddhāntic texts including Āryabhaṭīya and Siddhānta Śiromaṇi."
                />
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 dark:bg-stone-900/70 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Vedāṅga Jyotiṣa Metrology</h4>
                <ProvenanceLabel type="documented" />
              </div>
              <div className="text-xs text-stone-700 dark:text-stone-300 font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 rounded-lg space-y-1.5">
                <p>1 Ahorātra (Day) = 30 muhūrta = 60 nāḍikā</p>
                <p>1 muhūrta = 2 nāḍikā = 48 minutes</p>
                <p>1 nāḍikā = 10 kalā = 24 minutes (1 kalā = 144s)</p>
                <p>1 kalā = 124 kāṣṭhā ≈ 1.161 seconds</p>
                <p>1 kāṣṭhā = 10 mātrā ≈ 0.116s (short syllable/blink)</p>
              </div>
              <div className="mt-3 flex justify-end">
                <SourceTooltip 
                  source="Vedāṅga Jyotiṣa"
                  chapter="Yājuṣa 7–8 / Ārcha 8"
                  author="Lagadha"
                  note="Ancient Vedic sacrificial calendar metric (~1st millennium BCE) using non-sexagesimal subdivisions prior to Siddhāntic astronomy."
                />
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="h-full w-full flex flex-col space-y-6 sm:space-y-8">
        
        {/* Top Navigation Pill Tabs to Sub-Labs */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm min-h-[38px] flex items-center">
              1. Ahorātra Dial
            </span>
            <Link 
              href="/observe/measure-time/water-clock"
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 min-h-[38px]"
            >
              <span>2. Sinking Water Clock (Ghaṭīyantra)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">→</span>
            </Link>
            <Link 
              href="/observe/measure-time/spoken-clock"
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 min-h-[38px]"
            >
              <span>3. Spoken Syllables (Nāḍikā)</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">→</span>
            </Link>
          </div>

          <ConventionSelector 
            conventions={CONVENTIONS}
            value={convention}
            onChange={setConvention}
            className="w-full sm:w-60"
          />
        </div>

        {/* Main Interactive Grid: 60-Ghaṭikā Dial + Live Sinking Water Bowl Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: 60-Ghaṭikā Circular Dial (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[420px] aspect-square flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
                <g transform="rotate(-90 50 50)">
                  {/* Outer track */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeWidth="2" />
                  
                  {/* Inner track (muhūrtas) */}
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeWidth="1" />

                  {/* Ticks for 60 ghaṭikās */}
                  {Array.from({ length: 60 }).map((_, i) => {
                    const isCurrent = currentGhatikaNum === i;
                    const isFifth = i % 5 === 0;
                    const length = isFifth ? 6 : 3;
                    return (
                      <line
                        key={`ghatika-${i}`}
                        x1="50"
                        y1={5}
                        x2="50"
                        y2={5 + length}
                        stroke={isCurrent ? "#D97706" : "currentColor"}
                        className={isCurrent ? "" : "text-stone-700 dark:text-stone-300"}
                        strokeWidth={isCurrent ? 1.5 : (isFifth ? 1 : 0.5)}
                        transform={`rotate(${i * 6} 50 50)`}
                      />
                    );
                  })}

                  {/* Ticks for 30 muhūrtas */}
                  {Array.from({ length: 30 }).map((_, i) => (
                    <line
                      key={`muhurta-${i}`}
                      x1="50"
                      y1={15}
                      x2="50"
                      y2={18}
                      stroke="currentColor"
                      className="text-stone-400 dark:text-stone-600"
                      strokeWidth="0.5"
                      transform={`rotate(${i * 12} 50 50)`}
                    />
                  ))}

                  {/* Animated hand */}
                  <g transform={`rotate(${rotationDegrees} 50 50)`}>
                    <line x1="50" y1="50" x2="50" y2="10" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="50" cy="10" r="1.5" fill="#D97706" />
                  </g>

                  {/* Center Pivot Pin - Clean and distinct */}
                  <circle cx="50" cy="50" r="2" fill="#D97706" stroke="currentColor" className="text-white dark:text-stone-900" strokeWidth="0.6" />
                  <circle cx="50" cy="50" r="0.8" fill="currentColor" className="text-stone-900 dark:text-stone-100" />
                </g>

                {/* Dial Face Readouts - Positioned with generous clearance around center pivot (50, 50) */}
                {/* Upper Quadrant: Traditional Reading */}
                <g className="select-none pointer-events-none">
                  {convention === 'siddhanta' ? (
                    <>
                      <text x="50" y="32" textAnchor="middle" fill="#D97706" fontSize="5.0" fontWeight="bold" className="font-serif">
                        {currentGhatikaNum} ghaṭikā
                      </text>
                      <text x="50" y="38" textAnchor="middle" fill="currentColor" fontSize="3.0" className="text-stone-500 dark:text-stone-400 font-mono">
                        {Math.floor(currentVinadis)} vināḍī · {Math.floor(timeState.traditional.pranas)} prāṇa
                      </text>
                    </>
                  ) : (
                    <>
                      <text x="50" y="32" textAnchor="middle" fill="#D97706" fontSize="4.8" fontWeight="bold" className="font-serif">
                        {currentVedanga.nadikas} nāḍikā · {currentVedanga.kalas} kalā
                      </text>
                      <text x="50" y="38" textAnchor="middle" fill="currentColor" fontSize="2.8" className="text-stone-500 dark:text-stone-400 font-mono">
                        {currentVedanga.kasthas} kāṣṭhā (M#{currentVedanga.muhurtas + 1})
                      </text>
                    </>
                  )}
                  
                  {/* Lower Quadrant: Modern Clock & Epoch Label */}
                  <text x="50" y="66" textAnchor="middle" fill="currentColor" fontSize="5.2" fontWeight="bold" fontFamily="monospace" className="text-stone-900 dark:text-stone-100">
                    {formatModernTime(timeState.modern)}
                  </text>
                  <text x="50" y="73" textAnchor="middle" fill="currentColor" fontSize="3.2" className="text-stone-500 dark:text-stone-400 font-sans">
                    {dayReckoning === 'audayika' ? 'Sunrise Epoch' : 'Midnight Epoch'}
                  </text>
                </g>
              </svg>
            </div>

            {/* Clear Digital Readout Display Card */}
            <div className="mt-4 flex flex-col items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-stone-50/90 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 text-center select-none shadow-xs">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Current Time Reading
                </span>
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {convention === 'siddhanta' ? 'Siddhānta' : 'Vedāṅga Jyotiṣa'}
                </span>
              </div>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-lg font-bold font-serif text-[#D97706]">
                  {convention === 'siddhanta' 
                    ? `${currentGhatikaNum} ghaṭikā · ${Math.floor(currentVinadis)} vināḍī` 
                    : `${currentVedanga.nadikas} nāḍikā · ${currentVedanga.kalas} kalā · ${currentVedanga.kasthas} kāṣṭhā`}
                </span>
                <span className="text-stone-400 text-xs font-mono">•</span>
                <span className="text-sm font-mono font-bold text-stone-900 dark:text-stone-100">
                  {formatModernTime(timeState.modern)}
                </span>
              </div>
            </div>

            {/* Epoch Selector Buttons */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Day Reckoning (Epoch)</span>
              <div className="inline-flex rounded-lg bg-stone-100 dark:bg-stone-800/80 p-1 shadow-inner border border-stone-200 dark:border-stone-700">
                <button
                  onClick={() => handleDayReckoningChange('audayika')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    dayReckoning === 'audayika'
                      ? 'bg-white dark:bg-stone-900 text-[#D97706] dark:text-amber-400 shadow-sm ring-1 ring-stone-200 dark:ring-stone-700'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  Audayika (Sunrise = 0)
                </button>
                <button
                  onClick={() => handleDayReckoningChange('ardharatrika')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    dayReckoning === 'ardharatrika'
                      ? 'bg-white dark:bg-stone-900 text-[#4338CA] dark:text-indigo-400 shadow-sm ring-1 ring-stone-200 dark:ring-stone-700'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  Ārdharātrika (Midnight = 0)
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Water Clock (Ghaṭīyantra) Interactive Card (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#141210] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                    Ghaṭīyantra Simulation
                  </span>
                  <ProvenanceLabel type="documented" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-md overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBowlViewMode('3d')}
                      className={`px-2 py-0.5 rounded font-medium transition-all ${
                        bowlViewMode === '3d'
                          ? 'bg-white dark:bg-stone-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                      }`}
                    >
                      3D
                    </button>
                    <button
                      type="button"
                      onClick={() => setBowlViewMode('2d')}
                      className={`px-2 py-0.5 rounded font-medium transition-all ${
                        bowlViewMode === '2d'
                          ? 'bg-white dark:bg-stone-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                      }`}
                    >
                      2D
                    </button>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                    Cycle #{currentGhatikaNum + 1}
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                In classical India, water clocks measured this exact cycle: a copper bowl with a calibrated orifice in the bottom floated in a basin, slowly filling and sinking once per ghaṭikā (24 minutes).
              </p>
            </div>

            {/* Live Water Bowl 3D / SVG preview */}
            <div className="w-full flex items-center justify-center p-2 bg-stone-50 dark:bg-stone-900/40 rounded-xl border border-stone-100 dark:border-stone-800/80">
              {bowlViewMode === '3d' ? (
                <div className="w-full h-56 relative rounded-lg overflow-hidden">
                  <WaterBowl3D
                    fillLevel={waterBowlFillRatio}
                    flowActive={isRealtime}
                    viewMode={bowlViewMode}
                    onToggleViewMode={setBowlViewMode}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <WaterBowl 
                  fillLevel={waterBowlFillRatio} 
                  isSinking={false}
                  flowActive={isRealtime}
                  showBasin={true}
                  showLabels={true}
                  size={260}
                  className="w-full max-w-[280px]"
                />
              )}
            </div>

            {/* Water Bowl Progress Telemetry */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 dark:text-stone-400">Current Ghaṭikā Progress:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.floor(currentVinadis)} / 60 vināḍīs ({(waterBowlFillRatio * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500 rounded-full"
                  style={{ width: `${waterBowlFillRatio * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-stone-400 dark:text-stone-500">
                <span>Vessel Emptied (0m)</span>
                <span>Next Sink in ~{Math.floor(secondsToNextSink / 60)}m {secondsToNextSink % 60}s</span>
              </div>
            </div>



            {/* Link to Full Laboratory */}
            <Link
              href="/observe/measure-time/water-clock"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Launch Dedicated Sinking Bowl Lab</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>

      </div>
    </ModuleLayout>
  );
}

