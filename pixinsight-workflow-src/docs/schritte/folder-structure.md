# Folder Structure

Ich folge im Wesentlichen der [Beschreibung auf Mac Observatory](https://macobservatory.com/organize-astrophotography-data-library-mac/).

Der Ansatz ist eine Objekt-First Ordner-Struktur, der jedoch Jahreszahlen vorangestellt werden.

Ziele meiner Ordnerstruktur sind:

- Erweiterbarkeit über lange Zeiträume
- Übersichtlichkeit
- Multi-Session-Unterstützung
- Kompatibilität zu
    - [Siril](https://siril.org/)
    - [Meridian](https://macobservatory.com/meridian-deep-sky-imaging-catalog/)
    - [Pixinsight](https://pixinsight.com/)

#### Single Session Structure
```text
 2026/
   M42 (Orion's Nebula)/
    SESSION_20260305
      Biases/
      Darks/
      Finals/
      Flats/
      Lights/
        REJECTED/
      Logs/
      PixInsight/
```

#### Multi Session Structure
```text
 2026/
   M97, M108 (Surfboard, Owl)/
    Finals/
    PixInsight/
      SESSION_20260428/
        Biases/
        Flats/
        Lights/
          REJECTED/
        Darks/
      SESSION_20260429/
        Biases/
        Flats/
        Lights/
          REJECTED/
        Darks/
```
