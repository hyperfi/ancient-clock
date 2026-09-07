/**
 * ΔT (Delta T) Models and Uncertainty Calculation
 *
 * ΔT = TT − UT1
 * where TT (Terrestrial Time) is uniform atomic time and UT1 is Earth-rotation time.
 *
 * References:
 * - Stephenson, F.R., Morrison, L.V., Hohenkerk, C.Y. (2016).
 *   "Measurement of the Earth's rotation: 720 BC to AD 2015."
 * - Espenak, F. and Meeus, J. (2006). "Five Millennium Canon of Solar Eclipses."
 *
 * PROVENANCE: MODERN COMPARISON
 */

/**
 * Approximate polynomial for ΔT in seconds given Gregorian year.
 * Based on Espenak & Meeus (2006) piece-wise polynomials.
 */
export function calculateDeltaT(year: number): number {
  const y = year;
  let t: number;

  if (y < -500) {
    const u = (y - 1820) / 100;
    return -20 + 32 * u * u;
  } else if (y < 500) {
    const u = y / 100;
    return (
      10583.6 -
      1014.41 * u +
      33.78311 * u * u -
      5.952053 * Math.pow(u, 3) -
      0.1798452 * Math.pow(u, 4) +
      0.022174192 * Math.pow(u, 5) +
      0.0090316521 * Math.pow(u, 6)
    );
  } else if (y < 1600) {
    t = (y - 1000) / 100;
    return (
      1574.2 -
      556.01 * t +
      71.23472 * t * t +
      0.319781 * Math.pow(t, 3) -
      0.8503463 * Math.pow(t, 4) -
      0.005050998 * Math.pow(t, 5) +
      0.0083572073 * Math.pow(t, 6)
    );
  } else if (y < 1800) {
    t = y - 1600;
    return (
      120 -
      0.9808 * t -
      0.01532 * t * t +
      Math.pow(t, 3) / 7129
    );
  } else if (y < 1900) {
    t = y - 1800;
    return (
      8.83 +
      0.1603 * t -
      0.0059285 * t * t +
      0.00013336 * Math.pow(t, 3) -
      Math.pow(t, 4) / 1174000
    );
  } else if (y < 2000) {
    t = y - 1900;
    return (
      -2.79 +
      1.494119 * t -
      0.0598939 * t * t +
      0.0061966 * Math.pow(t, 3) -
      0.000197 * Math.pow(t, 4)
    );
  } else {
    t = y - 2000;
    return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * Math.pow(t, 3);
  }
}

/**
 * Returns estimated ± uncertainty of ΔT in seconds for an epoch.
 *
 * For ancient dates, this can range from several minutes to hours.
 */
export function getDeltaTUncertaintySeconds(year: number): number {
  if (year >= 2000) return 0.1;
  if (year >= 1900) return 1.0;
  if (year >= 1800) return 10.0;
  if (year >= 1600) return 60.0;      // ~1 minute
  if (year >= 1000) return 600.0;     // ~10 minutes
  if (year >= 500) return 1500.0;     // ~25 minutes
  if (year >= 0) return 3600.0;       // ~1 hour
  if (year >= -500) return 7200.0;    // ~2 hours
  return 18000.0;                     // ~5 hours
}

/**
 * Format uncertainty into human readable string.
 */
export function formatDeltaTUncertainty(year: number): string {
  const unc = getDeltaTUncertaintySeconds(year);
  if (unc < 60) {
    return `±${unc.toFixed(1)}s`;
  }
  const minutes = unc / 60;
  if (minutes < 60) {
    return `±${Math.round(minutes)} min`;
  }
  const hours = minutes / 60;
  return `±${hours.toFixed(1)} hr`;
}
