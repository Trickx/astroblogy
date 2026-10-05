---
title: "Serien: vor und nach dem Meridian-Flip"
order: 110
---
### Warum ein Flip hilft

Eine deutsche Montierung muss das Teleskop umschlagen, wenn das Objekt den Meridian überquert.
Nach diesem **Meridian-Flip** ist der Tubus relativ zur Schwerkraft um 180° um seine Achse gedreht.
Alles, was **unter seinem eigenen Gewicht durchhängt oder sich verschiebt** - ein Okularauszug, eine Kamera an einem langen Adapter, ein Hauptspiegel in seiner Fassung („Mirror Flop“), ein lockerer Korrektor -, wandert auf die andere Seite.
Alles, was im optischen Zug **fest** sitzt, bleibt, wie es ist.

<figure><img src="fig/meridian-flip.svg" alt="Meridian-Flip" />
<figcaption>Abbildung 16 - Vor und nach dem Flip wirkt die Schwerkraft von entgegengesetzten Seiten auf den optischen Zug.</figcaption></figure>

Ein Vergleich von Aufnahmen beider Seiten beantwortet deshalb eine Frage, die eine einzelne Aufnahme nicht beantworten kann: **Ist ein Fehler fest oder mechanisch?**
Eine Verkippung, die mit der Seite wechselt, verlangt das Festziehen von Okularauszug und Adaptern - ein Justieren der Verkippung würde nur für eine Seite passen.
Eine Verkippung, die bleibt, verlangt die Kippjustage.

### Auf welcher Seite liegt eine Aufnahme?

1. **Manuell** - in der Liste gesetzt.
2. **PIERSIDE** - geschrieben von N.I.N.A. und den meisten ASCOM/INDI-Aufnahmeprogrammen (West vor dem Meridian, Teleskop zeigt nach Osten; Ost nach dem Flip).
3. **Ein Kamerawinkel, der sich um 180° dreht** - z. B. ROTATOR, wie ihn der ASIAIR aus seinem Plate Solve schreibt (auch POSANGLE, ANGLE, CROTA2).
   Aufnahmen innerhalb von 45° um den ersten Winkel bilden eine Gruppe, die innerhalb von 45° um den Gegenwinkel die andere; die Stundenwinkel ihrer Mitglieder benennen die Gruppen.
4. **Der Stundenwinkel** - aus der Uhrzeit, der Rektaszension α des Objekts und der geografischen Länge λ des Standorts (Ost positiv):
{: .steps}

<div class="eq"><div>GMST = 280,46061837° + 360,98564736629° · d&nbsp;&nbsp; (d = Tage seit 2000-01-01 12:00 UT)</div><div>Stundenwinkel HA = GMST + λ − α</div><div><span class="c">HA ≤ −0,05 h: West (der Meridian ist noch nicht erreicht) · HA ≥ +0,5 h: Ost · dazwischen: unbekannt, der Flip kann später kommen</span></div></div>

### Der Vergleich

Jede Aufnahme wird mit denselben Einstellungen vermessen.
Pro Seite und Wert bildet das Script den **Median** und eine robuste Streuung σ = 1,4826 · MAD, die die Standardabweichung schätzt, ohne sich von einzelnen Ausreißern täuschen zu lassen.
Der Standardfehler eines Medians beträgt etwa 1,253 σ/√n.
Ein Wert **ändert sich beim Flip**, wenn beides gilt:

<div class="eq"><div>|Median<sub>Ost</sub> − Median<sub>West</sub>| &gt; 3 · 1,253 · √( σ<sub>W</sub>²/n<sub>W</sub> + σ<sub>O</sub>²/n<sub>O</sub> )</div><div>und die Differenz übersteigt ein praktisches Minimum</div></div>

<figure><img src="fig/series-comparison.svg" alt="Serienvergleich" />
<figcaption>Abbildung 17 - Ein Wert, der beim Flip springt: Die Differenz der Mediane ist groß im Vergleich zur Streuung innerhalb jeder Seite.</figcaption></figure>

<div class="tbl"><table>
<tr><th>Wert</th><th>Praktisches Minimum</th><th>Eine Änderung beim Flip bedeutet</th></tr>
<tr><td>FWHM Mitte / Rand</td><td>5 %</td><td>Nachfokussieren, Temperatur oder rutschender Okularauszug</td></tr>
<tr><td>Verkippung (als Vektor: Größe und Richtung)</td><td>3 Punkte</td><td>Durchhang oder Spiel in Kamera, Okularauszug, Adapter</td></tr>
<tr><td>Rand-Elongation eps_rad</td><td>0,02</td><td>Spiel in Korrektor oder Auszugsrohr, oder ein anderer Fokus</td></tr>
<tr><td>Nachführ-Elongation</td><td>0,02</td><td>Balance (ost-/westlastig), DEC-Spiel, Kabelzug</td></tr>
<tr><td>Koma k</td><td>-</td><td>Korrektor oder Abstand mit Spiel</td></tr>
<tr><td>Komafreier Punkt (Vektor)</td><td>10 % von R</td><td>Mirror Flop, lockerer Fangspiegel oder Korrektor</td></tr>
<tr><td>Plate-Solve-Verzeichnung (Kapitel 12)</td><td>1 px</td><td>ein Teil der Optik verschiebt sich - oder eine Konvention des Solvers</td></tr>
</table></div>

Mit weniger als 3 Aufnahmen auf einer Seite gibt es kein Urteil.
Vektoren (Verkippung, komafreier Punkt, Verzeichnung) werden als Vektoren verglichen: Ihre Richtung kann sich drehen, während ihre Länge gleich bleibt.

### Drift im Laufe der Nacht

Temperatur und Höhe ändern sich langsam, und die Aufnahmen einer Seite folgen zeitlich aufeinander - eine Drift kann deshalb wie ein Sprung beim Flip aussehen.
Das Script zieht den Median jeder Seite ab und korreliert den Rest mit der Zeit.
Bei mindestens 6 Aufnahmen, einer Korrelation |r| ≥ 0,6 und einer Gesamtänderung über dem praktischen Minimum wird der Wert als **driftend** gemeldet, mit einer Warnung, wo er eine Änderung beim Flip vorgetäuscht haben könnte.
Unterscheidet sich die Fokuserposition (FOCPOS) zwischen den Seiten, vermerkt der Bericht, dass nachfokussiert wurde.
