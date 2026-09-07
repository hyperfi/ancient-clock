/**
 * Tithi Computation
 * 
 * A tithi is defined as the time for the Moon-Sun angular separation
 * (elongation) to increase by 12°. There are 30 tithis in one synodic month.
 * 
 * tithi_number = floor(elongation / 12) + 1
 * where elongation = (moon_longitude - sun_longitude) mod 360
 * 
 * PROVENANCE: DOCUMENTED
 * SOURCE: Āryabhaṭīya; Sūrya Siddhānta; universal in siddhāntic astronomy
 */

export interface TithiInfo {
  /** Tithi number (1-30) */
  number: number;
  /** Tithi name in IAST */
  name: string;
  /** Tithi name in Devanagari */
  devanagari: string;
  /** Paksha (fortnight): shukla (waxing) or krishna (waning) */
  paksha: 'shukla' | 'krishna';
  /** Angular elongation at start of this tithi */
  startElongation: number;
  /** Angular elongation at end of this tithi */
  endElongation: number;
}

const TITHI_NAMES = [
  { name: 'Pratipada', devanagari: 'प्रतिपदा' },
  { name: 'Dvitiya', devanagari: 'द्वितीया' },
  { name: 'Tritiya', devanagari: 'तृतीया' },
  { name: 'Chaturthi', devanagari: 'चतुर्थी' },
  { name: 'Panchami', devanagari: 'पञ्चमी' },
  { name: 'Shashthi', devanagari: 'षष्ठी' },
  { name: 'Saptami', devanagari: 'सप्तमी' },
  { name: 'Ashtami', devanagari: 'अष्टमी' },
  { name: 'Navami', devanagari: 'नवमी' },
  { name: 'Dashami', devanagari: 'दशमी' },
  { name: 'Ekadashi', devanagari: 'एकादशी' },
  { name: 'Dvadashi', devanagari: 'द्वादशी' },
  { name: 'Trayodashi', devanagari: 'त्रयोदशी' },
  { name: 'Chaturdashi', devanagari: 'चतुर्दशी' },
  { name: 'Purnima', devanagari: 'पूर्णिमा' },
];

export const ALL_TITHIS: TithiInfo[] = Array.from({ length: 30 }, (_, i) => {
  const number = i + 1;
  const isShukla = number <= 15;
  const index = isShukla ? i : i - 15;
  const baseName = index === 14 && !isShukla ? { name: 'Amavasya', devanagari: 'अमावास्या' } : TITHI_NAMES[index];
  
  return {
    number,
    name: baseName.name,
    devanagari: baseName.devanagari,
    paksha: isShukla ? 'shukla' : 'krishna',
    startElongation: i * 12,
    endElongation: (i + 1) * 12,
  };
});

export function computeElongation(moonLongitude: number, sunLongitude: number): number {
  let elongation = (moonLongitude - sunLongitude) % 360;
  if (elongation < 0) {
    elongation += 360;
  }
  return elongation;
}

export function getTithiInfo(elongationDeg: number): TithiInfo {
  // normalize elongation to 0-360
  let e = elongationDeg % 360;
  if (e < 0) e += 360;
  
  const index = Math.floor(e / 12);
  // Ensure index is within bounds due to float precision
  return ALL_TITHIS[Math.min(index, 29)];
}

export function timeToNextTithi(currentElongation: number, moonDailyMotion: number = 13.176, sunDailyMotion: number = 0.985): number {
  const nextBoundary = Math.ceil((currentElongation + 0.0001) / 12) * 12;
  const degreesToCover = nextBoundary - currentElongation;
  const relativeDailyMotion = moonDailyMotion - sunDailyMotion; // ~12.19 degrees/day
  return (degreesToCover / relativeDailyMotion) * 24; // in hours
}

// Basic mock function using mean motions for demo purposes
export function tithiFromDate(year: number, month: number, day: number): TithiInfo {
  // Note: For a real astronomical app, this would use VSOP87 and ELP2000 
  // or similar ephemeris models to calculate precise moon/sun longitudes.
  // Here we use a simple linear approximation based on an epoch.
  
  const jd = julianDay(year, month, day);
  // J2000 epoch: 2451545.0
  const t = (jd - 2451545.0) / 36525;
  
  // Very rough mean longitudes
  const sunLon = (280.460 + 36000.770 * t) % 360;
  const moonLon = (218.316 + 481267.881 * t) % 360;
  
  const elongation = computeElongation(moonLon, sunLon);
  return getTithiInfo(elongation);
}

function julianDay(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
}
