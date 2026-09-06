# Ghaṭikā Project: Water Clock (Ghaṭikā-yantra) Physics Model

This document provides a comprehensive overview of the physics model for the sinking-bowl water clock simulation in the Ghaṭikā project. It rigorously distinguishes between historically documented facts, scholarly interpretations, and our modern engineering reconstructions.

## 1. HISTORICAL DOCUMENTATION

### Primary Sources
- **Sūrya Siddhānta, Chapter 13, Verse 23**: "In a vessel filled with clean water, keep a copper vessel which has a hole in the bottom; this hemispherical instrument will be immersed in water 60 times in a day and night." [DOCUMENTED]
- **Arthaśāstra (Kauṭilya)**: Mentions ghaṭikā-yantra for administrative/civil timekeeping. [DOCUMENTED]
- **S.R. Sarma**: Documents that while the basic design is uniform, no single "universal" set of dimensions exists across all texts. Different traditions specified different parameters. [SCHOLARLY INTERPRETATION]

### Documented Physical Parameters
**Provenance:** DOCUMENTED (from classical astronomical texts, specific verse citations needed during implementation)
- Material: Copper (tāmra)
- Weight of bowl: 10 palas
- Height/depth: 6 aṅgulas
- Top diameter: 12 aṅgulas (hemispherical)
- Hole: Pierced by a gold needle 8 aṅgulas long, weighing 1 pala
- Estimated modern equivalent of hole diameter: ~1 mm [SCHOLARLY INTERPRETATION]
- Timing: Sinks exactly 60 times in 24 hours (1 sink = 1 ghaṭikā = 24 minutes)

### Conversion of Historical Units
- 1 aṅgula ≈ 1.763 cm (approximately, varies by tradition — this is a scholarly estimate) [SCHOLARLY INTERPRETATION]
- 1 pala (weight) ≈ varies significantly by region/period (roughly 35-48 grams) [SCHOLARLY INTERPRETATION]
- *Note: These conversions introduce inherent uncertainty into any modern numerical reconstruction.*

---

## 2. PHYSICS MODEL [ENGINEERING RECONSTRUCTION]

> **IMPORTANT**: This entire section is our modern engineering reconstruction of the instrument's physics. The historical texts describe the instrument and its dimensions but do not provide the fluid dynamics equations.

### 2.1 Sinking Bowl Dynamics

The sinking bowl is an inflow clepsydra. Water enters through a small hole in the bottom, gradually filling the bowl until it sinks.

**Key physics**:
1. The bowl floats on water with some initial freeboard.
2. Water flows in through the hole driven by the pressure difference between outside and inside water levels at the orifice.
3. As the bowl fills, its weight increases, it sinks deeper, and the freeboard decreases.
4. Eventually the rim submerges and the bowl sinks rapidly.

### 2.2 Force Balance

At any instant, the bowl is in quasi-static equilibrium:

`Buoyancy = Weight of bowl + Weight of water inside`

`ρ_water × g × V_submerged = M_bowl × g + ρ_water × g × V_water_inside`

where:
- `ρ_water` = density of water (~998 kg/m³ at 20°C)
- `V_submerged` = volume of bowl below external water surface
- `M_bowl` = mass of empty bowl
- `V_water_inside` = volume of water accumulated inside

### 2.3 Flow Rate (Modified Torricelli's Law)

The volumetric flow rate through the orifice:

`Q = C_d × A_hole × √(2g × Δh)`

where:
- `C_d` = discharge coefficient (~0.6 for sharp-edged orifice) [ENGINEERING RECONSTRUCTION]
- `A_hole` = cross-sectional area of the hole = `π(d/2)²`
- `g` = gravitational acceleration (9.81 m/s²)
- `Δh` = effective pressure head = depth of hole below external water surface minus internal water level above the hole

**Critical note**: The pressure head `Δh` changes over time as the bowl sinks deeper (increasing external head) and fills (increasing internal head). This creates a coupled differential equation.

### 2.4 Bowl Geometry

For a hemispherical bowl of radius `R_bowl` and depth `D_bowl`:
- If hemispherical: `R_bowl = D_bowl = 6 aṅgulas ≈ 10.6 cm`, top diameter = `12 aṅgulas ≈ 21.2 cm`
- Volume = `(2/3)πR³` for a full hemisphere
- Submerged volume as a function of depth `d`: `V(d) = π×d²×(3R-d)/3` (spherical cap formula)

### 2.5 Governing Differential Equation

The system evolves as:

`dV_water/dt = Q(t) = C_d × A_hole × √(2g × Δh(t))`

where `Δh(t)` depends on the current submersion depth (from force balance) and internal water level.

This must be solved numerically (e.g., Euler or RK4 integration) with time steps.

**Sinking condition**: The bowl sinks when:
- Freeboard → 0 (water spills over rim), OR
- Buoyancy can no longer support total weight (unstable equilibrium)

### 2.6 Calibration Target

The dimensions should be such that the bowl sinks once every:
- **Target:** 1 ghaṭikā = 1440 seconds (24 minutes)

In Calibrate Mode, the user adjusts parameters to achieve this target.

---

## 3. SENSITIVITY ANALYSIS [MODERN SENSITIVITY EXPERIMENT]

> **IMPORTANT**: This is a modern hypothetical sensitivity study, NOT historical documentation.

### 3.1 Error Sources to Model

| Parameter | Effect | Physically Relevant? |
|-----------|--------|---------------------|
| Hole diameter ±0.1mm | Changes flow rate significantly | Yes — manufacturing precision |
| Water temperature | Viscosity changes (0.7-1.5 mPa·s for 5-45°C) | Yes — most significant error source |
| Bowl mass ±5% | Changes initial submersion, affects Δh | Yes |
| Water level in basin | Changes external pressure head | Moderate |
| Surface tension at orifice | Can impede flow at ~1mm hole | Minor but real |
| Human reset delay | ±2-5 seconds per reset | Accumulates over 60 resets per day |
| Bowl shape imperfection | Changes volume-depth relationship | Minor |

### 3.2 Temperature Effect on Viscosity

For small orifices (~1mm), viscous effects are NOT negligible. The flow regime is likely transitional (Re ~ 100-1000), not fully turbulent.

Kinematic viscosity of water:
- At 5°C: 1.519 × 10⁻⁶ m²/s
- At 20°C: 1.004 × 10⁻⁶ m²/s  
- At 35°C: 0.727 × 10⁻⁶ m²/s

This means a clock calibrated in summer would run SLOW in winter and vice versa. The timing error could be several percent.

### 3.3 Projected Drift

For each error source, compute:
- Error per ghaṭikā (seconds)
- Projected drift after 12 hours (30 ghaṭikās)
- Projected drift after 24 hours (60 ghaṭikās)

---

## 4. ACOUSTIC CALIBRATION CROSS-CHECK

### Historical Basis [DOCUMENTED / SCHOLARLY INTERPRETATION]
- Bhāskara I's commentary describes calibrating time intervals through recitation of long (guru) syllables.
- 60 guru-akṣaras at "middling speed" = 1 pala/vināḍī = 24 seconds.
- This provides an independent metrological standard to verify/calibrate the water clock.

### Modern Experimental Verification [SCHOLARLY INTERPRETATION]
- S.R. Sarma, "Measuring Time with Long Syllables"
- R.N. Iyengar, H.S. Sudarshan, A. Viswanathan, "Akṣara the Basic Unit of Time Measure in Ancient India"
- Experimental result: 60 guru-akṣaras ≈ 24 seconds confirmed.
- 3,600 guru-akṣaras = 1 ghaṭikā = 24 minutes confirmed.

### Simulation Feature
- User can simulate 60 recitations and see timing distribution.
- Compare target (24.00s) against observed distribution.
- Demonstrates how acoustic calibration provides independent verification of water clock.

---

## 5. IMPLEMENTATION NOTES

```text
src/lib/water-clock/
  bowlGeometry.ts     — Bowl shape, volume calculations
  fluidDynamics.ts    — Torricelli flow, pressure head computation  
  simulation.ts       — Time-stepping simulation engine
  calibration.ts      — Parameter adjustment for target timing
  sensitivity.ts      — Error propagation and Monte Carlo
  constants.ts        — Historical parameters with provenance
  types.ts            — Type definitions
```

---

## 6. WHAT WE DO NOT CLAIM

- We do **NOT** claim the historical texts contain fluid dynamics equations.
- We do **NOT** claim the exact dimensions in our model match every historical tradition.
- We do **NOT** claim the error analysis is historically documented.
- We **DO** claim the physical model is a defensible engineering reconstruction.
- We **DO** clearly label what comes from texts vs. our reconstruction.
