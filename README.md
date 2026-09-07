# Ghaṭikā (घटिका)
### Ancient Indian Time & Astronomy Lab

> *"How much astronomy can you do with the Sun, Moon, stars, geometry, arithmetic, and carefully calibrated instruments?"*

**Ghaṭikā** is an interactive scientific laboratory that computationally reconstructs, simulates, and benchmarks methods used in Indian mathematical astronomy over two millennia.

Rather than presenting static historical exposition or decorative imagery, Ghaṭikā provides an inspectable numerical environment where users can verify time-reckoning conventions, operate water clocks using fluid dynamics, test gnomon shadow geometry, explore variable-duration lunar days (*tithis*), and predict eclipses using algorithms from the *Sūrya Siddhānta* side-by-side with modern analytical ephemerides.

---

## Key Modules & Interactive Experiments

### 1. Measure Time (`/observe/measure-time`)
- **The Indian Day (Ahorātra)**: Interactive 24-hour circular visualizer divided into 60 *ghaṭikās* (24 min each) and 30 *muhūrtas* (48 min each).
- **Day Reckonings**: Toggle between *Audayika* (sunrise-reckoned, Sūrya Siddhānta) and *Ārdharātrika* (midnight-reckoned, Āryabhaṭa).
- **Bidirectional Converter**: Convert seamlessly between Modern clock time (HH:MM:SS) and traditional units (*ghaṭikā*, *vināḍī*, *prāṇa*).
- **Water Clock (`/observe/measure-time/water-clock`)**: Physically modeled sinking-bowl clepsydra (*ghaṭīyantra*) running a 4th-order Runge-Kutta (RK4) integration of Torricelli inflow and Archimedean buoyancy. Includes *Historical Mode*, *Calibrate Mode*, and *Accuracy Mode*.
- **Spoken Clock (`/observe/measure-time/spoken-clock`)**: Acoustic calibration ring based on Bhāskara I's method of reciting 60 *guru-akṣaras* (long syllables) at a measured tempo to verify 1 *pala* (24.0 seconds).

### 2. Sun & Shadow (`/observe/sun-shadow`)
- **The Gnomon (Śaṅku)**: Interactive 12-*aṅgula* vertical gnomon simulation. Observe dynamic solar altitude arcs and shadow lengths across coordinates and seasons.
- **Finding North (`/observe/sun-shadow/find-north`)**: Step-by-step construction of the equal-shadow circle method from *Sūrya Siddhānta* Chapter 3, using morning/afternoon crossings and the *timi* (fish-figure) perpendicular bisector. Explores the angular error caused by diurnal declination shifts.

### 3. Moon & Calendar (`/observe/moon-calendar`)
- **Tithi Explorer**: Earth-centered orbital schematic demonstrating how each 12° increment in Moon–Sun elongation constitutes one *tithi*.
- **Variable Duration**: Explains why *tithis* range from 19 to 26 hours due to orbital anomaly, illustrating calendar concepts like omitted (*kṣaya*) and intercalary (*adhika*) days.
- **Lunar Nodes (Rāhu & Ketu)**: Visualizes nodal retrograde motion (~18.6 yr cycle) and orbital tilt limits (~11.5° for solar, ~17.5° for lunar eclipses).

### 4. Predict an Eclipse (`/observe/predict-eclipse`)
- **Historical Model**: Complete 6-step inspectable algorithm from *Sūrya Siddhānta* Chapter 4:
  1. Ahargaṇa (elapsed civil days from Kali Yuga epoch)
  2. Mean longitudes via Mahāyuga revolution counts
  3. Manda corrections (epicyclic equation of centre)
  4. Lunar latitude from node
  5. Earth's shadow cone (*chāyā*) and apparent diameters
  6. Obscuration (*grāsa*) and half-duration (*sthityardha*)
- **Modern Ground Truth**: Real-time analytical calculation using Don Cross's *Astronomy Engine* (VSOP87) with NASA Espenak–Meeus ΔT polynomials.
- **Historical Presets**: Load curated benchmark events including Parameśvara's 1422 observation in Kerala, the 1868 Guntur Helium-discovery eclipse, and the 1995 total eclipse across northern India.
- **Quantitative Comparison**: Side-by-side error evaluation, disc overlap geometry, and transparent breakdown of divergence causes (Ayanāṁśa precession, evection omission, ΔT uncertainty).

### 5. Accuracy Lab (`/observe/accuracy-lab`)
- **Error Budget**: Toggle physical instrument tolerances (water viscosity, orifice wear, gnomon plumb), table quantization ($R = 3438$), and observational limits (solar penumbra, refraction).
- **Monte Carlo Engine**: Runs 500–1,000 real-time stochastic trials in-browser to plot probability distributions, standard deviations, and 68%/95% confidence bounds.
- **Guided Challenge**: An 8-step pedagogical sequence titled *"Predict an Eclipse Without a Telescope"*, synthesizing all laboratory instruments into a unified scientific narrative.

### 6. Sources & Methodology (`/observe/sources`)
- Complete bibliographic registry of all primary texts, critical editions, commentaries, and scholarly papers.
- Chronological timeline distinguishing the *Vedāṅga Jyotiṣa* period (~1st millennium BCE), Classical Siddhāntas (5th–12th c. CE), the Kerala School (14th–16th c. CE), and early modern masonry observatories like Jantar Mantar (18th c. CE).

---

## Research Rigor & Provenance Labels

Every historical parameter, algorithm, and simulation in Ghaṭikā carries an explicit provenance tag:

- `DOCUMENTED`: Directly attested in primary Sanskrit astronomical treatises or recognized critical translations (e.g. standard 12-*aṅgula* gnomon, $R = 3438$ sine table, Mahāyuga revolution counts).
- `SCHOLARLY INTERPRETATION`: Reconstructions or readings established in modern peer-reviewed history of science literature (e.g. S.R. Sarma, K.S. Shukla, K.V. Sarma, Kim Plofker, David Pingree).
- `ENGINEERING RECONSTRUCTION`: Our numerical implementations built using modern physics and mathematics to bridge textual computational gaps (e.g. RK4 fluid dynamics for clepsydra inflow).
- `MODERN COMPARISON`: High-precision modern ephemeris data (Astronomy Engine / VSOP87 / Stephenson ΔT) used strictly as an independent measurement benchmark.

---

## Design System

- **Palette**: Warm ivory background (`#FEFDF5`), charcoal typography (`#1C1917`), muted stone neutrals, muted indigo (`#4338CA`), saffron accents (`#D97706`), and copper for instruments (`#B87333`).
- **Typography**: Inter for Latin text and Noto Sans Devanagari for original Sanskrit terminology.
- **Pure Vector Graphics**: All celestial bodies, instruments, and diagrams are built purely in SVG and CSS—no raster assets, glowing mandalas, or faux parchment textures.
- **Deterministic Motion**: Animations are driven by physics and geometry, with full `prefers-reduced-motion` compliance.

---

## Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Modern Ephemeris**: [Astronomy Engine](https://github.com/cosinekitty/astronomy) (Don Cross, MIT)
- **Unit Testing**: [Vitest](https://vitest.dev/)

```
anient/
├── src/
│   ├── app/                    # Next.js App Router routes & observatory pages
│   ├── components/
│   │   ├── nav/                # ObservatoryNav navigation bar
│   │   ├── svg/                # Reusable vector instrument components
│   │   └── ui/                 # ProvenanceLabel, SourceTooltip, ModuleLayout, etc.
│   ├── data/                   # Structured source registry & benchmark catalog
│   ├── history/models/         # Independent historical algorithms (Sūrya Siddhānta)
│   └── lib/
│       ├── astronomy/          # Modern ephemeris wrapper, ΔT models & comparison
│       ├── lunar/              # Tithi calculation & lunar nodes
│       ├── solar/              # Gnomon geometry, R=3438 sine table, direction finding
│       ├── time/               # Unit conversions, day reckonings, Ahargaṇa
│       └── water-clock/        # Torricelli fluid dynamics & RK4 simulation engine
├── docs/                       # Research documentation (Phase 0 deliverables)
├── data/                       # Curated benchmark eclipses (1422, 1868, 1898, 1980, 1995)
└── __tests__/                  # Unit test suites (32 tests covering all modules)
```

---

## Getting Started

### Prerequisites
- Node.js 20+ (recommended Node 20, 22, or 25)
- npm or pnpm

### Installation
```bash
git clone <repo-url>
cd anient
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Unit Tests
```bash
npm test
```

### Production Build
```bash
npm run build
npm run start
```

---

## Academic References

1. **Burgess, Ebenezer** (1860). *Translation of the Sūrya-Siddhānta, a Text-Book of Hindu Astronomy*. Journal of the American Oriental Society.
2. **Shukla, K.S. & Sarma, K.V.** (1976). *Āryabhaṭīya of Āryabhaṭa: Critically Edited with Translation*. Indian National Science Academy (INSA).
3. **Sarma, S.R.** (2008). *The Archaic and the Exotic: Studies in the History of Indian Astronomical Instruments*.
4. **Iyengar, R.N., Sudarshan, H.S., & Viswanathan, A.** (2015). *Akṣara the Basic Unit of Time Measure in Ancient India*. Indian Journal of History of Science.
5. **Stephenson, F.R., Morrison, L.V., & Hohenkerk, C.Y.** (2016). *Measurement of the Earth's rotation: 720 BC to AD 2015*. Proceedings of the Royal Society A.
6. **Espenak, F. & Meeus, J.** (2006). *Five Millennium Canon of Solar Eclipses: −1999 to +3000*. NASA Technical Publication.

---

## License
MIT License.
