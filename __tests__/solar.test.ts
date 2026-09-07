import { describe, it, expect } from 'vitest';
import {
  R,
  buildRsineTable,
  rsineDegrees,
  rcosineDegrees,
  modernSinComparison,
} from '../src/lib/solar/sineTable';
import {
  solarAltitudeFromShadow,
  shadowLengthFromAltitude,
  STANDARD_GNOMON_HEIGHT,
} from '../src/lib/solar/altitude';
import { latitudeFromEquinoxShadow } from '../src/lib/solar/latitude';

describe('Historical R=3438 Sine Table', () => {
  it('has R = 3438 (21600 / 2π)', () => {
    expect(R).toBe(3438);
  });

  it('builds table where Rsine(0) = 0 and Rsine(90°) = 3438', () => {
    const table = buildRsineTable();
    expect(table[0]).toBe(0);
    expect(table[24]).toBe(3438);
  });

  it('computes interpolated Rsines with high agreement to modern sine', () => {
    // Check 30 degrees (Rsine should be ~1719)
    const sin30 = rsineDegrees(30);
    expect(sin30).toBeCloseTo(1719, 0);

    // Modern comparison check
    const comp30 = modernSinComparison(30);
    expect(comp30.errorPercent).toBeLessThan(0.1); // error < 0.1%

    const comp45 = modernSinComparison(45);
    expect(comp45.errorPercent).toBeLessThan(0.1);

    const comp60 = modernSinComparison(60);
    expect(comp60.errorPercent).toBeLessThan(0.1);
  });

  it('verifies Pythagorean identity: Rsine² + Rcosine² ≈ R²', () => {
    for (const deg of [15, 30, 45, 60, 75]) {
      const s = rsineDegrees(deg);
      const c = rcosineDegrees(deg);
      const sumSq = s * s + c * c;
      const rSq = R * R;
      expect(Math.sqrt(sumSq)).toBeCloseTo(R, -1);
    }
  });
});

describe('Gnomon Geometry & Altitude', () => {
  it('standard gnomon height is 12 aṅgulas', () => {
    expect(STANDARD_GNOMON_HEIGHT).toBe(12);
  });

  it('when shadow = gnomon height (12), altitude is 45°', () => {
    const alt = solarAltitudeFromShadow(12, 12);
    expect(alt).toBeCloseTo(45.0, 4);
  });

  it('when Sun is at zenith (90°), shadow is 0', () => {
    const shadow = shadowLengthFromAltitude(12, 90);
    expect(shadow).toBeCloseTo(0, 4);
  });

  it('determines latitude from equinox noon shadow', () => {
    // If at 45° latitude, equinox noon shadow = gnomon height (12)
    const lat = latitudeFromEquinoxShadow(12, 12);
    expect(lat).toBeCloseTo(45.0, 4);
  });
});
