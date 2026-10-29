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

## Simulator

Der Simulator zeichnet die Karte für eine Aufnahme mit zufällig verteilten Sternen, deren Größe einem einfachen optischen Modell folgt, und wertet sie aus wie das Script.
Stellen Sie Korrektorabstand und Sensorverkippung ein und beobachten Sie, wie sich Bildfeldwölbung, Verkippung und Fokus in den Zellen und im Evaluation-Feld zeigen - und wie viele Sterne nötig sind, um sie vom Rauschen zu unterscheiden.

<p class="sim-head">Fehler</p>
<div class="sim">
  <label><span>Fehler des Korrektorabstands: <b id="ss-vds"></b></span><input type="range" id="ss-ds" min="-3" max="3" step="0.1" value="1" /></label>
  <label><span>Empfindlichkeit: Durchbiegung bei r = 15 mm je mm Abstandsfehler: <b id="ss-vsens"></b></span><input type="range" id="ss-sens" min="5" max="80" step="1" value="25" /></label>
  <label><span>Sensorverkippung: <b id="ss-vtilt"></b></span><input type="range" id="ss-tilt" min="0" max="0.5" step="0.01" value="0.05" /></label>
  <label><span>Richtung der Verkippung (von der Optik weg): <b id="ss-vtiltdir"></b></span><input type="range" id="ss-tiltdir" min="0" max="355" step="5" value="0" /></label>
  <label><span>Fokusversatz in der Mitte: <b id="ss-vfocus"></b></span><input type="range" id="ss-focus" min="-40" max="40" step="1" value="0" /></label>
</div>
<p class="sim-head">Optik und Sensor</p>
<div class="sim">
  <label><span>Öffnungsverhältnis: <b id="ss-vN"></b></span><input type="range" id="ss-N" min="2" max="10" step="0.1" value="6" /></label>
  <label><span>Brennweite: <b id="ss-vF"></b></span><input type="range" id="ss-F" min="200" max="2500" step="10" value="500" /></label>
  <label><span>Seeing (FWHM): <b id="ss-vS"></b></span><input type="range" id="ss-S" min="1" max="5" step="0.1" value="2.5" /></label>
  <label><span>Sensor</span><select id="ss-sensor">
    <option value="23.5,15.6">APS-C (23,5 × 15,6 mm)</option>
    <option value="36,24">Vollformat (36 × 24 mm)</option>
    <option value="17.3,13">Four Thirds (17,3 × 13 mm)</option>
    <option value="11.3,11.3">IMX533 (11,3 × 11,3 mm)</option>
  </select></label>
  <label><span>Pixelgröße (effektiv): <b id="ss-vP"></b></span><input type="range" id="ss-P" min="2" max="9" step="0.01" value="3.76" /></label>
</div>
<p class="sim-head">Messung und Anzeige</p>
<div class="sim">
  <label><span>Vermessene Sterne: <b id="ss-vstars"></b></span><input type="range" id="ss-stars" min="100" max="4000" step="50" value="1000" /></label>
  <label><span>Streuung der FWHM eines einzelnen Sterns: <b id="ss-vscatter"></b></span><input type="range" id="ss-scatter" min="0" max="25" step="1" value="8" /></label>
  <button type="button" id="ss-reseed">Neue Sterne</button>
  <label class="check"><input type="radio" name="ss-mode" value="px" /> FWHM in pixels</label>
  <label class="check"><input type="radio" name="ss-mode" value="arcsec" /> FWHM in arcseconds</label>
  <label class="check"><input type="radio" name="ss-mode" value="ratio" checked="checked" /> Ratio to the center</label>
  <label class="check"><input type="checkbox" id="ss-details" /> Uncertainty and star count</label>
</div>
<div id="size-sim">
  <canvas class="sim-canvas" id="ss-map" aria-label="Simulierte Karte der Sterngröße, 11 × 11 Zellen"></canvas>
  <pre class="readout" id="ss-eval"></pre>
  <div class="readout" id="ss-truth"></div>
  <canvas class="sim-canvas" id="ss-section" aria-label="Schnitt entlang beider Diagonalen: Bildschale und Sensor"></canvas>
</div>

Der Schnitt unter der Karte zeigt entlang beider Diagonalen, wo die Sterne scharf abgebildet werden (die Bildschale) und wo der Sensor liegt; der Abstand dazwischen ist der Defokus Δz der Sterne an dieser Stelle.
Die *wahren* Werte darüber stammen direkt aus dem Modell; Karte und Evaluation-Feld sehen nur die vermessenen Sterne, mit ihrer Streuung und dem getrimmten Mittel des Scripts.
Die wahren Werte gelten für den äußersten Punkt jeder Ecke; das Script fasst die 2×2 Eckzellen zusammen, deren Sterne im Mittel näher an der Mitte liegen, und misst dort deshalb kleinere Verhältnisse.

<div class="note"><p><b>Modell:</b> Der Fehler des Korrektorabstands biegt die Bildschale zu einem Paraboloid, z = s · Δs · (r / 15 mm)², mit der Empfindlichkeit s des Korrektors; der Sensor ist eine Ebene, um den eingestellten Winkel verkippt und um den Fokusversatz verschoben.
Ein Stern wird um d = |Δz| / N unscharf, quadratisch addiert zum Seeing: FWHM² = FWHM₀² + d², dieselbe Beziehung, mit der das Handbuch eine FWHM in Δz zurückrechnet.
Weggelassen sind Astigmatismus und die radiale oder tangentiale Elongation, die er verursacht (Maps › Shape), Koma, Beugung und die Abtastung durch die Pixel.
Die Empfindlichkeit hängt vom Korrektor ab und ist im Allgemeinen nicht bekannt; der Vorgabewert gibt nur eine plausible Größenordnung.</p></div>
<script src="/pi-scripts/StarAberrationDiagnostics/dialog/size-sim.js?v={{ site.time | date: '%s' }}"></script>
