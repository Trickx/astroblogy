<img src="../../assets/icons/Blink.svg" alt="Blink Icon" class="step-icon" />

# Blink

<div class="step-icon-clear"></div>

### Fits Blaster
<img src="../../assets/screenshots/FitsBlaster.png" alt="FitsBlaster Screenshot" />

## Beschreibung

[FITS Blaster](https://astrophoto-app.com/) ist ein kostenloses macOS-Programm zur schnellen Qualitätsbewertung und Aussortierung (Culling) von Astrofotografie-Aufnahmen im FITS-Format. Es analysiert automatisch Kennzahlen wie FWHM, Sternanzahl, Exzentrizität und Signal-Rausch-Verhältnis (SNR), um unscharfe oder fehlerhafte Einzelbilder zu erkennen. Anschließend können schlechte Aufnahmen vor dem Stacking bequem ausgewählt und aussortiert werden. 

### Integration in den Workflow

FITS Blaster erzeugt keine eigenen Projektdateien und versucht nicht, PixInsight oder Siril zu ersetzen. Stattdessen dient es als vorgeschaltete Qualitätskontrolle. Aussortierte Frames werden in einen **Rejected**-Ordner verschoben.

### Qualitätsanalyse

Die App berechnet automatisch Qualitätsmetriken direkt aus den FITS-Daten:
- FWHM (Sternschärfe)
- Sternexzentrizität
- SNR (Signal-Rausch-Verhältnis)
- Sternanzahl
- Qualitäts-Score

### Download

[FITS Blaster](https://astrophoto-app.com/)