---
title: "Maps › Coma"
menu: "Coma"
section: Maps
order: 60
shot: [SAD_Maps_Coma.png]
handbook: [coma]
---
Die Koma-Karte: auf welcher Seite jedes Sterns sein Schweif sitzt.
Unter- und überkorrigierte Koma, ein dezentrierter Korrektor und die Kollimation eines Spiegelteleskops zeigen sich hier, mit dem komafreien Punkt.

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

## Coma field

### Measure PSF asymmetry (coma direction, coma-free point)
{: #measureAsymmetryCheck .checkbox}

Gauß- und Moffat-Fits sind punktsymmetrisch und können nicht zeigen, auf welcher Seite des Kerns ein Komaschweif sitzt.
Diese Option misst den Flussschwerpunkt und das dritte Moment jedes Sterns direkt auf den Pixeln relativ zum Zentrum des PSF-Fits, zeichnet die mediane Schweifrichtung auf einem groben Raster (orange Pfeile), fittet das Komafeld v = k·(P − P0) und markiert den komafreien Punkt P0 (magenta) mit seiner Bootstrap-Unsicherheit.
Kostet einige Sekunden Laufzeit.

### Show coma streamlines (orange with arrows)
{: #comaStreamlinesCheck .checkbox}

Stromlinien durch das geglättete Feld der PSF-Asymmetrie (Schweifrichtung) statt der Ellipsenausrichtung.
Anders als die Stromlinien der Streckung haben sie eine echte Richtung (Pfeilspitzen) und enden, wo die Koma schwach wird.
Unterkorrigierte Koma: Die Linien laufen vom komafreien Punkt auseinander (Quelle); überkorrigiert: Sie laufen auf ihn zu (Senke).
Abweichungen von geraden radialen Linien zeigen, was ein einfaches Komamodell nicht kann, z. B. einen verkippten Korrektor.
Braucht „Measure PSF asymmetry“.

### Smoothing radius (%)
{: #comaStreamlineRadiusSpin .number}

Glättungsradius des Asymmetriefelds, in % der Bilddiagonale.
Die Asymmetrie einzelner Sterne ist viel verrauschter als die Ellipsenausrichtung, deshalb sollte dieser Radius größer sein als der für die Stromlinien der Streckung (Voreinstellung: etwa doppelt so groß).

### Stop below (%)
{: #comaStreamlineMinSpin .number}

Eine Linie endet, wo die geglättete Asymmetrie unter diesen Prozentsatz der Feldstärke fällt (90.
Perzentil über die Startpunkte).
Höher = nur die deutlich komatischen Bereiche, niedriger = die Linien reichen weiter in die komafreie Zone (verrauschter).

### Show coma arrows (median per grid cell, length = strength)
{: #comaArrowsCheck .checkbox}

Orange Pfeile auf einem 9×6-Raster mit der medianen Schweifrichtung pro Zelle.
Anders als bei den Stromlinien zeigt ihre Länge direkt die Stärke.
Braucht „Measure PSF asymmetry“.

## Per-star arrows

### Show one asymmetry arrow per star
{: #starAsymArrowsCheck .checkbox}

Zeichnet die gemessene Schweifrichtung jedes Sterns als Pfeil vom Sternzentrum (Länge = Stärke, skaliert mit der Vector scale), für einen Vergleich Stern für Stern mit den Ellipsen.
Standardfarbe: Übereinstimmung mit der Ellipsenachse - grün = parallel (Koma formt den Stern), rot = senkrecht (Streckung durch Defokus, Bildfeldwölbung oder Astigmatismus), grau = Stern fast rund.
Pfeile unter der Schwelle werden ausgeblendet.
Braucht „Measure PSF asymmetry“.

### Min. strength (sigma)
{: #starAsymMinSpin .number}

Die Asymmetrie einzelner Sterne ist verrauscht.
Ihr Rauschen wird aus dem inneren Feld geschätzt, wo die Koma nahe null ist; nur Pfeile, die stärker als so viele Sigma sind, werden gezeichnet. 0 = alle zeichnen.

### Color by strength instead of alignment
{: #starAsymColorCheck .checkbox}

> Färbt die Pfeile der einzelnen Sterne nach ihrer Stärke statt nach ihrer Übereinstimmung mit der Ellipsenachse.
