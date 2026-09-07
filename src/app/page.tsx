'use client';

import Link from 'next/link';
import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, prefersReducedMotion]);

  // Subtle parallax values
  const sunX = useTransform(mouseX, [0, 1], [-15, 15]);
  const sunY = useTransform(mouseY, [0, 1], [-10, 10]);
  const shadowSkew = useTransform(mouseX, [0, 1], [-45, -20]);
  const shadowScaleX = useTransform(mouseX, [0, 1], [0.8, 1.2]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#FEFDF5] dark:bg-[#0C0A09] text-[#1C1917] dark:text-[#F5F5F4] selection:bg-[#4338CA] selection:text-white flex items-center justify-center transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>

      {/* Background Vector Scene */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sky / Horizon */}
        <div className="absolute bottom-0 w-full h-1/3 bg-[#1C1917]/5 dark:bg-white/5 border-t border-[#1C1917]/20 dark:border-white/10" />

        {/* Stars */}
        <div className="absolute inset-0">
          {[
            { top: '15%', left: '20%' },
            { top: '25%', left: '45%' },
            { top: '10%', left: '70%' },
            { top: '30%', left: '85%' },
            { top: '40%', left: '15%' },
            { top: '20%', left: '60%' },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#4338CA]/40 dark:bg-indigo-300 dark:shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              style={{ top: pos.top, left: pos.left }}
            />
          ))}
        </div>

        {/* Crescent Moon */}
        <div className="absolute top-[20%] left-[25%] w-12 h-12 rounded-full shadow-[inset_-8px_4px_0_0_#a8a29e] dark:shadow-[inset_-8px_4px_0_0_#cbd5e1]" />

        {/* Parallax Sun */}
        <motion.div
          className="absolute top-[40%] right-[20%] w-32 h-32"
          style={{ x: sunX, y: sunY }}
        >
          {/* Sun Body */}
          <div className="absolute inset-0 rounded-full bg-[#D97706]/90 blur-[2px]" />
          <div className="absolute inset-0 rounded-full bg-[#D97706]" />
        </motion.div>

        {/* Gnomon and Shadow Container */}
        <div className="absolute bottom-1/3 left-[40%] w-px h-64 -translate-x-1/2 translate-y-[2px] origin-bottom z-10">
          {/* Shadow */}
          <motion.div
            className="absolute bottom-0 left-0 w-2 h-48 bg-[#1C1917]/10 dark:bg-white/10 origin-bottom-left"
            style={{
              skewX: shadowSkew,
              scaleY: shadowScaleX,
              x: prefersReducedMotion ? 0 : useTransform(mouseX, [0, 1], [-5, 5]),
            }}
          />
          {/* Gnomon Stick */}
          <div className="absolute bottom-0 left-[-2px] w-1 h-48 bg-[#1C1917] dark:bg-stone-300 rounded-t-sm" />

          {/* Water-clock bowl near base */}
          <div className="absolute bottom-0 left-8 w-16 h-8 bg-[#B87333] rounded-b-full border-t-2 border-[#1C1917]/20 dark:border-amber-500/40 shadow-inner" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-3xl mt-[-10vh]">
        <h1 className="text-6xl md:text-8xl font-light tracking-tight text-[#1C1917] dark:text-[#F5F5F4] mb-2">
          Ghaṭikā
        </h1>
        <div className="text-2xl md:text-3xl text-[#D97706] mb-8 font-serif opacity-90">
          घटिका
        </div>
        <p className="text-xl md:text-2xl font-light text-[#1C1917]/80 dark:text-stone-300 mb-12 tracking-wide">
          Measure time. Read the sky. Predict an eclipse.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Link
            href="/observe"
            className="px-8 py-3 rounded-full bg-[#4338CA] dark:bg-[#4F46E5] text-white font-medium hover:bg-[#3730A3] dark:hover:bg-[#4338CA] transition-colors focus:ring-4 focus:ring-[#4338CA]/30 outline-none shadow-sm"
          >
            Enter the Observatory
          </Link>
          <Link
            href="/observe/sources"
            className="text-[#1C1917]/70 dark:text-stone-400 hover:text-[#1C1917] dark:hover:text-white font-medium underline underline-offset-4 decoration-[#1C1917]/30 dark:decoration-stone-600 hover:decoration-[#1C1917] transition-all"
          >
            How did this work?
          </Link>
        </div>
      </div>
    </main>
  );
}
