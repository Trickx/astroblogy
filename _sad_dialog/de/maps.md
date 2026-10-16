---
title: "Maps"
menu: "Alle Karten"
section: Maps
order: 35
---
Der Maps-Tab hat einen Unter-Tab pro Karte: [Size](#maps-size), [Shape](#maps-shape), [Coma](#maps-coma) und [Tilt](#maps-tilt).
Über den Unter-Tabs sitzt eine Einstellung, die für alle vier gilt.

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
