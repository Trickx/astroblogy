---
title: "Setup › General"
menu: "General"
section: Setup
order: 20
shot: [SAD_Setup_General.png]
handbook: [measuring, tracking, tilt, limits]
---
What to measure and with which optics.
The optics values are only needed for the physical results (arcseconds, &Delta;z, tilt angle, 3D plot, coma-free point in mm) and for the suggestions of the assessment - the maps themselves work in pixels.

## Target

### Target image
{: #targetCombo .list}

> The image to analyze, from the open image windows.
> Below it its size and number of channels.
> Use a single light frame, not registered and not cropped: the image center must be the optical axis.
>
> The last entry, **Tips for the test frames**, shows instead of an image what makes a good test frame: exposure, focus, star field, unprocessed data, filter and comparing several frames.
> The same tips appear while no image is open.

### Load results...
{: #loadResultsButton .button}

Loads results saved with Save results and shows them as after a Calculate, without measuring the stars again: the maps, their evaluations, the assessment, Save and the AI review all work with them.
Optics, mount and observation values come from the saved FITS header (or the fields above), the layers from the current settings.

The background is the image when it is open (same view and file), else dark.
The detection settings of the dialog do not apply to loaded results; the next Calculate measures the target image again.

### Save results...
{: #saveResultsButton .button}

Saves the stars measured by the last Calculate (or loaded results) as a file *name*\_aberration.json, by default next to the image: positions, FWHM, shape and asymmetry of every star, the detection settings and the FITS header of the image - about 100 bytes per star.
The maps, the evaluations and the assessment are computed from it again on loading; the current layer and optics settings are not part of it.

### Loaded results
{: .display}

While loaded results are shown, a line below the buttons names the file and its number of stars.

## Debayer

### Debayer (SuperPixel) before star detection
{: #debayerCheck .checkbox}

Creates a debayered copy of the target image (SuperPixel method: direct 2x2 pixel grouping without interpolation, half resolution) and continues working on this copy.
The original image is left unchanged.
Only enable this if the target image is still an unprocessed Bayer mosaic (not true RGB).

It also applies to the frames of the Series tab.
It is disabled for a color target image unless the Series tab lists frames; color images are never debayered.

> Leave it off for a monochrome camera and for an image that is already RGB.
> Debayering it yourself with VNG or bilinear interpolation works too, but broadens the star profiles slightly.

### Bayer pattern
{: #bayerPatternCombo .list}

- Auto
- RGGB
- BGGR
- GBRG
- GRBG

\'Auto\' reads the Bayer pattern from the image\'s FITS/RAW metadata.
If that fails (\'Unable to acquire CFA pattern information\'), manually select the actual sensor pattern here (see the camera specification).

### Close intermediate windows after processing
{: #closeWindowsCheck .checkbox}

Closes the debayered SuperPixel intermediate window as well as any side windows created during the debayer step (e.g. noise evaluation) once the vector map has finished drawing.
Only relevant if debayering is enabled.

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

The optical system, for the suggestions of the Assessment page.
A bare Newtonian shows coma and field curvature by design; with a coma corrector, field flattener or reducer, the same patterns point to its spacing.
A refractor has hardly any coma: without a flattener, field curvature and astigmatism at the edge are expected, and its lens is collimated at the factory.
In a color or broadband frame, a refractor\'s lateral color elongates the edge stars radially like under-correction.
With Unknown, the suggestions name both cases.

SCT, Maksutov and RASA focus by moving the primary mirror (mirror flop).
A classic SCT has coma and a curved field by design; a Maksutov or SCT at f/10-f/15 is seeing-limited with a deep focus zone, so small differences across the field are uncertain.
An aplanatic SCT (EdgeHD), a RASA and an astrograph with built-in flattener are meant to be flat: curvature and coma point to the back focus.
A RASA at f/2 reacts to a few micrometers of tilt.

### Read the values from the FITS header
{: #opticsFromHeaderCheck .checkbox}

Uses XPIXSZ (pixel pitch, by convention including binning), FOCALLEN and APTDIA (or FOCALLEN/FOCRATIO) from the target image\'s FITS header (and from each frame\'s header in a series).
The fields below then show these values, read-only; a value the header does not give is not set (0) - without an image, all three.
Uncheck to enter your own values instead: they are saved and used for every image.
Always the physical sensor pitch - the doubling after SuperPixel debayering is applied automatically.

### Pixel pitch (µm)
{: #pixelPitchSpin .number}

Physical pixel size of the sensor in micrometers (e.g. 4.31 for a Canon EOS 550D). 0 = not specified, the tilt angle computation is then skipped.
Always enter the physical sensor pitch - with SuperPixel debayering the script automatically uses twice this value (one output pixel = 2x2 sensor pixels).

Grayed: \"Read the values from the FITS header\" is checked - the value comes from the header of the target image (XPIXSZ), 0 when it has none or there is no image.
Uncheck it to enter your own value, which is saved.

### Focal length (mm)
{: #focalLengthSpin .number}

Focal length of the telescope in mm (e.g. 750 for a Skywatcher 150P).

Grayed: from the FITS header of the target image (FOCALLEN), 0 when it has none.

### Aperture (mm)
{: #apertureSpin .number}

Aperture of the telescope in mm (e.g. 150 for a Skywatcher 150P).
Together with the focal length, this gives the f-number (focal length/aperture).

Grayed: from the FITS header of the target image (APTDIA, or FOCALLEN/FOCRATIO), 0 when it has none.

### Camera
{: #cameraValue .display}

From the FITS header of the target image (INSTRUME, binning from XBINNING/YBINNING), when \"Read the values from the FITS header\" is checked.
For information only.

### Mount
{: #mountCombo .list}

- Unknown
- German equatorial (GEM)
- Equatorial fork
- Alt-azimuth, tracked
- Not tracked

The mount, for the assessment: an alt-azimuth mount without a derotator turns the field during the exposure - the stars become arcs around the rotation center, a tangential pattern like field curvature; the assessment then gives its size at the corners (from EXPTIME, CENTALT, CENTAZ and SITELAT) and warns.

With \"Read the values from the FITS header\" it is estimated (grayed, the source beside it): PIERSIDE East/West means a German equatorial mount; otherwise the mount driver\'s name in TELESCOP (EQMod, GS Server, iOptron CEM, AM5 ... equatorial; Alt-Az, AZ-GTi, Seestar, Dwarf ... alt-azimuth); else unknown.
Uncheck it to choose the mount yourself.

### Guiding
{: #guidingCombo .list}

- Unknown
- Not guided
- Guide scope
- Off-axis guider (OAG)
- Guided, method unknown

How the exposures were guided - it decides what a common elongation of all stars means:

**Not guided**: the mount\'s tracking (periodic error of the worm, polar drift).

**Guide scope**: differential flexure between guide scope and main optics or mirror flop when it is the same in every frame, the guiding quality when it changes.

**Off-axis guider**: no differential flexure - the same in every frame points rather to astigmatism on the axis.

No FITS keyword says this; it is saved, also with \"Read the values from the FITS header\".
With **Unknown**, a guide camera in the header (GUIDECAM, written by the ASIAIR) counts as \"guided, method unknown\" - shown beside the field.

## Output

### 3D sensor tilt plot
{: #tiltPlot3DCheck .checkbox}

Opens a separate window with an isometric 2D graphic (PJSR has no true 3D): a flat reference plane next to the tilted plane computed from the Δz values.
Created by Save (and per frame by a series).
It needs pixel pitch, focal length and aperture - from the image\'s FITS header or the fields above: an image without them is skipped with a console note.

### Export data table as CSV
{: #exportCheck .checkbox}

Save: *name*\_aberration.csv next to the original file (the temporary directory for an image that was never saved).
Analyze series: StarAberrationSeries.csv in the directory of the frames.
Existing files are replaced.
