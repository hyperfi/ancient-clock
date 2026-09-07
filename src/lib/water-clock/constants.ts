/** 
 * Water Clock Historical Constants
 * PROVENANCE: DOCUMENTED (from classical astronomical texts)
 * SOURCE: Sūrya Siddhānta Ch.13 v.23; S.R. Sarma's documentation
 */

export interface WaterClockParams {
  bowlRadiusM: number;         // Bowl radius in meters
  bowlDepthM: number;          // Bowl depth in meters  
  bowlMassKg: number;          // Empty bowl mass in kg
  holeDiameterM: number;       // Orifice diameter in meters
  basinWaterDepthM: number;    // Water depth in the basin in meters
  dischargeCoefficient: number; // Cd for the orifice
  waterDensity: number;        // kg/m³
  gravity: number;             // m/s²
}

// Historical unit conversions (SCHOLARLY INTERPRETATION)
export const ANGULA_TO_M = 0.01763;  // 1 aṅgula ≈ 1.763 cm
export const PALA_TO_KG = 0.040;     // 1 pala ≈ 40g (varies 35-48g by tradition)

// Historical documented dimensions
export const HISTORICAL_PARAMS: WaterClockParams = {
  bowlRadiusM: 6 * ANGULA_TO_M,      // 6 aṅgulas radius (hemispherical, diameter 12)
  bowlDepthM: 6 * ANGULA_TO_M,       // 6 aṅgulas deep
  bowlMassKg: 10 * PALA_TO_KG,       // 10 palas
  holeDiameterM: 0.001,              // ~1mm (SCHOLARLY INTERPRETATION: from gold needle spec)
  basinWaterDepthM: 0.30,            // 30cm assumed basin depth
  dischargeCoefficient: 0.6,         // Sharp-edged orifice Cd (ENGINEERING RECONSTRUCTION)
  waterDensity: 998,                 // kg/m³ at 20°C
  gravity: 9.81,
};

// Target: 1 ghaṭikā = 1440 seconds = 24 minutes
export const TARGET_SINK_TIME = 1440;
