import Link from 'next/link';

export default function ObservePage() {
  const modules = [
    {
      title: 'Measure Time',
      href: '/observe/measure-time',
      description: 'Explore the water clock and celestial mechanics of the day.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Sun & Shadow',
      href: '/observe/sun-shadow',
      description: 'Track the path of the sun using a gnomon and shadows.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="4" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v2m0 12v2m8-8h-2M6 12H4m13.657-5.657l-1.414 1.414M7.757 16.243l-1.414 1.414M17.657 17.657l-1.414-1.414M7.757 7.757L6.343 6.343" />
        </svg>
      )
    },
    {
      title: 'Moon & Calendar',
      href: '/observe/moon-calendar',
      description: 'Observe lunar phases and construct the ancient lunisolar calendar.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    },
    {
      title: 'Predict an Eclipse',
      href: '/observe/predict-eclipse',
      description: 'Calculate nodes and shadows to predict lunar and solar eclipses.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="8" strokeWidth={1.5} strokeDasharray="4 4" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      )
    },
    {
      title: 'Accuracy Lab',
      href: '/observe/accuracy-lab',
      description: 'Test the limits and precision of ancient observational instruments.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Sources & Methodology',
      href: '/observe/sources',
      description: 'Provenance, historical texts, and mathematical models used in this lab.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-light text-[#1C1917] mb-4">The Observatory</h1>
        <p className="text-lg text-[#1C1917]/70">
          Choose an instrument or experiment to begin your journey through ancient Indian astronomy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group block p-6 border border-[#1C1917]/10 rounded-xl hover:border-[#4338CA]/30 hover:bg-[#4338CA]/5 transition-all"
          >
            <div className="text-[#B87333] mb-4 group-hover:text-[#4338CA] transition-colors">
              {mod.icon}
            </div>
            <h2 className="text-xl font-medium text-[#1C1917] mb-2">{mod.title}</h2>
            <p className="text-[#1C1917]/60 text-sm leading-relaxed">
              {mod.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
