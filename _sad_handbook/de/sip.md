---
title: "Plate-Solve-Verzeichnung (SIP)"
order: 120
---
Ein Plate Solve ermittelt, wohin am Himmel jedes Pixel zeigt.
Eine reale Optik bildet den Himmel nicht perfekt auf ein ebenes Raster ab; die **SIP-Konvention** (Simple Imaging Polynomial) speichert die Abweichung als Polynome in den Pixelkoordinaten <i class="v">u, v</i> relativ zu einem Referenzpixel:

<div class="eq"><div>u′ = u + Σ A<sub>p,q</sub> · u<sup>p</sup> v<sup>q</sup>,&nbsp;&nbsp; v′ = v + Σ B<sub>p,q</sub> · u<sup>p</sup> v<sup>q</sup>,&nbsp;&nbsp; 2 ≤ p + q ≤ Ordnung</div></div>

<figure><img src="fig/sip-distortion.svg" alt="SIP-Verzeichnung" />
<figcaption>Abbildung 18 - Quadratische Verzeichnungsterme verbiegen das Pixelraster.</figcaption></figure>

Das misst die **Positionen** der Sterne - unabhängig von ihren Formen, und ein Nebenprodukt jedes Solves.
Die Serienanalyse liest die sechs quadratischen Terme (p + q = 2) aus dem Header.
Sie hängen nicht vom Referenzpixel ab und lassen sich deshalb auch dann vergleichen, wenn der Rest der Lösung fehlt.
Das Script drückt sie als Verschiebung der vier Bildecken in Pixeln aus und vergleicht diese zwischen den Seiten.

### Was sie aussagen kann und was nicht

- **Kein Maß für die Sensorverkippung.**
  Eine Verkippung θ wirkt wie eine leichte Perspektive und verschiebt einen Punkt im Abstand r nur um etwa tan θ · r² / f<sub>px</sub> (f<sub>px</sub> = Brennweite in Pixeln).
  Bei 750 mm und 4,29-µm-Pixeln verschiebt 0,1° eine Ecke um 0,07 px - die FWHM-Methode (Kapitel 7) ist weit empfindlicher.
  Der Bericht zeigt die Verkippung, die eine reine Perspektive für die gemessenen Terme bräuchte; ein Wert von mehreren Grad bedeutet, dass sie andere Ursachen haben.
- **Kein Maß für den Backfokus.**
  Die symmetrische (kissen-/tonnenförmige) Verzeichnung eines Korrektors ist ein Term dritter Ordnung; viele Solver passen nur die zweite Ordnung an.
- **Ein guter Indikator für Bewegung.**
  Ändern sich die quadratischen Terme beim Flip, verschiebt sich etwas im optischen Zug unter der Schwerkraft - typischerweise der Hauptspiegel eines Newtons oder ein Korrektor, der sich im Auszugsrohr bewegt.
  Wandert auch der komafreie Punkt, stützt das diesen Befund.

<div class="note"><p>Eine Vorzeichenumkehr beim Flip kann auch daher kommen, dass der Solver in einem System
rechnet, das sich mit dem Himmel dreht. Um sicherzugehen, lösen Sie pro Seite eine Aufnahme mit dem ImageSolver von
PixInsight und vergleichen. Die Terme werden nur verglichen, wenn sich alle Lösungen auf gleich große Bilder
beziehen.</p></div>
