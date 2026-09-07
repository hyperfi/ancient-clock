/**
 * Shared types for Sūrya Siddhānta model.
 */

export interface MeanPositions {
  sunLongitude: number;      // degrees [0, 360)
  moonLongitude: number;     // degrees [0, 360)
  moonApogeeLongitude: number; // degrees [0, 360)
  moonNodeLongitude: number;  // degrees [0, 360) - ascending node (Rāhu)
  ahargana: number;           // input days
}

export interface EclipseStep {
  stepNumber: number;
  name: string;
  description: string;
  inputValues: Record<string, number>;
  outputValues: Record<string, number>;
  formula?: string;
  provenance: 'documented' | 'scholarly' | 'reconstruction';
}

export interface LunarEclipseResult {
  /** Is there an eclipse? */
  isEclipse: boolean;
  /** Type: total, partial, or penumbral */
  type?: 'total' | 'partial' | 'penumbral';
  /** True Sun longitude (degrees) */
  sunTrueLongitude: number;
  /** True Moon longitude (degrees) */
  moonTrueLongitude: number;
  /** Moon's latitude from ecliptic (degrees) */
  moonLatitude: number;
  /** Angular separation at opposition (degrees) */
  angularSeparation: number;
  /** Shadow angular radius (arc-minutes) */
  shadowRadius: number;
  /** Moon angular radius (arc-minutes) */
  moonRadius: number;
  /** Obscuration (grāsa) in arc-minutes */
  obscuration: number;
  /** Eclipse magnitude (fraction of Moon's diameter) */
  magnitude: number;
  /** Half-duration of eclipse (ghaṭikās) */
  halfDurationGhatikas?: number;
  /** Contact times (ghaṭikās from epoch) */
  firstContact?: number;
  maximum?: number;
  lastContact?: number;
  /** Step-by-step breakdown for visualization */
  steps: EclipseStep[];
}
