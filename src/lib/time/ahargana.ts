/**
 * Ahargaṇa Computation
 *
 * Computes the "heap of days" — the total elapsed civil (sāvana) days
 * from the Kali Yuga epoch to a given date. This is the foundational
 * calculation for all siddhāntic astronomical computations.
 *
 * PROVENANCE: DOCUMENTED (concept and method)
 * SOURCE: Āryabhaṭīya Kālakriyāpāda; Sūrya Siddhānta
 */

/**
 * Kali Yuga epoch in Julian Day Number.
 *
 * The Kali Yuga epoch corresponds to:
 * - February 18, 3102 BCE (Julian calendar) at sunrise for audayika
 * - February 17/18, 3102 BCE at midnight for ardharātrika
 *
 * Julian Day Number for midnight starting Feb 17, 3102 BCE (Julian):
 * JD = 588465.5 (midnight) or JD = 588466.0 (noon)
 *
 * PROVENANCE: DOCUMENTED
 * SOURCE: Standard astronomical computation; confirmed in Āryabhaṭīya and SS
 * NOTE: This is a computed/extrapolated epoch, not a historical event.
 * At this epoch, all planets were ASSUMED to be in mean conjunction at 0° Aries.
 */
export const KALI_YUGA_JD_MIDNIGHT = 588465.5;
export const KALI_YUGA_JD_SUNRISE = 588465.75; // approx 6am = +0.25

/**
 * Convert a Gregorian date to Julian Day Number (JD).
 *
 * Uses the standard astronomical algorithm (Meeus, Astronomical Algorithms).
 * Valid for all dates in the Gregorian calendar.
 *
 * PROVENANCE: MODERN COMPARISON (standard astronomical algorithm)
 */
export function gregorianToJD(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
): number {
  // Handle BCE dates: year 1 BCE = year 0 in astronomical convention
  let y = year;
  let m = month;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  // Gregorian calendar correction
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  const dayFraction = (hour + minute / 60 + second / 3600) / 24;

  const JD =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    dayFraction +
    B -
    1524.5;

  return JD;
}

/**
 * Convert a Julian calendar date to Julian Day Number.
 * Used for dates before the Gregorian reform (October 15, 1582).
 *
 * PROVENANCE: MODERN COMPARISON
 */
export function julianCalendarToJD(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
): number {
  let y = year;
  let m = month;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const dayFraction = (hour + minute / 60 + second / 3600) / 24;

  // No Gregorian correction (B=0) for Julian calendar
  const JD =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    dayFraction -
    1524.5;

  return JD;
}

/**
 * Convert Julian Day Number to Gregorian date.
 *
 * PROVENANCE: MODERN COMPARISON
 */
export function jdToGregorian(jd: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const JD = jd + 0.5;
  const Z = Math.floor(JD);
  const F = JD - Z;

  let A: number;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  const totalHours = F * 24;
  const hour = Math.floor(totalHours);
  const totalMinutes = (totalHours - hour) * 60;
  const minute = Math.floor(totalMinutes);
  const second = Math.round((totalMinutes - minute) * 60);

  return { year, month, day, hour, minute, second };
}

/**
 * Compute the Ahargaṇa — total elapsed civil days from the Kali Yuga epoch.
 *
 * This is the fundamental input for all siddhāntic mean longitude computations:
 *   mean_longitude = (revolutions_per_mahayuga / days_per_mahayuga) × ahargana
 *
 * @param year - Gregorian year (negative for BCE: -3101 = 3102 BCE)
 * @param month - Month (1-12)
 * @param day - Day of month
 * @param dayReckoning - 'audayika' (sunrise) or 'ardharatrika' (midnight)
 * @returns Ahargaṇa (may be fractional for sub-day precision)
 *
 * PROVENANCE: DOCUMENTED (concept), ENGINEERING RECONSTRUCTION (implementation)
 * SOURCE: Āryabhaṭīya Kālakriyāpāda; Sūrya Siddhānta
 */
export function computeAhargana(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
  dayReckoning: 'audayika' | 'ardharatrika' = 'audayika',
): number {
  const jd = gregorianToJD(year, month, day, hour, minute, second);
  const epochJD =
    dayReckoning === 'ardharatrika'
      ? KALI_YUGA_JD_MIDNIGHT
      : KALI_YUGA_JD_SUNRISE;

  return jd - epochJD;
}

/**
 * Verify the Kali Yuga epoch correspondence.
 * The epoch should correspond to Feb 17/18, 3102 BCE.
 *
 * In astronomical year numbering: 3102 BCE = year -3101
 *
 * USED IN TESTS
 */
export function verifyEpoch(): boolean {
  // Feb 18, 3102 BCE at midnight in Julian calendar
  // Astronomical year -3101, month 2, day 18
  const jd = julianCalendarToJD(-3101, 2, 18, 0, 0, 0);
  // Should be close to our epoch JD
  return Math.abs(jd - KALI_YUGA_JD_MIDNIGHT) < 1;
}
