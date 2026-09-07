import { radToDeg, degToRad } from './utils';
import { solarAltitudeFromShadow, shadowLengthFromAltitude } from './altitude';

/**
 * Time Determination from Shadow Length (Iṣṭa Shadow)
 * 
 * Given current shadow length, compute time of day.
 * Historical method:
 * 1. From shadow, compute solar altitude
 * 2. From altitude, latitude, and declination, compute hour angle
 * 3. Convert hour angle to ghaṭikās from noon
 * 
 * PROVENANCE: DOCUMENTED (concept), ENGINEERING RECONSTRUCTION (implementation)
 * SOURCE: Sūrya Siddhānta Ch.3 (iṣṭa shadow computations)
 */

export const hourAngleFromAltitude = (altitudeDeg: number, latitudeDeg: number, declinationDeg: number): number => {
  const altRad = degToRad(altitudeDeg);
  const latRad = degToRad(latitudeDeg);
  const decRad = degToRad(declinationDeg);

  const sinAlt = Math.sin(altRad);
  const sinLat = Math.sin(latRad);
  const sinDec = Math.sin(decRad);
  const cosLat = Math.cos(latRad);
  const cosDec = Math.cos(decRad);

  const cosH = (sinAlt - sinLat * sinDec) / (cosLat * cosDec);
  
  // Constrain to valid domain [-1, 1] due to atmospheric refraction / float inaccuracies at bounds
  const clampedCosH = Math.max(-1, Math.min(1, cosH));
  
  const hRad = Math.acos(clampedCosH);
  return radToDeg(hRad);
};

export const timeFromShadow = (gnomonHeight: number, shadowLength: number, latitudeDeg: number, declinationDeg: number, isAfternoon: boolean): { ghatikas: number, vinadis: number, modernHours: number } => {
  const altDeg = solarAltitudeFromShadow(gnomonHeight, shadowLength);
  const hourAngleDeg = hourAngleFromAltitude(altDeg, latitudeDeg, declinationDeg);

  // Hour angle is degrees from noon. 15 degrees = 1 hour.
  const hoursFromNoon = hourAngleDeg / 15;
  const modernHours = isAfternoon ? 12 + hoursFromNoon : 12 - hoursFromNoon;

  // 360 degrees = 60 ghatikas -> 1 degree = 60/360 = 1/6 ghatika
  const ghatikasFromNoon = hourAngleDeg / 6;
  const totalGhatikas = isAfternoon ? 30 + ghatikasFromNoon : 30 - ghatikasFromNoon;
  
  const ghatikas = Math.floor(totalGhatikas);
  const vinadis = (totalGhatikas - ghatikas) * 60;

  return { ghatikas, vinadis, modernHours };
};

export const shadowFromTime = (gnomonHeight: number, hourAngleDeg: number, latitudeDeg: number, declinationDeg: number): number => {
  const hRad = degToRad(hourAngleDeg);
  const latRad = degToRad(latitudeDeg);
  const decRad = degToRad(declinationDeg);

  // sin(alt) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(H)
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad);
  
  // Constrain sinAlt
  const clampedSinAlt = Math.max(-1, Math.min(1, sinAlt));
  const altRad = Math.asin(clampedSinAlt);
  const altDeg = radToDeg(altRad);

  return shadowLengthFromAltitude(gnomonHeight, altDeg);
};
