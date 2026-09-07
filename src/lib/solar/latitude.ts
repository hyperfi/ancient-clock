import { radToDeg, degToRad } from './utils';

/**
 * Latitude Determination from Gnomon Shadow
 * 
 * At the equinox (solar declination ≈ 0):
 *   latitude = arctan(noon_shadow / gnomon_height)
 * 
 * General case:
 *   latitude = zenith_distance ± solar_declination
 *   where zenith_distance = arctan(shadow / gnomon)
 *   sign depends on whether Sun is north or south of zenith
 * 
 * PROVENANCE: DOCUMENTED  
 * SOURCE: Sūrya Siddhānta Ch.3
 */

export const latitudeFromEquinoxShadow = (gnomonHeight: number, noonShadowLength: number): number => {
  const latRad = Math.atan2(noonShadowLength, gnomonHeight);
  return radToDeg(latRad);
};

export const latitudeFromNoonShadow = (gnomonHeight: number, noonShadowLength: number, solarDeclinationDeg: number, shadowPointsNorth: boolean = true): number => {
  const zenithDistanceRad = Math.atan2(noonShadowLength, gnomonHeight);
  const zenithDistanceDeg = radToDeg(zenithDistanceRad);
  
  // If shadow points North, Sun is South of zenith: lat = ZD + declination
  // If shadow points South, Sun is North of zenith: lat = declination - ZD
  if (shadowPointsNorth) {
    return zenithDistanceDeg + solarDeclinationDeg;
  } else {
    return solarDeclinationDeg - zenithDistanceDeg;
  }
};

export const solarDeclinationApprox = (dayOfYear: number): number => {
  // Use the standard formula: decl = 23.44 * sin(2π * (284 + dayOfYear) / 365)
  return 23.44 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365);
};

export const evaluateLatitudeError = (estimated: number, actual: number): { error: number, errorKm: number } => {
  const error = Math.abs(estimated - actual);
  const errorKm = error * 111.32; // 1 degree latitude ≈ 111.32 km
  return { error, errorKm };
};
