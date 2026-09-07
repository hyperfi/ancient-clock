/**
 * Time Conversion Functions
 *
 * Converts between modern (HH:MM:SS) time and traditional Indian time units
 * (ghaṭikā, vināḍī, prāṇa) under different day-reckoning conventions.
 *
 * PROVENANCE: DOCUMENTED (unit relationships)
 * ENGINEERING RECONSTRUCTION (conversion implementation)
 */

import {
  SECONDS_PER_DAY,
  SECONDS_PER_GHATIKA,
  SECONDS_PER_VINADI,
  SECONDS_PER_PRANA,
  SECONDS_PER_MUHURTA,
  SECONDS_PER_GURU_AKSHARA,
  GURU_AKSHARAS_PER_VINADI,
  GURU_AKSHARAS_PER_GHATIKA,
  SECONDS_PER_NADIKA,
  SECONDS_PER_KALA,
  SECONDS_PER_KASTHA,
  SECONDS_PER_MATRA,
  GHATIKAS_PER_DAY,
  VINADIS_PER_GHATIKA,
  PRANAS_PER_VINADI,
  type DayReckoning,
} from './units';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Modern time as hours, minutes, seconds since midnight */
export interface ModernTime {
  hours: number;
  minutes: number;
  seconds: number;
}

/** Traditional Indian time */
export interface TraditionalTime {
  ghatikas: number;
  vinadis: number;
  pranas: number;
  /** Fractional prāṇas (sub-prāṇa precision) */
  fractionalPranas: number;
}

/** Full time representation with both systems */
export interface DualTime {
  modern: ModernTime;
  traditional: TraditionalTime;
  /** Total seconds from midnight (or sunrise, depending on convention) */
  totalSeconds: number;
  /** Day reckoning convention used */
  dayReckoning: DayReckoning;
}

// ─── Conversion Functions ────────────────────────────────────────────────────

/**
 * Convert modern time (HH:MM:SS from midnight) to total seconds from midnight.
 */
export function modernTimeToSeconds(time: ModernTime): number {
  return time.hours * 3600 + time.minutes * 60 + time.seconds;
}

/**
 * Convert total seconds from midnight to modern time.
 */
export function secondsToModernTime(totalSeconds: number): ModernTime {
  const s = ((totalSeconds % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { hours, minutes, seconds };
}

/**
 * Convert total seconds from the day-start to traditional time.
 *
 * The input seconds are measured from the start of the traditional day
 * (sunrise for audayika, midnight for ardharātrika).
 */
export function secondsToTraditionalTime(totalSeconds: number): TraditionalTime {
  const s = ((totalSeconds % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;

  const ghatikas = Math.floor(s / SECONDS_PER_GHATIKA);
  const remainderAfterGhatikas = s - ghatikas * SECONDS_PER_GHATIKA;

  const vinadis = Math.floor(remainderAfterGhatikas / SECONDS_PER_VINADI);
  const remainderAfterVinadis =
    remainderAfterGhatikas - vinadis * SECONDS_PER_VINADI;

  const pranas = Math.floor(remainderAfterVinadis / SECONDS_PER_PRANA);
  const fractionalPranas =
    (remainderAfterVinadis - pranas * SECONDS_PER_PRANA) / SECONDS_PER_PRANA;

  return { ghatikas, vinadis, pranas, fractionalPranas };
}

/**
 * Convert traditional time to total seconds from day-start.
 */
export function traditionalTimeToSeconds(time: TraditionalTime): number {
  return (
    time.ghatikas * SECONDS_PER_GHATIKA +
    time.vinadis * SECONDS_PER_VINADI +
    (time.pranas + time.fractionalPranas) * SECONDS_PER_PRANA
  );
}

/**
 * Convert modern clock time to traditional time, accounting for day reckoning.
 *
 * @param modern - Modern time (HH:MM:SS from midnight)
 * @param dayReckoning - 'audayika' (sunrise) or 'ardharatrika' (midnight)
 * @param sunriseSeconds - Seconds after midnight when sunrise occurs (needed for audayika)
 */
export function modernToTraditional(
  modern: ModernTime,
  dayReckoning: DayReckoning = 'ardharatrika',
  sunriseSeconds: number = 6 * 3600, // default: 06:00 sunrise
): DualTime {
  const midnightSeconds = modernTimeToSeconds(modern);

  let dayStartSeconds: number;
  if (dayReckoning === 'ardharatrika') {
    // Midnight system: seconds from midnight = midnightSeconds directly
    dayStartSeconds = midnightSeconds;
  } else {
    // Sunrise system: seconds from sunrise
    dayStartSeconds = midnightSeconds - sunriseSeconds;
    if (dayStartSeconds < 0) {
      dayStartSeconds += SECONDS_PER_DAY;
    }
  }

  return {
    modern,
    traditional: secondsToTraditionalTime(dayStartSeconds),
    totalSeconds: dayStartSeconds,
    dayReckoning,
  };
}

/**
 * Convert traditional time to modern clock time.
 */
export function traditionalToModern(
  traditional: TraditionalTime,
  dayReckoning: DayReckoning = 'ardharatrika',
  sunriseSeconds: number = 6 * 3600,
): DualTime {
  const dayStartSeconds = traditionalTimeToSeconds(traditional);

  let midnightSeconds: number;
  if (dayReckoning === 'ardharatrika') {
    midnightSeconds = dayStartSeconds;
  } else {
    midnightSeconds = dayStartSeconds + sunriseSeconds;
    if (midnightSeconds >= SECONDS_PER_DAY) {
      midnightSeconds -= SECONDS_PER_DAY;
    }
  }

  return {
    modern: secondsToModernTime(midnightSeconds),
    traditional,
    totalSeconds: dayStartSeconds,
    dayReckoning,
  };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format modern time as HH:MM:SS
 */
export function formatModernTime(time: ModernTime): string {
  const h = String(Math.floor(time.hours)).padStart(2, '0');
  const m = String(Math.floor(time.minutes)).padStart(2, '0');
  const s = String(Math.floor(time.seconds)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Format traditional time as "GG ghaṭikā · VV vināḍī · PP prāṇa"
 */
export function formatTraditionalTime(
  time: TraditionalTime,
  options: { includeLabels?: boolean; includeDevanagari?: boolean } = {},
): string {
  const { includeLabels = true, includeDevanagari = false } = options;
  const g = Math.floor(time.ghatikas);
  const v = Math.floor(time.vinadis);
  const p = Math.floor(time.pranas);

  if (includeLabels) {
    const gLabel = includeDevanagari ? 'घटिका' : 'ghaṭikā';
    const vLabel = includeDevanagari ? 'विनाडी' : 'vināḍī';
    const pLabel = includeDevanagari ? 'प्राण' : 'prāṇa';
    return `${g} ${gLabel} · ${v} ${vLabel} · ${p} ${pLabel}`;
  }

  return `${g}:${String(v).padStart(2, '0')}:${String(p).padStart(2, '0')}`;
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Verify fundamental time unit relationships.
 * Returns true if all relationships hold.
 * Used in unit tests.
 */
export function verifyUnitRelationships(): boolean {
  const checks = [
    // 60 ghaṭikās = 1 day
    Math.abs(GHATIKAS_PER_DAY * SECONDS_PER_GHATIKA - SECONDS_PER_DAY) < 0.001,
    // 60 vināḍīs = 1 ghaṭikā
    Math.abs(VINADIS_PER_GHATIKA * SECONDS_PER_VINADI - SECONDS_PER_GHATIKA) < 0.001,
    // 6 prāṇas = 1 vināḍī
    Math.abs(PRANAS_PER_VINADI * SECONDS_PER_PRANA - SECONDS_PER_VINADI) < 0.001,
    // 1 ghaṭikā = 24 minutes = 1440 seconds
    Math.abs(SECONDS_PER_GHATIKA - 1440) < 0.001,
    // 1 vināḍī = 24 seconds
    Math.abs(SECONDS_PER_VINADI - 24) < 0.001,
    // 1 prāṇa = 4 seconds
    Math.abs(SECONDS_PER_PRANA - 4) < 0.001,
  ];

  return checks.every(Boolean);
}

// ─── Vedāṅga Jyotiṣa Conversions ────────────────────────────────────────────

export interface VedangaTime {
  /** Muhūrtas elapsed in the day (0 to 29) */
  muhurtas: number;
  /** Nāḍikās elapsed in the day (0 to 59) */
  nadikas: number;
  /** Kalās elapsed in the current nāḍikā (0 to 9) */
  kalas: number;
  /** Kāṣṭhās elapsed in the current kalā (0 to 123) */
  kasthas: number;
  /** Mātrās elapsed in the current kāṣṭhā (0 to 9) */
  matras: number;
}

/**
 * Convert total seconds from day-start to Vedāṅga Jyotiṣa time units.
 */
export function secondsToVedangaTime(totalSeconds: number): VedangaTime {
  const s = ((totalSeconds % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;

  const nadikas = Math.floor(s / SECONDS_PER_NADIKA);
  const remainderNadika = s - nadikas * SECONDS_PER_NADIKA;

  const muhurtas = Math.floor(s / SECONDS_PER_MUHURTA);

  const kalas = Math.floor(remainderNadika / SECONDS_PER_KALA);
  const remainderKala = remainderNadika - kalas * SECONDS_PER_KALA;

  const kasthas = Math.floor(remainderKala / SECONDS_PER_KASTHA);
  const remainderKastha = remainderKala - kasthas * SECONDS_PER_KASTHA;

  const matras = Math.floor(remainderKastha / SECONDS_PER_MATRA);

  return { muhurtas, nadikas, kalas, kasthas, matras };
}

/**
 * Convert Vedāṅga Jyotiṣa time units to total seconds from day-start.
 */
export function vedangaTimeToSeconds(time: {
  nadikas: number;
  kalas: number;
  kasthas: number;
  matras?: number;
}): number {
  return (
    time.nadikas * SECONDS_PER_NADIKA +
    time.kalas * SECONDS_PER_KALA +
    time.kasthas * SECONDS_PER_KASTHA +
    (time.matras || 0) * SECONDS_PER_MATRA
  );
}

/**
 * Format Vedāṅga Jyotiṣa time as string
 */
export function formatVedangaTime(time: VedangaTime): string {
  return `${time.nadikas} nāḍikā · ${time.kalas} kalā · ${time.kasthas} kāṣṭhā`;
}

// ─── Gurvakṣara Acoustic Cadence ────────────────────────────────────────────

export interface GurvaksharaBreakdown {
  /** Gurvakṣaras in the current prāṇa (0 to 9, 0.4s each) */
  inPrana: number;
  /** Gurvakṣaras in the current vināḍī (0 to 59, 24s total) */
  inVinadi: number;
  /** Gurvakṣaras in the current ghaṭikā (0 to 3599, 24m total) */
  inGhatika: number;
  /** Total gurvakṣaras elapsed in the day (0 to 215999) */
  totalInDay: number;
  /** Fraction (0 to 1) of the current 400ms syllable cycle */
  syllableProgress: number;
}

/**
 * Calculate gurvakṣara counts from total seconds.
 */
export function secondsToGurvaksharas(totalSeconds: number): GurvaksharaBreakdown {
  const s = ((totalSeconds % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  const inGhatikaSeconds = s % SECONDS_PER_GHATIKA;
  const inVinadiSeconds = inGhatikaSeconds % SECONDS_PER_VINADI;
  const inPranaSeconds = inVinadiSeconds % SECONDS_PER_PRANA;

  const inPrana = Math.min(9, Math.floor(inPranaSeconds / SECONDS_PER_GURU_AKSHARA));
  const inVinadi = Math.min(59, Math.floor(inVinadiSeconds / SECONDS_PER_GURU_AKSHARA));
  const inGhatika = Math.min(3599, Math.floor(inGhatikaSeconds / SECONDS_PER_GURU_AKSHARA));
  const totalInDay = Math.min(215999, Math.floor(s / SECONDS_PER_GURU_AKSHARA));
  const syllableProgress = (inPranaSeconds % SECONDS_PER_GURU_AKSHARA) / SECONDS_PER_GURU_AKSHARA;

  return { inPrana, inVinadi, inGhatika, totalInDay, syllableProgress };
}
