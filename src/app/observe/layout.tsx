import { ObservatoryNav } from '@/components/nav/ObservatoryNav';

export default function ObservatoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FEFDF5] dark:bg-[#0C0A09] text-[#1C1917] dark:text-[#F5F5F4] transition-colors">
      <ObservatoryNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
