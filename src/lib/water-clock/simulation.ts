/**
 * Water Clock Simulation Engine
 * RK4 time-stepping simulation of the sinking bowl water clock.
 * PROVENANCE: ENGINEERING RECONSTRUCTION
 */

import { WaterClockParams, TARGET_SINK_TIME } from './constants';
import { submersionDepth, freeboard, internalWaterHeight } from './bowlGeometry';
import { pressureHead, flowRate } from './fluidDynamics';

export interface SimulationState {
  time: number;              // elapsed seconds
  waterInsideVolume: number; // m³ of water inside bowl  
  submersionDepth: number;   // m - how deep bowl sits
  freeboard: number;         // m - rim height above water
  flowRate: number;          // m³/s current flow rate
  isSinking: boolean;        // true when freeboard <= 0
}

export interface SimulationResult {
  sinkTime: number;          // seconds until bowl sinks
  states: SimulationState[]; // time series (sampled)
  targetTime: number;        // 1440s = 24 min
  error: number;             // sinkTime - targetTime
  driftPer12h: number;       // projected drift over 12 hours
  driftPer24h: number;       // projected drift over 24 hours  
}

export function simulateWaterClock(params: WaterClockParams, dt: number = 0.1): SimulationResult {
  let time = 0;
  let waterInsideVolume = 0;
  
  const states: SimulationState[] = [];
  
  // Helper to compute flow rate Q given volume V
  const getQ = (v: number): number => {
    const subDepth = submersionDepth(params.bowlRadiusM, params.bowlMassKg, v, params.waterDensity);
    const intHeight = internalWaterHeight(params.bowlRadiusM, v);
    const head = pressureHead(subDepth, intHeight);
    return flowRate(head, params.holeDiameterM, params.dischargeCoefficient, params.gravity);
  };

  let isSinking = false;
  let currentSubmersion = submersionDepth(params.bowlRadiusM, params.bowlMassKg, 0, params.waterDensity);
  let currentFreeboard = freeboard(params.bowlDepthM, currentSubmersion);
  let currentFlowRate = getQ(0);
  
  // Max time limit to avoid infinite loops (e.g. if hole is too small to sink)
  const MAX_SIM_TIME = 10000;
  let sampleTimer = 0;

  while (!isSinking && time < MAX_SIM_TIME) {
    // Record state every ~1 second
    if (sampleTimer >= 1.0 || time === 0) {
      states.push({
        time,
        waterInsideVolume,
        submersionDepth: currentSubmersion,
        freeboard: currentFreeboard,
        flowRate: currentFlowRate,
        isSinking
      });
      sampleTimer = 0;
    }

    // RK4 Integration for volume
    const k1 = getQ(waterInsideVolume);
    const k2 = getQ(waterInsideVolume + 0.5 * dt * k1);
    const k3 = getQ(waterInsideVolume + 0.5 * dt * k2);
    const k4 = getQ(waterInsideVolume + dt * k3);
    
    waterInsideVolume += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    time += dt;
    sampleTimer += dt;
    
    // Update state variables for termination check
    currentSubmersion = submersionDepth(params.bowlRadiusM, params.bowlMassKg, waterInsideVolume, params.waterDensity);
    currentFreeboard = freeboard(params.bowlDepthM, currentSubmersion);
    currentFlowRate = getQ(waterInsideVolume);
    
    if (currentFreeboard <= 0) {
      isSinking = true;
    }
  }

  // Final state
  states.push({
    time,
    waterInsideVolume,
    submersionDepth: currentSubmersion,
    freeboard: currentFreeboard,
    flowRate: currentFlowRate,
    isSinking: true
  });

  const sinkTime = time;
  const error = sinkTime - TARGET_SINK_TIME;
  
  // 1 ghaṭikā = 1 sink. 12h = 30 ghaṭikās. 24h = 60 ghaṭikās.
  const driftPer12h = error * 30;
  const driftPer24h = error * 60;

  return {
    sinkTime,
    states,
    targetTime: TARGET_SINK_TIME,
    error,
    driftPer12h,
    driftPer24h
  };
}
