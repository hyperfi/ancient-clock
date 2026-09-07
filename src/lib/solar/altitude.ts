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
