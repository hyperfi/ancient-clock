'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArmillarySphere } from '@/components/svg';

export default function ObservePage() {
  const modules = [
    {
      title: 'Measure Time',
      href: '/observe/measure-time',
      subtitle: 'Ahorātra & Ghaṭīyantra',
      description: 'Explore the 60-ghaṭikā day, midnight vs sunrise reckonings, physical water clocks, and acoustic syllable calibration.',
      simulation: (
        <div className="w-full h-32 bg-stone-100/70 dark:bg-stone-900/80 rounded-lg flex items-center justify-center relative overflow-hidden border border-stone-200/60 dark:border-stone-800">
          <svg viewBox="0 0 200 120" className="w-full h-full max-h-32 select-none">
            {/* 60 Ghatika dial centered at (65, 60) */}
            <circle cx="65" cy="60" r="40" fill="none" stroke="#D6D3D1" strokeWidth="1.5" strokeDasharray="3 3" className="dark:stroke-stone-700" />
            <circle cx="65" cy="60" r="30" fill="none" stroke="#E7E5E4" strokeWidth="1" className="dark:stroke-stone-800" />
            {/* Cardinal hour ticks */}
            {[0, 90, 180, 270].map((deg) => (
              <line
                key={deg}
                x1={65 + 32 * Math.cos((deg * Math.PI) / 180)}
                y1={60 + 32 * Math.sin((deg * Math.PI) / 180)}
                x2={65 + 38 * Math.cos((deg * Math.PI) / 180)}
                y2={60 + 38 * Math.sin((deg * Math.PI) / 180)}
                stroke="#D97706"
                strokeWidth="1.5"
              />
            ))}
            {/* Rotating Clock Hand - Natively rotating around exact center (65, 60) */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 65 60"
                to="360 65 60"
                dur="10s"
                repeatCount="indefinite"
              />
              <line x1="65" y1="60" x2="65" y2="28" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="62.5,35 65,27 67.5,35" fill="#D97706" />
            </g>
            {/* Center Pivot Pin */}
            <circle cx="65" cy="60" r="3.5" fill="#D97706" />

            {/* Sinking Bowl simulation at right */}
            <rect x="124" y="44" width="62" height="42" rx="5" fill="#E0F2FE" className="dark:fill-sky-950/50" stroke="#BAE6FD" strokeWidth="1" />
            <line x1="125" y1="56" x2="185" y2="56" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
            
            {/* Sinking bowl and internal water move together */}
            <motion.g
              animate={{ y: [0, 4, 9, 14, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 135 58 A 20 20 0 0 0 175 58 Z"
                fill="#B87333"
                opacity={0.95}
                stroke="#92400E"
                strokeWidth="0.8"
              />
              <motion.path
                d="M 139 65 A 16 13 0 0 0 171 65 Z"
                fill="#38BDF8"
                animate={{ opacity: [0.1, 0.4, 0.7, 0.95, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>
          </svg>
        </div>
      ),
    },
    {
      title: 'Sun & Shadow',
      href: '/observe/sun-shadow',
      subtitle: 'Śaṅku & Direction Finding',
      description: 'Track solar altitude arcs with a 12-aṅgula gnomon and construct cardinal axes via equal-shadow circles and timi geometry.',
      simulation: (
        <div className="w-full h-32 bg-stone-100/70 dark:bg-stone-900/80 rounded-lg flex items-center justify-center relative overflow-hidden border border-stone-200/60 dark:border-stone-800">
          <svg viewBox="0 0 200 120" className="w-full h-full max-h-32 select-none">
            {/* Ground line */}
            <line x1="15" y1="95" x2="185" y2="95" stroke="#A8A29E" strokeWidth="1.5" className="dark:stroke-stone-700" />
            {/* Sun path arc */}
            <path d="M 30 95 A 70 70 0 0 1 170 95" fill="none" stroke="#E7E5E4" strokeWidth="1" strokeDasharray="3 3" className="dark:stroke-stone-800" />
            {/* Gnomon stick */}
            <line x1="100" y1="95" x2="100" y2="45" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" className="dark:stroke-stone-300" />
            <circle cx="100" cy="45" r="2.5" fill="#D97706" />

            {/* Sun smoothly arcing East -> Zenith -> West */}
            <motion.circle
              r="8"
              fill="#D97706"
              animate={{
                cx: [32, 65, 100, 135, 168],
                cy: [92, 45, 25, 45, 92],
                opacity: [0.4, 1, 1, 1, 0.4],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Dynamic Shadow responding to Sun position */}
            <motion.line
              x1="100"
              y1="95"
              stroke="#1C1917"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="dark:stroke-stone-400"
              animate={{
                x2: [165, 132, 100, 68, 35],
                opacity: [0.5, 0.8, 0.3, 0.8, 0.5],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      ),
    },
    {
      title: 'Moon & Calendar',
      href: '/observe/moon-calendar',
      subtitle: 'Tithi & Orbital Nodes',
      description: 'Observe lunar elongation in 12° tithi increments, explain variable day durations, and map Rāhu/Ketu nodal crossing limits.',
      simulation: (
        <div className="w-full h-32 bg-stone-100/70 dark:bg-stone-900/80 rounded-lg flex items-center justify-center relative overflow-hidden border border-stone-200/60 dark:border-stone-800">
          <svg viewBox="0 0 200 120" className="w-full h-full max-h-32 select-none">
            {/* Orbit track */}
            <circle cx="100" cy="60" r="42" fill="none" stroke="#D6D3D1" strokeWidth="1" strokeDasharray="3 3" className="dark:stroke-stone-700" />

            {/* Central Earth (Bhū) */}
            <circle cx="100" cy="60" r="10" fill="#2563EB" stroke="#60A5FA" strokeWidth="1" />
            <text x="100" y="63" fontSize="6" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Bhū</text>

            {/* Moon revolving around Earth centered at (100, 60) */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 100 60"
                to="360 100 60"
                dur="8s"
                repeatCount="indefinite"
              />
              <circle cx="100" cy="18" r="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
              <path d="M 100 12 A 6 6 0 0 1 100 24 Z" fill="#334155" />
            </g>

            {/* Sun direction rays */}
            <line x1="165" y1="60" x2="190" y2="60" stroke="#D97706" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="192" cy="60" r="4" fill="#D97706" />
            <text x="178" y="52" fontSize="7" fill="#D97706" textAnchor="middle" fontWeight="bold">Sūrya</text>
          </svg>
        </div>
      ),
    },
    {
      title: 'Predict an Eclipse',
      href: '/observe/predict-eclipse',
      subtitle: 'Sūrya Siddhānta vs VSOP87',
      description: 'Execute the full 6-step historical eclipse algorithm, compare against modern ephemeris ground truth, and test against 5 historical benchmarks.',
      simulation: (
        <div className="w-full h-32 bg-stone-100/70 dark:bg-stone-900/80 rounded-lg flex items-center justify-center relative overflow-hidden border border-stone-200/60 dark:border-stone-800">
          <svg viewBox="0 0 200 120" className="w-full h-full max-h-32 select-none">
            {/* Sun at left */}
            <circle cx="35" cy="60" r="20" fill="#F59E0B" opacity="0.95" />
            <line x1="58" y1="60" x2="88" y2="60" stroke="#FBBF24" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />

            {/* Earth in middle */}
            <circle cx="102" cy="60" r="11" fill="#2563EB" stroke="#60A5FA" strokeWidth="1" />
            
            {/* Umbra shadow cone */}
            <polygon points="102,51 102,69 175,60" fill="#1E1B4B" opacity="0.85" stroke="#3730A3" strokeWidth="0.6" />

            {/* Moon traversing shadow from left to right */}
            <motion.circle
              cy="60"
              r="5.5"
              animate={{
                cx: [118, 142, 172],
                fill: ['#E2E8F0', '#DC2626', '#E2E8F0'],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      ),
    },
    {
      title: 'Accuracy Lab',
      href: '/observe/accuracy-lab',
      subtitle: 'Monte Carlo & Guided Challenge',
      description: 'Perturb physical instrument parameters, table quantization, and observer limits across 1,000 runs, or complete the 8-stage guided walkthrough.',
      simulation: (
        <div className="w-full h-32 bg-stone-100/70 dark:bg-stone-900/80 rounded-lg flex items-center justify-center relative overflow-hidden border border-stone-200/60 dark:border-stone-800">
          <svg viewBox="0 0 200 120" className="w-full h-full max-h-32 select-none">
            {/* Axis */}
            <line x1="20" y1="95" x2="180" y2="95" stroke="#A8A29E" strokeWidth="1" className="dark:stroke-stone-700" />
            <line x1="100" y1="95" x2="100" y2="25" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />

            {/* Gaussian Bell Curve */}
            <path
              d="M 30 95 C 65 95, 75 90, 85 65 C 95 38, 100 25, 100 25 C 100 25, 105 38, 115 65 C 125 90, 135 95, 170 95"
              fill="none"
              stroke="#4338CA"
              strokeWidth="2"
              className="dark:stroke-indigo-400"
            />
            {/* Shaded 68% region */}
            <path
              d="M 85 65 C 95 38, 100 25, 100 25 C 100 25, 105 38, 115 65 L 115 95 L 85 95 Z"
              fill="#4338CA"
              opacity={0.15}
              className="dark:fill-indigo-400/30"
            />

            {/* Stochastic Particle Scatter Dots (animating radius & opacity without origin jump) */}
            {[
              { cx: 96, cy: 35 },
              { cx: 104, cy: 40 },
              { cx: 92, cy: 55 },
              { cx: 108, cy: 52 },
              { cx: 88, cy: 75 },
              { cx: 114, cy: 72 },
            ].map((pt, i) => (
              <motion.circle
                key={i}
                cx={pt.cx}
                cy={pt.cy}
                fill="#D97706"
                animate={{ r: [1.8, 3.2, 1.8], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </svg>
        </div>
      ),
    },
    {
      title: 'Sources & Methodology',
      href: '/observe/sources',
      subtitle: '2,000-Year Timeline & Ledger',
      description: 'Explore the full register of primary texts, critical editions, modern references, and the four strict provenance categories.',
      simulation: (
        <div className="w-full h-32 bg-stone-100/70 dark:bg-stone-900/80 rounded-lg flex items-center justify-center relative overflow-hidden border border-stone-200/60 dark:border-stone-800">
          <ArmillarySphere size={105} interactive={false} />
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-mono uppercase tracking-widest text-[#D97706] mb-2 block font-semibold">
          Astronomical Laboratory
        </span>
        <h1 className="text-4xl sm:text-5xl font-light text-[#1C1917] dark:text-[#F5F5F4] tracking-tight mb-4">
          The Observatory
        </h1>
        <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
          Select an instrument or simulation below to reproduce ancient mathematical observations,
          measure time, and verify predictions with modern astronomical precision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group flex flex-col justify-between p-5 bg-white dark:bg-[#141210] border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-[#4338CA]/40 dark:hover:border-[#818CF8]/40 hover:shadow-lg transition-all"
          >
            <div>
              {/* Simulation Header */}
              <div className="mb-4">{mod.simulation}</div>
              
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-lg font-semibold text-[#1C1917] dark:text-[#F5F5F4] group-hover:text-[#4338CA] dark:group-hover:text-[#818CF8] transition-colors">
                  {mod.title}
                </h2>
                <span className="text-stone-400 group-hover:translate-x-0.5 transition-transform text-sm">
                  →
                </span>
              </div>

              <p className="text-xs font-mono text-[#D97706] mb-2">{mod.subtitle}</p>

              <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm leading-relaxed">
                {mod.description}
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
              <span>Interactive Simulation</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Launch Lab</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
