import { radToDeg, degToRad } from './utils';
import { R } from './sineTable';

/**
 * Solar Altitude Computation from Gnomon Shadow
 * 
 * tan(altitude) = gnomon_height / shadow_length
 * Rsine(altitude) = (gnomon × R) / hypotenuse
 * where hypotenuse = sqrt(gnomon² + shadow²)
 * 
 * PROVENANCE: DOCUMENTED
 * SOURCE: Sūrya Siddhānta Ch.3; standard across siddhānta texts
 * Standard gnomon height: 12 aṅgulas
 */

export const STANDARD_GNOMON_HEIGHT = 12; // aṅgulas (DOCUMENTED)

export const hypotenuse = (gnomonHeight: number, shadowLength: number): number => {
  return Math.sqrt(gnomonHeight * gnomonHeight + shadowLength * shadowLength);
};

export const solarAltitudeFromShadow = (gnomonHeight: number, shadowLength: number): number => {
  if (shadowLength === 0) return 90; // Zenith
  const radians = Math.atan2(gnomonHeight, shadowLength);
  return radToDeg(radians);
};

export const shadowLengthFromAltitude = (gnomonHeight: number, altitudeDeg: number): number => {
  if (altitudeDeg >= 90) return 0;
  if (altitudeDeg <= 0) return Infinity;
  const radians = degToRad(altitudeDeg);
  return gnomonHeight / Math.tan(radians);
};

export const solarAltitudeRsine = (gnomonHeight: number, shadowLength: number): number => {
  const hyp = hypotenuse(gnomonHeight, shadowLength);
  if (hyp === 0) return R; // Avoid division by zero, though gnomon shouldn't be 0
  return (gnomonHeight * R) / hyp;
};

export const zenithDistance = (altitudeDeg: number): number => {
  return 90 - altitudeDeg;
};

/**
 * Break down decimal aṅgula value into aṅgulas and vyaṅgulas (1 aṅgula = 60 vyaṅgulas).
 * Standard sexagesimal subdivision in Siddhānta texts.
 */
export const formatAngulas = (decimalAngulas: number): { angulas: number; vyangulas: number; formatted: string } => {
  if (!isFinite(decimalAngulas) || isNaN(decimalAngulas)) {
    return { angulas: 0, vyangulas: 0, formatted: '∞' };
  }
  const a = Math.floor(decimalAngulas);
  const v = Math.round((decimalAngulas - a) * 60);
  if (v === 60) {
    return { angulas: a + 1, vyangulas: 0, formatted: `${a + 1} aṅg` };
  }
  return { angulas: a, vyangulas: v, formatted: `${a} aṅg ${v} vyaṅ` };
};

/**
 * Mahā-Śaṅku: The great gnomon (vertical sine) on celestial sphere radius R = 3438'.
 * Mahā-Śaṅku = R * sin(h) = (12 * R) / Karṇa
 */
export const mahaShanku = (altitudeDeg: number): number => {
  const rad = degToRad(Math.max(0, Math.min(90, altitudeDeg)));
  return Math.round(R * Math.sin(rad));
};

/**
 * Mahā-Chāyā / Dṛgjyā: The horizontal sine (cosine) on celestial sphere radius R = 3438'.
 * Mahā-Chāyā = R * cos(h) = (Chāyā * R) / Karṇa
 */
export const mahaChaya = (altitudeDeg: number): number => {
  const rad = degToRad(Math.max(0, Math.min(90, altitudeDeg)));
  return Math.round(R * Math.cos(rad));
};

/**
 * Palabhā (Equinoctial midday shadow): The midday shadow length of 12-aṅgula gnomon at equinox.
 * Palabhā = 12 * tan(latitude)
 */
export const palabhaFromLatitude = (latitudeDeg: number): number => {
  const rad = degToRad(latitudeDeg);
  return 12 * Math.tan(rad);
};

