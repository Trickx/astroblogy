---
title: "Series"
menu: "Series"
order: 90
shot: [SAD_Series_PreStart.png, SAD_Series_Postrun.png, SAD_Series_Report.png, SAD_Series_AIReview.png]
handbook: [series, sip]
---
Mehrere Frames, mit denselben Einstellungen vermessen und verglichen - vor allem vor und nach einem Meridian-Flip, der trennt, was am Sensor festsitzt (Optik), von dem, was sich mit der Montierung dreht (Nachführung, Durchbiegung).
Die Erkennungseinstellungen, das Debayern, der Abzug der Nachführung und die Optik des Setup-Tabs gelten für jedes Frame.

Solange der Series-Tab gewählt ist, ändert sich auch die linke Seite des Dialogs: Vor dem ersten Lauf zeigt sie Hinweise zur Serienanalyse, ab **Analyze series** drei Tabs - **Map**, **Series report** und **AI review**.

## Linke Seite

### Hinweise vor einem Lauf
{: .display}

Bis zum ersten Analyze series zu sehen: die bisher gelisteten Frames mit ihren Seiten und einer Schätzung der Laufzeit, die Dateien, die ein Lauf mit den aktuellen Einstellungen schreibt (CSV-Tabelle, Karten, Mosaike, Protokoll der KI-Auswertung - die Frames selbst werden nie verändert), sowie Tipps, wie viele Frames man nimmt, zu Frames vor und nach dem Meridian-Flip und zu den Frames selbst.

### Map
{: .display}

Die Karte der Serie: während des Laufs die Karte jedes Frames, sobald es vermessen ist (mit **Show each frame\'s map**), danach das statische Ergebnis aller Frames (Maps - Show: Series static).
Ein Klick auf ein Frame in der Liste zeigt seine Karte erneut.

### Series report
{: .display}

Der Vergleich der Frames und Seiten nach Analyze series.
Er erscheint, sobald die Frames vermessen sind; das statische Ergebnis von Durchlauf 2 folgt darunter.
Nach einem **Stop** nennen seine ersten Zeilen, nach welchem Frame der Lauf endete und wie viele Frames nicht vermessen wurden; Durchlauf 2 entfällt dann.
Ein Frame, dessen Header nicht lesbar war und das deshalb übersprungen wurde, nennt die Konsole.

### AI review
{: .display}

Claudes Antwort - dieselbe wie im Assessment-Tab.
**Ask Claude** wechselt auf diesen Tab.

## Frames

### Frame-Liste
{: #seriesTree .list}

Die Light-Frames der Serie.
**From** gibt an, woher die Seite kommt: das PIERSIDE-Keyword (N.I.N.A., ASCOM), ein Kamerawinkel, der sich beim Flip um 180° dreht (ROTATOR des ASIAIR), der Stundenwinkel oder manuell.
Frames kurz nach dem Meridian haben womöglich keine bekannte Seite.

Nicht registrierte, nicht beschnittene Frames verwenden: Die Bildmitte muss die optische Achse sein.

### Add files...
{: #seriesAddButton .button}

> Fügt Light-Frames (FITS oder XISF) zur Liste hinzu.

### Remove
{: #seriesRemoveButton .button}

Entfernt die ausgewählten Frames aus der Liste.

### Clear
{: #seriesClearButton .button}

> Leert die Liste.

## Seite
{: #seriesSideLabel}

Legt die Seite der ausgewählten Frames fest.

### West
{: .display}

Vor dem Flip: Teleskop westlich der Säule, zeigt nach Osten (so wie N.I.N.A.
PIERSIDE schreibt).

### East
{: .display}

Nach dem Flip: Teleskop östlich der Säule, zeigt nach Westen.

### Auto
{: .display}

Übernimmt die Seite wieder aus dem Header (PIERSIDE, Kamerawinkel oder Stundenwinkel).

## Karten

### Show each frame\'s map
{: #seriesShowMapsCheck .checkbox}

Zeichnet die Karte des gewählten Tabs (Star shape, Star size oder Coma) jedes Frames in die Vorschau, sobald es vermessen ist, und behält eine verkleinerte Kopie: Ein Klick auf ein Frame in der Liste zeigt sie wieder.
Das kostet einige Sekunden mehr pro Frame.

Nur die Anzeige ändert sich: Die Analyse von Calculate, der Assessment-Tab und die KI-Auswertung bleiben, wie sie sind (die KI-Auswertung bekommt nie die Karten der Serie).

### Save maps next to the frames
{: #seriesSaveMapsCheck .checkbox}

Speichert für jedes Frame die Bilder, die Save öffnet, als PNG im Verzeichnis des Frames, nach dem Frame benannt, damit sie direkt dahinter einsortiert werden:

*Name*\_Size.png, *Name*\_Shape.png, *Name*\_Coma.png, *Name*\_Tilt.png - die vier Karten mit den Ebenen ihrer Tabs

*Name*\_Aberration3D.png - der 3D-Plot der Sensorverkippung, wenn er aktiviert ist (Setup › General) und Pixelgröße, Brennweite und Öffnung bekannt sind

Nach Durchgang 2 außerdem SeriesStatic\_*Gruppe*\_Size.png ... \_Tilt.png im Verzeichnis des ersten Frames - die statischen Karten aller Frames und jeder Seite.

Dateien eines früheren Laufs werden ersetzt.

### Save a 3x3 mosaic next to the frames
{: #seriesSaveMosaicCheck .checkbox}

Speichert für jedes Frame ein Mosaik, wie AberrationInspector es zeichnet: die vier Ecken, die vier Randmitten und die Bildmitte, jeweils 1:1 auf 512 × 512 px des gestreckten Bildes zugeschnitten, durch graue Linien getrennt.

*Name*\_Mosaic.png - PNG, im Verzeichnis des Frames

Mit eingeschaltetem Debayern stammen die Kacheln aus dem SuperPixel-Bild halber Größe.
Dateien eines früheren Laufs werden ersetzt.

## Ausführen

### Analyze series
{: #seriesAnalyzeButton .button}

Vermisst jedes Frame mit den aktuellen Einstellungen (Setup › Star detection, Debayern, Abzug der Nachführung, Optik) und vergleicht die Seiten: Verkippung, FWHM, Randmuster, Nachführung, Komastärke und komafreier Punkt, jeweils beurteilt als stabil oder beim Flip wechselnd, dazu Drifts über die Nacht.

Jedes Frame dauert etwa so lange wie ein Calculate.
**Stop** beendet den Lauf nach dem aktuellen Frame; die bis dahin vermessenen Frames werden verglichen, Durchlauf 2 entfällt.
Der CSV-Export (Setup › General) schreibt eine Zeile pro Frame.

**Durchgang 2** legt dann die Sterne aller Frames und jeder Seite zusammen, nachdem jedem Frame seine dynamische Nachführung abgezogen (sein eigener gleichförmiger Anteil abzüglich des Mittels) und seine FWHM auf die mediane Mitten-FWHM skaliert wurde: die statische Optik mit etwa √n-mal kleineren Fehlern.
Die Karten zeigen sie sofort (Maps - Show: Series static); der Bericht nennt die statische und die dynamische Nachführung.
Calculate bleibt ein einzelner Durchgang auf dem Zielbild - um die Einstellungen vor einer Serie zu prüfen.

### Ask Claude
{: #seriesAiButton .button}

Sendet die Serie (Werte pro Frame und den Vergleich der Seiten) an Claude und zeigt die Auswertung links im Tab AI review (wie beim Assessment-Tab).
Eine aktuelle Analyse von Calculate wird mitgesendet.
API-Schlüssel, Antwortsprache und Kosten: siehe den Assessment-Tab.
