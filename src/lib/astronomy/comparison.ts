/**
 * Historical vs Modern Comparison Engine
 *
 * Compares Sūrya Siddhānta predictions against modern Astronomy Engine results,
 * providing a quantitative breakdown of errors and their astronomical causes.
 *
 * PROVENANCE: MODERN COMPARISON
 */

import type { LunarEclipseResult } from '@/history/models/suryaSiddhanta/types';
import type { ModernEclipseResult, ModernCelestialPositions } from './modernReference';

export interface ComparisonReport {
  isBothEclipse: boolean;
  typeMatch: boolean;
  magnitudeDiff: number;
  durationDiffMinutes?: number;
  sunLongitudeDiffDeg?: number;
  moonLongitudeDiffDeg?: number;
  apparentNodeDiffDeg?: number;
  primaryDiscrepancyReasons: string[];
}

/**
 * Compare historical SS lunar eclipse with modern computation.
 */
export function compareLunarEclipse(
  historical: LunarEclipseResult,
  modern: ModernEclipseResult,
  modernPositions?: ModernCelestialPositions
): ComparisonReport {
  const isBothEclipse = historical.isEclipse && modern.kind !== 'none';
  const typeMatch = historical.type === modern.kind;
  const magnitudeDiff = historical.magnitude - modern.obscuration;

  let durationDiffMinutes: number | undefined;
  if (historical.halfDurationGhatikas && modern.partialBegin && modern.partialEnd) {
    // Historical half duration in ghaṭikās: 1 ghaṭikā = 24 minutes
    const histTotalDurationMinutes = (historical.halfDurationGhatikas * 2) * 24;
    const modTotalDurationMinutes =
      (modern.partialEnd.getTime() - modern.partialBegin.getTime()) / (60 * 1000);
    durationDiffMinutes = histTotalDurationMinutes - modTotalDurationMinutes;
  }

  let sunLongitudeDiffDeg: number | undefined;
  let moonLongitudeDiffDeg: number | undefined;

  if (modernPositions) {
    // Note: Historical SS is roughly sidereal (Nirayana) whereas modern is tropical (Sayana)
    sunLongitudeDiffDeg = historical.sunTrueLongitude - modernPositions.sunEclipticLongitude;
    moonLongitudeDiffDeg = historical.moonTrueLongitude - modernPositions.moonEclipticLongitude;
  }

  const reasons: string[] = [];

  // Categorize historical discrepancies
  reasons.push(
    'Ayanāṁśa (Precession): The Sūrya Siddhānta measures positions along the sidereal zodiac (nirayana) tied to fixed stars, whereas modern coordinates use the moving vernal equinox (tropical).'
  );

  if (Math.abs(magnitudeDiff) > 0.1) {
    reasons.push(
      'Simplified Lunar Inequalities: The historical epicycle accounts for the principal equation of centre, but omits secondary perturbations such as evection (~1.27°) and variation (~0.66°).'
    );
  }

  if (durationDiffMinutes && Math.abs(durationDiffMinutes) > 15) {
    reasons.push(
      'Shadow Geometry & Diameters: The historical calculation assumes a mean shadow size (~40 arcminutes) and constant apparent diameters rather than dynamically varying earth-sun-moon distances.'
    );
  }

  if (modern.deltaTSeconds > 100) {
    reasons.push(
      `ΔT Earth Rotation Uncertainty: At this historical epoch, Earth's rotation rate uncertainty is ${modern.deltaTUncertainty}, introducing timing variance into modern local reconstruction.`
    );
  }

  return {
    isBothEclipse,
    typeMatch,
    magnitudeDiff,
    durationDiffMinutes,
    sunLongitudeDiffDeg,
    moonLongitudeDiffDeg,
    primaryDiscrepancyReasons: reasons,
  };
}
