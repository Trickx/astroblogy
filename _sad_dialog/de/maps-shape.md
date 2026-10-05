---
title: "Maps › Shape"
menu: "Shape"
section: Maps
order: 50
shot: [SAD_Maps_Shape.png]
handbook: [shape, tracking, map, spacing]
---
Die Karte der Sternform: Streckung und Ausrichtung jedes Sterns und die Muster, die sie bilden.
Radiale und tangentiale Muster deuten auf Korrektorabstand oder Bildfeldwölbung, ein einseitiges Muster auf Verkippung, überall parallele Linien auf die Nachführung.

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

## Star ellipses

### Show star ellipses
{: #showEllipsesCheck .checkbox}

Zeichnet die gefittete Ellipse jedes Sterns.
Ausschalten, um die Stromlinien oder die Orientierungs-Heatmap allein zu betrachten.

### Vector scale
{: #scaleSpin .number}

Größe der Sternellipsen hier und der Pfeile auf der Coma-Karte - rein optisch.

### Cell averages with uncertainty
{: #shapeShowCellsCheck .checkbox}

Ein Balken pro Zelle des 11×11-Rasters entlang der mittleren Achse ihrer Sterne (im doppelten Winkel gemittelt, da eine Achse keine Richtung hat), seine Länge die mittlere Streckung.
Der weiße Fächer zeigt die Unsicherheit der Achse (± Standardfehler / (2 × Streckung)).
Hell mit Fächer: signifikant gestreckt (≥ 2,45σ); dünn und grau: rund innerhalb des Rauschens; grauer Punkt: weniger als 5 Sterne.

## Streamlines

### Show streamlines (smoothed orientation trend)
{: #streamlinesCheck .checkbox}

Zeigt den großräumigen Trend der PSF-Ausrichtung als durchgehende Linien (wie Feldlinien), über benachbarte Sterne geglättet.
Radiales Muster = unterkorrigierte Koma (Korrektor zu nah), konzentrisches Muster = Überkorrektur, Defokus oder Bildfeldwölbung, ein Muster, das sich zwischen beiden Seiten unterscheidet = Verkippung; alle Feldlinien parallel = Nachführung.
Leichter zu erkennen als die verrauschte Vektorkarte der einzelnen Sterne.
Berücksichtigt, dass die PSF-Ausrichtung nur modulo 180° definiert ist (Mittelung im doppelten Winkel).

Weiß: Die Richtung ist dort signifikant; grau: nicht (siehe die Option darunter).

### Smoothing radius (%)
{: #streamlineRadiusSpin .number}

Wie weit benachbarte Sterne zur Glättung des Orientierungsfelds beitragen, in % der Bilddiagonale.
Kleiner = folgt lokalen Details enger (verrauschter), größer = glatter, mehr großräumiger Trend.

### Hide where the direction is not significant
{: #shapeSignificantOnlyCheck .checkbox}

Die Stromlinien zeigen nur eine Richtung, nie ihre Stärke: Selbst auf reinem Rauschen sehen sie geordnet aus.
Sie sind deshalb weiß, wo die geglättete Streckung mindestens das 2,45-fache ihres Standardfehlers beträgt (die lokale Streuung der Sterne über ihre effektive Anzahl; reines Rauschen übersteigt das an 5 % der Stellen), und sonst grau.
Mit dieser Option fallen die grauen Teile weg.

## Optics model

### Optics model streamlines
{: #shapeShowModelCheck .checkbox}

Fittet an alle Sterne, was eine Optik erzeugen kann: einen gleichförmigen Anteil (Nachführrest, Astigmatismus auf der Achse), lineare Anteile (ein dezentriertes Muster, binodaler Astigmatismus eines dejustierten Systems) und einen radialen/tangentialen Anteil, der mit r² wächst (Bildfeldwölbung, Korrektorabstand).
Zeichnet seine Stromlinien in Violett (gedämpft, wo es nicht signifikant ist); „Model match per cell“ darunter zeigt, wo die Sterne damit übereinstimmen.
Die Evaluation darunter gibt an, wie viel des Musters es erklärt, und sein Rest-Chi²/dof (etwa 1 = bis aufs Rauschen erklärt).

### Hide the model where it is not significant
{: #shapeModelSignificantOnlyCheck .checkbox}

Die Modelllinien sind violett, wo das Feld des Modells mindestens das 2,45-fache seines Standardfehlers beträgt (aus der Unsicherheit der 7 gefitteten Terme), und gedämpft grauviolett, wo nicht - in der Nähe der Punkte, an denen sich seine Terme aufheben, und überall, wo die Sterne es nicht festlegen.
Mit dieser Option fallen die gedämpften Teile weg.

### Model match per cell
{: #shapeShowMatchCheck .checkbox}

Vergleicht jede Zelle mit dem Optikmodell: die mittlere Differenz zwischen den Sternformen und dem, was das Modell dort vorhersagt, in Einheiten ihres Standardfehlers (Streuung der Sterne / √n).

**Magenta**: 3σ oder mehr - die Zelle enthält Struktur, die keine Optik des Modells erzeugt (verbogene oder verspannte Optik, Tau, Vignettierung durch einen Off-Axis-Guider oder den Okularauszug, Nebel, Halos, Doppelsterne - oder ein Muster höherer Ordnung als das Modell).
Etwa eine magentafarbene Zelle pro Frame ist Zufall; die Evaluation nennt die erwartete Zahl.

**Grün**: weniger als 3σ - die Zelle stimmt innerhalb ihres Rauschens mit dem Modell überein.

Kein Rahmen: weniger als 5 Sterne.

### Singular points
{: #shapeShowDefectsCheck .checkbox}

Markiert die Punkte, an denen das geglättete Achsenfeld keine Richtung hat, mit ihrem Index: Eine Optik erzeugt höchstens einen +1 (radiales oder tangentiales Muster um die Achse) oder zwei +½ (dasselbe, durch einen gleichförmigen Anteil aufgespalten, oder binodaler Astigmatismus).
Mehr Punkte und jeder −½ sind Rauschen im geglätteten Feld - ein größerer Glättungsradius oder mehr Sterne helfen.

## Orientation heatmap

### Show orientation heatmap (instead of the star field)
{: #orientationHeatmapCheck .checkbox}

Ersetzt den Bildhintergrund durch eine Farbfeld-Heatmap der PSF-Ausrichtung (wie die „Orientation Map“ der Seti Astro Suite, github.com/setiastro/setiastrosuite): θ wird per Mittelung im doppelten Winkel (mit 3-Sigma-Clipping) als glatte 2D-Polynomfläche über alle Sterne gefittet (Grad darunter einstellbar) und als Farbton eines HSV-Farbkreises dargestellt - Farbverläufe zeigen den großräumigen Trend der Ausrichtung (Verkippung/Koma) direkter als das echte Sternfeld.
Braucht genug Sterne für den gewählten Grad, sonst fällt sie automatisch auf den normalen Hintergrund zurück.

### Fit degree
{: #orientationHeatmapDegreeSpin .number}

Grad des 2D-Polynoms, das an die Sternausrichtungen gefittet wird. 1 = eine Ebene (nur reine, gleichförmige Verkippung - entspricht der Voreinstellung der Seti Astro Suite). 2 oder höher lässt die Heatmap auch lokaler Krümmung folgen (z. B. einem Koma-Muster), die eine Ebene nicht darstellen kann und die sonst nur in den Stromlinien sichtbar wäre - um den Preis größerer Empfindlichkeit gegenüber Rauschen und Ausreißern, besonders nahe den Bildrändern, wo weniger Sterne die Terme höherer Ordnung festlegen.

## Evaluation

### Evaluation
{: .display}

Nach Calculate: die gestreckten und runden Zellen, die Signifikanz des Musters und wie viel davon das Optikmodell erklärt.
