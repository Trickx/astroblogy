---
title: "Nachführ- und Guidingfehler"
order: 50
---
### Der Fehler

Folgt die Montierung dem Himmel nicht exakt - periodischer Fehler, schlechtes Guiding, Wind, Kabelzug, ein sich verbiegendes Leitrohr -, bewegt sich das ganze Bild während der Belichtung ein wenig.
Jeder Stern wird um den **gleichen Betrag in die gleiche Richtung** verschmiert, egal wo er im Bildfeld steht.
Dieser Fingerabdruck unterscheidet die Nachführung von allen optischen Fehlern, die sich über das Bildfeld ändern.

### Die Messung

Das Script bildet den **Median** der Formvektoren aller Sterne.
Der Median ignoriert die Minderheit der Sterne, die von der Optik am Rand verzogen sind, und findet das, was fast alle Sterne gemeinsam haben:

<div class="eq"><div>m<sub>1</sub> = Median(χ<sub>1</sub>),&nbsp;&nbsp; m<sub>2</sub> = Median(χ<sub>2</sub>)</div><div>χ<sub>T</sub> = √(m<sub>1</sub>² + m<sub>2</sub>²),&nbsp;&nbsp; Richtung = ½ · atan2(m<sub>2</sub>, m<sub>1</sub>)</div><div><span class="c">χ<sub>T</sub> wird für den Bericht in eine Elliptizität zurückgerechnet</span></div></div>

Mit der Option *Subtract it from all stars* wird dieser gemeinsame Anteil vor jeder weiteren Analyse von jedem Stern abgezogen - durch Subtraktion der Vektoren, und genau deshalb wird die Verzerrung χ verwendet:

<div class="eq"><div>χ′<sub>1</sub> = χ<sub>1</sub> − m<sub>1</sub>,&nbsp;&nbsp; χ′<sub>2</sub> = χ<sub>2</sub> − m<sub>2</sub></div></div>

<figure><img src="fig/tracking-component.svg" alt="Nachführanteil" />
<figcaption>Abbildung 6 - Links: Ein Nachführfehler zieht jeden Stern gleich in die Länge. Rechts: Ihn zu entfernen ist eine Vektorsubtraktion in der Ebene der Formvektoren.</figcaption></figure>

Korrigiert werden nur die Formen; die Sterngrößen (FWHM) bleiben wie gemessen.
Der Nachführfehler würde sonst die optischen Muster überdecken, vor allem das radiale/tangentiale Muster aus Kapitel 8.

### Den Wert lesen

<div class="tbl"><table>
<tr><th>Gemeinsame Elliptizität</th><th>Urteil</th></tr>
<tr><td>unter 0,03</td><td>OK - die Nachführung ist sauber</td></tr>
<tr><td>0,03 - 0,07</td><td>Hinweis</td></tr>
<tr><td>über 0,07</td><td>Maßnahme: Guiding (RMS, Kalibrierung), Balance, Kabelzug, Wind und Verbiegung prüfen</td></tr>
</table></div>

<div class="note"><p>Eine Richtung, die über mehrere Aufnahmen gleich bleibt, deutet auf die Montierung; eine,
die wechselt, auf Wind oder zufällige Guidingfehler. Die <a href="#series">Serienanalyse</a> vergleicht beide
Seiten eines Meridian-Flips, bei dem sich die Balance ändert.</p></div>
