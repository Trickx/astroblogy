---
title: "Fokus, Sensorverkippung und Bildfeldwölbung"
order: 70
---
### Die Physik: Unschärfe durch Defokus

Das Teleskop formt einen Lichtkegel, der in der Brennebene zu einem Punkt zusammenläuft.
Sitzt der Sensor um <i class="v">Δz</i> vor oder hinter dieser Ebene, schneidet er den Kegel und nimmt statt eines Punktes ein kleines Scheibchen auf.
Aus der Geometrie des Kegels (seine Öffnung ist die Apertur <i class="v">D</i> geteilt durch die Brennweite <i class="v">f</i>, also 1/N):

<figure><img src="fig/defocus-blur.svg" alt="Unschärfe durch Defokus" />
<figcaption>Abbildung 7 - Ein um Δz defokussierter Sensor nimmt ein Scheibchen mit dem Durchmesser d = Δz/N auf.</figcaption></figure>

<div class="eq"><div>d = Δz / N&nbsp;&nbsp;&nbsp; ⇔&nbsp;&nbsp;&nbsp; Δz = N · d,&nbsp;&nbsp;&nbsp; N = f / D</div><div><span class="c">ein schnelles f/4-System reagiert auf dasselbe Δz doppelt so stark wie ein f/8-System</span></div></div>

Auch der fokussierte Stern ist kein Punkt (Seeing, Beugung, Optik): Er hat eine Größe <i class="v">FWHM<sub>0</sub></i>.
Unschärfen unabhängiger Herkunft addieren sich näherungsweise **quadratisch**, daher folgt die zusätzliche Unschärfe durch Defokus aus der gemessenen FWHM als

<div class="eq"><div>d = √( FWHM² − FWHM<sub>0</sub>² ) · p,&nbsp;&nbsp;&nbsp; Δz = N · d</div><div><span class="c">p = (effektiver) Pixelabstand, rechnet Pixel in Mikrometer um</span></div></div>

Das ist die Brücke von einer Sterngröße in Pixeln zu einem Abstand in Mikrometern - und sie braucht Pixelabstand, Brennweite und Öffnung, die das Script aus dem Dialog oder dem FITS-Header übernimmt (XPIXSZ, FOCALLEN, APTDIA oder FOCRATIO).

<div class="note"><p><b>Das Vorzeichen geht verloren.</b> Ein Scheibchen sieht gleich aus, egal ob der Sensor vor
oder hinter dem Fokus sitzt. Aus einer Aufnahme ist Δz nur ein Betrag - in welche Richtung eine Kippschraube zu
drehen ist, muss man ausprobieren (siehe Abbildung 11).</p></div>

### Wie die Fehler aussehen

<figure><img src="fig/tilt-and-curvature.svg" alt="Verkippung und Bildfeldwölbung" />
<figcaption>Abbildung 8 - Links: Ein verkippter Sensor ist entlang einer Linie im Fokus und zu beiden Rändern hin defokussiert, in entgegengesetzte Richtungen. Rechts: Eine gewölbte Bildschale trifft einen ebenen Sensor nur in der Mitte; die Sterne wachsen zu allen Rändern hin gleichmäßig.</figcaption></figure>

- **Defokus** macht jeden Stern größer - aber gleichmäßig, er zeigt sich also eher in der absoluten FWHM als in ihrem Muster.
  Ein verräterisches Zeichen ist eine Mitte, die *weicher* ist als der Rand: Es wurde auf den Rand fokussiert, oder ein gewölbtes Feld wurde außerhalb der Mitte fokussiert.
- **Sensorverkippung** macht eine Seite des Bildes weich und die gegenüberliegende scharf: ein einseitiger Verlauf.
- **Bildfeldwölbung** macht den Rand auf allen Seiten gleich weich: eine symmetrische Schüssel.

### Methode 1: Quadranten wie in Siril

Wie bei Sirils „Show tilt“ wird das Bild in vier Quadranten sowie einen inneren Kreis und einen äußeren Ring um die Mitte eingeteilt (Radien bezogen auf die halbe Diagonale <i class="v">R</i>).
Jeder Bereich erhält das **25%-getrimmte Mittel** der Sterngrößen (FWHM<sub>x</sub>+FWHM<sub>y</sub>)/2 - das unterste und oberste Viertel wird vor der Mittelung verworfen, was es robust gegen einzelne schlechte Fits macht.

<figure><img src="fig/siril-quadrants.svg" alt="Siril-Quadranten" />
<figcaption>Abbildung 9 - Die Bereiche der Quadrantenauswertung (O/U = oben/unten, L/R = links/rechts).</figcaption></figure>

<div class="eq"><div>Verkippung = max(m<sub>1</sub>…m<sub>4</sub>) − min(m<sub>1</sub>…m<sub>4</sub>),&nbsp;&nbsp; in % ihres Mittels</div><div>Off-Axis-Aberration = m<sub>außen</sub> − m<sub>innen</sub></div></div>

Das **11×11-FWHM-Raster** ist dieselbe Idee in feinerem Maßstab: ein getrimmtes Mittel pro Zelle, stärker verrauscht, aber detailreicher.
Die **Kippachse** wird aus den Quadranten abgeleitet.
Der Überschuss jedes Quadranten gegenüber der Mitte bekommt ein Vorzeichen, der Gradient einer Ebene durch die vier Werte liefert die Richtung des steilsten Anstiegs und, bei bekannter Optik, den Kippwinkel:

<div class="eq"><div>e<sub>q</sub> = sign(F<sub>q</sub>² − F<sub>0</sub>²) · √|F<sub>q</sub>² − F<sub>0</sub>²|,&nbsp;&nbsp; F<sub>0</sub> = m<sub>innen</sub></div><div>g<sub>x</sub> = [(e<sub>OR</sub> + e<sub>UR</sub>) − (e<sub>OL</sub> + e<sub>UL</sub>)] / W,&nbsp;&nbsp; g<sub>y</sub> = [(e<sub>UL</sub> + e<sub>UR</sub>) − (e<sub>OL</sub> + e<sub>OR</sub>)] / H</div><div>Achsrichtung = atan2(g<sub>y</sub>, g<sub>x</sub>) (mod 180°),&nbsp;&nbsp; Kippwinkel = atan( N · √(g<sub>x</sub>² + g<sub>y</sub>²) )</div></div>

Pro Quadrant listet die Konsole außerdem den Defokus Δz = N · √(F<sub>q</sub>² − F<sub>0</sub>²) · p und den Winkel atan(Δz / Abstand) zur Quadrantenmitte bei einem Viertel der Breite und Höhe.

### Methode 2: die FWHM²-Fläche

Quadranten vermischen Verkippung und Wölbung: Ein gewölbtes Feld macht alle vier Quadranten weich, eine Verkippung nur zwei.
Das Script passt deshalb eine glatte Fläche an die quadrierte FWHM **jedes Sterns** an, mit X und Y als Position relativ zur Mitte, geteilt durch die halbe Diagonale:

<div class="eq"><div>FWHM² = c<sub>0</sub> + c<sub>1</sub>·X + c<sub>2</sub>·Y + c<sub>3</sub>·(X² + Y²)</div></div>

<figure><img src="fig/fwhm-squared-surface.svg" alt="FWHM²-Fläche" />
<figcaption>Abbildung 10 - Ein Schnitt durch die Fläche entlang X. Der symmetrische Term c₃ ist die Wölbung (gestrichelt); die linearen Terme c₁, c₂ kippen die Schüssel zu einer Seite (durchgezogen) - das ist die Sensorverkippung.</figcaption></figure>

Angepasst werden die Quadrate, weil sich Unschärfen quadratisch addieren (siehe oben): Der symmetrische Term misst dann die Wölbung, die linearen Terme die Verkippung, und beide verfälschen sich nicht mehr gegenseitig.
Der Fit ist ein robuster Kleinste-Quadrate-Fit: vier Runden, in denen Sterne mit einem Residuum über 3 σ (σ aus dem Median der absoluten Residuen) ausgelassen werden.
Aus den Koeffizienten:

<div class="eq"><div>FWHM<sub>Mitte</sub> = √c<sub>0</sub>,&nbsp;&nbsp; FWHM<sub>Rand</sub> = √(c<sub>0</sub> + c<sub>3</sub>)</div><div>G = √(c<sub>1</sub>² + c<sub>2</sub>²),&nbsp;&nbsp; weichere Seite in Richtung atan2(c<sub>2</sub>, c<sub>1</sub>)</div><div>FWHM<sub>weiche Seite</sub> = √(c<sub>0</sub> + G),&nbsp;&nbsp; FWHM<sub>scharfe Seite</sub> = √(c<sub>0</sub> − G)</div><div>Δz<sub>Rand</sub> = N · √G · p,&nbsp;&nbsp; Kippwinkel = atan( Δz<sub>Rand</sub> / (R · p) )</div><div>Wölbungstiefe = N · √|c<sub>3</sub>| · p</div><div>schärfster Punkt = Mitte − (c<sub>1</sub>, c<sub>2</sub>) / (2 c<sub>3</sub>) · R&nbsp;&nbsp; (falls c<sub>3</sub> &gt; 0)</div></div>

Ein **negatives c<sub>3</sub>** bedeutet, dass der Rand schärfer ist als die Mitte - die Aufnahme ist defokussiert oder wurde auf den Rand fokussiert.
Das Script meldet außerdem einen **Defokus-Verdacht**, wenn die Median-FWHM im inneren Drittel (r &lt; ⅓ R) um mehr als 5 % größer ist als im äußeren Drittel (r &gt; ⅔ R).
Solange das der Fall ist, sind die Urteile zu Verkippung und Abstand unzuverlässig - deshalb steht der Fokus in der vorgeschlagenen Reihenfolge an erster Stelle.

### Der 3D-Kippplot

<figure><img src="fig/sign-ambiguity.svg" alt="Vorzeichen-Mehrdeutigkeit" />
<figcaption>Abbildung 11 - Zwei Verkippungen in entgegengesetzte Richtungen erzeugen dieselbe Unschärfe. Der 3D-Plot zeichnet deshalb beide Ebenen.</figcaption></figure>

Der Pseudo-3D-Plot setzt die vier Quadrantenwerte an ihre physischen Positionen auf dem Sensor (in mm) als vorzeichenbehaftetes Δz und legt eine Ebene durch die Mitte.
Weil das Vorzeichen von Δz unbekannt ist (siehe den Hinweis oben), zeichnet er **zwei spiegelbildliche Varianten**.
Beide sind gleich plausibel; die Kippachse ist für beide dieselbe.

### Urteile

<div class="tbl"><table>
<tr><th>Wert</th><th>OK</th><th>Hinweis</th><th>Maßnahme</th></tr>
<tr><td>Verkippung: (FWHM<sub>weich</sub> − FWHM<sub>scharf</sub>) / ihr Mittel</td><td>&lt; 5 %</td><td>5 - 10 %</td><td>&gt; 10 %</td></tr>
<tr><td>Bildfeldwölbung: (FWHM<sub>Rand</sub> − FWHM<sub>Mitte</sub>) / FWHM<sub>Mitte</sub></td><td>≤ 15 %</td><td>15 - 30 %</td><td>&gt; 30 %</td></tr>
<tr><td>Fokus: Defokus-Verdacht oder c<sub>3</sub> &lt; 0</td><td></td><td></td><td>zuerst neu fokussieren</td></tr>
</table></div>
