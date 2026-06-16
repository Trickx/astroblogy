<img src="../../assets/icons/DynamicBackgroundExtraction.svg" alt="Dynamic Background Extraction Icon" class="step-icon" />

# Dynamic Background Extraction

<div class="step-icon-clear"></div>

## Ziel

Dynamic Background Extraction (DBE) ist ebenso wie die [Gradient Correction](gradient-correction.md) ein Werkzeug zur Entfernung unerwünschter Hintergrundgradienten und Helligkeitsunterschiedn. Der Arbeitsablauf unterscheided sich jedoch, da hier gezielt Hintergrundproben (Samples) platziert werden.

## Ausgangslage

Das Bild unten zeigt die Ausgangslage aus Schritt [Gradient Correction](gradient-correction.md). Wir befinden uns noch in der linearen Bildberarbeitung. Sämtliche Bilder sind per Scree transfer Function gestreckt.

<img src="../../assets/screenshots/GC_Result_OKsettings.jpg" alt="Ergebnis mit angepassten Settings" />

Folgende Parameter sind zu setzen:

- **Tolerance** Die Samples sollten keine Strukturen beinhalten, lediglich den Hintergrund. Größere Werte erlauben höhe Abweichungen.

- **Default Sample Radius** Sind die Samples zu klein treten mitunter farbfehler im Hintergrund auf.

- **Samples per rox** Nicht übertreiben. :-)

- **Correction** Ich nutze fast immer Substaction, wenn ich es nicht vergesse und nichts passiert.

- **Replace target image** bestimmt ob ein neues Bild erzeugt wird oder das Original überschrieben wird.

## 1. Versuch

<img src="../../assets/screenshots/DBG_Samples.png" alt="Ergebnis mit angepassten Settings" />

Das Ergebnis der Korrektur kann sich scjon fast sehen lassen. Mich stören noch die Farbfehler im Hintergrund.

<img src="../../assets/screenshots/DBE_Result.jpg" alt="Ergebnis mit angepassten Settings" />

Das entsprechende Hintergrundmodell ist im folgenden Bild dargestellt.

<img src="../../assets/screenshots/DBG_Modell.jpg" alt="Ergebnis mit angepassten Settings" />

## 2. Versuch 

Mit größeren Samples wird die Hintergrundfarbe besser gemittelt.

<img src="../../assets/screenshots/DBG_Samples2.png" alt="Ergebnis mit angepassten Settings" />

Das Ergebnis der Korrektur mit vergrößerten Samples sollte sich nun gut entrauschen lassen.

<img src="../../assets/screenshots/DBE_Result2.jpg" alt="Ergebnis mit angepassten Settings" />

## Fazit 

Das neue Hintergrundmodell ist weniger bunt. Jedoch sollte das Modell einen Grauverlauf zeigen und keine farbigen Flecken ins Bild bringen. Vermutlich sollte man mehrere Durchläufe einer Hintergrundkorrektur oder eine zu starke Korrektur vermeiden. Ich werde weiter an den Parametern im vorherigen Schritt der [Gradient Correction](gradient-correction.md) erneut spielen um die Dynamic Background Extraction vermeiden zu können.

<img src="../../assets/screenshots/DBG_Modell2.jpg" alt="Ergebnis mit angepassten Settings" />

Also weiter zurück zur [Gradient Correction](gradient-correction.md).