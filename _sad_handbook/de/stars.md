---
title: "Sterne als Sonde der Optik"
order: 20
---
Ein Stern ist so weit entfernt, dass er praktisch ein **Punkt** ist.
Alles, was diesen Punkt auf dem Sensor zu einem kleinen Scheibchen, einem Oval oder einem kleinen Kometen macht, passiert unterwegs: in der Atmosphäre, in der Montierung, im Teleskop, im Korrektor, in der Kamera.
Das Bild, das eine Punktquelle erzeugt, heißt **Punktspreizfunktion (PSF)**.
Weil jeder Stern im Bild durch einen anderen Teil des optischen Systems läuft, bilden die Sterne zusammen eine Karte davon, wie gut die Optik an jeder Stelle des Bildfelds arbeitet.

Das Script liest diese Karte.
Für jeden Stern misst es vier Dinge:

- **Größe** - wie weit das Licht verteilt ist, als Halbwertsbreite (FWHM, full width at half maximum).
- **Elongation** - wie stark der Stern von einem Kreis abweicht.
- **Orientierung** - in welche Richtung ein länglicher Stern zeigt.
- **Asymmetrie** - ob das Licht zu einer Seite hin ausläuft, wie der Schweif eines Kometen.

Ein einzelner Stern sagt wenig aus: Seeing, Rauschen und Nachbarsterne stören jede Messung.
Die Stärke der Methode liegt im **Muster** über Hunderte von Sternen.
Ein Fokusfehler, ein verkippter Sensor, ein falscher Korrektorabstand, ein dejustierter Spiegel und ein Nachführfehler hinterlassen jeweils ein eigenes Muster, und die folgenden Kapitel erklären, welches - und wie das Script sie auseinanderhält.

<figure><img src="fig/star-profile.svg" alt="Sternprofil" />
<figcaption>Abbildung 1 - Ein Schnitt durch einen Stern: die Helligkeit pro Pixel (Balken) und das angepasste Modell (Kurve). Die FWHM ist die Breite auf halber Höhe über dem Hintergrund.</figcaption></figure>
