---
title: "Series"
menu: "Series"
order: 90
shot: [SAD_Series_PreStart.png, SAD_Series_Postrun.png, SAD_Series_Report.png, SAD_Series_AIReview.png]
handbook: [series, sip]
---
Several frames measured with the same settings and compared - above all before and after a meridian flip, which separates what is fixed to the sensor (optics) from what turns with the mount (tracking, flexure).
The detection settings, debayering, tracking subtraction and optics of the Setup tab apply to every frame.

While the Series tab is selected, the left side of the dialog changes too: before the first run it shows hints for the series analysis, from **Analyze series** on three tabs - **Map**, **Series report** and **AI review**.

## Left side

### Hints before a run
{: .display}

Shown until the first Analyze series: the frames listed so far with their sides and an estimate of the run time, the files a run will write with the current settings (CSV table, maps, mosaics, log of the AI review - the frames themselves are never changed), and tips on how many frames to take, on frames before and after the meridian flip and on the frames themselves.

### Map
{: .display}

The map of the series: during the run each frame\'s map as soon as it is measured (with **Show each frame\'s map**), afterwards the static result of all frames (Maps - Show: Series static).
Clicking a frame in the list shows its map again.

### Series report
{: .display}

The comparison of the frames and sides after Analyze series.
It is shown as soon as the frames are measured; the static result of pass 2 follows below.
After a **Stop**, its first lines say after which frame the run ended and how many frames were not measured; pass 2 is then skipped.
The console also names a frame whose header could not be read and that was skipped.

### AI review
{: .display}

Claude\'s answer - the same as on the Assessment tab.
**Ask Claude** switches to this tab.

## Frames

### Frame list
{: #seriesTree .list}

The light frames of the series.
**From** tells where the side comes from: the PIERSIDE keyword (N.I.N.A., ASCOM), a camera angle that turns by 180° at the flip (ROTATOR of the ASIAIR), the hour angle, or manual.
Frames close after the meridian may have no known side.

Use unregistered, uncropped frames: the image center must be the optical axis.

### Add files...
{: #seriesAddButton .button}

> Adds light frames (FITS or XISF) to the list.

### Remove
{: #seriesRemoveButton .button}

Removes the selected frames from the list.

### Clear
{: #seriesClearButton .button}

> Empties the list.

## Side
{: #seriesSideLabel}

Sets the side of the selected frames.

### West
{: .display}

Before the flip: telescope west of the pier, pointing east (as N.I.N.A. writes PIERSIDE).

### East
{: .display}

After the flip: telescope east of the pier, pointing west.

### Auto
{: .display}

Takes the side from the header again (PIERSIDE, camera angle or hour angle).

## Maps

### Show each frame\'s map
{: #seriesShowMapsCheck .checkbox}

Draws the map of the selected tab (Star shape, Star size or Coma) of each frame in the preview as soon as it is measured, and keeps a reduced copy: clicking a frame in the list shows it again.
This takes a few seconds more per frame.

Only the display changes: the analysis of Calculate, the Assessment tab and the AI review stay as they are (the AI review never gets the maps of the series).

### Save maps next to the frames
{: #seriesSaveMapsCheck .checkbox}

Saves for each frame the images Save opens, as PNG in the frame\'s directory, named after the frame so that they sort right after it:

*name*\_Size.png, *name*\_Shape.png, *name*\_Coma.png, *name*\_Tilt.png - the four maps with the layers of their tabs

*name*\_Aberration3D.png - the 3D sensor tilt plot, when it is enabled (Setup > General) and pixel pitch, focal length and aperture are known

After pass 2 also SeriesStatic\_*group*\_Size.png ... \_Tilt.png in the directory of the first frame - the static maps of all frames and of each side.

Files of an earlier run are replaced.

### Save a 3x3 mosaic next to the frames
{: #seriesSaveMosaicCheck .checkbox}

Saves for each frame a mosaic as AberrationInspector draws it: the four corners, the four edge centers and the image center, each cropped 1:1 to 512 x 512 px of the stretched image, separated by gray lines.

*name*\_Mosaic.png - PNG, in the frame\'s directory

With Debayer enabled, the tiles come from the half-size SuperPixel image.
Files of an earlier run are replaced.

## Run

### Analyze series
{: #seriesAnalyzeButton .button}

Measures every frame with the current settings (Setup > Star detection, debayer, tracking subtraction, optics) and compares the sides: tilt, FWHM, edge pattern, tracking, coma strength and coma-free point, each judged as stable or changing at the flip, plus drifts over the session.

Each frame takes about as long as a Calculate.
**Stop** ends the run after the current frame; the frames measured so far are compared, pass 2 is skipped.
The CSV export (Setup > General) writes one line per frame.

**Pass 2** then pools the stars of all frames, and of each side, after taking out each frame\'s dynamic tracking (its own uniform term less the mean) and scaling its FWHM to the median center FWHM: the static optics with about √n smaller errors.
The maps show it at once (Maps - Show: Series static); the report gives the static and the dynamic tracking.
Calculate stays a single pass on the target image - to check the settings before a series.

### Ask Claude
{: #seriesAiButton .button}

Sends the series (values per frame and the comparison of the sides) to Claude and shows its review on the AI review tab on the left (as on the Assessment tab).
A current analysis of Calculate is sent along.
API key, answer language and costs: see the Assessment tab.
