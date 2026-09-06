# Ghaṭikā: Research and Source Review Documentation

## 1. Project Purpose

Ghaṭikā is an interactive laboratory designed to simulate and explore ancient Indian timekeeping and astronomy. The purpose of this project is not merely to visualize these concepts, but to present them through the lens of a rigorous, historically accurate, and scientifically grounded framework. 

By building this interactive environment, we aim to bridge the gap between historical texts and modern astronomical computational methods. Maintaining academic rigor is crucial; the project treats the material strictly as a history of quantitative science rather than engaging in unsourced civilizational boasting. As such, establishing a solid foundation of primary sources, recognized scholarly interpretations, and transparent engineering methodologies is essential to ensure the integrity and educational value of the simulations.

## 2. Primary Textual Sources

### Sūrya Siddhānta
The *Sūrya Siddhānta* is a foundational text of Indian astronomy, yet it presents significant historiographical challenges due to its nature as a "living document" revised over nearly a millennium.
*   **Dating and Evolution:** The original or "old" *Sūrya Siddhānta* (summarized by Varāhamihira in the *Pañcasiddhāntikā*, ~6th c. CE) is largely lost. The surviving text represents a heavily revised version generally dated to around **800 CE**, with later medieval interpolations. It is inaccurate to assign a simplistic ancient date to the current text (Pingree, Plofker).
*   **Key Chapters:**
    *   Ch. 3 (*Triprasna*): Direction, place, and time.
    *   Ch. 4 & 6: Lunar eclipses and eclipse projection (graphical methods).
    *   Ch. 5: Solar parallax (*Candra Lambana*).
    *   Ch. 13: Instruments, including the water clock (*kapāla-yantra/jala-yantra*) and gnomon (*śaṅku*).
    *   Ch. 14: Nine measures of time (Brahma, Daiva/Divya, Prājāpatya/Mānava, Pitrya, Saura, Sāvana, Chāndra, Ārksha, Guru).
*   **Astronomical Model:** Employs a geocentric model and a *jyā* (sine) based system with R=3438. The epoch is set at the start of the Kali Yuga, deriving mean motions via *Mahāyuga* revolutions.
*   **Eclipse Algorithm:** Calculates true longitudes of the Sun and Moon, the Earth's shadow (*Chāyā*), and eclipse phases (obscuration/*grasa*, half-duration/*sthityardha*). Solar eclipses include parallax corrections.
*   **Translations:** Ebenezer Burgess's translation (1860, published in JAOS) remains a standard English reference, though it reflects colonial-era interpretive limitations and relies on a medieval recension. Bapu Deva Sastri published another translation alongside Lancelot Wilkinson in 1861.

### Āryabhaṭīya
Authored by Āryabhaṭa, this text is a succinct, highly influential treatise marking a major shift in Indian mathematical astronomy.
*   **Dating:** Āryabhaṭa was born in 476 CE and wrote the *Āryabhaṭīya* c. 499 CE.
*   **Editions:** The INSA Critical Edition (1976) by K.S. Shukla and K.V. Sarma (3 volumes) is the definitive landmark publication.
*   **Structure:** Comprises 121 verses across four *pādas*: *Gītikāpāda* (constants, sine table, alphabetic numerals), *Gaṇitapāda* (mathematics), *Kālakriyāpāda* (time reckoning, mean motions), and *Golapāda* (spherical astronomy, eclipses).
*   **Key Innovations:** 
    *   Proposes that the Earth rotates on its axis (using the analogy of a person in a moving boat), contrasting with the *Sūrya Siddhānta*'s stationary Earth model.
    *   Attributes eclipses to natural shadows rather than the mythological entity Rāhu.
    *   Presents a sine table using 24 first differences at 3°45' intervals (R=3438).
    *   Calculates π to ≈ 3.1416 and estimates the Earth's circumference to ≈ 39,968 km (within 0.2% of the modern value).
*   **Time Reckoning:** Employs a midnight epoch (*ardharātrika* system) at the prime meridian of Laṅkā. The Kali Yuga epoch is defined as midnight Feb 17/18, 3102 BCE. A *Mahāyuga* equals 4,320,000 solar years.
*   **Commentary:** Bhāskara I's 7th-century commentary is crucial, expanding Āryabhaṭa's cryptic aphorisms into actionable algorithms with worked examples, including discussions on time measurement via *guru-akṣara* recitation.

## 3. Scholarly Literature

Modern scholarship provides critical context, translations, and interpretations necessary to understand these ancient texts.

*   **K.S. Shukla & K.V. Sarma:** Key figures associated with the Indian National Science Academy (INSA), responsible for critical editions of the *Āryabhaṭīya* and extensive analyses of mathematical astronomy and observational records (e.g., Parameśvara's work).
*   **S.N. Sen:** Provided extensive bibliographies and critical studies through INSA.
*   **S.R. Sarma:** The foremost authority on historical Indian astronomical instruments. Extensively documented the *ghaṭikā-yantra* (water clock), noting the absence of universal dimensions and detailing acoustic calibration methods.
*   **David Pingree & Kim Plofker:** Leading historians of the exact sciences in antiquity, whose work is essential for understanding the transmission, evolution, and dating controversies of texts like the *Sūrya Siddhānta*.
*   **R.N. Iyengar et al.:** Conducted experimental verifications of timekeeping practices, such as acoustically calibrating the water clock using the *guru-akṣara* metric.

## 4. Source Evaluation Methodology

To maintain absolute clarity regarding the origin of the information presented in the Ghaṭikā simulations, all claims, models, and constants are tagged with one of the following provenance labels:

*   **DOCUMENTED:** A claim, parameter, or method directly stated in a primary text or established in a reliable critical translation (e.g., "The *Sūrya Siddhānta* states R=3438").
*   **SCHOLARLY INTERPRETATION:** A reconstruction, theory, or reading that is accepted or actively discussed in peer-reviewed academic literature, bridging the gaps in cryptic primary texts.
*   **ENGINEERING RECONSTRUCTION:** Our specific numerical implementation or simulation code built to operationalize historical algorithms using modern physics and programming.
*   **MODERN COMPARISON:** Present-day astronomical results (e.g., JPL DE441 ephemerides) used strictly as a benchmark to evaluate the accuracy of ancient algorithms, not to claim the ancients possessed modern knowledge.

## 5. Modern Astronomical References

To validate historical algorithms and provide the **MODERN COMPARISON** benchmarks, the following tools and standards are utilized:

*   **Astronomy Engine (Don Cross):** Recommended for browser-based applications (MIT license, JS/TS). Based on VSOP87, handles dates thousands of years in the past, and computes local eclipse contact times and magnitudes with ~1 arcminute accuracy.
*   **VSOP87 & JPL DE441:** VSOP87 offers ~1 arcsecond accuracy and is public domain. JPL DE441 is the gold standard but requires backend API usage (e.g., Horizons API) due to its size. (Note: Swiss Ephemeris is avoided due to AGPL licensing issues).
*   **ΔT (TT − UT1):** Crucial for historical eclipses. Uncertainty grows quadratically going back in time (several minutes at 500 CE; over an hour at 1000 BCE). Uses Espenak-Meeus (2006) polynomials, referencing Stephenson, Morrison, Hohenkerk (2016).
*   **NASA Five Millennium Canon:** Data from Espenak & Meeus (-1999 to +3000) is used as a machine-readable reference for long-term eclipse evaluation.
*   **Historical Benchmark Eclipses:**
    1. Parameśvara's dataset (1393-1448 CE, Kerala) — for comparison with the *Dṛgganita* system.
    2. August 18, 1868 (Total Solar, Guntur).
    3. January 22, 1898 (Total Solar, central India).
    4. February 16, 1980 (Total Solar, Southern India).
    5. October 24, 1995 (Total Solar, Northern India).

## 6. Detailed Reconstructions & Sub-topics

### Water Clocks (*Ghaṭikā-yantra*)
*   **Mechanism:** Sinking bowl (inflow) type predominates over outflow types due to better linearity.
*   **Parameters [DOCUMENTED]:** According to various texts, common dimensions include a copper (*tāmra*) vessel weighing 10 *palas*, height 6 *aṅgulas*, top diameter 12 *aṅgulas* (hemispherical). The orifice is pierced by a gold needle 8 *aṅgulas* long weighing 1 *pala* (estimated ~1mm diameter).
*   **Calibration:** Immerses 60 times in a day and night (SS Ch.13 v.23). Acoustically calibrated: reciting 60 *guru-akṣaras* at "middling speed" = 1 *pala* (24s). R.N. Iyengar verified 3600 *guru-akṣaras* ≈ 24 minutes = 1 *ghaṭikā*.
*   **Error Sources:** Water temperature/viscosity (most significant), surface tension at the tiny orifice, necessitating seasonal calibration.

### Gnomon (*Śaṅku*)
*   **Methodology:** Standard height is 12 *aṅgulas*. The equal-shadow method is used to determine the N-S meridian.
*   **Calculations:** 
    *   Latitude derived from equinox noon shadow.
    *   Time derived from *iṣṭa* (current) shadow by calculating altitude, then hour angle (*nata*), then converting to *ghaṭīs/vighaṭīs*.
*   **Error Sources:** Penumbra (Sun's ~0.5° diameter blurs the shadow tip), ground leveling, and verticality. While monumental instruments like those at Jantar Mantar achieve high precision, a 12-*aṅgula* gnomon is physically limited. Later commentators (Bhāskara, Nīlakaṇṭha) introduced corrections for declination changes during the day.

### Indian Time Units and Calendrics
*   **Hierarchy [DOCUMENTED]:** 1 *Prāṇa* (4s) → 6 *Prāṇas* = 1 *Pala/Vināḍī* (24s) → 60 *Palas* = 1 *Nāḍikā/Ghaṭikā* (24min) → 60 *Ghaṭikās* = 1 *Ahorātra* (24h). 2 *Ghaṭikās* = 1 *Muhūrta* (48 min).
*   **Acoustic Sub-units:** *Guru-akṣara* = 0.4s = 1 *Vipala*.
*   **Tithi:** A 12° increment in Moon-Sun elongation. Variable duration (19-26 hours). Required calculation of true longitudes, handling lost (*kṣaya*) and added (*vṛddhi*) *tithis* in the civil calendar.
*   **Lunar Nodes:** Rāhu and Ketu cycle in ~18.6 years. Recognizing the distinction between mean and true motion was critical for eclipse prediction.

## 7. Gaps and Limitations

To maintain academic honesty, the following gaps in historical knowledge and simulation limitations must be acknowledged:

*   **Physical Artifacts:** Very few original ancient astronomical instruments survive. Our physical parameters rely heavily on textual prescriptions, which vary between sources and may represent idealized rather than practical dimensions.
*   **Textual Integrity:** Given the continual revision of the *Sūrya Siddhānta*, pinpointing the exact mathematical procedures used in specific early centuries is impossible. We are modeling the text as it survived into the medieval period.
*   **Observational Data:** Systematic observational records from antiquity are scarce. Parameśvara's 15th-century dataset is a rare exception. We lack insight into the day-to-day observational corrections applied by earlier astronomers.
*   **Algorithm Drift:** Research indicates ancient eclipse algorithms show a systematic bias toward false positives and their accuracy drifts over centuries because they lacked modern ΔT (secular deceleration of Earth's rotation) corrections.
*   **Interpretation:** Translating poetic, cryptic Sanskrit verses into concrete mathematical algorithms occasionally requires scholarly conjecture. Where multiple valid interpretations exist, the simulation must select one (noted as SCHOLARLY INTERPRETATION or ENGINEERING RECONSTRUCTION) which may not be definitive.
