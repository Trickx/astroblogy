---
title: "Die Form eines Sterns beschreiben"
order: 40
---
Die angepasste Ellipse hat eine große Halbachse <i class="v">a</i> (die größere FWHM) und eine kleine Halbachse <i class="v">b</i>, und ihre große Achse zeigt in eine Richtung.
Drei Zahlen beschreiben, wie länglich sie ist - sie tragen dieselbe Information, verhalten sich in Rechnungen aber unterschiedlich:

<div class="eq"><div>Exzentrizität&nbsp;&nbsp; e = √(1 − b²/a²)</div><div>Elliptizität&nbsp;&nbsp;&nbsp;&nbsp; ε = 1 − b/a = 1 − √(1 − e²)</div><div>Verzerrung&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; χ = (a² − b²)/(a² + b²) = e²/(2 − e²)</div><div><span class="c">und zurück: e = √(2χ/(1 + χ))</span></div></div>

<figure><img src="fig/shape-measures.svg" alt="Formmaße" />
<figcaption>Abbildung 3 - Die drei Maße für dieselben Sterne. Die Exzentrizität steigt schon bei leicht ovalen Sternen schnell an und eignet sich deshalb gut für die Farben der Karte; die Elliptizität liest sich wie ein Prozentwert (0,10 = die kurze Achse ist 10 % kürzer); die Verzerrung lässt sich korrekt addieren.</figcaption></figure>

Die **Exzentrizität** färbt die Vektorkarte.
Die **Elliptizität** wird überall dort verwendet, wo ein Urteil gefällt wird, weil sie leicht zu lesen ist.
Die **Verzerrung** dient zum Mitteln und Abziehen: Nur ihre Komponenten addieren sich (näherungsweise) linear, wenn zwei Elongationen zusammenkommen, z. B. eine der Optik und eine der Nachführung.

### Richtung und das 180°-Problem

<figure><img src="fig/psf-ellipse.svg" alt="PSF-Ellipse" />
<figcaption>Abbildung 4 - Die angepasste Ellipse in Bildkoordinaten: x nach rechts, y nach unten. Der Winkel ψ der großen Achse wird von der x-Achse aus gezählt; 90° zeigt nach unten.</figcaption></figure>

Alle Richtungen im Script werden in **Bildkoordinaten** angegeben: x nach rechts, y nach unten, 0° = rechts, 90° = unten.
DynamicPSF misst seinen Winkel <i class="v">θ</i> auf dem Bildschirm gegen den Uhrzeigersinn, daher ist die Richtung der großen Achse in Bildkoordinaten <i class="v">ψ = −θ</i>.

Eine Ellipse sieht nach einer Drehung um 180° gleich aus: Ihre Orientierung ist nur **modulo 180°** definiert.
Die Winkel direkt zu mitteln geht deshalb schief - zwei fast waagerechte Sterne bei 10° und 170° ergäben im Mittel senkrechte 90°.
Die übliche Abhilfe, die das Script überall verwendet, ist der **doppelte Winkel**: Jede Orientierung wird zu einem Vektor mit dem Winkel 2ψ, die Vektoren werden gemittelt, und der Winkel des Mittelwerts wird wieder halbiert.

<figure><img src="fig/double-angle.svg" alt="Doppelter Winkel" />
<figcaption>Abbildung 5 - Orientierungen mitteln: naiv (links) und über den doppelten Winkel (rechts).</figcaption></figure>

<div class="eq"><div>χ<sub>1</sub> = χ · cos 2ψ,&nbsp;&nbsp;&nbsp; χ<sub>2</sub> = χ · sin 2ψ</div><div>mittlere Orientierung = ½ · atan2( Σ w·χ<sub>2</sub>, Σ w·χ<sub>1</sub> )</div><div><span class="c">(χ<sub>1</sub>, χ<sub>2</sub>) ist der „Formvektor“ eines Sterns; w ein optionales Gewicht</span></div></div>
