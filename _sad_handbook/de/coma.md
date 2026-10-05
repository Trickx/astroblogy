---
title: "Koma und Kollimation"
order: 90
---
### Der Fehler

**Koma** macht Sterne zu kleinen Kometen: ein heller Kern mit einem Lichtfächer auf einer Seite.
Bei einem Newton wächst sie linear mit dem Abstand von der optischen Achse und zeigt von ihr weg; ein Komakorrektor beseitigt sie - oder überkorrigiert sie, wenn er im falschen Abstand sitzt.
Der Punkt, an dem die Koma verschwindet, markiert die **optische Achse**.
Sind die Spiegel dejustiert (oder ist ein Korrektor dezentriert oder verkippt), wandert dieser **komafreie Punkt** von der Bildmitte weg.

<div class="note"><p>Warum Koma entsteht, wie stark sie bei welchem Öffnungsverhältnis ist und wie Korrektor und
Dejustage das Bild verändern, erklärt die Seite <a href="koma.html">Koma - wie sie entsteht</a>, mit berechneten
Strahlengängen und einem interaktiven Simulator.</p></div>

### Warum der Fit sie nicht sieht

Gauß und Moffat sind punktsymmetrische Modelle: Sie legen eine Ellipse um den Kern und können nicht erkennen, auf welcher Seite der Fächer liegt.
Das Script misst die Asymmetrie stattdessen direkt an den Pixeln, relativ zum angepassten Zentrum:

<figure><img src="fig/coma-star.svg" alt="Koma-Stern" />
<figcaption>Abbildung 14 - Ein Stern mit Koma. Der Flussschwerpunkt liegt gegenüber dem Fit-Zentrum zum Ausläufer hin versetzt; das dritte Moment gewichtet das äußere Licht stärker und zeigt ihn deutlicher.</figcaption></figure>

- Aperturradius r<sub>ap</sub> = 4σ + 1 px (begrenzt auf 3 … 25 px), σ = FWHM/2,3548; Hintergrund = Median eines Rings von r<sub>ap</sub>+2 bis r<sub>ap</sub>+6 px.
- Gewichte w = Pixelwert − Hintergrund (nur positive).
- Sterne am Bildrand, ohne Hintergrundring oder mit einem Maximum bei 95 % des Wertebereichs (gesättigt) werden übersprungen.
{: .steps}

<div class="eq"><div>Schwerpunktversatz = Σ w · d / Σ w</div><div>drittes Moment&nbsp;&nbsp; m<sub>3</sub> = Σ w · ρ² · ρ / Σ w,&nbsp;&nbsp; ρ = d / σ</div><div><span class="c">d = Pixelposition relativ zum Fit-Zentrum; ρ macht m<sub>3</sub> unabhängig von der Sterngröße</span></div></div>

### Das Komafeld

Koma dritter Ordnung ist linear in der Feldposition.
Um den komafreien Punkt <i class="v">P<sub>0</sub></i> wird der Asymmetrievektor eines Sterns an der Position <i class="v">P</i> deshalb modelliert als

<div class="eq"><div>m<sub>3</sub>(P) = k · (P − P<sub>0</sub>) / R</div><div>linear in (k, o<sub>x</sub>, o<sub>y</sub>):&nbsp; m<sub>3,x</sub> = k·X + o<sub>x</sub>,&nbsp; m<sub>3,y</sub> = k·Y + o<sub>y</sub></div><div>P<sub>0</sub> = Mitte − (o<sub>x</sub>, o<sub>y</sub>) / k · R</div></div>

<figure><img src="fig/coma-field.svg" alt="Komafeld" />
<figcaption>Abbildung 15 - Das Komafeld. Bei k &gt; 0 zeigen die Ausläufer von P₀ weg, bei k &lt; 0 zu P₀ hin.</figcaption></figure>

- **k &gt; 0**: Die Ausläufer zeigen von P<sub>0</sub> weg - unterkorrigiert (normal für einen Newton ohne Korrektor).
- **k &lt; 0**: Die Ausläufer zeigen zu P<sub>0</sub> hin - überkorrigiert.

Nötig sind mindestens 30 Sterne mit gültiger Asymmetrie.
Der Fit ist robust (3σ-Clipping, drei Runden).
Seine Unsicherheit stammt aus einem **Bootstrap**: Der Fit wird 100-mal an zufälligen Stichproben der Sterne wiederholt; die Streuung von k ist ihre Standardabweichung, die von P<sub>0</sub> eine robuste Streuung (MAD), weil einige Stichproben mit k ≈ 0 P<sub>0</sub> beliebig weit wegwerfen können.
Die Koma gilt als **signifikant**, wenn |k| &gt; 3 · Streuung(k).
Zur Gegenprobe wird dasselbe Modell an die Schwerpunktversätze angepasst.

### Kollimation

Das Script empfiehlt eine Kollimation, wenn P<sub>0</sub> mehr als **15 % der halben Diagonale** von der Mitte entfernt liegt und mehr als das Doppelte seiner eigenen Unsicherheit.
Eine Vorsichtsmaßnahme ist eingebaut: Eine ungleichmäßige Nachführdrift fügt eine konstante Asymmetrie hinzu und verschiebt P<sub>0</sub> entlang der Drift.
Liegt der Versatz innerhalb von 20° zur Nachführ-Elongation, weist der Vorschlag darauf hin - vergleichen Sie mehrere Aufnahmen, bevor Sie die Kollimationsschrauben anfassen.

### Koma-Stromlinien

Anders als eine Orientierung ist m<sub>3</sub> ein echter Vektor mit Richtung.
Die Koma-Stromlinien folgen seinem gaußgeglätteten Feld (mindestens 8 Sterne im Radius) mit Pfeilspitzen und enden dort, wo das Feld schwächer wird als ein eingestellter Prozentsatz seines starken Teils - so täuscht die komafreie Zone keine Richtung vor.
Unterkorrigierte Koma sieht aus wie eine Quelle, überkorrigierte wie eine Senke.
