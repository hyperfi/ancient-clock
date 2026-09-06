# Eclipse Computation Methods

## 1. Overview

Eclipse prediction serves as the intellectual centrepiece of the Ghaṭikā application. The project aims to implement historical astronomical algorithms as faithfully as possible, providing direct comparisons against modern astronomical computation. The primary objective is to allow users to engage with and understand the historical *methodology* and mathematical structures, rather than merely evaluating the accuracy of the results. 

This document outlines the astronomical algorithms, constants, and computational architecture used to achieve this comparison, adhering to strict principles of historical integrity.

**Provenance Labels Used in this Project:**
* **DOCUMENTED:** Directly stated in a primary text or reliable translation.
* **SCHOLARLY INTERPRETATION:** A reconstruction accepted or discussed in academic literature.
* **ENGINEERING RECONSTRUCTION:** Our numerical implementation using modern physics/math to bridge computational gaps.
* **MODERN COMPARISON:** A present-day astronomical result used strictly as a benchmark.

---

## 2. MVP Eclipse Model: Sūrya Siddhānta

For the Minimum Viable Product (MVP), we implement the eclipse algorithms detailed in the *Sūrya Siddhānta*. 

**Rationale:**
* **Completeness:** It contains highly detailed, accessible chapters dedicated to lunar and solar eclipses (Chapters 4, 5, and 6).
* **Accessibility:** The Ebenezer Burgess translation (1860) provides extensive English exposition and mathematical commentary.
* **Historical Impact:** It became the practical standard for Indian almanacs (pañcāṅgas) for centuries.
* **Dating Context:** The surviving recension is generally dated to ~800 CE, though it incorporates earlier observational and theoretical layers.

### Chapter 4: Lunar Eclipse Algorithm
The steps below outline the procedural flow derived from the text (DOCUMENTED / SCHOLARLY INTERPRETATION):

1. **Ahargaṇa:** Compute the total elapsed civil days from the Kali Yuga epoch (midnight at the meridian of Ujjain, Feb 17/18, 3102 BCE).
2. **Mean Longitudes:** Compute the mean positions of the Sun and Moon by multiplying the elapsed days by their respective revolution counts per *mahāyuga*, divided by the total civil days in a *mahāyuga*.
3. **Anomaly Corrections (Manda):** Apply the equation of centre using the epicyclic model and the sine table ($R=3438$). This accounts for the variable apparent motion of the bodies.
4. **True Longitudes:** Obtain true longitudes by adding or subtracting the *manda* corrections from the mean longitudes.
5. **Lunar Node Position:** Compute the mean position of the ascending node (Rāhu), which exhibits retrograde motion (completing a cycle in ~18.6 years).
6. **Lunar Latitude (Vikṣepa):** Calculate the Moon's latitude from the ecliptic based on its angular distance from the node and the assumed maximum inclination.
7. **Opposition Test:** Verify that the true longitudes of the Sun and Moon are approximately 180° apart (the fundamental requirement for a full Moon and potential lunar eclipse).
8. **Earth's Shadow (Chāyā):** Compute the angular radius of the Earth's shadow cone at the distance of the Moon's orbit.
9. **Apparent Angular Sizes:** Determine the apparent angular diameters of the Moon and the shadow based on their current distances (derived from their daily motions).
10. **Obscuration (Grāsa):** Calculate the magnitude of the eclipse by comparing the sum of the semi-diameters with the true angular separation (latitude).
11. **Half-Duration (Sthityardha):** Compute the duration of the eclipse phases (partial and total) using spherical trigonometry approximations.
12. **Contact Times:** Determine the precise local times of first contact, maximum eclipse, and last contact.

### Chapter 5: Solar Eclipse (Parallax)
Solar eclipses require highly complex corrections for the observer's location on Earth. 

1. Calculate all basic parameters (longitudes, nodes, diameters) adapted for conjunction (new Moon, 0° separation).
2. **Parallax in Longitude (Lambana):** Compute the horizontal correction for the observer's position, which shifts the apparent time of conjunction.
3. **Parallax in Latitude (Nati):** Compute the vertical parallax component, which alters the apparent latitude of the Moon and directly affects obscuration.
4. **Apparent Conjunction:** Adjust the true conjunction time and positions based on parallax computations.
5. **Contact Times:** Final contact times iteratively corrected for the changing parallax effects throughout the duration of the eclipse.

### Chapter 6: Eclipse Projection (Chedyaka)
* Graphical and geometric methods for visualizing the progression of an eclipse.
* Projection of the eclipse phases onto a flat diagram (often drawn on the ground or a board).
* Mapping phase angles and directions of contact (valana).

---

## 3. Key Astronomical Constants (Sūrya Siddhānta)

All historical constants used in the codebase must strictly adhere to the values presented in the text. No tuning to modern values is permitted.

| Parameter | Value | Units | Source / Provenance | Modern Comparison | % Error |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mahāyuga** | 4,320,000 | Solar Years | DOCUMENTED (SS 1.15-17) | N/A | N/A |
| **Civil days per mahāyuga** | 1,577,917,828 | Days | DOCUMENTED (SS 1.37) | ~1,577,917,500 | +0.00002% |
| **Sun revolutions/mahāyuga** | 4,320,000 | Revs | DOCUMENTED (By definition) | N/A | N/A |
| **Moon revolutions/mahāyuga** | 57,753,336 | Revs | DOCUMENTED (SS 1.29) | 57,753,332 (J2000) | +0.000007% |
| **Moon's node revs/mahāyuga** | 232,238 | Revs (retro) | DOCUMENTED (SS 1.33) | ~232,311 | -0.031% |
| **Moon's apogee revs** | 488,203 | Revs | DOCUMENTED (SS 1.33) | ~488,140 | +0.013% |
| **Sine table radius (R)** | 3438 | Arcminutes | DOCUMENTED (SS 2.15-22) | $360 \times 60 / 2\pi \approx 3437.75$ | +0.007% |
| **Earth's diameter** | 1,600 | Yojanas (~8,000 mi) | DOCUMENTED (SS 1.59) | 7,917 miles | ~1.0% |
| **Moon's diameter** | 480 | Yojanas | DOCUMENTED (SS 4.1) | 2,159 miles (if 1Y = 5m: 2400m)| ~11% |
| **Sun's diameter** | 6,500 | Yojanas | DOCUMENTED (SS 4.1) | 864,000 miles (if 1Y = 5m: 32,500m)| Massive underestimate |
| **Moon's orbital distance** | 324,000 | Yojanas | DOCUMENTED (SS 12.85) | ~238,900 miles (if 1Y=5m: 1,620,000m)| Factor of ~6.7 off |
| **Sun's orbital distance** | 4,331,500 | Yojanas | DOCUMENTED (SS 12.86) | ~93,000,000 miles (if 1Y=5m: 21,657,500m) | Factor of ~4.3 off |
| **Max Equation of Centre (Sun)** | ~2°10' | Degrees | SCHOLARLY INTERPRETATION (SS 2) | ~1°55' | +13% |
| **Max Equation of Centre (Moon)** | ~5°02' | Degrees | SCHOLARLY INTERPRETATION (SS 2) | ~6°17' | -20% |
| **Obliquity of Ecliptic** | 24° | Degrees | DOCUMENTED (SS 2.28) | ~23.44° | +2.4% |

*(Note: Distances in Yojanas in Indian astronomy are scaled geometrically such that angular sizes remain empirically functional for eclipse models, despite the physical distances and absolute sizes being highly inaccurate compared to modern physics).*

---

## 4. Future Models (Post-MVP)

### Āryabhaṭa's Eclipse Method
To be implemented in `src/history/models/aryabhata/`.
Key differences from the Sūrya Siddhānta tradition:
* Epoch is defined from midnight (Ārdharātrika) or sunrise (Audayika) depending on the specific text/recension.
* Assumes Earth rotates while the celestial sphere is stationary (a revolutionary model).
* Utilizes different fundamental constants (revolution counts per *kalpa*/*yuga*).
* Procedural order for *manda* (equation of centre) and *śīghra* (equation of anomaly for planets) corrections differ.
* Employs different epicycle sizes and radial pulsation models.
* Uses *jyā* (sines) directly derived from a different base sine table construction.

### Parameśvara's Dṛgganita System (1431 CE)
* Represents the empirical refinement of theoretical models in the Kerala School.
* Built upon 55 years of systematic astronomical observations (1393–1448 CE).
* Introduces observation-based corrections (bīja) to the traditional Āryabhaṭan parameters to align computed eclipses with reality.
* Will provide a profound comparison narrative: Theoretical (SS) → Observational refinement (Dṛgganita) → Modern.

---

## 5. Modern Reference Model

To provide a benchmark (MODERN COMPARISON), the application utilizes modern ephemerides. 

**Primary Tool:** Astronomy Engine (by Don Cross)
* **License:** MIT, native JS/TS.
* **Theory:** Based on VSOP87 planetary theory.
* **Capabilities:** Handles dates thousands of years in the past, highly precise angular accuracy (~1 arcminute), and computes local eclipse contact times natively.

**ΔT Considerations (Critical for Historical Astronomy):**
Historical events were recorded in local solar/civil time, but modern ephemerides run on uniform Terrestrial Time (TT). The difference is ΔT ($\Delta T = TT - UT$).
* Because the Earth's rotation slows unpredictably due to tidal friction and glacial isostatic adjustment, ΔT is uncertain for the distant past.
* **Uncertainty around 500 CE:** Several minutes.
* **Uncertainty around 1000 BCE:** Over an hour.
* **Reference standard:** Stephenson, Morrison, Hohenkerk (2016).
* **Implementation Requirement:** The application MUST display ΔT uncertainty alongside modern results. We must *never* create an illusion of absolute precision for ancient events.

**Fallback:** Swiss Ephemeris via WebAssembly (used only if higher precision needs arise, bearing in mind AGPL licensing constraints).

---

## 6. Comparison Methodology

The pedagogical value of Ghaṭikā lies in the comparison. For each queried eclipse, the system will:

1. Execute the historical algorithm (e.g., SS) to generate historical predicted contact times and magnitudes.
2. Execute the modern reference (Astronomy Engine + ΔT) to generate modern computed equivalents.
3. Render a side-by-side UI comparison.
4. Quantify timing errors (Δt) and magnitude discrepancies.
5. Identify the mathematical sources of historical error (e.g., mean motion drift over centuries, nodal longitude error, inaccuracy in the maximum equation of centre, parallax estimation limits).

**Benchmark Eclipses for Validation:**
1. Parameśvara's observed eclipses (1393–1448 CE, Kerala).
2. August 18, 1868 (Total Solar, Guntur — famous for the discovery of Helium).
3. January 22, 1898 (Total Solar, central India).
4. February 16, 1980 (Total Solar, Southern India).
5. October 24, 1995 (Total Solar, Northern India).

---

## 7. Implementation Architecture

The codebase physically segregates historical models from modern routines to prevent cross-contamination of logic or constants.

```text
src/
  history/
    models/
      suryaSiddhanta/
        constants.ts      — All SS constants with exact provenance comments
        meanMotions.ts     — Ahargaṇa and Mean longitude computation
        equations.ts       — Epicyclic equation of centre (manda correction)
        sineTable.ts       — Static SS sine table (R=3438)
        lunarEclipse.ts    — Chapter 4 Lunar eclipse algorithm
        solarEclipse.ts    — Chapter 5 Solar eclipse with parallax
        types.ts           — Type definitions specific to SS algorithms
      aryabhata/           — (Future)
  
  lib/
    astronomy/
      modernReference.ts  — Astronomy Engine wrapper
      deltaT.ts           — ΔT polynomial models and uncertainty calculator
      comparison.ts       — Diffing logic for Historical vs Modern output
```

---

## 8. Critical Principles

To maintain the rigorous academic nature of this project, all contributors and agents must adhere to the following:

1. **No Tuning:** Never alter, tune, or optimize historical constants to match modern results. Doing so destroys the historiographical experiment.
2. **Provenance is Mandatory:** Every constant and significant mathematical step must have a documented provenance comment (e.g., `// DOCUMENTED: SS 1.29`).
3. **No Magic Numbers:** All constants must be exported from a central `constants.ts` file for that specific model.
4. **Total Independence:** Historical and modern computational pipelines must share absolutely no data other than the input target date and geographic coordinates.
5. **Transparency in Uncertainty:** If a historical procedural step is ambiguous in the text and requires modern interpolation to function in code, it MUST be clearly marked as `ENGINEERING RECONSTRUCTION` or `RECONSTRUCTION UNCERTAIN` in the source code and UI.
