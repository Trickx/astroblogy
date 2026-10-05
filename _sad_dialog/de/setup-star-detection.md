---
title: "Setup › Star detection"
menu: "Star detection"
section: Setup
order: 30
shot: [SAD_Setup_StarDetection.png]
handbook: [measuring, shape, tracking]
---
Wie die Sterne gefunden (StarDetector von PixInsight) und vermessen werden (ein PSF-Fit mit DynamicPSF).
Die Voreinstellungen passen für die meisten Frames.
Eine Änderung auf dieser Seite braucht ein neues **Calculate**; alles auf den Maps-Seiten zeichnet nur neu.

## Star detection

### Threshold (sigma)
{: #thresholdSpin .number}

Schwelle der Sternerkennung in Einheiten des Hintergrundrauschens.
Niedriger = mehr, aber womöglich weniger zuverlässige Sterne.

### Max. stars (0 = all)
{: #maxCandSpin .number}

Begrenzt die Zahl der Kandidaten, die an DynamicPSF gehen, auf die N hellsten (nach dem Fluss des StarDetector sortiert).
Der PSF-Fit ist ein einziger, blockierender Aufruf ohne sichtbaren Zwischenfortschritt - weniger Kandidaten verkürzen seine Laufzeit direkt. 0 = alle gefundenen Kandidaten fitten.

### Custom StarDetector parameters
{: #sdCustomCheck .checkbox}

Aus: StarDetector läuft mit seinen eigenen Voreinstellungen (structure layers 5, sensitivity 0,5, peak response 0,5, max. distortion 0,6, keine clustered sources).
Diese verwerfen stark gestreckte und große Sterne - genau die verzerrten Sterne am Feldrand, die dann die Ecken des FWHM-Rasters leer oder dünn besetzt lassen.

Ein: Die Werte darunter werden verwendet.

> Die vier Felder und das Kontrollkästchen darunter gelten nur, solange dies eingeschaltet ist.

### Structure layers
{: #sdLayersSpin .number}

Zahl der dyadischen Wavelet-Ebenen: Die größte erkennbare Struktur ist etwa 2^n Pixel (5 = 32 px).
Für große, defokussierte oder stark verzerrte Sterne erhöhen.
Voreinstellung 5.

### Sensitivity
{: #sdSensitivitySpin .number}

0..1, höher = schwächere Sterne werden erkannt.
Voreinstellung 0,5.

### Peak response
{: #sdPeakResponseSpin .number}

0..1, höher = toleranter gegenüber flachen Sternprofilen (aufgeblähte Sterne am Feldrand); niedriger = nur Sterne mit ausgeprägter Spitze.
Voreinstellung 0,5.

### Max. distortion
{: #sdMaxDistortionSpin .number}

0..1, höher = stärker gestreckte oder unregelmäßige Sterne werden akzeptiert.
Erhöhen (z. B. auf 0,8), wenn die Sterne am Feldrand stark gestreckt sind.
Zu hoch lässt auch Galaxien und verschmolzene Sterne durch.
Voreinstellung 0,6.

### Allow clustered sources
{: #sdClusteredCheck .checkbox}

Nicht trennbare Doppel- und Mehrfachsterne als ein Objekt erkennen.
Ihre Schwerpunkte und Formen sind unzuverlässig, deshalb ist dies standardmäßig aus.

## PSF fit

### Moffat PSF instead of Gaussian
{: #moffatCheck .checkbox}

Moffat ist das realistischere Profil für Sterne mit Beugungsscheibchen, Gauß ist schneller.

### Search radius (px)
{: #radiusSpin .number}

Suchradius des PSF-Fits in Pixeln; an die Sterngröße anpassen.

### MAD outlier factor
{: #madSpin .number}

Verwirft PSF-Fits, deren MAD (mittlere Abweichung vom Modell) mehr als das X-fache des Medians aller erfolgreichen Fits dieses Bildes beträgt.
Filtert verrauschte oder instabile Fits heraus (Hotpixel, verschmolzene Sterne, sehr schwache Kandidaten), die in der Vektorkarte sonst als physikalisch unplausible, einzelne Ausreißer erschienen (starke Exzentrizität direkt neben ruhigen Nachbarsternen). 0 = Filter aus.

## Common tracking error

### Gemessener Nachführfehler
{: #trackingInfoLabel .display}

Die mediane Streckung aller Sterne: Elliptizität, Exzentrizität und Richtung der großen Achse (Bildkoordinaten: 0° = rechts, 90° = unten).
Unter einer Elliptizität von 0,03 ist sie vernachlässigbar.

> Zeigt *Measured with Calculate* bis zum ersten Calculate, danach den gemessenen Wert.

### Subtract it from all stars
{: #subtractTrackingCheck .checkbox}

Optische Fehler bilden Muster, die symmetrisch um die optische Achse liegen und sich über das Feld ausmitteln; eine Streckung, die alle Sterne teilen, kommt von Nachführung/Guiding, Wind oder Durchbiegung.
Ihr Median steht immer in der Konsole; mit dieser Option wird sie außerdem von jedem Stern abgezogen, bevor Vektorkarte, Stromlinien, Heatmap und Ringanalyse berechnet werden, damit die Montierung das optische Muster nicht überdeckt.
Die CSV behält die Rohwerte in zusätzlichen Spalten.
