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

## Simulator

Der Simulator zeichnet die Karte für eine Aufnahme mit zufällig verteilten Sternen mit Koma und wertet sie aus wie das Script.
Stellen Sie die Restkoma des Korrektors und eine Dejustage ein und beobachten Sie die Pfeile, die Stromlinien und den komafreien Punkt - und was die Konsole meldet.

<p class="sim-head">Optik</p>
<div class="sim">
  <label><span>Rest der Feldkoma: <b id="co-vcorr"></b></span><input type="range" id="co-corr" min="-1" max="1" step="0.05" value="1" /></label>
  <label><span>Dejustage x (konstante Koma): <b id="co-vdx"></b></span><input type="range" id="co-dx" min="-8" max="8" step="0.5" value="0" /></label>
  <label><span>Dejustage y (konstante Koma): <b id="co-vdy"></b></span><input type="range" id="co-dy" min="-8" max="8" step="0.5" value="0" /></label>
  <label><span>Öffnungsverhältnis: <b id="co-vN"></b></span><input type="range" id="co-N" min="2.8" max="10" step="0.1" value="4" /></label>
  <label><span>Brennweite: <b id="co-vF"></b></span><input type="range" id="co-F" min="200" max="2500" step="10" value="800" /></label>
  <label><span>Seeing (FWHM): <b id="co-vS"></b></span><input type="range" id="co-S" min="1" max="5" step="0.1" value="2.5" /></label>
  <label><span>Sensor</span><select id="co-sensor">
    <option value="23.5,15.6">APS-C (23,5 × 15,6 mm)</option>
    <option value="36,24">Vollformat (36 × 24 mm)</option>
    <option value="17.3,13">Four Thirds (17,3 × 13 mm)</option>
    <option value="11.3,11.3">IMX533 (11,3 × 11,3 mm)</option>
  </select></label>
  <label><span>Pixelgröße (effektiv): <b id="co-vP"></b></span><input type="range" id="co-P" min="2" max="9" step="0.01" value="3.76" /></label>
</div>
<p class="sim-head">Messung</p>
<div class="sim">
  <label><span>Vermessene Sterne: <b id="co-vstars"></b></span><input type="range" id="co-stars" min="100" max="4000" step="50" value="1000" /></label>
  <label><span>Rauschen von m3 eines einzelnen Sterns: <b id="co-vnoise"></b></span><input type="range" id="co-noise" min="0" max="1" step="0.01" value="0.15" /></label>
  <button type="button" id="co-reseed">Neue Sterne</button>
  <label class="check"><input type="checkbox" id="co-measure" checked="checked" /> Measure PSF asymmetry (coma direction, coma-free point)</label>
</div>
<p class="sim-head">Anzeige</p>
<div class="sim">
  <label class="check"><input type="checkbox" id="co-streamlines" checked="checked" /> Show coma streamlines (orange with arrows)</label>
  <label><span>Smoothing radius (%): <b id="co-vradius"></b></span><input type="range" id="co-radius" min="5" max="55" step="1" value="24" /></label>
  <label><span>Stop below (%): <b id="co-vmin"></b></span><input type="range" id="co-min" min="0" max="90" step="5" value="20" /></label>
  <label class="check"><input type="checkbox" id="co-arrows" checked="checked" /> Show coma arrows (median per grid cell, length = strength)</label>
  <label class="check"><input type="checkbox" id="co-stararrows" /> Show one asymmetry arrow per star</label>
  <label><span>Min. strength (sigma): <b id="co-vminsigma"></b></span><input type="range" id="co-minsigma" min="0" max="10" step="0.5" value="2" /></label>
  <label class="check"><input type="checkbox" id="co-bystrength" /> Color by strength instead of alignment</label>
  <label><span>Vector scale: <b id="co-vscale"></b></span><input type="range" id="co-scale" min="0.02" max="2" step="0.02" value="0.1" /></label>
</div>
<div id="coma-sim">
  <canvas class="sim-canvas" id="co-map" aria-label="Simulierte Koma-Karte"></canvas>
  <pre class="readout" id="co-eval"></pre>
  <div class="readout" id="co-truth"></div>
</div>

Unter der Karte stehen die Zeilen, die das Script in die Konsole schreibt, darunter die *wahren* Werte des Modells; der gestrichelte cyanfarbene Kreis markiert den wahren komafreien Punkt, das magentafarbene Kreuz den gefitteten.
Einen Versuch wert: die Restkoma von 1 (ohne Korrektor) über 0 (passender Korrektor) bis zu negativen Werten (überkorrigiert, die Pfeile zeigen nach innen); eine Dejustage ohne Korrektor (der komafreie Punkt wandert um die Dejustage geteilt durch die Restkoma - bei kleiner Restkoma also weit); und ein gut korrigiertes System mit viel Rauschen, bei dem sich der komafreie Punkt nicht mehr bestimmen lässt.
Im Modell wächst das dritte Moment bei starker Koma langsamer als die Koma selbst; das lineare Feldmodell des Scripts legt den komafreien Punkt dann etwas neben den wahren - weiter, als seine Bootstrap-Unsicherheit angibt.

<div class="note"><p><b>Modell:</b> Koma dritter Ordnung wie auf der Seite <a href="/pi-scripts/StarAberrationDiagnostics/de/koma.html">Koma - wie sie entsteht</a>: Ein Stern an der Feldposition P erhält den Komavektor c = q · P − D, mit dem Rest q der Feldkoma und der konstanten Koma D einer Dejustage; seine Länge ist C = |c| / (16 N²), wie bei einem Paraboloid.
Was das Script an einem solchen Stern misst, hängt nur vom Verhältnis von C zum Seeing ab; es wird beim Laden der Seite einmal mit Strahlen durchgerechnet: Kernzentrum und σ über adaptive Momente (anstelle des PSF-Fits), dann drittes Moment, Schwerpunktversatz und Elongation innerhalb einer Apertur von 4,5 σ.
Weggelassen sind Astigmatismus, Bildfeldwölbung und Verkippung (Maps › Shape), eine ungleichmäßige Nachführdrift (sie fügt eine konstante Asymmetrie hinzu und verschiebt den komafreien Punkt genau wie eine Dejustage), Beugung, Sättigung und die Abtastung durch die Pixel.
Die Vektorskala hier ist nicht die des Dialogs: Die simulierte Karte ist viel kleiner als eine echte Aufnahme.</p></div>
<script src="/pi-scripts/StarAberrationDiagnostics/dialog/coma-sim.js?v={{ site.time | date: '%s' }}"></script>
