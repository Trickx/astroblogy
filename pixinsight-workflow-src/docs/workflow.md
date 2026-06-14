# Workflow

Diese Seite dient als Vorlage fuer deinen PixInsight-Prozess.
Die Reihenfolge ist auf einen typischen OSC-Workflow in PixInsight abgestimmt.

## Schrittseiten

1. [Blink (Frame-Check)](schritte/blink.md)
2. [Weighted Batch Preprocessing](schritte/weighted-batch-preprocessing.md)
3. [Fast Batch Preprocessing (optional)](schritte/fast-batch-preprocessing.md)
4. [Dynamic Background Extraction](schritte/dynamic-background-extraction.md)
5. [GraXpert (optional)](schritte/graxpert.md)
6. [Gradient Correction (optional)](schritte/gradient-correction.md)
7. [Multiscale Gradient Correction (optional)](schritte/multiscale-gradient-correction.md)
8. [Background Neutralization](schritte/background-neutralization.md)
9. [BlurXTerminator Correct Only (optional)](schritte/blur-xterminator-correct-only.md)
10. [Image Solver](schritte/image-solver.md)
11. [Spectrophotometric Color Calibration](schritte/spectrophotometric-color-calibration.md)
12. [Photometric Color Calibration (optional)](schritte/photometric-color-calibration.md)
13. [NoiseXTerminator](schritte/noise-xterminator.md)
14. [BlurXTerminator](schritte/blur-xterminator.md)
15. [StarXTerminator](schritte/star-xterminator.md)
16. [StarComposer](schritte/star-composer.md)
17. [Multiscale Adaptive Stretch](schritte/multiscale-adaptive-stretch.md)

## 1. Datenvorbereitung

1. Lights, Darks, Flats, Bias erfassen
2. Frames pruefen und aussortieren
3. Dateistruktur pro Objekt anlegen

## 2. Kalibrierung und Integration

1. `WeightedBatchPreprocessing` konfigurieren
2. Kalibrierte Einzelbilder kontrollieren
3. Integration je Kanal oder OSC durchfuehren

## 3. Lineare Bearbeitung

1. Background-Extraktion (`ABE` oder `DBE`)
2. Rauschreduktion im linearen Zustand
3. Farbkalibrierung (`SPCC`/`PCC`)

## 4. Nichtlineare Bearbeitung

1. Histogramm-Transformation
2. Kontrast, Sättigung, lokale Schärfung
3. Sterne reduzieren oder separieren (optional)

## 5. Finalisierung

1. Beschnitt und Komposition
2. Export als TIFF/PNG/JPEG
3. Projektnotizen und Prozessparameter dokumentieren

## Checkliste

- [ ] Alle Master-Frames aktuell
- [ ] Referenzbild dokumentiert
- [ ] Prozesssymbole gespeichert
- [ ] Finale Exportparameter notiert
