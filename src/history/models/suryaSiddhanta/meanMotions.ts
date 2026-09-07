/**
 * Mean Longitude Computation (Sūrya Siddhānta)
 * 
 * Computes mean positions of Sun, Moon, Moon's apogee, and Moon's node
 * from the ahargaṇa (elapsed civil days from Kali Yuga epoch).
 * 
 * mean_longitude = (revolutions_per_mahayuga / civil_days_per_mahayuga) × ahargana × 360°
 * Then normalize to [0, 360)
 * 
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS I.29-34, I.46-47 (Burgess)
 */

import { MEAN_DAILY_MOTION } from './constants';
import { MeanPositions } from './types';

/**
 * Normalizes an angle in degrees to [0, 360).
 */
export function normalizeDegrees(deg: number): number {
  const result = deg % 360;
  return result < 0 ? result + 360 : result;
}

/**
 * Computes the mean positions of the Sun, Moon, Moon's apogee, and Node.
 */
export function computeMeanPositions(ahargana: number): MeanPositions {
  // Mean daily motion is degrees per day
  const sunLongitude = normalizeDegrees(ahargana * MEAN_DAILY_MOTION.sun);
  const moonLongitude = normalizeDegrees(ahargana * MEAN_DAILY_MOTION.moon);
  const moonApogeeLongitude = normalizeDegrees(ahargana * MEAN_DAILY_MOTION.moonApogee);
  
  // Moon node is retrograde, its daily motion is negative.
  const moonNodeLongitude = normalizeDegrees(ahargana * MEAN_DAILY_MOTION.moonNode);

  return {
    sunLongitude,
    moonLongitude,
    moonApogeeLongitude,
    moonNodeLongitude,
    ahargana
  };
}
