/**
 * Water Clock Sensitivity Analysis
 * Monte Carlo simulation for error propagation.
 * PROVENANCE: MODERN SENSITIVITY EXPERIMENT (not historical documentation)
 */

import { WaterClockParams, TARGET_SINK_TIME } from './constants';
import { submersionDepth, freeboard, internalWaterHeight } from './bowlGeometry';
import { pressureHead, flowRateWithViscosity } from './fluidDynamics';

export interface SensitivityParams {
  holeDiameterStd: number;    // std dev of hole diameter (m)
  bowlMassStd: number;        // std dev of bowl mass (kg) 
  resetDelayMean: number;     // mean reset delay (s)
  resetDelayStd: number;      // std dev of reset delay (s)
  temperatureC: number;       // water temperature (°C)
}

export interface MonteCarloResult {
  meanSinkTime: number;
  stdSinkTime: number;
  medianSinkTime: number;
  percentile16: number;  // ~-1σ
  percentile84: number;  // ~+1σ
  minSinkTime: number;
  maxSinkTime: number;
  errorPerGhatika: number; // mean deviation from 1440s
  driftPer12h: number;
  driftPer24h: number;
  sinkTimes: number[];   // raw data
}

export function waterViscosity(tempC: number): number {
  // Simple polynomial interpolation for kinematic viscosity (m²/s) based on standard data:
  // 5°C: 1.519e-6, 10°C: 1.307e-6, 15°C: 1.139e-6, 20°C: 1.004e-6
  // 25°C: 0.893e-6, 30°C: 0.801e-6, 35°C: 0.727e-6
  
  // Fit a quadratic or just use linear interpolation for simplicity
  const points = [
    {t: 5, v: 1.519e-6},
    {t: 10, v: 1.307e-6},
    {t: 15, v: 1.139e-6},
    {t: 20, v: 1.004e-6},
    {t: 25, v: 0.893e-6},
    {t: 30, v: 0.801e-6},
    {t: 35, v: 0.727e-6},
    {t: 40, v: 0.658e-6}
  ];
  
  if (tempC <= points[0].t) return points[0].v;
  if (tempC >= points[points.length - 1].t) return points[points.length - 1].v;
  
  for (let i = 0; i < points.length - 1; i++) {
    if (tempC >= points[i].t && tempC < points[i + 1].t) {
      const dt = points[i + 1].t - points[i].t;
      const dv = points[i + 1].v - points[i].v;
      const fraction = (tempC - points[i].t) / dt;
      return points[i].v + fraction * dv;
    }
  }
  return 1.004e-6; // fallback to 20°C
}

// Box-Muller transform for normal distribution
function randomNormal(mean: number, std: number): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * std + mean;
}

export function runMonteCarloSensitivity(
  baseParams: WaterClockParams,
  sensParams: SensitivityParams,
  nRuns: number = 1000
): MonteCarloResult {
  const sinkTimes: number[] = [];
  
  const kinematicViscosity = waterViscosity(sensParams.temperatureC);
  
  for (let i = 0; i < nRuns; i++) {
    // Perturb parameters
    const holeD = Math.max(0.0001, randomNormal(baseParams.holeDiameterM, sensParams.holeDiameterStd));
    const mass = Math.max(0.01, randomNormal(baseParams.bowlMassKg, sensParams.bowlMassStd));
    const resetDelay = Math.max(0, randomNormal(sensParams.resetDelayMean, sensParams.resetDelayStd));
    
    // Simulate with Euler method for speed (RK4 is slow for 1000 runs)
    let time = 0;
    let volume = 0;
    const dt = 1.0; // 1 second step for speed
    
    let isSinking = false;
    while (!isSinking && time < 5000) {
      const subDepth = submersionDepth(baseParams.bowlRadiusM, mass, volume, baseParams.waterDensity);
      const intHeight = internalWaterHeight(baseParams.bowlRadiusM, volume);
      const head = pressureHead(subDepth, intHeight);
      
      const q = flowRateWithViscosity(
        head, holeD, baseParams.dischargeCoefficient, baseParams.gravity, 
        kinematicViscosity, baseParams.waterDensity
      );
      
      volume += q * dt;
      time += dt;
      
      const newSubDepth = submersionDepth(baseParams.bowlRadiusM, mass, volume, baseParams.waterDensity);
      if (freeboard(baseParams.bowlDepthM, newSubDepth) <= 0) {
        isSinking = true;
      }
    }
    
    // Total time includes the manual reset delay
    sinkTimes.push(time + resetDelay);
  }
  
  sinkTimes.sort((a, b) => a - b);
  
  const sum = sinkTimes.reduce((a, b) => a + b, 0);
  const meanSinkTime = sum / nRuns;
  
  const variance = sinkTimes.reduce((sq, n) => sq + Math.pow(n - meanSinkTime, 2), 0) / nRuns;
  const stdSinkTime = Math.sqrt(variance);
  
  const medianSinkTime = sinkTimes[Math.floor(nRuns / 2)];
  const percentile16 = sinkTimes[Math.floor(nRuns * 0.16)];
  const percentile84 = sinkTimes[Math.floor(nRuns * 0.84)];
  const minSinkTime = sinkTimes[0];
  const maxSinkTime = sinkTimes[nRuns - 1];
  
  const errorPerGhatika = meanSinkTime - TARGET_SINK_TIME;
  const driftPer12h = errorPerGhatika * 30; // 30 ghatikas in 12h
  const driftPer24h = errorPerGhatika * 60; // 60 ghatikas in 24h
  
  return {
    meanSinkTime,
    stdSinkTime,
    medianSinkTime,
    percentile16,
    percentile84,
    minSinkTime,
    maxSinkTime,
    errorPerGhatika,
    driftPer12h,
    driftPer24h,
    sinkTimes
  };
}
