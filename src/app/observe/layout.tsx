import { ObservatoryNav } from '@/components/nav/ObservatoryNav';

export default function ObservatoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FEFDF5] dark:bg-[#0C0A09] text-[#1C1917] dark:text-[#F5F5F4] transition-colors">
      <ObservatoryNav />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-stone-200 dark:border-stone-800/80 py-6 px-4 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="tracking-wide">
            Ghaṭikā — Ancient Indian Time & Astronomy Lab
          </p>
          <p>
            Created by{' '}
            <a
              href="https://www.dr-abhishek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-stone-700 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 transition-colors"
            >
              Dr. Abhishek
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
