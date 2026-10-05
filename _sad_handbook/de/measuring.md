---
title: "Sterne finden und vermessen"
order: 30
---
### Debayern von Farb-Rohbildern

Eine Farbkamera nimmt ein **Bayer-Mosaik** auf: Jedes Pixel sieht nur Rot, Grün oder Blau.
Ein unbearbeitetes Mosaik lässt sich nicht direkt vermessen - das Farbmuster sähe in jedem Stern wie Struktur aus.
Die üblichen Debayer-Verfahren ergänzen die fehlenden Farben durch **Interpolation**, die jeden Stern ein wenig und richtungsabhängig weichzeichnet.
Das würde genau das verfälschen, was das Script misst.

Das Script verwendet deshalb das **SuperPixel**-Verfahren: Jeder 2×2-Block (ein rotes, zwei grüne, ein blaues Pixel) wird zu einem Farbpixel, ganz ohne Interpolation.
Das Bild hat die halbe Auflösung, und jede in Mikrometer umgerechnete Länge verwendet den **effektiven Pixelabstand**, also das Doppelte des physischen.

<figure><img src="fig/superpixel-debayer.svg" alt="SuperPixel-Debayering" />
<figcaption>Abbildung 2 - SuperPixel-Debayering: Jeder 2×2-Block des Mosaiks wird zu einem Pixel.</figcaption></figure>

### Detektion

Der <code>StarDetector</code> von PixInsight findet die Kandidaten.
Ist die Option *Max. stars* gesetzt, werden nur die hellsten behalten (nach Fluss sortiert) - sie liefern die zuverlässigsten Fits, und der Fit ist der langsame Teil.

### Der PSF-Fit

Für jeden Kandidaten passt <code>DynamicPSF</code> von PixInsight ein **elliptisches Modell** an die Pixel innerhalb eines Suchfensters an (der *search radius*).
Zwei Modelle stehen zur Wahl.
In den Koordinaten <i class="v">u, v</i> entlang der Achsen der Ellipse (gedreht um den Winkel <i class="v">θ</i>) lauten sie:

<div class="eq"><div>Gauß:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; I(u, v) = B + A · exp( −u²/(2σ<sub>x</sub>²) − v²/(2σ<sub>y</sub>²) )</div><div>Moffat:&nbsp;&nbsp;&nbsp;&nbsp; I(u, v) = B + A / ( 1 + u²/α<sub>x</sub>² + v²/α<sub>y</sub>² )<sup>β</sup></div><div><span class="c">B Hintergrund, A Amplitude, σ bzw. α die Breite entlang jeder Achse, β die Steilheit der Moffat-Flanken</span></div></div>

Das Moffat-Profil hat breitere Flanken als die Gaußkurve und beschreibt reale Sterne (Seeing, Beugung) oft besser; die Gaußkurve ist schneller.
Aus den Breiten berechnet das Script die FWHM entlang jeder Achse:

<div class="eq"><div>Gauß:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; FWHM = 2 √(2 ln 2) · σ ≈ 2,3548 · σ</div><div>Moffat:&nbsp;&nbsp;&nbsp;&nbsp; FWHM = 2 α · √(2<sup>1/β</sup> − 1)</div></div>

Den Gauß-Faktor für einen Moffat-Fit zu verwenden wäre ein grober Fehler: Je nach β würde er die FWHM um den Faktor 1,5 bis 2,7 und mehr aufblähen.

### Qualitätskontrolle

<ul>
  <li><b>Detektionsschwelle.</b> Ein Fit zählt nur oberhalb dieser Signifikanz. Kommt kein einziger Stern durch,
      senkt das Script die Schwelle schrittweise (×0,6, bis hinunter auf 0,2), statt aufzugeben, und meldet das.</li>
  <li><b>MAD-Ausreißer.</b> DynamicPSF liefert für jeden Fit die mittlere absolute Abweichung (MAD) zwischen Modell
      und Pixeln. Hotpixel, verschmolzene Paare oder sehr schwache Sterne ergeben schlecht passende Modelle mit
      großer MAD. Ein Fit wird verworfen, wenn
      <div class="eq"><div>MAD &gt; Faktor · Median(MAD aller Fits)</div></div>
      Die Grenze passt sich so dem Rauschen jeder Aufnahme an, statt eine feste Zahl zu sein.</li>
  <li><b>Sättigung</b> wird für die Asymmetriemessung geprüft (Kapitel 9): Ein Stern, dessen Maximum 95 % des
      Wertebereichs erreicht, hat eine abgeflachte Spitze und wird dort übersprungen.</li>
</ul>
