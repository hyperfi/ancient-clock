/**
 * Sūrya Siddhānta Sine Table
 * Uses R=3438 and the standard 24 first-differences.
 * PROVENANCE: DOCUMENTED
 * SOURCE: SS II.2-6 (Burgess)
 */

import { SINUS_TOTUS } from './constants';

const SS_SINE_DIFFERENCES = [
  225, 224, 222, 219, 215, 210, 205, 199,
  191, 183, 174, 164, 154, 143, 131, 119,
  106, 93, 79, 65, 51, 37, 22, 7
];

const SS_SINES: number[] = [0];
let currentSine = 0;
for (const diff of SS_SINE_DIFFERENCES) {
  currentSine += diff;
  SS_SINES.push(currentSine);
}

/**
 * Returns Rsine for a given angle in degrees.
 * Uses linear interpolation between the 3.75° (225') steps.
 */
export function ssRsine(angleDeg: number): number {
  let deg = angleDeg % 360;
  if (deg < 0) deg += 360;

  let sign = 1;
  if (deg > 180) {
    sign = -1;
    deg -= 180;
  }
  if (deg > 90) {
    deg = 180 - deg;
  }

  const step = deg / 3.75;
  const index = Math.floor(step);
  const fraction = step - index;

  if (index >= 24) {
    return sign * SINUS_TOTUS;
  }

  const s1 = SS_SINES[index];
  const s2 = SS_SINES[index + 1];
  const interpolated = s1 + (s2 - s1) * fraction;

  return sign * interpolated;
}

/**
 * Returns Rcosine for a given angle in degrees.
 */
export function ssRcosine(angleDeg: number): number {
  return ssRsine(angleDeg + 90);
}

/**
 * Returns inverse Rsine (arcsine) in degrees.
 */
export function ssInverseRsine(value: number): number {
  let sign = 1;
  if (value < 0) {
    sign = -1;
    value = -value;
  }
  if (value > SINUS_TOTUS) {
    value = SINUS_TOTUS;
  }

  let index = 0;
  while (index < 24 && SS_SINES[index + 1] <= value) {
    index++;
  }

  if (index === 24) {
    return sign * 90;
  }

  const s1 = SS_SINES[index];
  const s2 = SS_SINES[index + 1];
  const fraction = (value - s1) / (s2 - s1);

  const angleDeg = (index + fraction) * 3.75;
  return sign * angleDeg;
}
