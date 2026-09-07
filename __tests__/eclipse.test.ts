import { describe, it, expect } from 'vitest';
import {
  SS_REVOLUTIONS,
  CIVIL_DAYS_PER_MAHAYUGA,
  MEAN_DAILY_MOTION,
} from '../src/history/models/suryaSiddhanta/constants';
import { computeMeanPositions } from '../src/history/models/suryaSiddhanta/meanMotions';
import { mandaCorrection, trueLongitude } from '../src/history/models/suryaSiddhanta/equations';
import { computeLunarEclipse } from '../src/history/models/suryaSiddhanta/lunarEclipse';
import {
  calculateDeltaT,
  getDeltaTUncertaintySeconds,
  getModernPositions,
  getModernLunarEclipse,
  getModernSolarEclipse,
} from '../src/lib/astronomy';
import { computeAhargana } from '../src/lib/time/ahargana';

describe('Sūrya Siddhānta Eclipse Model', () => {
  it('documents authentic Mahāyuga revolution counts', () => {
    expect(SS_REVOLUTIONS.sun.value).toBe(4320000);
    expect(SS_REVOLUTIONS.moon.value).toBe(57753336);
    expect(CIVIL_DAYS_PER_MAHAYUGA).toBe(1577917828);
  });

  it('computes mean daily motions close to modern rates', () => {
    // Sun: ~0.9856°/day
    expect(MEAN_DAILY_MOTION.sun).toBeCloseTo(0.9856, 3);
    // Moon: ~13.1764°/day
    expect(MEAN_DAILY_MOTION.moon).toBeCloseTo(13.1764, 3);
    // Node: retrograde negative rate (~ -0.053°/day)
    expect(MEAN_DAILY_MOTION.moonNode).toBeLessThan(0);
  });

  it('applies manda equation of centre within documented bounds', () => {
    // Sun max equation is ~2.17°
    const sunCorr = mandaCorrection(90, 0, 2.167);
    expect(Math.abs(sunCorr)).toBeLessThanOrEqual(2.17);
    expect(sunCorr).toBeGreaterThan(0);

    const trueSun = trueLongitude(90, 0, 2.167);
    expect(trueSun).toBeCloseTo(90 + sunCorr, 4);
  });

  it('runs the 6-step lunar eclipse computation returning inspectable steps', () => {
    // Test on a known full moon / eclipse date
    const ahargana = computeAhargana(1995, 10, 24);
    const result = computeLunarEclipse(ahargana);

    expect(result.steps.length).toBe(6);
    expect(result.steps[0].name).toBe('Mean Longitudes');
    expect(result.steps[1].name).toBe('True Longitudes');
    expect(result.steps[2].name).toBe('Lunar Latitude');
    expect(result.steps[3].name).toBe("Earth Shadow & Apparent Sizes");
    expect(result.steps[4].name).toBe('Obscuration (Grāsa)');
    expect(result.steps[5].name).toBe('Half-Duration (Sthityardha)');
    expect(result.shadowRadius).toBeGreaterThan(30);
    expect(result.moonRadius).toBeGreaterThan(14);
  });
});

describe('Modern Astronomy Reference & ΔT', () => {
  it('computes historical ΔT with era-appropriate uncertainty', () => {
    // 2000 CE: ΔT ~ 64s
    const dt2000 = calculateDeltaT(2000);
    expect(dt2000).toBeCloseTo(64, 0);
    expect(getDeltaTUncertaintySeconds(2000)).toBeLessThanOrEqual(1);

    // 500 CE (Āryabhaṭa era): ΔT is several thousand seconds with minutes uncertainty
    const dt500 = calculateDeltaT(500);
    expect(dt500).toBeGreaterThan(1000);
    expect(getDeltaTUncertaintySeconds(500)).toBeGreaterThanOrEqual(900);
  });

  it('computes modern celestial positions using Astronomy Engine', () => {
    const pos = getModernPositions(new Date('1995-10-24T00:00:00Z'));
    expect(pos.sunEclipticLongitude).toBeGreaterThanOrEqual(0);
    expect(pos.sunEclipticLongitude).toBeLessThan(360);
    expect(pos.moonEclipticLongitude).toBeGreaterThanOrEqual(0);
    expect(pos.moonEclipticLongitude).toBeLessThan(360);
  });

  it('computes modern local solar eclipse circumstances for Neem Ka Thana (1995)', () => {
    const date = new Date('1995-10-24T00:00:00Z');
    const eclipse = getModernSolarEclipse(date, 27.72, 75.79);
    expect(eclipse.kind).toBe('total');
    expect(eclipse.obscuration).toBeCloseTo(1.0, 1);
    expect(eclipse.peakTime).toBeDefined();
  });

  it('evaluates Parameśvara 1422-06-01 lunar eclipse benchmark', () => {
    const date = new Date('1422-06-01T12:00:00Z');
    const eclipse = getModernLunarEclipse(date);
    expect(eclipse.type).toBe('lunar');
    expect(eclipse.peakTime).toBeDefined();

    // Ahargana for 1422-06-01
    const ahargana = computeAhargana(1422, 6, 1);
    const historical = computeLunarEclipse(ahargana);
    expect(historical.steps.length).toBe(6);
    expect(historical.sunTrueLongitude).toBeDefined();
    expect(historical.moonTrueLongitude).toBeDefined();
  });
});
