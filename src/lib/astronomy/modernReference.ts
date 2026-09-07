/**
 * Modern Astronomical Reference Engine
 *
 * Wraps Astronomy Engine (Don Cross) to provide ground-truth ephemeris
 * calculations for positions, phases, and eclipse contact times.
 *
 * PROVENANCE: MODERN COMPARISON
 */

import {
  Observer,
  SearchLocalSolarEclipse,
  SearchGlobalSolarEclipse,
  SearchLunarEclipse,
  SunPosition,
  EclipticGeoMoon,
  MoonPhase,
  AstroTime,
  Body,
  Equator,
  Horizon,
} from 'astronomy-engine';
import { calculateDeltaT, getDeltaTUncertaintySeconds, formatDeltaTUncertainty } from './deltaT';

export interface ModernEclipseResult {
  type: 'solar' | 'lunar';
  kind: 'total' | 'partial' | 'annular' | 'penumbral' | 'none';
  peakTime: Date;
  obscuration: number;
  partialBegin?: Date;
  totalBegin?: Date;
  totalEnd?: Date;
  partialEnd?: Date;
  peakAltitudeDeg?: number;
  deltaTSeconds: number;
  deltaTUncertainty: string;
}

export interface ModernCelestialPositions {
  sunEclipticLongitude: number;
  moonEclipticLongitude: number;
  moonEclipticLatitude: number;
  elongation: number;
  phaseAngle: number;
}

/**
 * Compute modern celestial longitudes and latitudes for a given UTC date.
 */
export function getModernPositions(date: Date): ModernCelestialPositions {
  const time = new AstroTime(date);
  const sunPos = SunPosition(time);
  const moonGeo = EclipticGeoMoon(time);
  const phase = MoonPhase(date);

  let elongation = moonGeo.lon - sunPos.elon;
  if (elongation < 0) elongation += 360;

  return {
    sunEclipticLongitude: sunPos.elon,
    moonEclipticLongitude: moonGeo.lon,
    moonEclipticLatitude: moonGeo.lat,
    elongation,
    phaseAngle: phase,
  };
}

/**
 * Compute modern lunar eclipse closest to given date.
 */
export function getModernLunarEclipse(date: Date): ModernEclipseResult {
  const year = date.getUTCFullYear();
  const deltaTSeconds = calculateDeltaT(year);
  const deltaTUncertainty = formatDeltaTUncertainty(year);

  // Search starts around 15 days before the date to catch current lunation's full moon
  const searchStart = new Date(date.getTime() - 15 * 86400 * 1000);
  const eclipse = SearchLunarEclipse(searchStart);

  const peak = eclipse.peak.date;
  const sdPartialMs = eclipse.sd_partial * 60 * 1000;
  const sdTotalMs = eclipse.sd_total * 60 * 1000;

  const partialBegin = sdPartialMs > 0 ? new Date(peak.getTime() - sdPartialMs) : undefined;
  const partialEnd = sdPartialMs > 0 ? new Date(peak.getTime() + sdPartialMs) : undefined;
  const totalBegin = sdTotalMs > 0 ? new Date(peak.getTime() - sdTotalMs) : undefined;
  const totalEnd = sdTotalMs > 0 ? new Date(peak.getTime() + sdTotalMs) : undefined;

  let kind: ModernEclipseResult['kind'] = 'none';
  if (eclipse.kind === 'total') kind = 'total';
  else if (eclipse.kind === 'partial') kind = 'partial';
  else if (eclipse.kind === 'penumbral') kind = 'penumbral';

  return {
    type: 'lunar',
    kind,
    peakTime: peak,
    obscuration: eclipse.obscuration,
    partialBegin,
    totalBegin,
    totalEnd,
    partialEnd,
    deltaTSeconds,
    deltaTUncertainty,
  };
}

/**
 * Compute modern solar eclipse circumstances for an observer location.
 */
export function getModernSolarEclipse(
  date: Date,
  latDeg: number,
  lonDeg: number
): ModernEclipseResult {
  const year = date.getUTCFullYear();
  const deltaTSeconds = calculateDeltaT(year);
  const deltaTUncertainty = formatDeltaTUncertainty(year);

  const observer = new Observer(latDeg, lonDeg, 0);
  const searchStart = new Date(date.getTime() - 15 * 86400 * 1000);

  try {
    const loc = SearchLocalSolarEclipse(searchStart, observer);
    let kind: ModernEclipseResult['kind'] = 'none';
    if (loc.kind === 'total') kind = 'total';
    else if (loc.kind === 'partial') kind = 'partial';
    else if (loc.kind === 'annular') kind = 'annular';

    return {
      type: 'solar',
      kind,
      peakTime: loc.peak.time.date,
      obscuration: loc.obscuration,
      partialBegin: loc.partial_begin?.time.date,
      totalBegin: loc.total_begin?.time.date,
      totalEnd: loc.total_end?.time.date,
      partialEnd: loc.partial_end?.time.date,
      peakAltitudeDeg: loc.peak.altitude,
      deltaTSeconds,
      deltaTUncertainty,
    };
  } catch {
    // Fall back to global search if no local eclipse is visible
    const global = SearchGlobalSolarEclipse(searchStart);
    let kind: ModernEclipseResult['kind'] = 'none';
    if (global.kind === 'total') kind = 'total';
    else if (global.kind === 'partial') kind = 'partial';
    else if (global.kind === 'annular') kind = 'annular';

    return {
      type: 'solar',
      kind,
      peakTime: global.peak.date,
      obscuration: global.obscuration ?? (kind === 'total' ? 1 : 0.5),
      deltaTSeconds,
      deltaTUncertainty,
    };
  }
}
