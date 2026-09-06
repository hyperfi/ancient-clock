# Ghaṭikā Claims Ledger

This is a structured register of historical claims made within the Ghaṭikā application. Each claim includes its sources, provenance type, confidence level, and how it impacts the application's implementation.

## Provenance Labels
* **DOCUMENTED**: Directly stated in a primary text or reliable translation.
* **SCHOLARLY INTERPRETATION**: A reconstruction accepted or discussed in academic literature.
* **ENGINEERING RECONSTRUCTION**: Our numerical implementation using modern physics.
* **MODERN COMPARISON**: A present-day astronomical result used only as a benchmark.

---

### CLAIM 001: One nāḍikā/ghaṭikā equals 1/60 of a day
* **Claim**: In siddhāntic astronomy, 60 nāḍikās (ghaṭikās) = 1 ahorātra (day and night, ~24 hours)
* **Sources**: Sūrya Siddhānta Ch.14; Āryabhaṭīya Kālakriyāpāda; consistent across all classical siddhānta texts
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Base conversion: 1 ghaṭikā = 1440/60 = 24 modern minutes
* **Notes**: The term ghaṭikā and nāḍikā are synonymous in this context. The term daṇḍa is also used as a synonym in some texts.

### CLAIM 002: One pala/vināḍī equals 1/60 of a ghaṭikā
* **Claim**: 60 palas (vināḍīs) = 1 ghaṭikā
* **Sources**: Standard in siddhāntic texts
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: 1 pala = 24 seconds
* **Notes**: Terms pala, vināḍī, and vighaṭī are used as equivalents across different texts/traditions.

### CLAIM 003: One muhūrta = 2 ghaṭikās = 1/30 day
* **Claim**: 30 muhūrtas = 1 day, therefore 1 muhūrta = 48 minutes
* **Sources**: Consistent across Vedāṅga Jyotiṣa and siddhānta traditions
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: 1 muhūrta = 48 minutes = 2 ghaṭikās

### CLAIM 004: The Vedāṅga Jyotiṣa uses a different sub-unit system
* **Claim**: The VJ uses mātrā, kāṣṭhā, kalā system which differs from the siddhāntic pala/vināḍī system
* **Sources**: Vedāṅga Jyotiṣa text; scholarly analysis
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: The Convention selector must distinguish VJ from siddhāntic time units
* **Notes**: 10 mātrās = 1 kāṣṭhā, 124 kāṣṭhās = 1 kalā, ~10 kalās = 1 nāḍikā

### CLAIM 005: The prāṇa equals approximately 4 seconds
* **Claim**: 1 prāṇa (respiration) = 4 seconds, 6 prāṇas = 1 pala
* **Sources**: Siddhāntic texts; Bhāskara I's commentary
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Smallest commonly used practical time unit = 4 seconds

### CLAIM 006: The guru-akṣara as a time calibration unit
* **Claim**: Recitation of 60 guru-akṣaras (long/heavy syllables) at middling speed takes approximately 1 pala (24 seconds)
* **Sources**: Bhāskara I's commentary on Āryabhaṭīya Kālakriyāpāda 2; S.R. Sarma "Measuring Time with Long Syllables"; R.N. Iyengar et al. "Akṣara the Basic Unit of Time Measure"
* **Source Type**: DOCUMENTED (for the textual claim), SCHOLARLY INTERPRETATION (for modern experimental verification)
* **Confidence**: High
* **Implementation**: Acoustic calibration feature; 60 akṣaras → 24s target
* **Notes**: Modern experimental verification confirmed the ~24 second duration

### CLAIM 007: Āryabhaṭa used midnight epoch; most other texts use sunrise
* **Claim**: Āryabhaṭa's ardharātrika system begins the astronomical day at midnight at Laṅkā, while the audayika system (used by SS and most practical almanacs) begins at sunrise
* **Sources**: Āryabhaṭīya Kālakriyāpāda; scholarly analysis (Shukla & Sarma)
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Day-reckoning selector must offer both midnight and sunrise conventions

### CLAIM 008: Kali Yuga epoch = February 18, 3102 BCE (Julian)
* **Claim**: The computational epoch used by siddhāntic astronomy corresponds to this Julian date
* **Sources**: Standard astronomical computation; Āryabhaṭīya; Sūrya Siddhānta
* **Source Type**: DOCUMENTED
* **Confidence**: High (for the computational correspondence)
* **Implementation**: Ahargaṇa computation base date
* **Notes**: This is a computed/extrapolated astronomical epoch, not a historical event. At this epoch, all planets were assumed to be in mean conjunction at 0° Aries.

### CLAIM 009: The standard gnomon height is 12 aṅgulas
* **Claim**: Classical Indian astronomical texts prescribe a gnomon of 12 aṅgulas (finger-widths)
* **Sources**: Sūrya Siddhānta Ch.3; widely consistent across texts
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Default gnomon height in simulation

### CLAIM 010: Equal-shadow circle method determines cardinal directions
* **Claim**: A circle drawn around a gnomon, with morning and afternoon shadow-tip crossings marked, yields the E-W line. The fish-figure (timi) bisection yields the N-S meridian.
* **Sources**: Sūrya Siddhānta Ch.3 (Triprasna); also in other siddhānta texts
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Interactive direction-finding exercise
* **Notes**: Later commentators (Bhāskara II, Nīlakaṇṭha) noted the declination limitation and introduced corrections (aprama)

### CLAIM 011: Latitude from equinox noon shadow
* **Claim**: At equinox, noon shadow length of a gnomon directly yields the observer's latitude through: latitude = arctan(shadow/gnomon)
* **Sources**: Sūrya Siddhānta Ch.3; general siddhāntic gnomon theory
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Latitude determination experiment
* **Notes**: At equinox, solar declination ≈ 0, so zenith distance = latitude

### CLAIM 012: Sinking-bowl water clock is documented with specific dimensions
* **Claim**: A copper hemispherical bowl, 6 aṅgulas deep, 12 aṅgulas diameter, weighing 10 palas, with hole pierced by gold needle of 8 aṅgulas length and 1 pala weight, sinks 60 times per day
* **Sources**: Classical astronomical texts (specific verse citations to be verified during implementation)
* **Source Type**: DOCUMENTED
* **Confidence**: Medium-High
* **Implementation**: Historical mode water clock parameters
* **Notes**: S.R. Sarma notes no single universal set of dimensions; these are from one tradition. The gold needle specification gives the hole size indirectly.

### CLAIM 013: A tithi equals 12° of lunar elongation
* **Claim**: A tithi is defined as the time for the Moon-Sun angular separation to increase by 12°. 30 tithis = 1 synodic month.
* **Sources**: Āryabhaṭīya; Sūrya Siddhānta; standard across siddhāntic astronomy
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Tithi Explorer visualization

### CLAIM 014: Tithi duration is variable (19-26 hours)
* **Claim**: Because the Moon's angular velocity varies (elliptical orbit), a tithi's duration in hours is not constant
* **Sources**: Inherent in the astronomical definition; discussed in siddhāntic texts
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Show tithi duration variation in Tithi Explorer

### CLAIM 015: The surviving Sūrya Siddhānta dates to approximately 800 CE
* **Claim**: The text as we have it is generally dated to ~800 CE, with possible earlier and later layers
* **Sources**: David Pingree; Kim Plofker (Mathematics in India, 2009); multiple scholars
* **Source Type**: SCHOLARLY INTERPRETATION
* **Confidence**: Medium (scholarly consensus exists but dating is inherently approximate)
* **Implementation**: Must state dating controversy in Sources page; never assign single date without qualification
* **Notes**: The "old" SS summarized by Varāhamihira (6th c.) differs from the surviving text. It is a "living document" revised over centuries.

### CLAIM 016: Parameśvara conducted 55 years of systematic eclipse observations
* **Claim**: The Kerala astronomer Parameśvara (c. 1380-1460) observed eclipses systematically from 1393-1448 from Alattur
* **Sources**: K.V. Sarma's critical editions of Parameśvara's works (Dṛgganita, Grahaṇamaṇḍana)
* **Source Type**: DOCUMENTED / SCHOLARLY INTERPRETATION
* **Confidence**: High
* **Implementation**: Historical context; benchmark eclipse dataset; future Dṛgganita model

### CLAIM 017: The SS sine table uses R=3438
* **Claim**: Both the Sūrya Siddhānta and Āryabhaṭīya use a trigonometric circle with R=3438, derived from circumference=21,600 minutes of arc
* **Sources**: Both texts; extensive scholarly analysis
* **Source Type**: DOCUMENTED
* **Confidence**: High
* **Implementation**: Core of all trigonometric computations in historical models

### CLAIM 018: Temperature affects water clock accuracy significantly
* **Claim**: Water viscosity varies with temperature, causing seasonal timing drift in water clocks
* **Sources**: Modern physics (NOT historically documented as such)
* **Source Type**: ENGINEERING RECONSTRUCTION / MODERN SENSITIVITY EXPERIMENT
* **Confidence**: High (physics is well-established)
* **Implementation**: Sensitivity analysis in Accuracy Lab
* **Notes**: We do NOT claim historical astronomers understood viscosity in modern terms. Practical seasonal adjustments are plausible but not specifically documented as temperature-based.

### CLAIM 019: Āryabhaṭa's sidereal day accuracy is within 0.1 seconds
* **Claim**: Āryabhaṭa's computed length of the sidereal day differs from the modern value by less than 0.1 seconds
* **Sources**: Modern scholarly comparison; widely cited
* **Source Type**: MODERN COMPARISON
* **Confidence**: High
* **Implementation**: Displayed as accuracy metric in Sources page

### CLAIM 020: ΔT uncertainty grows quadratically for ancient dates
* **Claim**: The difference between Terrestrial Time and Universal Time (ΔT) becomes increasingly uncertain for ancient dates, reaching several minutes for 500 CE and over an hour for 1000 BCE
* **Sources**: Stephenson, Morrison, Hohenkerk (2016); Espenak & Meeus (2006)
* **Source Type**: MODERN COMPARISON
* **Confidence**: High
* **Implementation**: Must display ΔT uncertainty alongside all modern eclipse reconstructions for ancient dates

---
*This ledger is a living document. Claims will be added, revised, or removed as research progresses. Every claim must have documented provenance before it appears in the application.*
