'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SOURCES, type Source } from '@/data/sources';
import { ProvenanceLabel } from '@/components/ui/ProvenanceLabel';
import { ArmillarySphere } from '@/components/svg/ArmillarySphere';

const SOURCE_TYPE_LABELS: Record<Source['sourceType'], string> = {
  primary_text: 'Primary Text',
  translation: 'Translation',
  commentary: 'Commentary',
  critical_edition: 'Critical Edition',
  scholarly_article: 'Scholarly Article',
  scholarly_book: 'Scholarly Book',
  modern_reference: 'Modern Reference',
  instrument_study: 'Instrument Study',
};

const SOURCE_TYPE_COLORS: Record<Source['sourceType'], string> = {
  primary_text: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  translation: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
  commentary: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300',
  critical_edition: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
  scholarly_article: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
  scholarly_book: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
  modern_reference: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300',
  instrument_study: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300',
};

function SourceCard({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141210] rounded-xl p-4 sm:p-5 hover:border-stone-300 dark:hover:border-stone-700 transition-colors shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-charcoal dark:text-stone-100 text-base leading-snug">
            {source.title}
          </h3>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">{source.author}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${
            SOURCE_TYPE_COLORS[source.sourceType]
          }`}
        >
          {SOURCE_TYPE_LABELS[source.sourceType]}
        </span>
      </div>

      <p className="text-stone-500 dark:text-stone-400 text-xs mt-2 font-mono">{source.period}</p>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs mt-3 font-medium transition-colors inline-flex items-center gap-1"
        aria-expanded={expanded}
      >
        {expanded ? '− Hide full citation & notes' : '+ View full citation & notes'}
      </button>

      {expanded && (
        <div className="mt-4 space-y-2.5 text-xs sm:text-sm border-t border-stone-100 dark:border-stone-800/80 pt-3 text-stone-700 dark:text-stone-300">
          <div>
            <span className="text-stone-400 text-[11px] uppercase tracking-wider block mb-0.5">
              Citation
            </span>
            <p className="font-serif italic text-stone-800 dark:text-stone-200">{source.citation}</p>
          </div>
          {source.notes && (
            <div>
              <span className="text-stone-400 text-[11px] uppercase tracking-wider block mb-0.5">
                Scholarly Notes
              </span>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{source.notes}</p>
            </div>
          )}
          {source.url && (
            <div className="pt-1">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-mono text-xs"
              >
                External Reference Link ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

interface TimelineEntry {
  period: string;
  label: string;
  description: string;
}

const TIMELINE: TimelineEntry[] = [
  {
    period: '~1st millennium BCE',
    label: 'Vedāṅga Jyotiṣa',
    description: 'Earliest Indian astronomical text. Calendrical/ritual timing. Non-sexagesimal time units (kāṣṭhā/kalā).',
  },
  {
    period: 'c. 499 CE',
    label: 'Āryabhaṭa',
    description: 'Āryabhaṭīya. Diurnal axial rotation of the Earth, midnight epoch, R=3438 sine table, natural shadow eclipse theory.',
  },
  {
    period: 'c. 575 CE',
    label: 'Varāhamihira',
    description: 'Pañcasiddhāntikā. Comparative summary of five traditions, including the lost "old" Sūrya Siddhānta.',
  },
  {
    period: 'c. 629 CE',
    label: 'Bhāskara I',
    description: 'Commentary on Āryabhaṭīya. Acoustic calibration of timekeepers via 60 guru-akṣara syllable recitations.',
  },
  {
    period: 'c. 628 CE',
    label: 'Brahmagupta',
    description: 'Brāhmasphuṭasiddhānta. Rigorous mathematical and interpolation methods; championed geocentric stability.',
  },
  {
    period: '~800 CE',
    label: 'Sūrya Siddhānta (surviving)',
    description: 'Extant recension. Practical baseline for pan-Indian almanacs (pañcāṅgas). A living, revised scientific document.',
  },
  {
    period: 'c. 1150 CE',
    label: 'Bhāskara II',
    description: 'Siddhānta Śiromaṇi. Refined gnomon mathematics, spherical coordinates, and eclipse parallax algorithms.',
  },
  {
    period: 'c. 1380–1460',
    label: 'Parameśvara',
    description: '55 years of continuous empirical eclipse observation (1393–1448). Founded the Dṛgganita observational school in Kerala.',
  },
  {
    period: 'c. 1724–1735',
    label: 'Jantar Mantar',
    description: 'Architectural masonry observatories built by Sawai Jai Singh II, scaling gnomons to 27 meters to minimize penumbral blur.',
  },
];

export default function SourcesPage() {
  const [activeFilter, setActiveFilter] = useState<Source['sourceType'] | 'all'>('all');

  const filteredSources =
    activeFilter === 'all'
      ? SOURCES
      : SOURCES.filter((s) => s.sourceType === activeFilter);

  const sourceTypes = Array.from(new Set(SOURCES.map((s) => s.sourceType)));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Header with Armillary Sphere Animated Graphic */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-stone-200 dark:border-stone-800 pb-10">
        <div className="flex-1 text-center md:text-left">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D97706] mb-2 block font-semibold">
            Epistemology & Methodology
          </span>
          <h1 className="text-3xl sm:text-4xl font-light text-[#1C1917] dark:text-[#F5F5F4] tracking-tight">
            Sources & Methodology
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed">
            Every formula, physical parameter, and claim in Ghaṭikā is grounded in primary Sanskrit texts,
            critical editions, and peer-reviewed modern scholarship.
          </p>
        </div>

        {/* Animated Armillary Sphere Graphic (Gola-yantra) */}
        <div className="w-36 h-36 flex-none bg-[#FEFDF5] dark:bg-[#141210] rounded-2xl border border-stone-200 dark:border-stone-800 p-3 shadow-xs flex items-center justify-center relative group">
          <ArmillarySphere size="100%" interactive={true} />
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[10px] font-mono text-stone-500 dark:text-stone-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs">
            Gola-yantra (SS Ch. 13)
          </div>
        </div>
      </div>

      {/* Methodology Section with Visual Animated Tier Cards */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-[#1C1917] dark:text-[#F5F5F4] mb-2">
          Research Provenance Framework
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
          To maintain scientific integrity, all models in Ghaṭikā are tagged with one of four explicit tiers:
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              type: 'documented' as const,
              title: 'Documented',
              desc: 'Directly stated in a primary historical text or critically established translation (e.g. 12-aṅgula gnomon, R=3438 sine table, revolution counts).',
              icon: (
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
            {
              type: 'scholarly' as const,
              title: 'Scholarly Interpretation',
              desc: 'A mathematical or textual reconstruction accepted and debated in peer-reviewed academic literature (e.g. S.R. Sarma, Shukla & Sarma, Plofker).',
              icon: (
                <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ),
            },
            {
              type: 'reconstruction' as const,
              title: 'Engineering Reconstruction',
              desc: 'Our numerical implementation built with modern physics to operationalize textual descriptions (e.g. RK4 Torricelli integration for the water clock).',
              icon: (
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              type: 'modern' as const,
              title: 'Modern Comparison',
              desc: 'Present-day astronomical ground truth (Astronomy Engine / VSOP87 / Stephenson ΔT) used strictly as an evaluation benchmark.',
              icon: (
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} strokeDasharray="3 3" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              ),
            },
          ].map(({ type, desc, icon }) => (
            <div
              key={type}
              className="flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-[#141210] border border-stone-200 dark:border-stone-800 shadow-xs"
            >
              <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800/80 flex-none">{icon}</div>
              <div className="space-y-1">
                <ProvenanceLabel type={type} />
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed pt-1">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2000-Year Timeline */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-[#1C1917] dark:text-[#F5F5F4]">
            Indian Astronomical Tradition — Timeline
          </h2>
          <span className="text-xs font-mono text-stone-400">~1000 BCE — 1735 CE</span>
        </div>
        <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mb-6 italic">
          Indian astronomy is not a static monolithic dogma—it evolved through continual critique,
          new mathematical tools, and observational recalibration.
        </p>

        <div className="relative bg-white dark:bg-[#141210] p-6 rounded-2xl border border-stone-200 dark:border-stone-800">
          <div className="absolute left-7 top-6 bottom-6 w-px bg-stone-200 dark:bg-stone-800" aria-hidden="true" />
          <div className="space-y-7">
            {TIMELINE.map((entry, i) => (
              <div key={i} className="relative pl-8">
                <div
                  className="absolute left-[-17px] top-1.5 w-3 h-3 rounded-full bg-[#D97706] border-2 border-white dark:border-[#141210] shadow-xs"
                  aria-hidden="true"
                />
                <p className="text-xs text-stone-400 dark:text-stone-500 font-mono mb-0.5">{entry.period}</p>
                <p className="font-semibold text-[#1C1917] dark:text-stone-100 text-sm sm:text-base">
                  {entry.label}
                </p>
                <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm mt-0.5 leading-relaxed">
                  {entry.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Source Registry Filter & List */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-[#1C1917] dark:text-[#F5F5F4]">Source Registry</h2>
          <span className="text-xs text-stone-400 font-mono">
            Showing {filteredSources.length} of {SOURCES.length} documents
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#1C1917] dark:bg-stone-200 text-white dark:text-stone-900 border-[#1C1917] dark:border-stone-200 font-medium'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            All Sources ({SOURCES.length})
          </button>
          {sourceTypes.map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                activeFilter === type
                  ? 'bg-[#1C1917] dark:bg-stone-200 text-white dark:text-stone-900 border-[#1C1917] dark:border-stone-200 font-medium'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              {SOURCE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Source Cards */}
        <div className="space-y-3.5">
          {filteredSources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      </section>

      {/* Footer Note */}
      <footer className="mt-16 pt-8 border-t border-stone-200 dark:border-stone-800 text-center space-y-1.5 pb-8">
        <p className="text-stone-500 dark:text-stone-400 text-xs">
          Designed and developed by{' '}
          <a
            href="https://www.dr-abhishek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-stone-700 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 transition-colors"
          >
            Dr. Abhishek (www.dr-abhishek.com)
          </a>
        </p>
        <p className="text-stone-400 dark:text-stone-500 text-xs">
          This project treats its material strictly as the history of quantitative science.
        </p>
      </footer>
    </div>
  );
}
