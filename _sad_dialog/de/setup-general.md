---
title: "Setup › General"
menu: "General"
section: Setup
order: 20
shot: [SAD_Setup_General.png]
handbook: [measuring, tracking, tilt, limits]
---
Was vermessen wird und mit welcher Optik.
Die Optikwerte braucht das Script nur für die physikalischen Ergebnisse (Bogensekunden, &Delta;z, Kippwinkel, 3D-Plot, komafreier Punkt in mm) und für die Vorschläge der Bewertung - die Karten selbst arbeiten in Pixeln.

## Target

### Target image
{: #targetCombo .list}

> Das zu analysierende Bild, aus den geöffneten Bildfenstern.
> Darunter stehen Größe und Zahl der Kanäle.
> Ein einzelnes Light-Frame verwenden, nicht registriert und nicht beschnitten: Die Bildmitte muss die optische Achse sein.
>
> Der letzte Eintrag, **Tips for the test frames**, zeigt statt eines Bildes, was eine gute Testaufnahme ausmacht: Belichtung, Fokus, Sternfeld, unbearbeitete Daten, Filter und der Vergleich mehrerer Aufnahmen.
> Dieselben Tipps erscheinen, solange kein Bild geöffnet ist.

### Load results...
{: #loadResultsButton .button}

Lädt mit Save results gespeicherte Ergebnisse und zeigt sie wie nach einem Calculate, ohne die Sterne neu zu vermessen: Karten, ihre Evaluation, das Assessment, Save und die KI-Auswertung arbeiten damit.
Optik-, Montierungs- und Beobachtungswerte kommen aus dem gespeicherten FITS-Header (oder den Feldern oben), die Ebenen aus den aktuellen Einstellungen.

Der Hintergrund ist das Bild, wenn es geöffnet ist (gleiche View und Datei), sonst dunkel.
Die Erkennungseinstellungen des Dialogs gelten nicht für geladene Ergebnisse; das nächste Calculate vermisst wieder das Zielbild.

### Save results...
{: #saveResultsButton .button}

Speichert die vom letzten Calculate vermessenen Sterne (oder geladene Ergebnisse) als Datei *Name*\_aberration.json, standardmäßig neben dem Bild: Position, FWHM, Form und Asymmetrie jedes Sterns, die Erkennungseinstellungen und der FITS-Header des Bildes - etwa 100 Byte pro Stern.
Karten, Evaluationen und Assessment werden beim Laden daraus neu berechnet; die aktuellen Ebenen- und Optikeinstellungen gehören nicht dazu.

### Geladene Ergebnisse
{: .display}

Solange geladene Ergebnisse angezeigt werden, nennt eine Zeile unter den Schaltflächen die Datei und die Zahl ihrer Sterne.

## Debayer

### Debayer (SuperPixel) before star detection
{: #debayerCheck .checkbox}

Erzeugt eine debayerte Kopie des Zielbilds (SuperPixel-Verfahren: direkte Zusammenfassung von 2×2 Pixeln ohne Interpolation, halbe Auflösung) und arbeitet mit dieser Kopie weiter.
Das Original bleibt unverändert.
Nur einschalten, wenn das Zielbild noch ein unbearbeitetes Bayer-Mosaik ist (kein echtes RGB).

Die Option gilt auch für die Frames des Series-Tabs.
Für ein farbiges Zielbild ist sie gesperrt, außer der Series-Tab enthält Frames; Farbbilder werden nie debayert.

> Bei einer Monochromkamera und bei einem Bild, das schon RGB ist, ausgeschaltet lassen.
> Selbst mit VNG oder bilinear zu debayern geht auch, verbreitert aber die Sternprofile etwas.

### Bayer pattern
{: #bayerPatternCombo .list}

- Auto
- RGGB
- BGGR
- GBRG
- GRBG

„Auto“ liest das Bayer-Muster aus den FITS-/RAW-Metadaten des Bildes.
Schlägt das fehl („Unable to acquire CFA pattern information“), hier das tatsächliche Muster des Sensors wählen (siehe Datenblatt der Kamera).

### Close intermediate windows after processing
{: #closeWindowsCheck .checkbox}

Schließt das debayerte SuperPixel-Zwischenfenster sowie alle Nebenfenster des Debayer-Schritts (z. B. der Rauschauswertung), sobald die Karte gezeichnet ist.
Nur relevant, wenn Debayern eingeschaltet ist.

## Optics, camera and mount

### Optics type
{: #opticsTypeCombo .list}

- Unknown
- Reflector without corrector (e.g. bare Newtonian)
- Reflector with coma corrector / reducer
- Refractor without flattener
- Refractor with flattener / reducer
- RASA / Hyperstar (f/2)
- SCT with reducer (e.g. f/6.3)
- Aplanatic SCT (EdgeHD and similar)
- Classic SCT or Maksutov (no corrector)
- Astrograph with built-in flattener (Petzval, quadruplet)

Das optische System, für die Vorschläge der Assessment-Seite.
Ein Newton ohne Korrektor zeigt Koma und Bildfeldwölbung konstruktionsbedingt; mit Komakorrektor, Bildfeldebner oder Reducer deuten dieselben Muster auf dessen Abstand.
Ein Refraktor hat kaum Koma: Ohne Bildfeldebner sind Bildfeldwölbung und Astigmatismus am Rand zu erwarten, und sein Objektiv ist ab Werk kollimiert.
In einem Farb- oder Breitband-Frame streckt der Farbquerfehler eines Refraktors die Randsterne radial wie eine Unterkorrektur.
Mit Unknown nennen die Vorschläge beide Fälle.

SCT, Maksutov und RASA fokussieren durch Verschieben des Hauptspiegels (Mirror Flop).
Ein klassisches SCT hat konstruktionsbedingt Koma und ein gewölbtes Feld; ein Maksutov oder SCT bei f/10-f/15 ist seeingbegrenzt und hat eine tiefe Fokuszone, kleine Unterschiede über das Feld sind daher unsicher.
Ein aplanatisches SCT (EdgeHD), ein RASA und ein Astrograph mit eingebautem Bildfeldebner sollen eben abbilden: Wölbung und Koma deuten dort auf den Backfokus.
Ein RASA bei f/2 reagiert schon auf wenige Mikrometer Verkippung.

### Read the values from the FITS header
{: #opticsFromHeaderCheck .checkbox}

Verwendet XPIXSZ (Pixelgröße, nach Konvention einschließlich Binning), FOCALLEN und APTDIA (oder FOCALLEN/FOCRATIO) aus dem FITS-Header des Zielbilds (in einer Serie aus dem Header jedes Frames).
Die Felder darunter zeigen dann diese Werte, nur lesbar; ein Wert, den der Header nicht liefert, ist nicht gesetzt (0) - ohne Bild alle drei.
Ausschalten, um eigene Werte einzugeben: Sie werden gespeichert und für jedes Bild verwendet.
Immer die physische Pixelgröße des Sensors - die Verdopplung nach SuperPixel-Debayern geschieht automatisch.

### Pixel pitch (µm)
{: #pixelPitchSpin .number}

Physische Pixelgröße des Sensors in Mikrometern (z. B. 4,31 für eine Canon EOS 550D). 0 = nicht angegeben, die Berechnung des Kippwinkels entfällt dann.
Immer die physische Pixelgröße eingeben - beim SuperPixel-Debayern verwendet das Script automatisch den doppelten Wert (ein Ausgabepixel = 2×2 Sensorpixel).

Ausgegraut: „Read the values from the FITS header“ ist eingeschaltet - der Wert kommt aus dem Header des Zielbilds (XPIXSZ), 0, wenn er fehlt oder kein Bild gewählt ist.
Ausschalten, um einen eigenen Wert einzugeben; er wird gespeichert.

### Focal length (mm)
{: #focalLengthSpin .number}

Brennweite des Teleskops in mm (z. B. 750 für einen Skywatcher 150P).

Ausgegraut: aus dem FITS-Header des Zielbilds (FOCALLEN), 0, wenn er fehlt.

### Aperture (mm)
{: #apertureSpin .number}

Öffnung des Teleskops in mm (z. B. 150 für einen Skywatcher 150P).
Zusammen mit der Brennweite ergibt sie das Öffnungsverhältnis (Brennweite/Öffnung).

Ausgegraut: aus dem FITS-Header des Zielbilds (APTDIA oder FOCALLEN/FOCRATIO), 0, wenn er fehlt.

### Camera
{: #cameraValue .display}

Aus dem FITS-Header des Zielbilds (INSTRUME, Binning aus XBINNING/YBINNING), wenn „Read the values from the FITS header“ eingeschaltet ist.
Nur zur Information.

### Mount
{: #mountCombo .list}

- Unknown
- German equatorial (GEM)
- Equatorial fork
- Alt-azimuth, tracked
- Not tracked

Die Montierung, für die Bewertung: Eine azimutale Montierung ohne Derotator dreht das Feld während der Belichtung - die Sterne werden zu Bögen um das Drehzentrum, ein tangentiales Muster wie bei Bildfeldwölbung; die Bewertung gibt dann seine Größe in den Ecken an (aus EXPTIME, CENTALT, CENTAZ und SITELAT) und warnt.

Mit „Read the values from the FITS header“ wird sie geschätzt (ausgegraut, die Quelle daneben): PIERSIDE East/West bedeutet eine deutsche Montierung; sonst der Name des Montierungstreibers in TELESCOP (EQMod, GS Server, iOptron CEM, AM5 ... äquatorial; Alt-Az, AZ-GTi, Seestar, Dwarf ... azimutal); andernfalls unbekannt.
Ausschalten, um die Montierung selbst zu wählen.

### Guiding
{: #guidingCombo .list}

- Unknown
- Not guided
- Guide scope
- Off-axis guider (OAG)
- Guided, method unknown

Wie die Aufnahmen geguidet wurden - das entscheidet, was eine gemeinsame Streckung aller Sterne bedeutet:

**Not guided**: die Nachführung der Montierung (periodischer Fehler der Schnecke, Poldrift).

**Guide scope**: differenzielle Durchbiegung zwischen Leitrohr und Hauptoptik oder Mirror Flop, wenn sie in jedem Frame gleich ist, die Guidingqualität, wenn sie sich ändert.

**Off-axis guider**: keine differenzielle Durchbiegung - gleich in jedem Frame deutet eher auf Astigmatismus auf der Achse.

Kein FITS-Keyword gibt das an; die Wahl wird gespeichert, auch mit „Read the values from the FITS header“.
Mit **Unknown** gilt eine Guiding-Kamera im Header (GUIDECAM, vom ASIAIR geschrieben) als „guided, method unknown“ - angezeigt neben dem Feld.

## Output

### 3D sensor tilt plot
{: #tiltPlot3DCheck .checkbox}

Öffnet ein eigenes Fenster mit einer isometrischen 2D-Grafik (PJSR hat kein echtes 3D): eine ebene Referenzfläche neben der aus den &Delta;z-Werten berechneten verkippten Ebene.
Erzeugt von Save (und in einer Serie pro Frame).
Braucht Pixelgröße, Brennweite und Öffnung - aus dem FITS-Header des Bildes oder den Feldern oben: Ein Bild ohne sie wird mit einem Hinweis in der Konsole übersprungen.

### Export data table as CSV
{: #exportCheck .checkbox}

Save: *Name*\_aberration.csv neben der Originaldatei (im temporären Verzeichnis für ein nie gespeichertes Bild).
Analyze series: StarAberrationSeries.csv im Verzeichnis der Frames.
Vorhandene Dateien werden ersetzt.
