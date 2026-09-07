import { radToDeg, degToRad } from './utils';
import { shadowLengthFromAltitude } from './altitude';

/**
 * Cardinal Direction Finding via Equal-Shadow Circle Method
 * 
 * Historical procedure (Sūrya Siddhānta Ch.3, Triprasna):
 * 1. Erect gnomon on level ground
 * 2. Draw circle with radius > shortest shadow of the day
 * 3. Mark where morning shadow tip crosses the circle (west point)
 * 4. Mark where afternoon shadow tip crosses the circle (east point)
 * 5. Connect marks for approximate E-W line
 * 6. Construct perpendicular for N-S meridian (fish-figure/timi method)
 * 
 * PROVENANCE: DOCUMENTED
 * SOURCE: Sūrya Siddhānta Ch.3
 * 
 * KNOWN LIMITATION: Sun's declination changes during the day,
 * so the two shadow-circle crossings are not perfectly symmetric.
 * Later commentators (Bhāskara II, Nīlakaṇṭha) introduced corrections.
 */

export interface ShadowPoint {
  x: number; // east-west position (positive east)
  y: number; // north-south position (positive north)
  time: number; // seconds from midnight
}

export interface DirectionResult {
  morningCrossing: ShadowPoint;
  afternoonCrossing: ShadowPoint;
  eastWestAngle: number;        // angle of derived E-W line (degrees from true E-W)
  northSouthAngle: number;      // angle of derived N-S line
  angularError: number;         // deviation from true north (degrees)
  trueNorthAngle: number;       // actual north direction
}

// Minimal placeholder for shadow path computation
// In a full implementation, this needs proper solar ephemeris
export const computeShadowPath = (latitude: number, longitude: number, date: Date, gnomonHeight: number): ShadowPoint[] => {
  // Returns mock shadow path for now as full modern implementation requires complex solar calculations
  // Real implementation would calculate solar azimuth and altitude, then project shadow
  return [];
};

export const findCircleCrossings = (shadowPath: ShadowPoint[], circleRadius: number): { morning: ShadowPoint | null, afternoon: ShadowPoint | null } => {
  let morning: ShadowPoint | null = null;
  let afternoon: ShadowPoint | null = null;

  // A simplified check looking for points crossing the circleRadius threshold
  // Assuming shadow length goes from > r to < r in morning, and < r to > r in afternoon
  for (let i = 1; i < shadowPath.length; i++) {
    const p1 = shadowPath[i - 1];
    const p2 = shadowPath[i];
    
    const r1 = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
    const r2 = Math.sqrt(p2.x * p2.x + p2.y * p2.y);
    
    if (r1 > circleRadius && r2 <= circleRadius) {
      // interpolate for morning
      morning = p2; // simplified
    } else if (r1 <= circleRadius && r2 > circleRadius) {
      // interpolate for afternoon
      afternoon = p1; // simplified
    }
  }

  return { morning, afternoon };
};

export const computeEastWestLine = (morning: ShadowPoint, afternoon: ShadowPoint): { angle: number, midpoint: { x: number, y: number } } => {
  const dx = afternoon.x - morning.x;
  const dy = afternoon.y - morning.y;
  
  const angle = radToDeg(Math.atan2(dy, dx));
  const midpoint = {
    x: (morning.x + afternoon.x) / 2,
    y: (morning.y + afternoon.y) / 2
  };

  return { angle, midpoint };
};

export const computeNorthSouthLine = (ewLine: { angle: number }): { angle: number } => {
  let nsAngle = ewLine.angle - 90;
  if (nsAngle < -180) nsAngle += 360;
  return { angle: nsAngle };
};

export const evaluateDirectionError = (derivedNorth: number, trueNorth: number = 0): number => {
  let error = derivedNorth - trueNorth;
  while (error > 180) error -= 360;
  while (error < -180) error += 360;
  return error;
};
