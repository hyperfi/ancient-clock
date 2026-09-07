/**
 * Equation of Centre (Manda Correction)
 * 
 * The SS uses an epicyclic model to convert mean longitudes to true longitudes.
 * The correction depends on the anomaly (mean longitude - apogee longitude).
 * 
 * PROVENANCE: DOCUMENTED  
 * SOURCE: SS II.34-39 (Burgess)
 */

import { SINUS_TOTUS } from './constants';
import { ssRsine, ssInverseRsine } from './sineTable';

/**
 * Returns the equation of centre (manda correction) in degrees.
 * anomaly = meanLongitude - apogeeLongitude
 * equation = arcsin(sin(anomaly) × maxEquation_factor)
 */
export function mandaCorrection(meanLongitude: number, apogeeLongitude: number, maxEquation: number): number {
  const anomaly = meanLongitude - apogeeLongitude;
  const rsineAnomaly = ssRsine(anomaly);
  
  // Rsine(correction) = (Rsine(anomaly) * Rsine(maxEquation)) / R
  const rsineMaxEq = ssRsine(maxEquation);
  const rsineCorrection = (rsineAnomaly * rsineMaxEq) / SINUS_TOTUS;
  
  return ssInverseRsine(rsineCorrection);
}

/**
 * Computes true longitude by applying the manda correction.
 */
export function trueLongitude(meanLongitude: number, apogeeLongitude: number, maxEquation: number): number {
  const correction = mandaCorrection(meanLongitude, apogeeLongitude, maxEquation);
  let trueLong = (meanLongitude + correction) % 360;
  if (trueLong < 0) trueLong += 360;
  return trueLong;
}
