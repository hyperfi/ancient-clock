/**
 * Bowl Geometry for Sinking Bowl Water Clock
 * Computes volumes, cross-sections, and submersion for hemispherical bowls.
 * PROVENANCE: ENGINEERING RECONSTRUCTION
 */

export function bowlVolume(radius: number): number {
  return (2 / 3) * Math.PI * Math.pow(radius, 3);
}

export function bowlCrossSectionArea(radius: number, height: number): number {
  if (height < 0 || height > radius) return 0;
  // r^2 = R^2 - (R - h)^2 = 2Rh - h^2
  const rSquared = 2 * radius * height - height * height;
  return Math.PI * rSquared;
}

export function sphericalCapVolume(radius: number, height: number): number {
  if (height <= 0) return 0;
  if (height >= radius) return bowlVolume(radius) + (height > radius ? 0 : 0); // clamp for hemisphere
  return (Math.PI * Math.pow(height, 2) * (3 * radius - height)) / 3;
}

export function submersionDepth(
  bowlRadius: number,
  bowlMass: number,
  waterInsideVolume: number,
  waterDensity: number
): number {
  const targetSubmergedVolume = (bowlMass / waterDensity) + waterInsideVolume;
  
  // If target volume exceeds the entire hemisphere volume, it's fully submerged (or sinking)
  const maxVol = bowlVolume(bowlRadius);
  if (targetSubmergedVolume >= maxVol) {
    return bowlRadius;
  }
  
  // Solve V(d) = pi/3 * d^2 * (3R - d) for d using Newton-Raphson
  // f(d) = d^3 - 3*R*d^2 + (3 * V_target) / pi = 0
  // f'(d) = 3*d^2 - 6*R*d
  const vTerm = (3 * targetSubmergedVolume) / Math.PI;
  let d = bowlRadius / 2; // Initial guess
  
  for (let i = 0; i < 20; i++) {
    const f = Math.pow(d, 3) - 3 * bowlRadius * Math.pow(d, 2) + vTerm;
    const df = 3 * Math.pow(d, 2) - 6 * bowlRadius * d;
    
    if (Math.abs(f) < 1e-10) {
      break;
    }
    
    // Avoid division by zero
    if (Math.abs(df) < 1e-12) {
      break;
    }
    
    d = d - f / df;
    
    // Clamp to valid range [0, bowlRadius]
    d = Math.max(0, Math.min(d, bowlRadius));
  }
  
  return d;
}

export function freeboard(bowlDepth: number, submersionDepth: number): number {
  return Math.max(0, bowlDepth - submersionDepth);
}

export function internalWaterHeight(bowlRadius: number, waterInsideVolume: number): number {
  // Uses the same logic as submersionDepth but mass is 0
  // meaning we just find the height of a spherical cap given its volume
  return submersionDepth(bowlRadius, 0, waterInsideVolume, 1);
}
