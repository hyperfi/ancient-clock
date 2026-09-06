import { ObservatoryNav } from '@/components/nav/ObservatoryNav';

export default function ObservatoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FEFDF5]">
      <ObservatoryNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
