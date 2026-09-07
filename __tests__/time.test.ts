import { describe, it, expect } from 'vitest';
import {
  verifyUnitRelationships,
  modernTimeToSeconds,
  secondsToModernTime,
  secondsToTraditionalTime,
  traditionalTimeToSeconds,
  modernToTraditional,
  traditionalToModern,
} from '../src/lib/time/conversion';
import {
  SECONDS_PER_DAY,
  SECONDS_PER_GHATIKA,
  SECONDS_PER_VINADI,
  SECONDS_PER_PRANA,
} from '../src/lib/time/units';
import { computeAhargana, verifyEpoch } from '../src/lib/time/ahargana';

describe('Traditional Indian Time Conversion', () => {
  it('verifies all fundamental siddhāntic time unit ratios', () => {
    expect(verifyUnitRelationships()).toBe(true);
  });

  it('converts modern times to seconds correctly', () => {
    expect(modernTimeToSeconds({ hours: 0, minutes: 0, seconds: 0 })).toBe(0);
    expect(modernTimeToSeconds({ hours: 12, minutes: 0, seconds: 0 })).toBe(43200);
    expect(modernTimeToSeconds({ hours: 24, minutes: 0, seconds: 0 })).toBe(86400);
  });

  it('converts seconds to traditional time units correctly', () => {
    // 0s = 0 ghaṭikā
    const t0 = secondsToTraditionalTime(0);
    expect(t0.ghatikas).toBe(0);
    expect(t0.vinadis).toBe(0);
    expect(t0.pranas).toBe(0);

    // 1 ghaṭikā = 1440 seconds
    const t1 = secondsToTraditionalTime(1440);
    expect(t1.ghatikas).toBe(1);
    expect(t1.vinadis).toBe(0);
    expect(t1.pranas).toBe(0);

    // 30 ghaṭikās = half day (12 hours = 43200s)
    const tHalf = secondsToTraditionalTime(43200);
    expect(tHalf.ghatikas).toBe(30);
    expect(tHalf.vinadis).toBe(0);
    expect(tHalf.pranas).toBe(0);

    // 1 vināḍī = 24 seconds
    const tVinadi = secondsToTraditionalTime(24);
    expect(tVinadi.ghatikas).toBe(0);
    expect(tVinadi.vinadis).toBe(1);
    expect(tVinadi.pranas).toBe(0);

    // 1 prāṇa = 4 seconds
    const tPrana = secondsToTraditionalTime(4);
    expect(tPrana.ghatikas).toBe(0);
    expect(tPrana.vinadis).toBe(0);
    expect(tPrana.pranas).toBe(1);
  });

  it('performs roundtrip conversions with zero loss', () => {
    const testTimes = [0, 100, 1440, 3600, 43200, 72000, 86399];
    for (const sec of testTimes) {
      const trad = secondsToTraditionalTime(sec);
      const recovered = traditionalTimeToSeconds(trad);
      expect(recovered).toBeCloseTo(sec, 5);
    }
  });

  it('supports midnight (ardharātrika) vs sunrise (audayika) day reckonings', () => {
    const modernTime = { hours: 6, minutes: 0, seconds: 0 }; // 06:00:00
    
    // Ardharātrika: 6 hours after midnight = 6 * 3600s = 21600s = 15 ghaṭikās
    const ardha = modernToTraditional(modernTime, 'ardharatrika');
    expect(ardha.traditional.ghatikas).toBe(15);

    // Audayika: sunrise is 06:00:00, so 06:00:00 = 0 ghaṭikā
    const auda = modernToTraditional(modernTime, 'audayika', 6 * 3600);
    expect(auda.traditional.ghatikas).toBe(0);
  });
});

describe('Ahargaṇa and Epoch Verification', () => {
  it('confirms the historical Kali Yuga epoch in 3102 BCE', () => {
    expect(verifyEpoch()).toBe(true);
  });

  it('computes positive, monotonically increasing ahargaṇa for historical dates', () => {
    const ahargana500 = computeAhargana(500, 1, 1);
    const ahargana1500 = computeAhargana(1500, 1, 1);
    const ahargana2000 = computeAhargana(2000, 1, 1);

    expect(ahargana500).toBeGreaterThan(0);
    expect(ahargana1500).toBeGreaterThan(ahargana500);
    expect(ahargana2000).toBeGreaterThan(ahargana1500);
  });
});
