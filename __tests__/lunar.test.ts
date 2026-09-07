import { describe, it, expect } from 'vitest';
import {
  getTithiInfo,
  computeElongation,
  ALL_TITHIS,
} from '../src/lib/lunar/tithi';
import {
  angularDistanceFromNode,
  isEclipsePossible,
} from '../src/lib/lunar/nodes';

describe('Tithi & Lunar Calendar', () => {
  it('defines exactly 30 tithis (15 Shukla + 15 Krishna)', () => {
    expect(ALL_TITHIS.length).toBe(30);
    const shukla = ALL_TITHIS.filter((t) => t.paksha === 'shukla');
    const krishna = ALL_TITHIS.filter((t) => t.paksha === 'krishna');
    expect(shukla.length).toBe(15);
    expect(krishna.length).toBe(15);
  });

  it('correctly maps angular elongation to tithis (12° increments)', () => {
    // 0° elongation = Tithi 1 (Pratipada, Shukla)
    const t0 = getTithiInfo(0);
    expect(t0.number).toBe(1);
    expect(t0.name).toBe('Pratipada');
    expect(t0.paksha).toBe('shukla');

    // 175° elongation = Tithi 15 (Purnima, Full Moon)
    const tFull = getTithiInfo(175);
    expect(tFull.number).toBe(15);
    expect(tFull.name).toBe('Purnima');

    // 181° elongation = Tithi 16 (Pratipada, Krishna)
    const tKrishna1 = getTithiInfo(181);
    expect(tKrishna1.number).toBe(16);
    expect(tKrishna1.paksha).toBe('krishna');

    // 355° elongation = Tithi 30 (Amavasya, New Moon)
    const tNew = getTithiInfo(355);
    expect(tNew.number).toBe(30);
    expect(tNew.name).toBe('Amavasya');
  });

  it('computes angular elongation modulo 360', () => {
    expect(computeElongation(50, 20)).toBe(30);
    expect(computeElongation(10, 350)).toBe(20);
  });
});

describe('Lunar Nodes & Eclipse Limits', () => {
  it('calculates angular distance from ascending and descending nodes', () => {
    const node = 100;
    // Moon at 105° is 5° from node
    expect(angularDistanceFromNode(105, node)).toBeCloseTo(5, 4);
    // Moon at 280° is 0° from descending node (100 + 180 = 280)
    expect(angularDistanceFromNode(280, node)).toBeCloseTo(0, 4);
  });

  it('determines if eclipse is possible within standard orbital limits', () => {
    const node = 90;
    // Within 10° of node: eclipse possible for both solar and lunar
    expect(isEclipsePossible(95, node, true)).toBe(true);
    expect(isEclipsePossible(95, node, false)).toBe(true);

    // 15° from node: possible for lunar (~17.5° limit), impossible for solar (~11.5° limit)
    expect(isEclipsePossible(105, node, true)).toBe(false);
    expect(isEclipsePossible(105, node, false)).toBe(true);

    // 30° from node: impossible for both
    expect(isEclipsePossible(120, node, true)).toBe(false);
    expect(isEclipsePossible(120, node, false)).toBe(false);
  });
});
