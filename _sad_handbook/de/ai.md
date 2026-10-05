---
title: "Die KI-Auswertung"
order: 130
---
Auf Wunsch schickt das Script seine Ergebnisse für eine zweite Meinung an Claude (Anthropic API) - nach einer Vorschau (Preview), nach einer Serienanalyse oder nach beidem.
Gesendet wird:

- die Messwerte der obigen Kapitel als Zahlen (Nachführung, Ringprofil, FWHM-Fläche und ein 5×5-Raster, Quadranten, Koma-Fit, Optik), die regelbasierte Bewertung und optional die Vektorkarte als Bild;
- bei einer Serie: eine Zeile pro Aufnahme (Seite, Stundenwinkel, Höhe, Fokus, die obigen Werte, SIP) und der Vergleich der Seiten.

Außer der optionalen Vektorkarte verlassen keine Bilddaten den Rechner.
Die Antwort wird in eine feste Struktur gezwungen: ein Gesamturteil, die Reihenfolge der Korrekturen und pro Befund die zugrunde liegenden Messwerte, wie die Sterne aussehen, die Herleitung, die Alternativen und warum sie schlechter passen, was zu tun ist, wie man es in der nächsten Aufnahme überprüft, und eine Konfidenz mit Begründung.
*Step by step* erklärt jeden Fachbegriff für Einsteiger; *Short* beschränkt jeden Punkt auf ein oder zwei Sätze.
Anfragen und Antworten lassen sich als Textdateien neben den Aufnahmen speichern.

<div class="note"><p>Die KI wägt dieselben Zahlen ab, die auch die Regeln verwenden - sie kann sie erklären und
verknüpfen, aber nicht mehr sehen, als gemessen wurde. Sie benötigt einen Anthropic-API-Schlüssel; jede Anfrage wird
darüber abgerechnet.</p></div>
