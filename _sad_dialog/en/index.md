---
title: "The dialog"
menu: "Overview"
order: 10
shot: [SAD_Setup_General.png]
handbook: [stars, limits]
permalink: /pi-scripts/StarAberrationDiagnostics/dialog/
---
StarAberrationDiagnostics measures the shape of every star across the field and turns it into maps and an assessment of the optics.
This reference walks through the dialog page by page and explains every setting; how the computations behind it work is explained in the [handbook](/pi-scripts/StarAberrationDiagnostics/#handbook).

The dialog has two halves.
On the **left** is the preview: the tips for the test frames while no image is chosen, the target image before the first **Calculate**, then the map of the selected Maps tab; on the Assessment and the Series tab, their own results instead (assessments, series hints and report).
On the **right** are the settings in four tabs:

- [Setup](setup-general/) - the target image, debayering, optics and output ([General](setup-general/)), and the star detection and PSF fit ([Star detection](setup-star-detection/)).
- [Maps](maps-size/) - one sub-tab per map: [Size](maps-size/), [Shape](maps-shape/), [Coma](maps-coma/) and [Tilt](maps-tilt/), each with its layers and its evaluation.
- [Assessment](assessment/) - the verdicts with suggested corrections, and the optional AI review.
- [Series](series/) - several frames, e.g. before and after the meridian flip, compared.

### Typical workflow

1. Open a single, unregistered and uncropped light frame and select it as the target image.
2. Check the optics on [Setup › General](setup-general/) (or let them be read from the FITS header).
3. Click **Calculate**.
   The preview shows the map of the selected Maps tab; switching tabs and layers redraws it at once, without measuring the stars again.
4. Read the [Assessment](assessment/) and work through the corrections in the order given.
5. **Save** opens the maps as image windows (plus CSV and 3D plot, when enabled) and closes the dialog.
{: .steps}

## Preview

### Zoom buttons
{: .display}

Zoom in, zoom out, 1:1 and zoom to fit.
The mouse wheel zooms as well; drag to scroll.

### Status line
{: .display}

The zoom factor and the image coordinates under the mouse pointer.

## Buttons

### New instance (triangle, bottom left)
{: #newInstanceButton .button}

Drop the current settings as a process icon on the workspace.
Double-clicking the dropped icon later reopens the dialog with the same settings.

**Note:** Dragging directly onto an image is not supported for script processes in current PixInsight versions.

### Calculate
{: #previewButton .button}

Runs the analysis with the current settings and shows a map in the preview - that of the selected Maps tab (Size, Shape, Coma, Tilt) - without opening a window, exporting the CSV file or drawing the 3D plot.
Switching between these tabs switches the map at once.
The PSF asymmetry is always measured, so that the coma layers can be switched on later.

After that, the layers and their settings can be changed without measuring the stars again: the preview is redrawn at once.
Only a change of the detection settings or the target image needs a new Calculate.

### Save
{: #applyButton .button}

Opens the four maps in new windows: Star size, Star shape, Coma and Tilt (AberrationSize\_…, AberrationShape\_…, AberrationComa\_…, AberrationTilt\_…), with the 3D plot and the CSV export when enabled, and closes the dialog.
The star measurement of Calculate is reused when its detection settings are still current.

### Cancel
{: #cancelButton .button}

> Closes the dialog without output.
> During a computation the button reads **Stop** and ends it.
