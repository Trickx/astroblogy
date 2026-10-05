---
title: "Maps › Size"
menu: "Size"
section: Maps
order: 40
shot: [SAD_Maps_Size.png]
handbook: [tilt, spacing]
---
Die Karte der Sterngröße: die FWHM in einem 11&times;11-Raster, jede Zelle mit der Bildmitte verglichen.
Sie zeigt Bildfeldwölbung, Korrektorabstand und Sensorverkippung als Muster größerer Sterne zum Rand oder zu einer Seite hin.

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

## Legend

### Füllfarben
{: .display}

Das 11×11-Raster zeigt pro Zelle ihre FWHM (25 %-getrimmtes Mittel) in Pixeln und/oder Bogensekunden und ihr Verhältnis zur Mitte (innere 3×3 Zellen): ×1,17 = 17 % größere Sterne als in der Mitte.
Die Füllung folgt dem Verhältnis und seiner Klasse: grün ≤ 1,10 gut (so scharf wie die Mitte oder schärfer), gelb leicht, orange deutlich (um 1,25), rot ≥ 1,50 stark - nur wo sich die Zelle um mindestens 2σ von der Mitte unterscheidet (oder ohnehin gut ist); eine ungefüllte Zelle lässt sich nicht von der Mitte unterscheiden.

Schraffiert, Wert in (Klammern): uncertain - weniger als 5 Sterne oder ein Standardfehler über 10 % des Wertes.

Das Evaluation-Feld nennt die FWHM der Mitte, die Ecken (medianes Verhältnis der 2×2-Eckblöcke: Bildfeldwölbung / Abstand) und die Verkippung (relativer Unterschied der ungleicheren Diagonale, mit ihrer Signifikanz: &lt; 5 % unauffällig, 5-10 % leicht, &gt; 10 % korrekturwürdig).
Die Konsole listet die Details.
Jede Zelle hat nur einen Bruchteil der Sterne: Kippachse und Kippwinkel verwenden die 4 Quadranten.

**Grün oder not significant?**
Grün heißt: Die Zelle ist höchstens 10 % größer als die Mitte - gut, unabhängig vom Rauschen.
*Not significant* (ungefüllt) heißt: Die Zelle sieht mehr als 10 % größer aus, aber der Unterschied zur Mitte ist kleiner als 2&sigma; - eine Verschlechterung ist dort weder belegt noch ausgeschlossen.

**Uncertain oder not significant?**
*Uncertain* (schraffiert) heißt: Die Zelle selbst ist nicht gut genug gemessen - weniger als 5 Sterne oder ein Standardfehler über 10 % - und wird gar nicht beurteilt.
*Not significant* heißt: Die Zelle ist gut gemessen, aber ihr Unterschied zur Mitte liegt im Rauschen.

## FWHM grid: each cell shows

### FWHM in pixels
{: #fwhmPxRadio .option}

Jede Zelle zeigt ihre FWHM in Bildpixeln (3,15 px).

### FWHM in arcseconds
{: #fwhmArcsecRadio .option}

Jede Zelle zeigt ihre FWHM in Bogensekunden (2,07\"), berechnet als 206,265 × Pixelgröße \[µm] / Brennweite \[mm].
Braucht Pixelgröße und Brennweite (Setup › General; beim SuperPixel-Debayern wird automatisch die doppelte Pixelgröße verwendet) - sonst Pixel.

### Ratio to the center
{: #fwhmRatioRadio .option}

Jede Zelle zeigt ihre FWHM relativ zur Mitte (innere 3×3 Zellen): ×1,17 = 17 % größere Sterne als in der Mitte - der Wert, auf dem Füllung und Bewertung beruhen.

### Uncertainty and star count
{: #fwhmGridDetailsCheck .checkbox}

Fügt jeder Zelle eine kleinere Zeile hinzu: ± die 1σ-Unsicherheit ihrer FWHM (ihr Standardfehler, 1,4826 × MAD / √n - nicht die Streuung der Sterne; in Pixeln, oder in Bogensekunden, wenn nur diese angezeigt werden) und *n* = Zahl der Sterne.
Zwei Zellen unterscheiden sich erst dann verlässlich, wenn ihr Unterschied etwa 2-3 × √(σ₁² + σ₂²) übersteigt.

## Evaluation

### Evaluation
{: .display}

Nach Calculate: die FWHM der Mitte, die Zahl der Zellen pro Klasse, die Ecken (Bildfeldwölbung / Abstand), die Verkippung entlang der ungleicheren Diagonale und die Streuung des äußeren Rings.
