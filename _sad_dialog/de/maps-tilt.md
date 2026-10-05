---
title: "Maps › Tilt"
menu: "Tilt"
section: Maps
order: 70
shot: [SAD_Maps_Tilt.png]
handbook: [tilt]
---
Die Tilt-Karte im Stil von Siril (*Show tilt*): die mittlere FWHM der vier Quadranten als Viereck, dazu die Kippachse.

## Über allen Karten-Tabs

### Show
{: #mapSourceCombo .list}

- Target image (Calculate)
- Series static: *group* (*n* frames)

**Target image (Calculate)**: das von Calculate vermessene Bild - um die Einstellungen an einem Frame zu prüfen, bevor eine Serie läuft.

**Series static**: nach Analyze series die Sterne aller Frames (oder einer Seite des Flips) zusammengelegt.
Jedem Frame wird seine dynamische Nachführung abgezogen (sein eigener gleichförmiger Anteil abzüglich des Mittels der Gruppe) und seine FWHM auf die mediane Mitten-FWHM skaliert, sodass das Seeing herausfällt: Übrig bleibt, was am Sensor festsitzt - die Optik, dazu eine konstante Nachführung, die sich mit nur einem Kamerawinkel nicht von Astigmatismus auf der Achse trennen lässt.
Mit n Frames sind die Standardfehler etwa √n-mal kleiner.
Der Hintergrund ist dunkel: Die zusammengelegten Sterne gehören zu keinem einzelnen Frame.

## Tilt axis

### Show tilt axis
{: #tiltAxisCheck .checkbox}

Zeichnet die hellblaue Kippachse durch die Sensormitte, abgeleitet aus der FWHM-Auswertung der 4 Quadranten, mit Beschriftung von Winkel und Richtung.

### Die Karte lesen
{: .display}

Das gelbe Viereck ist Sirils „Show tilt“ (ccd-inspector.c) nachgebildet: ein Eckpunkt pro Bildquadrant, sein Abstand von der Mitte proportional zur Abweichung der mittleren FWHM dieses Quadranten vom Mittel aller vier.
Gröber als das 11×11-Raster von Star size, aber jeder Quadrant hat ein Viertel aller Sterne.
Die hellblaue Kippachse läuft durch die Sensormitte entlang des steilsten Anstiegs der Ebene durch die vier Quadranten.

## Evaluation

### Evaluation
{: .display}

Nach Calculate: die FWHM der vier Quadranten, die Verkippung und - mit Pixelgröße, Brennweite und Öffnung - &Delta;z und der Kippwinkel.
