---
title: "Der Dialog"
menu: "Übersicht"
order: 10
shot: [SAD_Setup_General.png]
handbook: [stars, limits]
permalink: /pi-scripts/StarAberrationDiagnostics/de/dialog/
---
StarAberrationDiagnostics vermisst die Form jedes Sterns im Bildfeld und macht daraus Karten und eine Bewertung der Optik.
Diese Referenz geht den Dialog Seite für Seite durch und erklärt jede Einstellung; wie die Berechnungen dahinter funktionieren, erklärt das [Handbuch](/pi-scripts/StarAberrationDiagnostics/de/#handbook).

Der Dialog hat zwei Hälften.
**Links** die Vorschau: ohne gewähltes Bild die Tipps für Testaufnahmen, vor dem ersten **Calculate** das Zielbild, danach die Karte des gewählten Maps-Tabs; beim Assessment- und beim Series-Tab stattdessen deren eigene Ergebnisse (Bewertungen, Hinweise und Bericht der Serie).
**Rechts** die Einstellungen in vier Tabs:

- [Setup](setup-general/) - Zielbild, Debayern, Optik und Ausgabe ([General](setup-general/)) sowie Sternerkennung und PSF-Fit ([Star detection](setup-star-detection/)).
- [Maps](maps-size/) - ein Unter-Tab pro Karte: [Size](maps-size/), [Shape](maps-shape/), [Coma](maps-coma/) und [Tilt](maps-tilt/), jeweils mit ihren Ebenen und ihrer Auswertung.
- [Assessment](assessment/) - die Bewertung mit Korrekturvorschlägen und die optionale KI-Auswertung.
- [Series](series/) - mehrere Frames, z. B. vor und nach dem Meridian-Flip, im Vergleich.

### Typischer Ablauf

1. Ein einzelnes, nicht registriertes und nicht beschnittenes Light-Frame öffnen und als Zielbild wählen.
2. Die Optik unter [Setup › General](setup-general/) prüfen (oder aus dem FITS-Header lesen lassen).
3. **Calculate** klicken.
   Die Vorschau zeigt die Karte des gewählten Maps-Tabs; ein Wechsel von Tab oder Ebene zeichnet sie sofort neu, ohne die Sterne erneut zu vermessen.
4. Das [Assessment](assessment/) lesen und die Korrekturen in der angegebenen Reihenfolge abarbeiten.
5. **Save** öffnet die Karten als Bildfenster (dazu CSV und 3D-Plot, wenn aktiviert) und schließt den Dialog.
{: .steps}

## Vorschau

### Zoom-Schaltflächen
{: .display}

Vergrößern, verkleinern, 1:1 und an das Fenster anpassen.
Das Mausrad zoomt ebenfalls; Ziehen verschiebt den Ausschnitt.

### Statuszeile
{: .display}

Der Zoomfaktor und die Bildkoordinaten unter dem Mauszeiger.

## Schaltflächen

### New instance (Dreieck unten links)
{: #newInstanceButton .button}

Legt die aktuellen Einstellungen als Prozess-Icon auf dem Arbeitsbereich ab.
Ein Doppelklick auf das Icon öffnet den Dialog später mit denselben Einstellungen.

**Hinweis:** Das direkte Ziehen auf ein Bild wird für Script-Prozesse in aktuellen PixInsight-Versionen nicht unterstützt.

### Calculate
{: #previewButton .button}

Führt die Analyse mit den aktuellen Einstellungen aus und zeigt eine Karte in der Vorschau - die des gewählten Maps-Tabs (Size, Shape, Coma, Tilt) -, ohne ein Fenster zu öffnen, die CSV-Datei zu exportieren oder den 3D-Plot zu zeichnen.
Ein Wechsel zwischen diesen Tabs wechselt sofort die Karte.
Die PSF-Asymmetrie wird immer gemessen, damit sich die Koma-Ebenen später zuschalten lassen.

Danach lassen sich die Ebenen und ihre Einstellungen ändern, ohne die Sterne neu zu vermessen: Die Vorschau wird sofort neu gezeichnet.
Nur eine Änderung der Erkennungseinstellungen oder des Zielbilds braucht ein neues Calculate.

### Save
{: #applyButton .button}

Öffnet die vier Karten in neuen Fenstern: Star size, Star shape, Coma und Tilt (AberrationSize\_…, AberrationShape\_…, AberrationComa\_…, AberrationTilt\_…), dazu den 3D-Plot und den CSV-Export, wenn aktiviert, und schließt den Dialog.
Die Sternvermessung von Calculate wird wiederverwendet, wenn ihre Erkennungseinstellungen noch aktuell sind.

### Cancel
{: #cancelButton .button}

> Schließt den Dialog ohne Ausgabe.
> Während einer Berechnung heißt die Schaltfläche **Stop** und bricht sie ab.
