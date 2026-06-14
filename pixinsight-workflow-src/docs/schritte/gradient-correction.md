<img src="../../assets/icons/GradientCorrection.svg" alt="Gradient Correction Icon" class="step-icon" />

# Gradient Correction

<div class="step-icon-clear"></div>

## Ziel

Die Gradient Correction dient dazu, großflächige Helligkeits- und Farbübergänge im Bild zu entfernen, die nicht vom eigentlichen Himmelsobjekt stammen.

Typische Ursachen für solche Gradienten sind:

* Lichtverschmutzung (Städte, Straßenlampen)
* Mondlicht
* Luftleuchten (Airglow)
* Dunst oder dünne Wolken
* Ungleichmäßige Flat-Kalibrierung
* Vignettierung oder Reflexionen im optischen System

## Ausgangslage

Als Beipiel soll hier ein Bild der Walgalaxie (NGC 4631) dienen. Es wurde am 22.05.2026 aufgenommen. Der Mond war in dieser Nacht rund 6 Tage alt und zu 38–42 % beleuchtet. Jedoch betrug der Winkelabstand zwischen Mond und Galaxie lediglich 35°. Dies führte offenbar zu dem heftigen Gradienten. Welcher optische Effekt den dunklen Donut rund um die Galaxie verursacht hat ist mir nicht bekannt. Im Folgenden wird die Heransgehensweise an diese Herausforderung Schritt für Schritt beschrieben.

<img src="../../assets/screenshots/GC_Before.jpg" alt="Ausgangsbild" />

Meine typischen Starteinstellungen unterscheiden sich etwas von den Standardeinstellungen in Pixinsight. Der folgende Screenshot zeigt meinen Startpunkt, der oft schon bei geringem Gradienten ausreicht.

<img src="../../assets/screenshots/GC_StartSetting.png" alt="Gradient Correction Start Settings" />

Das Ergebnis ist an sich nicht schlecht, aber es reicht nicht um diesen dunklen Donut zu entfernen.

<img src="../../assets/screenshots/GC_Result_Startsettings.jpg" alt="Ergebnis mit Start Settings" />

Ob die Einstellungen gut zum Bild passen lässt sich gut anhand der erzeugten Gradientenmodells überprüfen:

<img src="../../assets/screenshots/GC_gradient_model.jpg" alt="Gradient Correction Modell" />

Leider bietet der Prozess Gradient Correction keine Vorschau. Dies ist durch den iterativen Ansatz begründet, der immer das gesamte Bild nutzt um eine Lösung zu suchen. Daher würde eine Vorschau mit kleinerem Bildausschnit nicht schneller berechnet werden können.

Somit muss man sich durch ebenfalls iterative durch Testen und Undo an die optimalen Settingsheranarbeiten. Hierbei gilt folgender Ansatz:

<img src="../../assets/screenshots/GC_OKsetting2.png" alt="Gradient Correction Start Settings" />

1. **Schwellwert für dunkle Bildbereiche** Wenn dieser Wert erhöht wird, werden mehr dunkle Strukturen des lokalen Bildhintergrunds bei der Berechnung des Gradientenmodells berücksichtigt.

1. **Schwellwert für die Einbeziehung heller Bildstrukturen** Durch Erhöhen dieses Parameters werden mehr relativ helle Bildstrukturen auf der Modellgenerierungsskala in das berechnete Gradientenmodell einbezogen.

1. **Modellskala** Dieser Parameter bestimmt, wie grob oder fein Helligkeitsverläufe im Bild modelliert werden. Ein hoher Wert berücksichtigt vor allem großflächige Helligkeitsunterschiede und erzeugt ein glatteres Modell.
Ein niedriger Wert erfasst auch kleinere, lokale Helligkeitsänderungen und erzeugt ein detaillierteres Modell.

1. **Modellglättung** Zusammen mit der Modellskala ermöglicht dieser Parameter eine feine Steuerung des Glättungsgrades lokaler Hintergrundverläufe. 

Der Donut wurde recht gut entfernt. Es bleiben noch Gradienten in beiden Ecken unten llinks sowie unten rechts. Diese werden wir im nächsten Schritt [Dynamic Background Extraction](dynamic-background-extraction.md) angehen.

<img src="../../assets/screenshots/GC_Result_OKsettings.jpg" alt="Ergebnis mit angepassten Settings" />

Im neuen Gradientenmodell zeigt sich nun der Donut deutlicher.

<img src="../../assets/screenshots/GC_gradient_model_ok.jpg" alt="Gradient Correction Modell" />
