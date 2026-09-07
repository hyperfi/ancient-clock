import React from 'react';

export interface ModuleLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  controls?: React.ReactNode;
  className?: string;
}

export function ModuleLayout({
  title,
  subtitle,
  children,
  controls,
  className = '',
}: ModuleLayoutProps) {
  return (
    <div
      className={`flex flex-col min-h-[calc(100vh-3.5rem)] bg-[#FEFDF5] dark:bg-[#0C0A09] text-[#1C1917] dark:text-[#F5F5F4] transition-colors ${className}`}
    >
      {/* Header */}
      <header className="flex-none px-4 sm:px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-[#FEFDF5]/95 dark:bg-[#0C0A09]/95 sticky top-14 z-20 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1C1917] dark:text-[#F5F5F4]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Visualization / Main Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-stone-50/40 dark:bg-stone-950/30">
          <div className="w-full h-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Controls Panel */}
        {controls && (
          <aside className="w-full md:w-80 lg:w-96 flex-none border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 bg-[#FEFDF5] dark:bg-[#141210] p-4 md:p-6 space-y-6">
            {controls}
          </aside>
        )}
      </div>
    </div>
  );
}
