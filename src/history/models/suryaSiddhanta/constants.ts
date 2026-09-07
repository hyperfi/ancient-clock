/**
 * Sūrya Siddhānta Astronomical Constants
 *
 * Every constant includes value, units, provenance, and source reference.
 * These are the computational parameters for the SS eclipse algorithm.
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: Sūrya Siddhānta (Burgess translation, 1860; ~800 CE recension)
 *
 * IMPORTANT: The surviving text dates to approximately 800 CE and has undergone
 * multiple revisions. These constants reflect the extant recension, not an
 * "original" or "ancient" version. See docs/HISTORICAL_SCOPE.md.
 */

// ─── Fundamental Period ──────────────────────────────────────────────────────

/**
 * Mahāyuga: the great astronomical cycle.
 *
 * All mean motions are defined as integer revolution counts within one mahāyuga.
 * 1 Mahāyuga = 4,320,000 solar years
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS I.15-29 (Burgess); consistent across siddhāntic texts
 */
export const MAHAYUGA_SOLAR_YEARS = 4_320_000;

// ─── Revolution Counts per Mahāyuga ─────────────────────────────────────────

/**
 * Number of revolutions of each body in one mahāyuga.
 *
 * From these, mean daily motion is computed as:
 *   mean_daily_motion = (revolutions / civil_days_per_mahayuga) * 360°
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS I.29-34 (Burgess)
 * NOTE: Some values differ between SS recensions and other siddhāntas
 */
export const SS_REVOLUTIONS = {
  /** Sun revolutions per mahāyuga (by definition = solar years) */
  sun: {
    value: 4_320_000,
    source: 'SS I.29',
    provenance: 'documented' as const,
    notes: 'Equal to mahāyuga years by definition',
  },
  /** Moon revolutions per mahāyuga */
  moon: {
    value: 57_753_336,
    source: 'SS I.29',
    provenance: 'documented' as const,
    notes: 'Gives sidereal month ≈ 27.32167 days (modern: 27.32166 days)',
  },
  /** Moon's apogee (mandocca) revolutions per mahāyuga */
  moonApogee: {
    value: 488_219,
    source: 'SS I.30',
    provenance: 'documented' as const,
    notes: 'Anomalistic month period. Retrograde correction applied.',
  },
  /** Moon's ascending node (Rāhu) revolutions per mahāyuga (RETROGRADE) */
  moonNode: {
    value: -232_226, // negative = retrograde
    source: 'SS I.30',
    provenance: 'documented' as const,
    notes:
      'Retrograde motion. Completes cycle in ~18.6 years. ' +
      'Sign convention: negative indicates westward (retrograde) motion.',
  },
} as const;

// ─── Civil Days per Mahāyuga ─────────────────────────────────────────────────

/**
 * Total civil (sāvana) days in one mahāyuga.
 *
 * This is computed from: solar_years × (days/year)
 * SS gives: 1,577,917,828 civil days per mahāyuga
 *
 * Modern sidereal year ≈ 365.25636 days
 * SS implied year ≈ 1,577,917,828 / 4,320,000 ≈ 365.25876 days
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS I.33 (Burgess)
 */
export const CIVIL_DAYS_PER_MAHAYUGA = 1_577_917_828;

// ─── Derived Mean Daily Motions (degrees per civil day) ──────────────────────

/**
 * Compute mean daily motion in degrees.
 *
 * mean_daily_motion = (revolutions / civil_days_per_mahayuga) × 360
 */
function meanDailyMotion(revolutions: number): number {
  return (revolutions / CIVIL_DAYS_PER_MAHAYUGA) * 360;
}

export const MEAN_DAILY_MOTION = {
  /** Sun: ~0.9856° per day (modern: 0.9856°) */
  sun: meanDailyMotion(SS_REVOLUTIONS.sun.value),
  /** Moon: ~13.1764° per day (modern: 13.1764°) */
  moon: meanDailyMotion(SS_REVOLUTIONS.moon.value),
  /** Moon's apogee: ~0.1114° per day */
  moonApogee: meanDailyMotion(SS_REVOLUTIONS.moonApogee.value),
  /** Moon's ascending node: retrograde ~-0.0530° per day */
  moonNode: meanDailyMotion(SS_REVOLUTIONS.moonNode.value),
} as const;

// ─── Trigonometric Radius ────────────────────────────────────────────────────

/**
 * Sinus totus: the trigonometric radius.
 *
 * R = 21600 / (2π) ≈ 3438
 * where 21600 = 360° × 60' (total arc-minutes in a circle)
 *
 * This means Rsine values can be directly interpreted as arc-minutes.
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS II.2-6 (Burgess); Āryabhaṭīya Gītikāpāda
 */
export const SINUS_TOTUS = 3438;

// ─── Epicycle Sizes ──────────────────────────────────────────────────────────

/**
 * Maximum equation of centre (manda correction).
 *
 * The epicycle model produces an equation of centre that oscillates.
 * Maximum values are the epicycle circumferences in degrees at specific zodiac points.
 *
 * SS gives varying epicycle sizes at different points (odd vs even quadrants).
 * These are the commonly used maximum values.
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS II.34-39 (Burgess)
 * NOTE: These may vary between SS recensions
 */
export const MAX_EQUATION = {
  sun: {
    maxDegrees: 2.167, // ~2°10' (epicycle circumference 14°/360 × circumference)
    source: 'SS II.34-39',
    provenance: 'documented' as const,
    notes: 'Modern: ~1.915°. SS value is ~13% larger.',
  },
  moon: {
    maxDegrees: 5.0, // ~5°0' (epicycle circumference 32°/360 × circumference)
    source: 'SS II.34-39',
    provenance: 'documented' as const,
    notes: 'Modern: ~6.29°. This is the principal inequality (evection not modeled).',
  },
} as const;

// ─── Obliquity of the Ecliptic ───────────────────────────────────────────────

/**
 * Maximum declination of the Sun (obliquity of the ecliptic).
 *
 * SS gives 24° (some readings 23°40').
 * Modern value (J2000): 23°26'21" ≈ 23.439°
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS II.28 (Burgess)
 */
export const OBLIQUITY_DEGREES = 24.0;

// ─── Moon's Maximum Latitude ─────────────────────────────────────────────────

/**
 * Maximum latitude of the Moon from the ecliptic.
 *
 * SS gives values around 4.5° to 5°.
 * Modern value: ~5.145°
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS II.6-7 (Burgess)
 * NOTE: Exact value varies by reading/recension
 */
export const MOON_MAX_LATITUDE_DEGREES = 4.5;

// ─── Apparent Diameters ──────────────────────────────────────────────────────

/**
 * Angular diameters used in eclipse computation.
 *
 * SS computes apparent diameters from daily motion:
 *   Sun diameter (arc-min) ≈ daily_motion × factor
 *   Moon diameter (arc-min) ≈ daily_motion × factor
 *
 * The actual formulae use proportionality with orbital speed
 * (faster daily motion = closer = larger apparent size).
 *
 * Mean apparent diameters:
 *   Sun: ~32' (modern: ~32')
 *   Moon: ~32' at mean distance (modern: ~31.5')
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS IV.1-9 (Burgess, Chapter on Eclipses)
 * NOTE: SS uses a linear interpolation based on daily motion
 */
export const APPARENT_DIAMETER = {
  /** Sun mean apparent diameter in arc-minutes */
  sunMean: 32.0,
  /** Moon mean apparent diameter in arc-minutes */
  moonMean: 32.0,
  /**
   * To compute actual apparent diameter from daily motion:
   * apparent_diameter = mean_diameter × (actual_daily_motion / mean_daily_motion)
   */
} as const;

// ─── Earth's Shadow ──────────────────────────────────────────────────────────

/**
 * Earth's shadow parameters for lunar eclipse computation.
 *
 * SS Ch.4 provides a method to compute the angular radius of Earth's
 * shadow cone at the Moon's distance.
 *
 * The shadow angular diameter ≈ (Sun_diameter_linear - Earth_diameter_linear)
 *   projected at Moon's distance, adjusted for geometry.
 *
 * In the SS formulation:
 *   shadow_diameter_arcmin = (Earth_diameter_yojanas / Moon_distance_yojanas) × R
 *     minus Sun's apparent angular correction
 *
 * PROVENANCE: DOCUMENTED / SCHOLARLY INTERPRETATION
 * SOURCE: SS IV.4-6 (Burgess)
 */
export const EARTH_SHADOW = {
  /**
   * Earth's diameter in yojanas (SS value).
   * 1 yojana ≈ 8 miles in Burgess's interpretation.
   * SS states Earth diameter ≈ 1,600 yojanas.
   * This gives ~12,800 miles ≈ 20,600 km (modern: 12,742 km diameter)
   *
   * NOTE: The yojana-to-modern conversion is uncertain.
   * Different scholars give different equivalences.
   */
  earthDiameterYojanas: 1600,
  source: 'SS I.59, IV.1-9 (Burgess)',
  provenance: 'documented' as const,
  notes:
    'Shadow computation is one of the most complex parts of the SS eclipse algorithm. ' +
    'The exact procedure must be followed step by step from the text.',
} as const;

// ─── Epoch ───────────────────────────────────────────────────────────────────

/**
 * SS Epoch: Sunrise at Laṅkā at the start of Kali Yuga.
 *
 * At this epoch, all mean planets are assumed to be at 0° Aries.
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS I.46-47 (Burgess); widely consistent
 */
export const SS_EPOCH = {
  description: 'Sunrise at Laṅkā, start of Kali Yuga',
  julianDate: 'February 18, 3102 BCE (Julian)',
  dayReckoning: 'audayika' as const, // sunrise system
  allPlanetsAt: '0° Aries (assumed mean conjunction)',
  provenance: 'documented' as const,
  source: 'SS I.46-47',
} as const;

// ─── Utility Type ────────────────────────────────────────────────────────────

export interface ProvenancedConstant<T> {
  value: T;
  source: string;
  provenance: 'documented' | 'scholarly' | 'reconstruction' | 'modern';
  notes?: string;
}
