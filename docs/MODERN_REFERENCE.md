# MODERN REFERENCE SYSTEM

### 1. PURPOSE

The modern reference system serves ONE purpose: to provide an independent, high-accuracy astronomical benchmark against which historical Indian astronomical algorithms can be compared.

It is NOT the "correct" answer that historical methods failed to achieve. It is a modern measurement standard, analogous to comparing a historical ruler against a laser interferometer.

For sufficiently ancient dates, the modern reference itself carries uncertainty (through ΔT).

### 2. PRIMARY TOOL: ASTRONOMY ENGINE

**Repository**: github.com/cosinekitty/astronomy (Don Cross)
**License**: MIT (highly permissive, ideal for educational project)
**Language support**: JavaScript/TypeScript native (also C, C#, Python)
**Underlying model**: VSOP87 planetary theory

#### Capabilities
- Sun, Moon, and planetary positions (equatorial, ecliptic, horizontal coordinates)
- Solar and lunar eclipse prediction (global and local circumstances)
- Local eclipse contact times (C1, C2, C3, C4)
- Eclipse magnitude computation
- Moon phases, equinoxes, solstices
- Rise/set times
- Coordinate transformations

#### Accuracy
- Angular positions: ~1 arcminute
- Sufficient for educational comparison with historical models (which typically have errors of several arcminutes to degrees)
- Less precise than JPL DE ephemerides or Swiss Ephemeris

#### Date Range
- Handles dates thousands of years in past and future
- Based on VSOP87 which is accurate for ±4000 years from J2000
- For dates beyond ~2000 years from present, accuracy may degrade
- MUST BE TESTED for specific ancient dates used in the project

#### ΔT Handling
- Uses Espenak-Meeus polynomial approximations internally
- For historical comparisons, we should document which ΔT model is being used
- Consider allowing user to select ΔT model or see uncertainty range

### 3. ΔT (DELTA T) — CRITICAL CONCEPT

#### Definition
ΔT = TT − UT1

where:
- TT (Terrestrial Time) = uniform time scale based on atomic clocks
- UT1 (Universal Time) = time based on Earth's actual rotation

#### Why It Matters
- Earth's rotation is gradually slowing (tidal friction)
- There are also unpredictable decadal fluctuations
- For ancient dates, we cannot precisely reconstruct what "local time" a clock would have shown
- A 1-minute error in ΔT shifts a solar eclipse path by ~0.25° longitude (~28 km at equator)

#### Uncertainty by Era

| Period | Approximate ΔT Uncertainty |
|--------|---------------------------|
| 2000 CE | < 1 second (well measured) |
| 1900 CE | ~1 second |
| 1800 CE | ~5-10 seconds |
| 1600 CE | ~30-60 seconds |
| 1000 CE | ~5-15 minutes |
| 500 CE | ~15-30 minutes |
| 0 CE | ~1-2 hours |
| 500 BCE | ~2-4 hours |
| 1000 BCE | ~4-8 hours |

*(Values are approximate and based on Stephenson, Morrison, Hohenkerk 2016 and related literature.)*

#### Implementation
- For recent centuries (post-1600): modern reference times are high-confidence
- For medieval period (500-1600 CE): display with noted uncertainty of minutes
- For ancient period (pre-500 CE): display with WARNING about ΔT uncertainty
- Never present modern reconstructed local times for ancient events without uncertainty bounds

#### Key References
- Stephenson, F.R., Morrison, L.V., Hohenkerk, C.Y. (2016). "Measurement of the Earth's rotation: 720 BC to AD 2015." Proceedings of the Royal Society A, 472(2196).
- Espenak, F. & Meeus, J. (2006). "Five Millennium Canon of Solar Eclipses: −1999 to +3000."

### 4. ALTERNATIVE TOOLS (EVALUATED)

#### Swiss Ephemeris
- **Precision**: Sub-milliarcsecond (far more than we need)
- **Basis**: NASA JPL DE ephemeris
- **JS availability**: WebAssembly bindings (`@swisseph/browser`)
- **License**: **AGPL** — requires open-sourcing all code OR paying commercial license
- **Verdict**: Too restrictive for this project. Use only if Astronomy Engine proves insufficient for specific date ranges.

#### VSOP87 (standalone)
- **Precision**: ~1 arcsecond
- **License**: Public domain
- **JS availability**: Via `astronomia` library (based on Jean Meeus)
- **Limitation**: No built-in eclipse contact time computation (requires manual implementation)
- **Verdict**: Astronomy Engine already uses VSOP87 internally with eclipse functions added. Prefer Astronomy Engine.

#### JPL DE441
- **Precision**: Gold standard for solar system positions
- **Data size**: ~2.6 GB (impractical for browser)
- **Access**: JPL Horizons API (network dependent) or local computation
- **Verdict**: Use for deep validation only, not primary reference. Could add optional backend API for edge cases.

### 5. ECLIPSE CATALOGS FOR VALIDATION

#### NASA Five Millennium Canon (Espenak & Meeus)
- Spans -1999 to +3000
- Provides: dates, times of greatest eclipse, Saros series, gamma, magnitude
- Machine-readable data available on NASA eclipse website
- Uses Espenak-Meeus ΔT model

#### Xavier Jubier's Interactive Maps
- Interactive Google Maps for historical eclipses
- Local contact times for specific coordinates
- Excellent for visual verification of eclipse paths

#### Validation Methodology
1. For recent eclipses (post-1900): Compare Astronomy Engine results directly with NASA tables and observed data
2. For medieval eclipses (500-1600): Compare with NASA tables, noting ΔT model used
3. For ancient eclipses (pre-500): Compare astronomical geometry only; note that local civil time is uncertain
4. Always ensure same ΔT model is used in comparison

### 6. BENCHMARK ECLIPSE DATASET

We will build `data/eclipse-benchmarks.json` starting with these well-studied events:

1. **Parameśvara's observations (1393-1448 CE)**: Multiple eclipses from Kerala; historical observations exist for comparison
2. **1868 Aug 18 (Total Solar)**: Visible from Guntur, India; famous for helium discovery; extensively documented
3. **1898 Jan 22 (Total Solar)**: Central India; early photographic documentation
4. **1980 Feb 16 (Total Solar)**: Southern India; modern institutional observations
5. **1995 Oct 24 (Total Solar)**: Northern India; modern benchmark

For each benchmark:
- Date (Julian/Gregorian as appropriate)
- Type (solar/lunar, total/partial/annular)
- Location coordinates for local circumstances
- Modern computed contact times (with ΔT model noted)
- Historical source (if any)
- Historical predicted contacts (if computable from our model)
- ΔT value used
- Estimated uncertainty

### 7. IMPLEMENTATION ARCHITECTURE

```
src/lib/astronomy/
  modernReference.ts    — Astronomy Engine wrapper
  deltaT.ts             — ΔT models, uncertainty computation
  eclipseSearch.ts      — Eclipse search and local circumstances
  coordinates.ts        — Coordinate transformations
  comparison.ts         — Historical vs modern comparison engine
  types.ts              — Type definitions

data/
  eclipse-benchmarks.json  — Curated benchmark dataset
```

### 8. WHAT THE MODERN REFERENCE IS NOT

- It is NOT "the right answer" that ancient astronomers were trying to find
- It is NOT perfectly precise for ancient dates (ΔT uncertainty)
- It is NOT a judgment on historical methods
- It IS a modern measurement standard for quantitative comparison
- It IS a tool for understanding WHERE and WHY historical methods diverge from modern computation
