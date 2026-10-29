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

## Simulator

Der Simulator zeichnet die Karte für eine Aufnahme mit zufällig verteilten Sternen, deren Form einem einfachen optischen Modell folgt, und wertet sie aus wie das Script.
Stellen Sie Korrektorabstand, Sensorverkippung, Nachführung und Kollimation ein und beobachten Sie, welches Muster jeder dieser Fehler in den Ellipsen, den Stromlinien und im Evaluation-Feld hinterlässt - und wie das Optikmodell sie auseinanderhält.

<p class="sim-head">Fehler</p>
<div class="sim">
  <label><span>Fehler des Korrektorabstands: <b id="sh-vds"></b></span><input type="range" id="sh-ds" min="-3" max="3" step="0.1" value="-1" /></label>
  <label><span>Empfindlichkeit: Durchbiegung bei r = 15 mm je mm Abstandsfehler: <b id="sh-vsens"></b></span><input type="range" id="sh-sens" min="5" max="80" step="1" value="25" /></label>
  <label><span>Restastigmatismus des Korrektors bei r = 15 mm: <b id="sh-vast"></b></span><input type="range" id="sh-ast" min="0" max="40" step="1" value="10" /></label>
  <label><span>Sensorverkippung: <b id="sh-vtilt"></b></span><input type="range" id="sh-tilt" min="0" max="0.5" step="0.01" value="0" /></label>
  <label><span>Richtung der Verkippung (von der Optik weg): <b id="sh-vtiltdir"></b></span><input type="range" id="sh-tiltdir" min="0" max="355" step="5" value="0" /></label>
  <label><span>Fokusversatz in der Mitte: <b id="sh-vfocus"></b></span><input type="range" id="sh-focus" min="-40" max="40" step="1" value="0" /></label>
  <label><span>Nachführfehler (Verschmierung): <b id="sh-vtrk"></b></span><input type="range" id="sh-trk" min="0" max="5" step="0.1" value="0" /></label>
  <label><span>Richtung des Nachführfehlers: <b id="sh-vtrkdir"></b></span><input type="range" id="sh-trkdir" min="0" max="175" step="5" value="0" /></label>
  <label><span>Optische Achse neben der Mitte, x: <b id="sh-vax"></b></span><input type="range" id="sh-ax" min="-6" max="6" step="0.5" value="0" /></label>
  <label><span>Optische Achse neben der Mitte, y: <b id="sh-vay"></b></span><input type="range" id="sh-ay" min="-6" max="6" step="0.5" value="0" /></label>
</div>
<p class="sim-head">Optik und Sensor</p>
<div class="sim">
  <label><span>Öffnungsverhältnis: <b id="sh-vN"></b></span><input type="range" id="sh-N" min="2" max="10" step="0.1" value="6" /></label>
  <label><span>Brennweite: <b id="sh-vF"></b></span><input type="range" id="sh-F" min="200" max="2500" step="10" value="500" /></label>
  <label><span>Seeing (FWHM): <b id="sh-vS"></b></span><input type="range" id="sh-S" min="1" max="5" step="0.1" value="2.5" /></label>
  <label><span>Sensor</span><select id="sh-sensor">
    <option value="23.5,15.6">APS-C (23,5 × 15,6 mm)</option>
    <option value="36,24">Vollformat (36 × 24 mm)</option>
    <option value="17.3,13">Four Thirds (17,3 × 13 mm)</option>
    <option value="11.3,11.3">IMX533 (11,3 × 11,3 mm)</option>
  </select></label>
  <label><span>Pixelgröße (effektiv): <b id="sh-vP"></b></span><input type="range" id="sh-P" min="2" max="9" step="0.01" value="3.76" /></label>
</div>
<p class="sim-head">Messung</p>
<div class="sim">
  <label><span>Vermessene Sterne: <b id="sh-vstars"></b></span><input type="range" id="sh-stars" min="100" max="4000" step="50" value="1000" /></label>
  <label><span>Rauschen der Form eines einzelnen Sterns (χ): <b id="sh-vnoise"></b></span><input type="range" id="sh-noise" min="0" max="0.1" step="0.005" value="0.03" /></label>
  <button type="button" id="sh-reseed">Neue Sterne</button>
  <label class="check"><input type="checkbox" id="sh-subtract" checked="checked" /> Subtract it from all stars</label>
</div>
<p class="sim-head">Anzeige</p>
<div class="sim">
  <label class="check"><input type="checkbox" id="sh-ellipses" checked="checked" /> Show star ellipses</label>
  <label><span>Vector scale: <b id="sh-vscale"></b></span><input type="range" id="sh-scale" min="0.2" max="4" step="0.1" value="1" /></label>
  <label class="check"><input type="checkbox" id="sh-cells" checked="checked" /> Cell averages with uncertainty</label>
  <label class="check"><input type="checkbox" id="sh-streamlines" checked="checked" /> Show streamlines (smoothed orientation trend)</label>
  <label><span>Smoothing radius (%): <b id="sh-vradius"></b></span><input type="range" id="sh-radius" min="3" max="40" step="1" value="12" /></label>
  <label class="check"><input type="checkbox" id="sh-sigonly" /> Hide where the direction is not significant</label>
  <label class="check"><input type="checkbox" id="sh-model" /> Optics model streamlines</label>
  <label class="check"><input type="checkbox" id="sh-modelsig" /> Hide the model where it is not significant</label>
  <label class="check"><input type="checkbox" id="sh-match" /> Model match per cell</label>
  <label class="check"><input type="checkbox" id="sh-defects" checked="checked" /> Singular points</label>
</div>
<div id="shape-sim">
  <canvas class="sim-canvas" id="sh-map" aria-label="Simulierte Karte der Sternform"></canvas>
  <pre class="readout" id="sh-eval"></pre>
  <div class="readout" id="sh-truth"></div>
</div>

Die *wahren* Werte unter dem Evaluation-Feld stammen direkt aus dem Modell, ohne Rauschen; Karte und Evaluation-Feld sehen nur die vermessenen Sterne.
Die wahren Werte gelten für den äußersten Punkt jeder Ecke; das Script fasst die 2×2 Eckzellen zusammen, deren Sterne im Mittel näher an der Mitte liegen, und misst dort deshalb kleinere Werte.
Einen Versuch wert: ein Abstandsfehler mit beiden Vorzeichen (radialer oder tangentialer Rand), eine Verkippung ohne Abstandsfehler (radial auf der einen Seite, tangential auf der anderen - ein Muster, das das Optikmodell nicht erklären kann), ein Fokusversatz (der ganze Rand radial oder tangential, wie bei einem Abstandsfehler), Nachführung mit und ohne *Subtract it from all stars* und eine optische Achse neben der Mitte (die Achse des Musters wandert mit).

<div class="note"><p><b>Modell:</b> Das Bild ist astigmatisch, mit einer sagittalen und einer tangentialen Fokusfläche zu beiden Seiten der mittleren, z = (κ ∓ α) · r², mit r gemessen von der optischen Achse.
Der Fehler des Korrektorabstands biegt die mittlere Fläche (κ = s · Δs / 15 mm², wie im Simulator unter <a href="#maps-size">Maps › Size</a>); der Restastigmatismus α des Korrektors lässt die Sterne dort rund, wo der Sensor die mittlere Fläche trifft, und streckt sie davor oder dahinter radial oder tangential.
Welches Vorzeichen des Abstandsfehlers welches Muster ergibt, folgt hier der Faustregel des Handbuchs (radial = Korrektor zu nah am Sensor); bei einem echten Korrektor hat dessen Anleitung das letzte Wort.
Die Unschärfen addieren sich als zweite Momente: das Seeing, die Defokus-Ellipse (|z<sub>T,S</sub> − z<sub>Sensor</sub>| / N, radial und tangential) und die Verschmierung durch die Nachführung.
Weggelassen sind Koma und jede Asymmetrie (Maps › Coma), die Verkippung der Bildebene, die ein dejustiertes System hinzufügt, Beugung und die Abtastung durch die Pixel; die Orientierungs-Heatmap wird nicht simuliert.</p></div>
<script src="/pi-scripts/StarAberrationDiagnostics/dialog/shape-sim.js?v={{ site.time | date: '%s' }}"></script>
