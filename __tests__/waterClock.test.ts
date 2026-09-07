import { describe, it, expect } from 'vitest';
import {
  HISTORICAL_PARAMS,
  TARGET_SINK_TIME,
} from '../src/lib/water-clock/constants';
import {
  bowlVolume,
  sphericalCapVolume,
  submersionDepth,
  freeboard,
} from '../src/lib/water-clock/bowlGeometry';
import { pressureHead, flowRate } from '../src/lib/water-clock/fluidDynamics';
import { simulateWaterClock } from '../src/lib/water-clock/simulation';

describe('Water Clock (Ghaṭīyantra) Physics Model', () => {
  it('documents 1 ghaṭikā = 1440 seconds target', () => {
    expect(TARGET_SINK_TIME).toBe(1440);
  });

  it('calculates hemispherical bowl geometry accurately', () => {
    const R = HISTORICAL_PARAMS.bowlRadiusM; // ~0.106 m (6 aṅgulas)
    const vol = bowlVolume(R);
    // (2/3) * pi * R^3
    expect(vol).toBeCloseTo((2 / 3) * Math.PI * Math.pow(R, 3), 6);
    expect(vol).toBeGreaterThan(0.002); // ~2.5 liters
  });

  it('determines initial freeboard for floating empty bowl', () => {
    const initialSubmersion = submersionDepth(
      HISTORICAL_PARAMS.bowlRadiusM,
      HISTORICAL_PARAMS.bowlMassKg,
      0,
      HISTORICAL_PARAMS.waterDensity
    );
    const fb = freeboard(HISTORICAL_PARAMS.bowlDepthM, initialSubmersion);
    // Empty bowl floats with positive freeboard
    expect(fb).toBeGreaterThan(0);
    expect(initialSubmersion).toBeLessThan(HISTORICAL_PARAMS.bowlDepthM);
  });

  it('computes positive Torricelli inflow when water head exists', () => {
    const head = pressureHead(0.05, 0.01);
    expect(head).toBeCloseTo(0.04, 6);
    const q = flowRate(
      head,
      HISTORICAL_PARAMS.holeDiameterM,
      HISTORICAL_PARAMS.dischargeCoefficient,
      HISTORICAL_PARAMS.gravity
    );
    expect(q).toBeGreaterThan(0);
  });

  it('simulates progressive sinking over time using RK4', () => {
    // Run a quick simulation with standard parameters
    const sim = simulateWaterClock(HISTORICAL_PARAMS, 1.0);
    expect(sim.sinkTime).toBeGreaterThan(0);
    expect(sim.states.length).toBeGreaterThan(1);

    // Initial state: freeboard > 0, water = 0
    expect(sim.states[0].waterInsideVolume).toBe(0);
    expect(sim.states[0].freeboard).toBeGreaterThan(0);

    // Final state: freeboard <= 0 (sunk)
    const last = sim.states[sim.states.length - 1];
    expect(last.freeboard).toBeLessThanOrEqual(0);
  });
});
