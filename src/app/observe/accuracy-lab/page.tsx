'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ModuleLayout, ProvenanceLabel, SourceTooltip } from '@/components/ui';

interface ErrorSource {
  id: string;
  category: 'instrument' | 'math' | 'observation';
  name: string;
  description: string;
  stdDevMinutes: number;
  active: boolean;
}

export default function AccuracyLabPage() {
  const [activeTab, setActiveTab] = useState<'sensitivity' | 'guided'>('sensitivity');

  // Error Sources State
  const [errorSources, setErrorSources] = useState<ErrorSource[]>([
    {
      id: 'water_temp',
      category: 'instrument',
      name: 'Water Viscosity & Temperature (±15°C)',
      description: 'Clepsydra flow rate shifts by ~2-3% between summer and winter without recalibration.',
      stdDevMinutes: 12.0,
      active: true,
    },
    {
      id: 'hole_wear',
      category: 'instrument',
      name: 'Orifice Diameter Tolerance (±0.1 mm)',
      description: 'Slight variations in punching the copper vessel aperture alter Torricelli discharge rate.',
      stdDevMinutes: 18.0,
      active: true,
    },
    {
      id: 'reset_delay',
      category: 'instrument',
      name: 'Human Clepsydra Reset Delay (±3 sec)',
      description: 'Accumulates over 60 successive sink-and-empty cycles in a civil day.',
      stdDevMinutes: 4.5,
      active: true,
    },
    {
      id: 'gnomon_level',
      category: 'instrument',
      name: 'Gnomon Leveling & Verticality (±0.5°)',
      description: 'Floor tilt or plumb-line misalignment causes asymmetric morning/afternoon shadow arcs.',
      stdDevMinutes: 6.0,
      active: false,
    },
    {
      id: 'table_rounding',
      category: 'math',
      name: 'Sine Table Quantization (R = 3438)',
      description: 'Interpolating between 24 discrete arcminute values creates minor angular discretization.',
      stdDevMinutes: 3.5,
      active: true,
    },
    {
      id: 'lunar_perturbation',
      category: 'math',
      name: 'Omission of Evection & Variation',
      description: 'Single epicycle model does not capture complex 3-body solar gravitational tugs on the lunar orbit.',
      stdDevMinutes: 45.0,
      active: true,
    },
    {
      id: 'penumbra',
      category: 'observation',
      name: 'Solar Penumbra Blur (~0.5°)',
      description: 'Solar disc width causes soft-edged shadows, making exact contact times harder to resolve visually.',
      stdDevMinutes: 8.0,
      active: false,
    },
    {
      id: 'refraction',
      category: 'observation',
      name: 'Atmospheric Refraction Near Horizon',
      description: 'Bends light upward by up to 34 arcminutes when events occur close to sunrise or sunset.',
      stdDevMinutes: 5.0,
      active: false,
    },
  ]);

  const toggleErrorSource = (id: string) => {
    setErrorSources((prev) =>
      prev.map((src) => (src.id === id ? { ...src, active: !src.active } : src))
    );
  };

  // Monte Carlo Simulation in Browser
  const [sampleCount, setSampleCount] = useState<number>(500);

  const simulationStats = useMemo(() => {
    const activeSources = errorSources.filter((s) => s.active);
    const combinedStd = Math.sqrt(
      activeSources.reduce((acc, curr) => acc + curr.stdDevMinutes * curr.stdDevMinutes, 0)
    );

    const samples: number[] = [];
    for (let i = 0; i < sampleCount; i++) {
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      samples.push(15.0 + z0 * combinedStd);
    }

    samples.sort((a, b) => a - b);
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const p16 = samples[Math.floor(samples.length * 0.16)];
    const p84 = samples[Math.floor(samples.length * 0.84)];
    const p025 = samples[Math.floor(samples.length * 0.025)];
    const p975 = samples[Math.floor(samples.length * 0.975)];

    const minBin = -100;
    const maxBin = 130;
    const binSize = 10;
    const binCount = Math.floor((maxBin - minBin) / binSize);
    const bins = new Array(binCount).fill(0);

    for (const val of samples) {
      const idx = Math.floor((val - minBin) / binSize);
      if (idx >= 0 && idx < binCount) {
        bins[idx]++;
      }
    }

    const maxFrequency = Math.max(...bins, 1);

    return {
      combinedStd,
      mean,
      p16,
      p84,
      p025,
      p975,
      bins,
      minBin,
      maxBin,
      binSize,
      maxFrequency,
    };
  }, [errorSources, sampleCount]);

  // Guided Challenge Steps with Dynamic SVG Visualizations
  const [currentStep, setCurrentStep] = useState<number>(1);
  const guidedSteps = [
    {
      num: 1,
      title: 'Observe the Sky',
      subtitle: 'Celestial Reference Geometry',
      desc: 'Before calculating anything, naked-eye astronomers established coordinate frames using the horizon (kṣitija), the celestial equator, and the local meridian (yāmyottara).',
      takeaway: 'Astronomy begins with geometric reference planes, not abstract numbers.',
      diagram: (
        <svg viewBox="0 0 400 180" className="w-full h-44">
          {/* Horizon plane */}
          <ellipse cx="200" cy="110" rx="140" ry="40" fill="none" stroke="#D6D3D1" strokeWidth="1.5" className="dark:stroke-stone-700" />
          <line x1="60" y1="110" x2="340" y2="110" stroke="#78716C" strokeWidth="1" strokeDasharray="3 3" />
          {/* Meridian vertical arc */}
          <path d="M 200 30 A 80 80 0 0 1 200 150" fill="none" stroke="#4338CA" strokeWidth="2" className="dark:stroke-indigo-400" />
          {/* Zenith point */}
          <circle cx="200" cy="30" r="3" fill="#D97706" />
          <text x="200" y="22" fontSize="9" fill="#D97706" textAnchor="middle" fontWeight="bold">Zenith (Khamadhya)</text>
          {/* Observer at center */}
          <circle cx="200" cy="110" r="4" fill="#1C1917" className="dark:fill-stone-100" />
          <text x="200" y="125" fontSize="8" fill="#78716C" textAnchor="middle">Observer (Draṣṭā)</text>
          <text x="320" y="105" fontSize="8" fill="#78716C">Horizon (Kṣitija)</text>
        </svg>
      ),
    },
    {
      num: 2,
      title: 'Calibrate the Timekeeper',
      subtitle: 'Acoustic & Clepsydra Harmony',
      desc: 'The copper sinking bowl (ghaṭīyantra) measures 1/60th of a civil day. To calibrate its orifice, astronomers recite 60 long syllables (guru-akṣaras) at a measured tempo.',
      takeaway: 'Human physiology provides an acoustic cross-check against mechanical clepsydra drift.',
      diagram: (
        <svg viewBox="0 0 400 180" className="w-full h-44">
          {/* Basin and Bowl */}
          <rect x="50" y="60" width="120" height="80" rx="6" fill="#E0F2FE" className="dark:fill-sky-950/40" stroke="#BAE6FD" strokeWidth="1" />
          <path d="M 70 85 A 40 40 0 0 0 150 85 Z" fill="#B87333" opacity={0.9} />
          {/* Orifice hole */}
          <circle cx="110" cy="125" r="2" fill="#1C1917" />
          <text x="110" y="150" fontSize="8" fill="#78716C" textAnchor="middle">1 Ghaṭikā = 24.0 min</text>
          
          {/* Sound Wave */}
          <path
            d="M 210 100 Q 230 70, 250 100 T 290 100 T 330 100 T 370 100"
            fill="none"
            stroke="#D97706"
            strokeWidth="2.5"
          />
          <text x="290" y="65" fontSize="9" fill="#D97706" textAnchor="middle" fontWeight="bold">
            60 Guru-Akṣaras ≈ 24.0s (1 Pala)
          </text>
          <text x="290" y="130" fontSize="8" fill="#78716C" textAnchor="middle">
            Acoustic Recitation Calibration
          </text>
        </svg>
      ),
    },
    {
      num: 3,
      title: 'Erect the Gnomon (Śaṅku)',
      subtitle: 'Equal-Shadow Circle Method',
      desc: 'A standard 12-aṅgula gnomon casts a moving shadow. Tracking symmetric crossings on a ground circle yields the true North-South cardinal axis.',
      takeaway: 'Equal-shadow symmetry extracts true geographical orientation from solar motion.',
      diagram: (
        <svg viewBox="0 0 400 180" className="w-full h-44">
          {/* Top-down reference circle */}
          <circle cx="200" cy="90" r="55" fill="none" stroke="#D6D3D1" strokeWidth="1.5" className="dark:stroke-stone-700" />
          <circle cx="200" cy="90" r="3" fill="#1C1917" className="dark:fill-stone-200" />
          <text x="200" y="82" fontSize="7" fill="#78716C" textAnchor="middle">Gnomon</text>

          {/* Shadow path arc */}
          <path d="M 140 50 Q 200 70 260 50" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Crossing points */}
          <circle cx="152" cy="62" r="3.5" fill="#D97706" />
          <text x="140" y="60" fontSize="8" fill="#D97706">West</text>
          <circle cx="248" cy="62" r="3.5" fill="#D97706" />
          <text x="254" y="60" fontSize="8" fill="#D97706">East</text>

          {/* East-West line */}
          <line x1="152" y1="62" x2="248" y2="62" stroke="#B87333" strokeWidth="2" />
          {/* North-South meridian line */}
          <line x1="200" y1="20" x2="200" y2="160" stroke="#4338CA" strokeWidth="2" className="dark:stroke-indigo-400" />
          <text x="208" y="28" fontSize="8" fill="#4338CA" className="dark:fill-indigo-400" fontWeight="bold">True North</text>
        </svg>
      ),
    },
    {
      num: 4,
      title: 'Consult the Sine Table',
      subtitle: 'Trigonometric Circle with R = 3438',
      desc: 'Trigonometry with R = 3438 arcminutes allows computing solar altitude, zenith distance, and hour angles without modern decimal trigonometry.',
      takeaway: 'Arcminute radius (21600 / 2π) unifies angular measure with trigonometric values.',
      diagram: (
        <svg viewBox="0 0 400 180" className="w-full h-44">
          {/* Circle Quadrant */}
          <path d="M 100 140 L 260 140 A 160 160 0 0 0 100 -20 Z" fill="none" stroke="#D6D3D1" strokeWidth="1.5" className="dark:stroke-stone-700" />
          <line x1="100" y1="140" x2="100" y2="20" stroke="#78716C" strokeWidth="1" />
          <line x1="100" y1="140" x2="260" y2="140" stroke="#78716C" strokeWidth="1" />
          
          {/* Angle Ray */}
          <line x1="100" y1="140" x2="225" y2="35" stroke="#D97706" strokeWidth="2" />
          {/* Dropped Rsine perpendicular */}
          <line x1="225" y1="140" x2="225" y2="35" stroke="#4338CA" strokeWidth="2" strokeDasharray="3 2" className="dark:stroke-indigo-400" />
          <text x="232" y="85" fontSize="8" fill="#4338CA" className="dark:fill-indigo-400" fontWeight="bold">Jyā (Rsine)</text>
          
          <text x="160" y="155" fontSize="8" fill="#78716C">Koṭi (Rcosine)</text>
          <text x="150" y="70" fontSize="8" fill="#D97706" fontWeight="bold">R = 3438&apos;</text>
          <text x="130" y="130" fontSize="8" fill="#78716C">θ</text>
        </svg>
      ),
    },
    {
      num: 5,
      title: 'Track Lunar Elongation (Tithi)',
      subtitle: 'The 12° Angular Motion Units',
      desc: 'Every 12° of separation between Sun and Moon defines one tithi. Because the Moon accelerates and decelerates along its orbit, tithis range from 19 to 26 hours.',
      takeaway: 'The calendar tracks angular reality rather than fixed clock hours.',
      diagram: (
        <svg viewBox="0 0 400 180" className="w-full h-44">
          <circle cx="200" cy="90" r="14" fill="#3B82F6" />
          <text x="200" y="93" fontSize="7" fill="#FFFFFF" textAnchor="middle">Earth</text>
          
          <circle cx="200" cy="90" r="65" fill="none" stroke="#E7E5E4" strokeWidth="1" strokeDasharray="3 3" className="dark:stroke-stone-800" />

          {/* 12 deg Sector Wedge */}
          <path d="M 200 90 L 265 90 A 65 65 0 0 0 262 76 Z" fill="#D97706" opacity={0.3} />
          <line x1="200" y1="90" x2="265" y2="90" stroke="#D97706" strokeWidth="1.5" />
          <line x1="200" y1="90" x2="262" y2="76" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="262" cy="76" r="6" fill="#E2E8F0" stroke="#94A3B8" />

          <text x="285" y="85" fontSize="8" fill="#D97706" fontWeight="bold">12° = 1 Tithi</text>
          <text x="200" y="170" fontSize="8" fill="#78716C" textAnchor="middle">
            Variable duration: 19h (at perigee) to 26h (at apogee)
          </text>
        </svg>
      ),
    },
    {
      num: 6,
      title: 'Inspect the Nodes (Rāhu & Ketu)',
      subtitle: 'Orbital Inclination & Syzygy',
      desc: 'The Moon orbits at a ~5° tilt to the ecliptic. Eclipses can only occur when a full or new Moon syzygy falls within ~12° of an orbital intersection node.',
      takeaway: 'Rāhu and Ketu are mathematical intersections (nodes), demystifying eclipse conditions.',
      diagram: (
        <svg viewBox="0 0 400 180" className="w-full h-44">
          {/* Ecliptic Plane Line */}
          <line x1="40" y1="90" x2="360" y2="90" stroke="#D97706" strokeWidth="1.5" />
          <text x="60" y="82" fontSize="8" fill="#D97706">Ecliptic (Sun Path)</text>
          
          {/* Tilted Lunar Orbit */}
          <path d="M 50 120 Q 200 60 350 120" fill="none" stroke="#4338CA" strokeWidth="2" className="dark:stroke-indigo-400" />
          <text x="320" y="135" fontSize="8" fill="#4338CA" className="dark:fill-indigo-400">Moon Orbit (5° tilt)</text>

          {/* Node Point (Rāhu) */}
          <circle cx="200" cy="90" r="5" fill="#DC2626" />
          <text x="200" y="78" fontSize="8" fill="#DC2626" textAnchor="middle" fontWeight="bold">Rāhu (Ascending Node)</text>
          <text x="200" y="106" fontSize="7" fill="#78716C" textAnchor="middle">Eclipse Hazard Limit: ±11.5°</text>
        </svg>
      ),
    },
    {
      num: 7,
      title: 'Construct the Earth Shadow (Chāyā)',
      subtitle: 'Umbra Cone & Obscuration',
      desc: 'At lunar distance, Earth casts an umbral shadow cone roughly 40 arcminutes wide. Comparing shadow radius with lunar latitude determines if obscuration (grāsa) happens.',
      takeaway: 'Eclipse duration (sthityardha) is determined through simple Euclidean triangle geometry.',
      diagram: (
        <svg viewBox="0 0 400 180" className="w-full h-44">
          {/* Earth */}
          <circle cx="100" cy="90" r="14" fill="#3B82F6" />
          <text x="100" y="115" fontSize="8" fill="#78716C" textAnchor="middle">Earth</text>

          {/* Umbra shadow cone */}
          <polygon points="100,76 100,104 290,90" fill="#1E1B4B" opacity={0.8} />
          
          {/* Moon disc in shadow */}
          <circle cx="220" cy="90" r="10" fill="#E2E8F0" stroke="#94A3B8" />
          <circle cx="220" cy="90" r="18" fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="2 2" />
          
          <text x="220" y="65" fontSize="8" fill="#D97706" textAnchor="middle">Shadow Radius (~40&apos;)</text>
          <text x="220" y="125" fontSize="8" fill="#1E1B4B" className="dark:fill-indigo-300" textAnchor="middle" fontWeight="bold">
            Obscuration (Grāsa) & Totality
          </text>
        </svg>
      ),
    },
    {
      num: 8,
      title: 'Compare with the Modern Sky',
      subtitle: 'Where Tradition Meets Modern Ephemeris',
      desc: 'Where does historical astronomy excel? Mean periods and eclipse occurrence. Where does it diverge? Small perturbations (evection, variation) and sidereal precession (ayanāṁśa).',
      takeaway: 'Ancient mathematical astronomy is a coherent, functional system within physical instrumentation bounds.',
      diagram: (
        <svg viewBox="0 0 400 180" className="w-full h-44">
          {/* Grid lines */}
          <line x1="60" y1="140" x2="340" y2="140" stroke="#D6D3D1" strokeWidth="1" className="dark:stroke-stone-700" />
          <line x1="60" y1="30" x2="60" y2="140" stroke="#D6D3D1" strokeWidth="1" className="dark:stroke-stone-700" />

          {/* Historical Epicycle Curve (Sine) */}
          <path d="M 60 85 Q 130 35 200 85 T 340 85" fill="none" stroke="#D97706" strokeWidth="2" />
          <text x="280" y="55" fontSize="8" fill="#D97706" fontWeight="bold">Historical (Sūrya Siddhānta)</text>

          {/* Modern Curve with Perturbations */}
          <path d="M 60 85 Q 125 30 195 82 T 340 88" fill="none" stroke="#4338CA" strokeWidth="2" strokeDasharray="3 2" className="dark:stroke-indigo-400" />
          <text x="280" y="115" fontSize="8" fill="#4338CA" className="dark:fill-indigo-400" fontWeight="bold">Modern Reference (VSOP87)</text>

          <text x="200" y="160" fontSize="8" fill="#78716C" textAnchor="middle">
            Agreement within ~1° longitude; divergences explainable by omitted evection & ΔT.
          </text>
        </svg>
      ),
    },
  ];

  return (
    <ModuleLayout
      title="Accuracy Lab"
      subtitle="Error Sources, Monte Carlo Propagation & Guided Synthesis"
    >
      <div className="flex flex-col gap-8 pb-16 max-w-6xl mx-auto">
        {/* Mode Navigation */}
        <div className="flex border-b border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('sensitivity')}
            className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sensitivity'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-900 dark:text-indigo-300'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-charcoal dark:hover:text-white'
            }`}
          >
            Sensitivity Experiment & Monte Carlo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guided')}
            className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'guided'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-900 dark:text-indigo-300'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-charcoal dark:hover:text-white'
            }`}
          >
            Guided Challenge: Predict Without a Telescope
          </button>
        </div>

        {activeTab === 'sensitivity' ? (
          <div className="flex flex-col gap-8">
            {/* Header Description */}
            <div className="bg-white dark:bg-[#141210] p-5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-charcoal dark:text-stone-100">
                    Error Budget & Propagation Simulator
                  </h2>
                  <ProvenanceLabel type="reconstruction" />
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
                  Toggle individual physical instrument uncertainties, mathematical simplifications,
                  and atmospheric limits to observe how error spreads through an eclipse prediction.
                </p>
              </div>
              <SourceTooltip
                source="Engineering Sensitivity Synthesis"
                note="Hypothetical modern uncertainty analysis isolating individual error contributors to historical eclipse timing."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Error Source Toggles */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Active Error Contributors
                </h3>
                {errorSources.map((src) => (
                  <div
                    key={src.id}
                    onClick={() => toggleErrorSource(src.id)}
                    className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      src.active
                        ? 'bg-white dark:bg-stone-900 border-indigo-300 dark:border-indigo-700 shadow-xs'
                        : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{src.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          src.active
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        ±{src.stdDevMinutes} min
                      </span>
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{src.description}</p>
                  </div>
                ))}
              </div>

              {/* Right Column: Monte Carlo Visualization */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className="bg-white dark:bg-[#141210] p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal dark:text-stone-100">
                        Timing Uncertainty Distribution
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {sampleCount} simulated runs with Gaussian perturbations
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSampleCount(sampleCount === 500 ? 1000 : 500)}
                        className="text-xs px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded text-stone-700 dark:text-stone-200 font-medium transition-colors"
                      >
                        {sampleCount === 500 ? 'Run 1,000' : 'Run 500'}
                      </button>
                    </div>
                  </div>

                  {/* Histogram Chart */}
                  <div className="bg-[#FEFDF5] dark:bg-[#0C0A09] border border-stone-200 dark:border-stone-800 rounded-lg p-4">
                    <div className="h-44 flex items-end justify-between gap-1 pt-4 px-2">
                      {simulationStats.bins.map((count, i) => {
                        const binMin = simulationStats.minBin + i * simulationStats.binSize;
                        const isNearZero = Math.abs(binMin) < 10;
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center group relative h-full justify-end"
                          >
                            <div
                              className={`w-full rounded-t-xs transition-all ${
                                isNearZero ? 'bg-amber-600' : 'bg-indigo-600 dark:bg-indigo-500 opacity-75'
                              }`}
                              style={{
                                height: `${(count / simulationStats.maxFrequency) * 100}%`,
                              }}
                            />
                            <div className="hidden group-hover:block absolute bottom-full mb-1 bg-charcoal dark:bg-stone-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none shadow-md">
                              {binMin} to {binMin + simulationStats.binSize}m: {count} runs
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 mt-2 font-mono border-t border-stone-200 dark:border-stone-800 pt-1">
                      <span>-100 min</span>
                      <span>0 (Exact)</span>
                      <span>+100 min</span>
                    </div>
                  </div>

                  {/* Quantitative Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-stone-50 dark:bg-stone-900 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block">Combined σ</span>
                      <span className="text-sm font-semibold font-mono text-charcoal dark:text-stone-100">
                        ±{simulationStats.combinedStd.toFixed(1)} min
                      </span>
                    </div>
                    <div className="bg-stone-50 dark:bg-stone-900 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block">Mean Offset</span>
                      <span className="text-sm font-semibold font-mono text-charcoal dark:text-stone-100">
                        +{simulationStats.mean.toFixed(1)} min
                      </span>
                    </div>
                    <div className="bg-stone-50 dark:bg-stone-900 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block">68% Interval</span>
                      <span className="text-sm font-semibold font-mono text-charcoal dark:text-stone-100">
                        [{simulationStats.p16.toFixed(0)}, {simulationStats.p84.toFixed(0)}] min
                      </span>
                    </div>
                    <div className="bg-stone-50 dark:bg-stone-900 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase block">95% Interval</span>
                      <span className="text-sm font-semibold font-mono text-charcoal dark:text-stone-100">
                        [{simulationStats.p025.toFixed(0)}, {simulationStats.p975.toFixed(0)}] min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Guided Challenge Mode with Interactive Simulation Diagrams */
          <div className="bg-white dark:bg-[#141210] p-6 sm:p-8 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-charcoal dark:text-stone-100">
                  Predict an Eclipse Without a Telescope
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Step {currentStep} of {guidedSteps.length}: {guidedSteps[currentStep - 1].title}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentStep <= 1}
                  onClick={() => setCurrentStep((p) => p - 1)}
                  className="px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 dark:border-stone-700 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition-colors min-h-[38px]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentStep >= guidedSteps.length}
                  onClick={() => setCurrentStep((p) => p + 1)}
                  className="px-4 py-2 text-xs sm:text-sm rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white disabled:opacity-40 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors min-h-[38px] font-medium"
                >
                  Next Step
                </button>
              </div>
            </div>

            {/* Step Progress Bar with Accessible Touch Targets */}
            <div className="flex items-center gap-1.5 py-1">
              {guidedSteps.map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  aria-label={`Step ${s.num}: ${s.title}`}
                  className="flex-1 py-3 group focus:outline-hidden"
                >
                  <div
                    className={`h-2.5 sm:h-2 rounded-full transition-all ${
                      s.num === currentStep
                        ? 'bg-amber-600 ring-2 ring-amber-500/40'
                        : s.num < currentStep
                        ? 'bg-indigo-600 dark:bg-indigo-400'
                        : 'bg-stone-200 dark:bg-stone-800 group-hover:bg-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Step Content & Animated Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Diagram */}
              <div className="lg:col-span-6 bg-[#FEFDF5] dark:bg-[#0C0A09] border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center justify-center">
                {guidedSteps[currentStep - 1].diagram}
              </div>

              {/* Text & Takeaway */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                <span className="text-xs font-mono text-amber-800 dark:text-amber-500 uppercase tracking-wider font-semibold">
                  Stage {currentStep}: {guidedSteps[currentStep - 1].subtitle}
                </span>
                <h3 className="text-2xl font-medium text-charcoal dark:text-stone-100">
                  {guidedSteps[currentStep - 1].title}
                </h3>
                <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
                  {guidedSteps[currentStep - 1].desc}
                </p>
                <div className="mt-2 p-3.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">Core Insight: </span>
                  {guidedSteps[currentStep - 1].takeaway}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
