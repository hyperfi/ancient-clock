/**
 * Fluid Dynamics for Sinking Bowl Water Clock
 * Modified Torricelli's law for inflow through bottom orifice.
 * PROVENANCE: ENGINEERING RECONSTRUCTION
 */

export function pressureHead(submersionDepth: number, internalWaterHeight: number): number {
  return Math.max(0, submersionDepth - internalWaterHeight);
}

export function flowRate(
  deltaH: number,
  holeDiameter: number,
  Cd: number,
  gravity: number
): number {
  if (deltaH <= 0) return 0;
  const area = Math.PI * Math.pow(holeDiameter / 2, 2);
  return Cd * area * Math.sqrt(2 * gravity * deltaH);
}

export function flowRateWithViscosity(
  deltaH: number,
  holeDiameter: number,
  Cd: number,
  gravity: number,
  kinematicViscosity: number, // m²/s
  waterDensity: number
): number {
  if (deltaH <= 0) return 0;
  
  // Base Torricelli velocity
  const vIdeal = Math.sqrt(2 * gravity * deltaH);
  
  // Reynolds number
  // Re = v * d / nu
  const reynoldsNumber = (vIdeal * holeDiameter) / kinematicViscosity;
  
  // At low Reynolds numbers, Cd decreases due to viscous effects.
  // This is a simplified empirical adjustment for the orifice Cd
  // For Re > 1000, Cd is close to asymptotic value (e.g., 0.6)
  // For Re < 1000, it can drop. We'll use a simple model:
  // C_d_effective = C_d * (1 - k/sqrt(Re))
  // We'll just apply a small correction factor based on Re
  let cdEffective = Cd;
  if (reynoldsNumber < 1000) {
     // Very rough approximation for transitional flow Cd reduction
     cdEffective = Cd * Math.max(0.5, (0.8 + 0.2 * (reynoldsNumber / 1000)));
  }
  
  const area = Math.PI * Math.pow(holeDiameter / 2, 2);
  return cdEffective * area * Math.sqrt(2 * gravity * deltaH);
}
