/**
 * Lunar Eclipse Computation (Sūrya Siddhānta Ch.4)
 * 
 * Implements the 12-step algorithm documented in ECLIPSE_METHODS.md:
 * 1. Ahargaṇa
 * 2. Mean longitudes
 * 3. Anomaly corrections
 * 4. True longitudes  
 * 5. Lunar node position
 * 6. Lunar latitude
 * 7. Opposition test
 * 8. Earth's shadow size
 * 9. Apparent angular sizes
 * 10. Obscuration (grāsa)
 * 11. Half-duration (sthityardha)
 * 12. Contact times
 * 
 * PROVENANCE: DOCUMENTED (algorithm) / ENGINEERING RECONSTRUCTION (implementation)
 * SOURCE: SS Ch.4 (Burgess)
 */

import { computeMeanPositions, normalizeDegrees } from './meanMotions';
import { trueLongitude } from './equations';
import { ssRsine } from './sineTable';
import { 
  MAX_EQUATION, 
  MOON_MAX_LATITUDE_DEGREES, 
  SINUS_TOTUS,
  MEAN_DAILY_MOTION,
  APPARENT_DIAMETER
} from './constants';
import { LunarEclipseResult, EclipseStep } from './types';

export function computeLunarEclipse(ahargana: number): LunarEclipseResult {
  const steps: EclipseStep[] = [];
  
  // 1 & 2. Ahargana and Mean Longitudes
  const means = computeMeanPositions(ahargana);
  steps.push({
    stepNumber: 1,
    name: 'Mean Longitudes',
    description: 'Compute mean positions of Sun, Moon, and nodes from Ahargaṇa.',
    inputValues: { ahargana },
    outputValues: {
      sunMean: means.sunLongitude,
      moonMean: means.moonLongitude,
      moonApogee: means.moonApogeeLongitude,
      moonNode: means.moonNodeLongitude
    },
    formula: 'mean = (revs / civil_days) * ahargana * 360',
    provenance: 'documented'
  });

  // 3 & 4. True Longitudes
  // Using an assumed mean Sun apogee of ~77.25 degrees (per SS I.41-44)
  const sunApogee = 77.25; 
  const sunTrue = trueLongitude(means.sunLongitude, sunApogee, MAX_EQUATION.sun.maxDegrees);
  const moonTrue = trueLongitude(means.moonLongitude, means.moonApogeeLongitude, MAX_EQUATION.moon.maxDegrees);
  
  steps.push({
    stepNumber: 2,
    name: 'True Longitudes',
    description: 'Apply manda correction (equation of centre) to get true longitudes.',
    inputValues: {
      sunMean: means.sunLongitude,
      moonMean: means.moonLongitude,
      moonApogee: means.moonApogeeLongitude
    },
    outputValues: {
      sunTrue,
      moonTrue
    },
    formula: 'true = mean + arcsin(sin(mean - apogee) * maxEq)',
    provenance: 'documented'
  });

  // 5 & 6. Lunar Latitude
  const nodeDist = moonTrue - means.moonNodeLongitude;
  const latDeg = MOON_MAX_LATITUDE_DEGREES * (ssRsine(nodeDist) / SINUS_TOTUS);

  steps.push({
    stepNumber: 3,
    name: 'Lunar Latitude',
    description: 'Calculate Moon\'s latitude from the ecliptic.',
    inputValues: { moonTrue, moonNode: means.moonNodeLongitude },
    outputValues: { latitude: latDeg },
    formula: 'latitude = max_lat * sin(moon_true - node)',
    provenance: 'documented'
  });

  // 7. Opposition Test
  const angularSeparation = normalizeDegrees(moonTrue - sunTrue);
  const distFrom180 = Math.abs(angularSeparation - 180);
  
  // 8 & 9. Apparent Angular Sizes and Earth's Shadow
  const sunDailyMotion = MEAN_DAILY_MOTION.sun;
  const moonDailyMotion = MEAN_DAILY_MOTION.moon;
  
  // Simplified mean shadow and moon apparent diameters (Engineering reconstruction)
  // SS derives shadow from daily motions: shadow ≈ 40' radius mean
  const shadowRadius = 40.0; 
  const moonRadius = APPARENT_DIAMETER.moonMean / 2;
  
  steps.push({
    stepNumber: 4,
    name: 'Earth Shadow & Apparent Sizes',
    description: 'Compute apparent angular diameters of Moon and Earth\'s shadow.',
    inputValues: {},
    outputValues: { moonRadius, shadowRadius },
    formula: 'shadow radius ≈ 40 arcmin (mean approximation)',
    provenance: 'reconstruction'
  });

  // 10. Obscuration (Grāsa)
  const latArcmin = Math.abs(latDeg * 60);
  const obscuration = Math.max(0, (shadowRadius + moonRadius) - latArcmin);
  const magnitude = obscuration > 0 ? obscuration / (moonRadius * 2) : 0;
  
  // Eclipse is valid if there's obscuration and we're reasonably close to opposition
  const isEclipse = obscuration > 0 && distFrom180 < 15; 
  const type = magnitude >= 1 ? 'total' : (magnitude > 0 ? 'partial' : undefined);

  steps.push({
    stepNumber: 5,
    name: 'Obscuration (Grāsa)',
    description: 'Calculate the magnitude of the eclipse.',
    inputValues: { shadowRadius, moonRadius, latitudeArcmin: latArcmin },
    outputValues: { obscuration, magnitude },
    formula: 'grāsa = (shadowRadius + moonRadius) - |latitude|',
    provenance: 'documented'
  });

  // 11. Half Duration (Sthityardha)
  const motionDiffArcminPerDay = (moonDailyMotion - sunDailyMotion) * 60;
  const motionDiffArcminPerGhatika = motionDiffArcminPerDay / 60; 
  
  let halfDurationGhatikas = 0;
  if (isEclipse) {
    const val = Math.pow(shadowRadius + moonRadius, 2) - Math.pow(latArcmin, 2);
    if (val > 0) {
      halfDurationGhatikas = Math.sqrt(val) / motionDiffArcminPerGhatika;
    }
  }

  steps.push({
    stepNumber: 6,
    name: 'Half-Duration (Sthityardha)',
    description: 'Compute the duration of the eclipse from contact to maximum.',
    inputValues: { motionDiff: motionDiffArcminPerGhatika },
    outputValues: { halfDurationGhatikas },
    formula: 'sqrt((shadow_r + moon_r)^2 - lat^2) / relative_motion',
    provenance: 'documented'
  });

  // 12. Contact times (Relative approximation for MVP)
  const firstContact = isEclipse ? -halfDurationGhatikas : undefined;
  const maximum = isEclipse ? 0 : undefined;
  const lastContact = isEclipse ? halfDurationGhatikas : undefined;

  return {
    isEclipse,
    type: isEclipse ? type : undefined,
    sunTrueLongitude: sunTrue,
    moonTrueLongitude: moonTrue,
    moonLatitude: latDeg,
    angularSeparation,
    shadowRadius,
    moonRadius,
    obscuration,
    magnitude,
    halfDurationGhatikas: isEclipse ? halfDurationGhatikas : undefined,
    firstContact,
    maximum,
    lastContact,
    steps
  };
}
