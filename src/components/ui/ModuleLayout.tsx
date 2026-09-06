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
    <div className={`flex flex-col h-screen max-h-screen bg-[#FEFDF5] text-[#1C1917] overflow-hidden ${className}`}>
      {/* Header */}
      <header className="flex-none px-4 py-3 border-b border-stone-200 bg-[#FEFDF5] z-10 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1C1917]">{title}</h1>
          {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Visualization / Main Area */}
        <main className="flex-1 relative overflow-auto bg-stone-50 md:bg-transparent">
          <div className="absolute inset-0">
            {children}
          </div>
        </main>

        {/* Controls Panel */}
        {controls && (
          <aside className="w-full md:w-80 lg:w-96 flex-none border-t md:border-t-0 md:border-l border-stone-200 bg-[#FEFDF5] overflow-y-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none z-10 transition-all max-h-[50vh] md:max-h-full">
            <div className="p-4 md:p-6 space-y-6">
              {controls}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
