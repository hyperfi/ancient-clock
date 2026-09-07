/**
 * Lunar Nodes (Rāhu / Ketu)
 * 
 * The ascending node (Rāhu) and descending node (Ketu) are the intersection
 * points of the Moon's orbital plane with the ecliptic.
 * 
 * Eclipses can only occur when a syzygy (New/Full Moon) happens near a node.
 * 
 * The nodes have retrograde motion, completing one cycle in ~18.6 years.
 * 
 * PROVENANCE: DOCUMENTED
 * SOURCE: Sūrya Siddhānta; Āryabhaṭīya
 */

export interface NodeInfo {
  ascendingNodeLongitude: number;  // Rāhu, degrees
  descendingNodeLongitude: number; // Ketu, degrees (= ascending + 180)
  angularDistanceFromNode: number; // Moon's angular distance from nearest node
  isNearNode: boolean;             // Within ~11.5° (eclipse limit)
}

// Basic cycle length of nodes
const NODE_CYCLE_DAYS = 6793.5; // ~18.6 years

export function computeNodePosition(ahargana: number): number {
  // Rough mean motion of ascending node based on ahargana (days since epoch)
  // Retrograde motion: subtract from 360
  // Mean daily motion is approx 0.05295 degrees/day
  
  // Starting from an arbitrary epoch offset
  const initialNode = 120; // arbitrary
  const dailyMotion = 360 / NODE_CYCLE_DAYS;
  
  let nodeLon = (initialNode - (ahargana * dailyMotion)) % 360;
  if (nodeLon < 0) nodeLon += 360;
  
  return nodeLon;
}

export function angularDistanceFromNode(moonLongitude: number, nodeLongitude: number): number {
  // Nearest node (ascending or descending)
  const d1 = Math.abs(moonLongitude - nodeLongitude);
  const dist1 = Math.min(d1, 360 - d1);
  
  const descNode = (nodeLongitude + 180) % 360;
  const d2 = Math.abs(moonLongitude - descNode);
  const dist2 = Math.min(d2, 360 - d2);
  
  return Math.min(dist1, dist2);
}

export function isEclipsePossible(moonLongitude: number, nodeLongitude: number, isSolar: boolean): boolean {
  const dist = angularDistanceFromNode(moonLongitude, nodeLongitude);
  
  // Solar eclipse limit: ~11.5° from node (partial limit can be up to 18°)
  // Lunar eclipse limit: ~17.5° from node (because Earth's shadow is larger)
  // Using simplified 11.5° threshold for basic "near node" indication
  const limit = isSolar ? 11.5 : 17.5;
  
  return dist <= limit;
}
