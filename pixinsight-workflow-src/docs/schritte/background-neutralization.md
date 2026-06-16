<img src="../../assets/icons/BackgroundNeutralization.svg" alt="Background Neutralization Icon" class="step-icon" />

# Background Neutralization

<div class="step-icon-clear"></div>

## Ziel

Die Hintergrundneutralisation (Background Neutralization) sorgt dafür, dass der Himmelshintergrund farblich neutral wird – also weder einen Rot-, Grün- noch Blaustich besitzt.
Selbst nach einer erfolgreichen SPCC-Kalibrierung kann der Hintergrund noch einen Farbstich haben, verursacht durch:

- Lichtverschmutzung (z. B. Natrium- oder LED-Beleuchtung)
- Luftleuchten (Airglow)
- Mondlicht
- unvollständige Gradientenentfernung
- Sensoreffekte
- Restfehler beim Stacking

Ein Hintergrund, der eigentlich dunkelgrau sein sollte, kann dann beispielsweise grünlich, rötlich oder bläulich erscheinen.

Was macht die Hintergrundneutralisation?

PixInsight sucht einen Bereich, der als echter Hintergrund betrachtet wird, also möglichst:

- ohne Sterne,
- ohne Nebel,
- ohne Galaxienanteile,
- ohne sonstige Objekte.

Anschließend misst es dort die mittleren RGB-Werte.

Beispiel:

| Kanal | Mittelwert |
| - | - |
| R | 0,018 |
| G | 0,015 |
| B | 0,012 |

Der Hintergrund ist hier rötlich.  
PixInsight skaliert dann die Kanäle so, dass die Werte angeglichen werden:

| Kanal	| Neu |
| - | - |
| R | 0,015 |
| G | 0,015 |
| B | 0,015 | 

Der Hintergrund wird neutral grau.

### Heute oft „optional“!

SPCC kalibriert die Farben bereits sehr präzise anhand realer Sternfarben.
Eine zusätzliche Hintergrundneutralisation kann in manchen Fällen sogar unerwünschte Farbanteile entfernen, die physikalisch real sind.
Deshalb empfehlen viele PixInsight-Anwender heute:

- SPCC durchführen
- Ergebnis prüfen
- Background Neutralization nur anwenden, wenn tatsächlich ein sichtbarer Farbstich im Hintergrund vorhanden ist.
    - Bei Emissionsnebeln besonders vorsichtig

**Faustregel**

Nach SPCC:

- Hintergrund neutral oder natürlich → nichts tun.
- Deutlicher Grün-, Rot- oder Blaustich → Background Neutralization kann helfen.
- Große Nebel im Bild → sehr vorsichtig einsetzen oder ganz weglassen.

