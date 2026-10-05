---
title: "Radiale und tangentiale Muster: der Korrektorabstand"
order: 80
---
### Der Fehler

Ein Komakorrektor, Bildfeldebner oder Reducer ist für genau einen Abstand zum Sensor ausgelegt (den Backfokus, z. B. 55 mm).
Im falschen Abstand korrigiert er zu wenig oder zu viel, und die Sterne am Bildrand werden länglich - entweder **radial**, wie Speichen zur Mitte zeigend, oder **tangential**, entlang von Kreisen um die Mitte liegend.
In einem unkorrigierten System (einem Newton ohne Korrektor) ist radiale Elongation schlicht seine natürliche Koma.

<figure><img src="fig/radial-and-tangential.svg" alt="Radial und tangential" />
<figcaption>Abbildung 12 - Radiale (links) und tangentiale (rechts) Elongation am Bildrand.</figcaption></figure>

### Die Messung

Für jeden Stern beim Positionswinkel <i class="v">φ</i> (von der Bildmitte aus gesehen) misst das Script, wie viel seiner Elongation entlang des Radius liegt:

<figure><img src="fig/radial-ellipticity.svg" alt="Radiale Elliptizität" />
<figcaption>Abbildung 13 - Der radiale Anteil der Elliptizität eines Sterns.</figcaption></figure>

<div class="eq"><div>eps_rad = ε · cos 2(ψ − φ)</div><div><span class="c">+ε für einen Stern entlang des Radius, −ε quer dazu, 0 bei 45° - Nachführfehler heben sich über einen ganzen Ring auf</span></div></div>

Die Sterne werden in sechs Ringe eingeteilt (r/R = 0-⅙, ⅙-⅓, … 5/6-1).
Pro Ring listet die Konsole die Anzahl der Sterne, die Median-FWHM, die Elliptizität, eps_rad, die radiale Ausläuferrichtung asym_rad (Kapitel 9) und einen Übereinstimmungswert zwischen Ausläufer und Elongation (+1: der Ausläufer liegt entlang der Elongation, d. h. die Koma formt den Stern).
Das Urteil verwendet den Median von eps_rad im äußeren Drittel (r &gt; ⅔ R), mit mindestens 10 Sternen:

<div class="tbl"><table>
<tr><th>eps_rad (äußeres Drittel)</th><th>Muster</th><th>Faustregel des Scripts</th></tr>
<tr><td>|eps_rad| ≤ 0,04</td><td>keines</td><td>OK</td></tr>
<tr><td>&gt; +0,04 (Maßnahme ab 0,08)</td><td>radial</td><td>mit Korrektor: unterkorrigiert - den Abstand Korrektor-Sensor in kleinen Schritten vergrößern (z. B. 0,5 mm); unkorrigiertes System: normale Koma</td></tr>
<tr><td>&lt; −0,04 (Maßnahme unter −0,08)</td><td>tangential</td><td>den Abstand verkleinern - Defokus zusammen mit Bildfeldwölbung sieht aber genauso aus, daher zuerst den Fokus prüfen</td></tr>
</table></div>

<div class="note"><p>Die Richtung der Korrektur ist eine Faustregel, die für viele Korrektoren gilt; das letzte
Wort hat die Anleitung Ihres Korrektors. Ändern Sie den Abstand in kleinen Schritten und messen Sie erneut.</p>
<p>Wie unter- und überkorrigierte Koma im Bildfeld aussieht, zeigt der Simulator auf der Seite
<a href="koma.html#corrector">Koma - wie sie entsteht</a>.</p></div>
