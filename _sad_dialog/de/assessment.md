---
title: "Assessment"
menu: "Assessment"
order: 80
shot: [SAD_Assessment_Script.png, SAD_Assessment_AI.png]
handbook: [assessment, ai]
---
Die Bewertung des letzten Calculate, Thema für Thema, mit Korrekturvorschlägen in der Reihenfolge, in der sie abzuarbeiten sind, und die optionale KI-Auswertung: eine zweite Meinung von Claude zu den Messwerten und der Bewertung.

Solange der Assessment-Tab gewählt ist, zeigt die linke Seite des Dialogs statt der Vorschau die beiden Bewertungen als Tabs: **Script assessment** und **AI review**.
Der Assessment-Tab rechts enthält die Einstellungen der KI-Auswertung.

## Linke Seite: die Bewertungen

### Script assessment
{: .display}

Wird von Calculate gefüllt.
Am Anfang steht die vorgeschlagene Reihenfolge der Korrekturen, danach ein Eintrag pro Thema (Daten, Montierung, Fokus, Nachführung, Verkippung, Abstand, Koma, Bildfeldwölbung ...) mit seinem Urteil - **[OK]**, **[Note]** oder **[Action]** - und, wo etwas zu tun ist, einem Vorschlag hinter einem Pfeil.
Die Einstellungen unter Setup › General - Optics type, Mount und Guiding - bestimmen die Vorschläge mit.

### AI review
{: .display}

Claudes Antwort.
Vor der ersten Anfrage steht dort, was die Schaltfläche tut; **Ask Claude** und **Continue** wechseln auf diesen Tab, während die Antwort abgewartet wird.

## AI review (Claude)

### API key
{: #aiKeyEdit .text}

Dein Anthropic-API-Schlüssel (console.anthropic.com).
Die Umgebungsvariable ANTHROPIC\_API\_KEY hat Vorrang, wenn sie gesetzt ist.

Ein hier eingegebener Schlüssel wird unverschlüsselt in den Einstellungen von PixInsight gespeichert, aber nie in einem Prozess-Icon.
Das Feld leeren, um ihn zu entfernen.

### Answer language
{: #aiLanguageEdit .text}

Die Sprache der KI-Auswertung, z. B. English oder Deutsch.

### Explanation
{: #aiDetailCombo .list}

- Short (for experienced users)
- Step by step (for beginners)

**Step by step**: für bis zu 6 Befunde, die Aufmerksamkeit brauchen, die Messwerte und was sie bedeuten, wie die Sterne aussehen, die Herleitung der Ursache, höchstens zwei andere Ursachen, was zu tun ist und wie man es prüft - jeweils in höchstens zwei Sätzen, Begriffe kurz erklärt (etwa 700 Wörter).

**Short**: bis zu 5 Befunde, höchstens 25 Wörter pro Feld (etwa 300 Wörter) - schneller und günstiger.

### Attach the maps
{: #aiSendMapCheck .checkbox}

Sendet die Karten Star size, Star shape und Coma mit ihren aktuellen Ebenen als Bilder (höchstens 1092 px je Karte), damit Claude die Muster ebenso sieht wie die Zahlen.
Ohne diese Option werden nur die Messwerte und die Bewertung gesendet.

### Save requests and answers
{: #aiSaveLogCheck .checkbox}

Speichert jede Anfrage und ihre Antwort als Textdatei StarAberrationAI\_*Datum*\_*Uhrzeit*.txt: ein Kopf mit Datum und den analysierten Dateien, die Anfrage wie gesendet (die Karten nur als Platzhalter) und die Antwort, lesbar und als JSON.
Fehlgeschlagene Anfragen werden mit dem Fehler gespeichert.

Die Datei landet neben den Frames der Serie, sonst neben dem Zielbild, sonst im temporären Verzeichnis.
Der API-Schlüssel wird nie geschrieben.

### Ask Claude
{: #aiButton .button}

Sendet die Messwerte der behaltenen Analyse (Calculate), die Bewertung des Scripts und optional die drei Karten sowie den Vergleich des Series-Tabs, falls vorhanden, an Claude (claude-opus-5-5, Anthropic API) und zeigt die Auswertung links im Tab AI review: welche Erklärung zu allen Werten passt, wo die Regeln zu streng oder zu nachsichtig sind und was in welcher Reihenfolge zu tun ist.
Ein Calculate oder eine Serie genügt.

Braucht einen API-Schlüssel und eine Internetverbindung; jede Anfrage wird dem Schlüssel berechnet (meist wenige Cent) und kann eine Minute dauern.
Außer den angehängten Karten verlassen keine Bilddaten den Computer.

### Continue
{: #aiContinueButton .button}

Nur wenn Claudes Antwort am Token-Limit abgeschnitten wurde: bittet Claude um den Rest der Antwort und zeigt die zusammengefügte Antwort.
Wird wie eine neue Anfrage berechnet (die Anfrage und die bisherige Antwort werden erneut gesendet).
