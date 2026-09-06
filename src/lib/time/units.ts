/**
 * Traditional Indian Time Units
 *
 * Defines the time unit hierarchy used in siddhāntic astronomy with
 * provenance tracking. Each unit includes its relationship to other units,
 * modern equivalents, and source references.
 *
 * Primary convention: Siddhānta (Sūrya Siddhānta / Āryabhaṭīya)
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: Sūrya Siddhānta Ch.14; Āryabhaṭīya Kālakriyāpāda
 */

/** Provenance type for historical claims */
export type ProvenanceType =
  | 'documented'
  | 'scholarly'
  | 'reconstruction'
  | 'modern';

/** A time unit definition with provenance */
export interface TimeUnit {
  /** Canonical Sanskrit name (IAST transliteration) */
  id: string;
  /** Display name in IAST */
  name: string;
  /** Devanāgarī form */
  devanagari: string;
  /** Alternative names used in different texts */
  aliases: string[];
  /** Duration in modern seconds */
  seconds: number;
  /** How many of the sub-unit make one of this unit */
  subdivisions?: { count: number; unitId: string };
  /** How many of this unit make the parent unit */
  parentRelation?: { count: number; unitId: string };
  /** Source provenance */
  provenance: ProvenanceType;
  /** Source text reference */
  source: string;
  /** Notes on variation across texts */
  notes?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Seconds in one sidereal/civil day */
export const SECONDS_PER_DAY = 86400;

/** Ghaṭikās per day (DOCUMENTED: SS Ch.14, Āryabhaṭīya) */
export const GHATIKAS_PER_DAY = 60;

/** Vināḍīs per ghaṭikā (DOCUMENTED: standard siddhāntic) */
export const VINADIS_PER_GHATIKA = 60;

/** Prāṇas per vināḍī (DOCUMENTED: siddhāntic texts) */
export const PRANAS_PER_VINADI = 6;

/** Muhūrtas per day (DOCUMENTED: consistent across traditions) */
export const MUHURTAS_PER_DAY = 30;

/** Seconds per ghaṭikā */
export const SECONDS_PER_GHATIKA = SECONDS_PER_DAY / GHATIKAS_PER_DAY; // 1440

/** Seconds per vināḍī */
export const SECONDS_PER_VINADI =
  SECONDS_PER_GHATIKA / VINADIS_PER_GHATIKA; // 24

/** Seconds per prāṇa */
export const SECONDS_PER_PRANA = SECONDS_PER_VINADI / PRANAS_PER_VINADI; // 4

/** Seconds per muhūrta */
export const SECONDS_PER_MUHURTA = SECONDS_PER_DAY / MUHURTAS_PER_DAY; // 2880 = 48 min

// ─── Unit Definitions ────────────────────────────────────────────────────────

export const SIDDHANTA_UNITS: TimeUnit[] = [
  {
    id: 'truti',
    name: 'Truṭi',
    devanagari: 'त्रुटि',
    aliases: [],
    seconds: 1 / 33750, // ~29.6 μs (one common definition; varies widely by text)
    provenance: 'documented',
    source: 'Sūrya Siddhānta Ch.14; Arthaśāstra',
    notes:
      'The smallest named unit. Definitions vary enormously across texts — ' +
      'some give 1/100 second, others far smaller. Primarily theoretical/cosmological.',
  },
  {
    id: 'prana',
    name: 'Prāṇa',
    devanagari: 'प्राण',
    aliases: ['asu', 'śvāsa'],
    seconds: SECONDS_PER_PRANA, // 4
    subdivisions: { count: 10, unitId: 'guru-akshara' },
    parentRelation: { count: 6, unitId: 'vinadi' },
    provenance: 'documented',
    source: 'Siddhāntic texts; Bhāskara I commentary',
    notes: 'Literally "breath". 6 prāṇas = 1 vināḍī. 10 guru-akṣaras = 1 prāṇa.',
  },
  {
    id: 'vinadi',
    name: 'Vināḍī',
    devanagari: 'विनाडी',
    aliases: ['pala', 'vighaṭī', 'vighaṭikā'],
    seconds: SECONDS_PER_VINADI, // 24
    subdivisions: { count: 6, unitId: 'prana' },
    parentRelation: { count: 60, unitId: 'ghatika' },
    provenance: 'documented',
    source: 'Sūrya Siddhānta Ch.14; Āryabhaṭīya Kālakriyāpāda',
    notes:
      'Also called pala in some texts. The terms vināḍī, vighaṭī, and pala ' +
      'are used as equivalents across different texts and traditions.',
  },
  {
    id: 'ghatika',
    name: 'Ghaṭikā',
    devanagari: 'घटिका',
    aliases: ['nāḍikā', 'nāḍī', 'daṇḍa'],
    seconds: SECONDS_PER_GHATIKA, // 1440 = 24 minutes
    subdivisions: { count: 60, unitId: 'vinadi' },
    parentRelation: { count: 60, unitId: 'ahoratra' },
    provenance: 'documented',
    source: 'Sūrya Siddhānta Ch.14; Āryabhaṭīya Kālakriyāpāda',
    notes:
      'The primary practical time unit. Named after the water-clock vessel (ghaṭī). ' +
      'Synonymous with nāḍikā and daṇḍa.',
  },
  {
    id: 'muhurta',
    name: 'Muhūrta',
    devanagari: 'मुहूर्त',
    aliases: [],
    seconds: SECONDS_PER_MUHURTA, // 2880 = 48 minutes
    subdivisions: { count: 2, unitId: 'ghatika' },
    parentRelation: { count: 30, unitId: 'ahoratra' },
    provenance: 'documented',
    source: 'Consistent across Vedāṅga Jyotiṣa and siddhānta traditions',
    notes: '30 muhūrtas = 1 day. 1 muhūrta = 2 ghaṭikās = 48 minutes.',
  },
  {
    id: 'ahoratra',
    name: 'Ahorātra',
    devanagari: 'अहोरात्र',
    aliases: ['divasa'],
    seconds: SECONDS_PER_DAY, // 86400
    subdivisions: { count: 60, unitId: 'ghatika' },
    provenance: 'documented',
    source: 'Universal across Indian astronomical texts',
    notes: 'Day and night combined. The civil (sāvana) day.',
  },
];

/** Guru-akṣara as a calibration unit */
export const GURU_AKSHARA: TimeUnit = {
  id: 'guru-akshara',
  name: 'Guru-akṣara',
  devanagari: 'गुरु-अक्षर',
  aliases: ['heavy syllable'],
  seconds: 0.4, // 10 per prāṇa = 0.4s each
  parentRelation: { count: 10, unitId: 'prana' },
  provenance: 'documented',
  source:
    "Bhāskara I's commentary on Āryabhaṭīya Kālakriyāpāda 2; " +
    'S.R. Sarma, "Measuring Time with Long Syllables"',
  notes:
    '60 guru-akṣaras at middling speed ≈ 1 pala (24 seconds). ' +
    'Experimentally verified by R.N. Iyengar et al.',
};

// ─── Vedāṅga Jyotiṣa Convention (for comparison) ────────────────────────────

/**
 * The Vedāṅga Jyotiṣa uses a different, non-sexagesimal sub-unit system.
 * PROVENANCE: DOCUMENTED
 * SOURCE: Vedāṅga Jyotiṣa text
 */
export const VEDANGA_JYOTISHA_NOTE =
  'The Vedāṅga Jyotiṣa (~1st millennium BCE) uses a different system: ' +
  '10 mātrās = 1 kāṣṭhā, 124 kāṣṭhās = 1 kalā, ~10 kalās = 1 nāḍikā. ' +
  'The higher-level units (nāḍikā, muhūrta, day) remain consistent, but ' +
  'sub-divisions differ from the siddhāntic pala/vināḍī system.';

// ─── Day Reckoning Conventions ───────────────────────────────────────────────

export type DayReckoning = 'audayika' | 'ardharatrika';

export interface DayReckoningConvention {
  id: DayReckoning;
  name: string;
  description: string;
  epoch: string;
  provenance: ProvenanceType;
  source: string;
}

export const DAY_RECKONINGS: DayReckoningConvention[] = [
  {
    id: 'audayika',
    name: 'Audayika (Sunrise)',
    description:
      'Day begins at sunrise at the local meridian. Used by the Sūrya Siddhānta ' +
      'and most practical almanacs (pañcāṅgas).',
    epoch: 'Sunrise at Laṅkā meridian',
    provenance: 'documented',
    source: 'Sūrya Siddhānta; standard civil convention',
  },
  {
    id: 'ardharatrika',
    name: 'Ārdharātrika (Midnight)',
    description:
      'Day begins at midnight at the prime meridian of Laṅkā. Introduced by ' +
      'Āryabhaṭa in the Āryabhaṭīya. Also used by Brahmagupta (Khaṇḍakhādyaka) ' +
      'and Bhāskara I.',
    epoch: 'Midnight at Laṅkā meridian',
    provenance: 'documented',
    source: 'Āryabhaṭīya Kālakriyāpāda; Shukla & Sarma (1976)',
  },
];
