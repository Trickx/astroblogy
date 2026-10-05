---
title: "Vektorkarte, Stromlinien und Heatmap"
order: 60
---
Die Vektorkarte zeichnet jeden Stern als Ellipse an seiner Position, Länge und Farbe nach der Exzentrizität (blau rund bis rot länglich), die Richtung nach ψ.
Hunderte kleiner Ellipsen sind schwer zu lesen, deshalb zeigen zwei Ebenen den **großräumigen Trend**.

### Stromlinien

An jedem Punkt des Bildes berechnet das Script eine geglättete Orientierung aus den umliegenden Sternen: ein gaußgewichtetes Mittel über den doppelten Winkel innerhalb eines Radius <i class="v">R</i> (ein Prozentsatz der Bilddiagonale).
Fast runde Sterne haben eine schlecht definierte Richtung, deshalb wird jeder Stern zusätzlich mit dem Quadrat seiner Exzentrizität gewichtet:

<div class="eq"><div>w = exp( −d² / (2 (R/2)²) ) · e²,&nbsp;&nbsp;&nbsp; für alle Sterne im Abstand d &lt; R</div><div>Orientierung = ½ · atan2( Σ w · sin 2ψ, Σ w · cos 2ψ )</div></div>

Eine Stromlinie folgt diesem Feld in kleinen Schritten.
Da eine Orientierung keine Pfeilspitze hat, wählt das Script bei jedem Schritt diejenige der beiden Richtungen, die den vorigen Schritt fortsetzt - sonst könnte die Linie zufällig umkehren.
Stromlinien zeigen auf einen Blick, ob die Sterne radial, konzentrisch oder alle in eine Richtung ausgerichtet sind.

### Orientierungs-Heatmap

Die Heatmap (nach der Seti Astro Suite) passt zwei glatte **Polynomflächen** eines wählbaren Grades über das ganze Bild an, eine an sin 2θ und eine an cos 2θ aller Sterne, mit auf ±1 normierten Koordinaten.
Drei Runden 3σ-Clipping entfernen Ausreißer.
An jedem Punkt wird der angepasste Winkel <i class="v">θ = ½ · atan2(s, c)</i> als Farbton eines Farbkreises dargestellt.
Eine Ebene (Grad 1) kann nur einen gleichmäßigen Verlauf zeigen; ab Grad 2 lassen sich die gekrümmten Muster der Koma abbilden, das Ergebnis wird aber empfindlicher für Rauschen an den Rändern, wo wenige Sterne es stützen.
