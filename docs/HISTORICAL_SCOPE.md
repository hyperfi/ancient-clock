# Historical Scope and Period Distinctions

This document outlines the chronological framework for the Ghaṭikā project. It is crucial to understand that "Indian astronomy" is not a monolithic tradition; it evolved dynamically over at least two millennia, encompassing diverse mathematical models, observational paradigms, and conceptual frameworks. The Ghaṭikā project strictly distinguishes between these periods and models to avoid anachronism and false conflation.

## 1. Chronological Framework

### Vedāṅga Jyotiṣa Period (~1st millennium BCE)
- **Context**: The earliest known Indian astronomical text.
- **Characteristics**: Primarily a calendrical and ritual timing text rather than a mathematical astronomy treatise.
- **Time Units**: Employs non-sexagesimal time units (the *mātrā*, *kāṣṭhā*, *kalā* system).
- **Cycles**: Uses a 5-year *yuga* cycle, distinct from the vast *mahāyuga* cycles of later periods.
- **Mathematics**: Exhibits limited mathematical sophistication compared to the later *siddhānta* texts.
- **Dating**: The dating of the text is disputed in modern scholarship, and it is likely a composite text containing layers from different periods.

### Classical Siddhānta Period (~5th-12th century CE)
This era represents the golden age of Indian mathematical astronomy (*gaṇita*).

- **Āryabhaṭa (b. 476 CE)**
  - Author of the *Āryabhaṭīya* (c. 499 CE).
  - Posited that the Earth rotates on its axis.
  - Employed a midnight epoch (*ardharātrika*) referenced to the Laṅkā meridian.
  - Used R=3438 and calculated a sine table as first differences.
  - Developed methods for eclipse prediction based on natural shadow geometry.
  - Set the Kali Yuga epoch at midnight on February 17/18, 3102 BCE.
  - Primary text reference: The INSA critical edition by Shukla & Sarma (1976).

- **Varāhamihira (c. 505-587 CE)**
  - Author of the *Pañcasiddhāntikā*, a vital compendium summarizing five distinct astronomical systems.
  - Documents the "old" *Sūrya Siddhānta* (the original text of which is largely lost).
  - Demonstrates a comparative, pluralistic approach to different astronomical traditions.

- **Brahmagupta (598-668 CE)**
  - Author of the *Brāhmasphuṭasiddhānta* (628 CE).
  - Notable for criticizing Āryabhaṭa's model of a rotating Earth.
  - Made highly significant mathematical contributions and refined eclipse computation methods.

- **Bhāskara I (c. 600-680 CE)**
  - Authored a crucial commentary on the *Āryabhaṭīya*.
  - Discussed the *guru-akṣara* time calibration method.
  - Provided worked examples that are essential for interpreting Āryabhaṭa's cryptic, condensed verses.

- **Bhāskara II (1114-1185 CE)**
  - Author of the *Siddhānta Śiromaṇi*.
  - Refined the mathematics of gnomon/shadow problems and advanced eclipse computation.

- **The Surviving Sūrya Siddhānta**
  - **Dating Controversy**: The dating of the surviving text is disputed.
  - Modern scholarly consensus (e.g., Pingree, Plofker) generally dates the core of the received text to ~800 CE.
  - It must be viewed as a "living document" revised over several centuries.
  - Crucially, the version summarized by Varāhamihira differs substantially from the surviving text, indicating multiple revision layers.
  - Historically, it became the practical standard for Indian almanacs (*pañcāṅgas*).

### Kerala School (~14th-16th century)
- **Parameśvara (c. 1380-1460)**: Conducted 55 years of systematic eclipse observations and created the *Dṛgganita* ("computation according to observation").
- Key figures include Mādhava, Nīlakaṇṭha, and others.
- Known for developing infinite series for $\pi$ and trigonometric functions.
- Represents a distinct scholarly shift toward empirical verification and observational correction of inherited parameters.

### Later Observational Period (~17th-18th century)
- Characterized by the Jantar Mantar observatories constructed by Jai Singh II in the early 18th century.
- Utilized massive masonry instruments.
- This period is chronologically much later than the classical *siddhānta* traditions.
- Represents the early modern period, and should absolutely **not** be classified as "ancient."

---

## 2. Scope of the MVP

The Minimum Viable Product (MVP) of the Ghaṭikā project focuses on the following:

- **Time Measurement**: Implementing systems universal across periods.
- **Water Clock Model**: Simulating the sinking bowl water clock (documented in multiple texts).
- **Gnomon Methods**: Reconstructing shadow computations based on *Sūrya Siddhānta* Chapter 3 and the *Āryabhaṭīya*.
- **Tithi System**: Implementing the lunar day calculations of *siddhānta* astronomy.
- **Eclipse Algorithm**: We implement the **Sūrya Siddhānta** model for eclipses because:
  - It contains the most complete and accessible eclipse computation chapters (Chapters 4, 5, 6).
  - The Burgess translation provides a detailed English exposition of the mathematics.
  - It became the standard practical system historically.
  - Constants and procedures are well-documented for implementation.
  - *Note: The UI and documentation will explicitly note the text's dating controversy.*

---

## 3. Disambiguation Rules

To maintain academic rigor, the project adheres to the following explicit rules:

1. **Do not** call *siddhānta* astronomy "Vedic."
2. **Do not** call the Jantar Mantar observatories "ancient."
3. **Do not** imply all Indian astronomers agreed; clearly note debates (e.g., Brahmagupta's criticism of Āryabhaṭa).
4. **Do not** flatten a 2000-year evolving tradition into a single monolithic period.
5. **Do not** assign the surviving *Sūrya Siddhānta* a single, definitive date without scholarly qualification.
6. **Always** distinguish between computational traditions (textual algorithms) and observational traditions.

---

## 4. Provenance Labels

To ensure transparency regarding historical authenticity versus modern interpretation, every historical algorithm or instrument simulated in the app must carry one of the following provenance labels. These labels must appear unobtrusively in the UI and are never mixed silently within a single computation:

- **DOCUMENTED**: Directly stated in a primary text or reliable translation.
- **SCHOLARLY INTERPRETATION**: A reconstruction accepted or discussed in academic literature.
- **ENGINEERING RECONSTRUCTION**: Our numerical implementation using modern physics to simulate a historical device or phenomenon.
- **MODERN COMPARISON**: A present-day astronomical result used only as a benchmark against historical values.
