'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const links = [
  { href: '/observe', label: 'Observe' },
  { href: '/observe/measure-time', label: 'Measure Time' },
  { href: '/observe/sun-shadow', label: 'Sun & Shadow' },
  { href: '/observe/moon-calendar', label: 'Moon & Calendar' },
  { href: '/observe/predict-eclipse', label: 'Predict an Eclipse' },
  { href: '/observe/accuracy-lab', label: 'Accuracy Lab' },
  { href: '/observe/sources', label: 'Sources' },
];

export function ObservatoryNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FEFDF5]/90 dark:bg-[#0C0A09]/90 backdrop-blur border-b border-[#1C1917]/10 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link
              href="/"
              className="font-medium text-[#1C1917] dark:text-[#F5F5F4] tracking-wide text-lg flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="font-semibold">Ghaṭikā</span>
              <span className="text-xs text-stone-400 font-normal hidden sm:inline">घटिका</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-baseline space-x-5">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-1 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#4338CA] dark:text-[#818CF8]'
                        : 'text-[#1C1917]/70 dark:text-stone-300 hover:text-[#1C1917] dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4338CA] dark:bg-[#818CF8]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pl-2 border-l border-stone-200 dark:border-stone-800">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#1C1917] dark:text-white hover:bg-[#1C1917]/5 dark:hover:bg-white/10 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#FEFDF5] dark:bg-[#141210] border-b border-[#1C1917]/10 dark:border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-[#4338CA]/10 dark:bg-[#818CF8]/20 text-[#4338CA] dark:text-[#818CF8]'
                        : 'text-[#1C1917]/70 dark:text-stone-300 hover:bg-[#1C1917]/5 dark:hover:bg-white/5 hover:text-[#1C1917] dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
