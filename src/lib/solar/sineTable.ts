/**
 * Historical Sine Table (R = 3438)
 * 
 * Both the Sūrya Siddhānta and Āryabhaṭīya use a trigonometric circle
 * with circumference = 21,600 minutes of arc (360° × 60').
 * R = 21600 / (2π) ≈ 3438
 * 
 * Āryabhaṭa provides 24 first differences at 3°45' (225') intervals.
 * The first differences: 225, 224, 222, 219, 215, 210, 205, 199, 
 *   191, 183, 174, 164, 154, 143, 131, 119, 106, 93, 79, 65, 51, 37, 22, 7
 * 
 * PROVENANCE: DOCUMENTED
 * SOURCE: Āryabhaṭīya Gītikāpāda; Sūrya Siddhānta
 */

export const R = 3438; // Siddhāntic trigonometric radius

// Āryabhaṭa's 24 first differences of Rsines at 3°45' intervals
export const ARYABHATA_SINE_DIFFERENCES = [
  225, 224, 222, 219, 215, 210, 205, 199,
  191, 183, 174, 164, 154, 143, 131, 119,
  106, 93, 79, 65, 51, 37, 22, 7
];

export const buildRsineTable = (): number[] => {
  const table = [0];
  let sum = 0;
  for (const diff of ARYABHATA_SINE_DIFFERENCES) {
    sum += diff;
    table.push(sum);
  }
  return table;
};

const rsineTable = buildRsineTable();

export const rsine = (angleMinutes: number): number => {
  // Normalize angle to 0 - 360 degrees (0 - 21600 minutes)
  let normalized = angleMinutes % 21600;
  if (normalized < 0) normalized += 21600;

  // Reduce to first quadrant (0 - 5400 minutes)
  let isNegative = false;
  let quadAngle = normalized;

  if (normalized >= 10800) {
    isNegative = true;
    quadAngle -= 10800;
  }
  
  if (quadAngle > 5400) {
    quadAngle = 10800 - quadAngle;
  }

  // Interval is 225 minutes (3°45')
  const index = Math.floor(quadAngle / 225);
  const remainder = quadAngle % 225;

  let value: number;
  if (index >= 24) {
    value = rsineTable[24];
  } else {
    // Linear interpolation
    const v1 = rsineTable[index];
    const v2 = rsineTable[index + 1];
    value = v1 + ((v2 - v1) * remainder) / 225;
  }

  return isNegative ? -value : value;
};

export const rcosine = (angleMinutes: number): number => {
  return rsine(angleMinutes + 5400); // add 90 degrees in minutes
};

export const rsineDegrees = (angleDeg: number): number => {
  return rsine(angleDeg * 60);
};

export const rcosineDegrees = (angleDeg: number): number => {
  return rcosine(angleDeg * 60);
};

export const inversRsine = (value: number): number => {
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  
  if (absVal >= R) return isNegative ? 16200 : 5400; // 270 or 90 degrees in minutes

  // Find interval
  let index = 0;
  for (let i = 0; i <= 24; i++) {
    if (rsineTable[i] > absVal) {
      index = i - 1;
      break;
    }
  }

  const v1 = rsineTable[index];
  const v2 = rsineTable[index + 1];
  const diff = v2 - v1;
  const remainder = ((absVal - v1) * 225) / diff;

  const angleMins = index * 225 + remainder;
  return isNegative ? 21600 - angleMins : angleMins;
};

export const modernSinComparison = (angleDeg: number): { historical: number, modern: number, errorPercent: number } => {
  const historical = rsineDegrees(angleDeg) / R;
  const modern = Math.sin(angleDeg * Math.PI / 180);
  
  const errorPercent = modern === 0 
    ? Math.abs(historical) * 100 
    : Math.abs((historical - modern) / modern) * 100;

  return { historical, modern, errorPercent };
};
