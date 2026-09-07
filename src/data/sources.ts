/**
 * Source Registry
 *
 * Structured data for all sources referenced in the Ghaṭikā application.
 * Every historical claim in the app must reference an ID from this registry.
 *
 * This is the single source of truth for bibliographic information.
 */

import type { ProvenanceType } from '@/lib/time/units';

export interface Source {
  /** Unique identifier */
  id: string;
  /** Full title */
  title: string;
  /** Author(s) */
  author: string;
  /** Approximate period */
  period: string;
  /** Type of source */
  sourceType: 'primary_text' | 'translation' | 'commentary' | 'critical_edition' | 'scholarly_article' | 'scholarly_book' | 'modern_reference' | 'instrument_study';
  /** Full bibliographic citation */
  citation: string;
  /** Chapter (if applicable) */
  chapter?: string;
  /** Verse (if applicable) */
  verse?: string;
  /** Page (if applicable) */
  page?: string;
  /** URL (if available online) */
  url?: string;
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
  /** Additional notes */
  notes?: string;
}

export const SOURCES: Source[] = [
  // ─── Primary Texts ─────────────────────────────────────────────────────────
  {
    id: 'ss',
    title: 'Sūrya Siddhānta',
    author: 'Unknown (composite authorship)',
    period: 'Surviving recension ~800 CE (with earlier and later layers)',
    sourceType: 'primary_text',
    citation: 'Sūrya Siddhānta. Dating contested; see Pingree and Plofker.',
    confidence: 'high',
    notes:
      'The surviving text dates to approximately 800 CE and has undergone ' +
      'multiple revisions. The "old" Sūrya Siddhānta summarized by Varāhamihira ' +
      '(6th c.) differs from the surviving text. It is a "living document" revised ' +
      'over centuries. Do NOT assign a simplistic ancient date.',
  },
  {
    id: 'ss-burgess',
    title: 'Translation of the Sūrya Siddhānta',
    author: 'Ebenezer Burgess',
    period: '1860',
    sourceType: 'translation',
    citation:
      'Burgess, E. (1860). "Translation of the Sūrya-Siddhānta, a Text-Book ' +
      'of Hindu Astronomy." Journal of the American Oriental Society, Vol. 6.',
    confidence: 'high',
    notes:
      'Standard English translation. Colonial-era interpretive limitations noted. ' +
      'Translated a medieval recension, not the original text.',
  },
  {
    id: 'aryabhatiya',
    title: 'Āryabhaṭīya',
    author: 'Āryabhaṭa I',
    period: 'c. 499 CE',
    sourceType: 'primary_text',
    citation: 'Āryabhaṭīya of Āryabhaṭa (b. 476 CE). Written c. 499 CE.',
    confidence: 'high',
    notes:
      '121 verses in 4 pādas. Proposes rotating Earth. Uses midnight epoch.',
  },
  {
    id: 'aryabhatiya-insa',
    title: 'Āryabhaṭīya of Āryabhaṭa — INSA Critical Edition',
    author: 'K.S. Shukla and K.V. Sarma (eds.)',
    period: '1976',
    sourceType: 'critical_edition',
    citation:
      'Shukla, K.S. and Sarma, K.V. (1976). Āryabhaṭīya of Āryabhaṭa: ' +
      'Critically Edited with Translation. New Delhi: Indian National Science Academy. ' +
      '3 volumes.',
    confidence: 'high',
    notes: 'Definitive critical edition. Published for Āryabhaṭa\'s 1500th birth anniversary.',
  },
  {
    id: 'bhaskara-i-commentary',
    title: 'Āryabhaṭīyabhāṣya',
    author: 'Bhāskara I',
    period: 'c. 629 CE',
    sourceType: 'commentary',
    citation: 'Bhāskara I. Āryabhaṭīyabhāṣya (Commentary on the Āryabhaṭīya). c. 629 CE.',
    confidence: 'high',
    notes:
      'Crucial commentary expanding Āryabhaṭa\'s cryptic verses into algorithms ' +
      'with worked examples. Contains discussion of guru-akṣara time calibration.',
  },
  {
    id: 'pancasiddhantika',
    title: 'Pañcasiddhāntikā',
    author: 'Varāhamihira',
    period: 'c. 575 CE',
    sourceType: 'primary_text',
    citation: 'Varāhamihira (c. 505–587 CE). Pañcasiddhāntikā.',
    confidence: 'high',
    notes:
      'Summary of five astronomical systems. Documents the "old" Sūrya Siddhānta ' +
      'which is largely lost.',
  },

  // ─── Scholarly Literature ──────────────────────────────────────────────────
  {
    id: 'sarma-instruments',
    title: 'Indian Astronomical and Time-Measuring Instruments',
    author: 'S.R. Sarma',
    period: 'Various publications, 2000s-2010s',
    sourceType: 'instrument_study',
    citation:
      'Sarma, S.R. Indian Astronomical and Time-Measuring Instruments: ' +
      'A Catalogue in Preparation.',
    confidence: 'high',
    notes:
      'Foremost authority on Indian astronomical instruments. Documents water clocks, ' +
      'noting no universal dimensions — different texts specify different parameters.',
  },
  {
    id: 'sarma-syllables',
    title: 'Measuring Time with Long Syllables',
    author: 'S.R. Sarma',
    period: 'Published academic article',
    sourceType: 'scholarly_article',
    citation:
      'Sarma, S.R. "Measuring Time with Long Syllables: Bhāskara I\'s Commentary ' +
      'on Āryabhaṭīya, Kālakriyāpāda 2."',
    confidence: 'high',
    notes:
      'Analyzes the acoustic calibration method: 60 guru-akṣaras at middling speed = 1 pala.',
  },
  {
    id: 'iyengar-akshara',
    title: 'Akṣara the Basic Unit of Time Measure in Ancient India',
    author: 'R.N. Iyengar, H.S. Sudarshan, and Anand Viswanathan',
    period: 'Published academic article',
    sourceType: 'scholarly_article',
    citation:
      'Iyengar, R.N., Sudarshan, H.S., and Viswanathan, A. "Akṣara the Basic ' +
      'Unit of Time Measure in Ancient India."',
    confidence: 'high',
    notes:
      'Experimental verification: 60 guru-akṣaras ≈ 24 seconds, confirming the ' +
      'historical calibration method.',
  },
  {
    id: 'plofker-india',
    title: 'Mathematics in India',
    author: 'Kim Plofker',
    period: '2009',
    sourceType: 'scholarly_book',
    citation:
      'Plofker, K. (2009). Mathematics in India. Princeton University Press.',
    confidence: 'high',
    notes: 'Comprehensive scholarly overview of Indian mathematical traditions.',
  },
  {
    id: 'pingree',
    title: 'Various works on Indian astronomy',
    author: 'David Pingree',
    period: '1970s-2000s',
    sourceType: 'scholarly_book',
    citation:
      'Pingree, D. Various publications including Census of the Exact Sciences ' +
      'in Sanskrit (5 vols), and numerous articles on transmission of astronomical texts.',
    confidence: 'high',
    notes: 'Leading historian of exact sciences. Essential for dating and transmission questions.',
  },
  {
    id: 'stephenson-deltaT',
    title: 'Measurement of the Earth\'s rotation: 720 BC to AD 2015',
    author: 'F.R. Stephenson, L.V. Morrison, C.Y. Hohenkerk',
    period: '2016',
    sourceType: 'modern_reference',
    citation:
      'Stephenson, F.R., Morrison, L.V., and Hohenkerk, C.Y. (2016). ' +
      '"Measurement of the Earth\'s rotation: 720 BC to AD 2015." ' +
      'Proceedings of the Royal Society A, 472(2196).',
    confidence: 'high',
    notes: 'Gold standard for ΔT (TT−UT1) values for historical dates.',
  },
  {
    id: 'espenak-meeus',
    title: 'Five Millennium Canon of Solar Eclipses: −1999 to +3000',
    author: 'Fred Espenak and Jean Meeus',
    period: '2006',
    sourceType: 'modern_reference',
    citation:
      'Espenak, F. and Meeus, J. (2006). Five Millennium Canon of Solar Eclipses: ' +
      '−1999 to +3000. NASA/TP-2006-214141.',
    confidence: 'high',
    notes: 'Comprehensive eclipse catalog with machine-readable data.',
  },
  {
    id: 'astronomy-engine',
    title: 'Astronomy Engine',
    author: 'Don Cross',
    period: 'Active development',
    sourceType: 'modern_reference',
    citation:
      'Cross, D. Astronomy Engine. GitHub: cosinekitty/astronomy. MIT License.',
    url: 'https://github.com/cosinekitty/astronomy',
    confidence: 'high',
    notes:
      'JavaScript/TypeScript astronomical computation library. Based on VSOP87. ' +
      'Accuracy ~1 arcminute. Used as modern reference for the application.',
  },
  {
    id: 'parameshvara-kv-sarma',
    title: 'Critical editions of Parameśvara\'s works',
    author: 'K.V. Sarma',
    period: '20th century',
    sourceType: 'critical_edition',
    citation:
      'Sarma, K.V. Various critical editions of Parameśvara\'s Dṛgganita, ' +
      'Grahaṇamaṇḍana, and Siddhāntadīpikā.',
    confidence: 'high',
    notes:
      'Parameśvara (c. 1380-1460) conducted 55 years of systematic eclipse ' +
      'observations (1393-1448) from Alattur, Kerala. Created the Dṛgganita ' +
      '("computation according to observation") system.',
  },
];

/**
 * Look up a source by ID.
 */
export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

/**
 * Get all sources of a particular type.
 */
export function getSourcesByType(type: Source['sourceType']): Source[] {
  return SOURCES.filter((s) => s.sourceType === type);
}
