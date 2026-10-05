---
title: "Setup › Star detection"
menu: "Star detection"
section: Setup
order: 30
shot: [SAD_Setup_StarDetection.png]
handbook: [measuring, shape, tracking]
---
How the stars are found (PixInsight\'s StarDetector) and measured (a PSF fit with DynamicPSF).
The defaults suit most frames.
Changing a value on this page needs a new **Calculate**; everything on the Maps pages only redraws.

## Star detection

### Threshold (sigma)
{: #thresholdSpin .number}

Star detection threshold in units of the background noise.
Lower = more, but possibly less reliable stars.

### Max. stars (0 = all)
{: #maxCandSpin .number}

Limits the number of candidates passed to DynamicPSF to the N brightest (sorted by StarDetector flux).
The PSF fit is a single, blocking call with no visible intermediate progress - fewer candidates directly shorten its runtime. 0 = fit all found candidates.

### Custom StarDetector parameters
{: #sdCustomCheck .checkbox}

Off: StarDetector runs with its own defaults (structure layers 5, sensitivity 0.5, peak response 0.5, max. distortion 0.6, no clustered sources).
These reject strongly elongated and large stars - exactly the aberrated stars at the field edge, which then leave the corners of the FWHM grid empty or sparsely populated.

On: the values below are used.

> The four fields and the checkbox below are only used while this is checked.

### Structure layers
{: #sdLayersSpin .number}

Number of dyadic wavelet layers: the largest detectable structure is about 2^n pixels (5 = 32 px).
Increase it for large, defocused or strongly aberrated stars.
Default 5.

### Sensitivity
{: #sdSensitivitySpin .number}

0..1, higher = fainter stars are detected.
Default 0.5.

### Peak response
{: #sdPeakResponseSpin .number}

0..1, higher = more tolerant of flat star profiles (bloated stars at the field edge); lower = only stars with a prominent peak.
Default 0.5.

### Max. distortion
{: #sdMaxDistortionSpin .number}

0..1, higher = more elongated or irregular stars are accepted.
Raise it (e.g. 0.8) when the stars at the field edge are strongly elongated.
Too high also lets galaxies and blends through.
Default 0.6.

### Allow clustered sources
{: #sdClusteredCheck .checkbox}

Detect non-separable double/multiple stars as single objects.
Their centroids and shapes are unreliable, so this is off by default.

## PSF fit

### Moffat PSF instead of Gaussian
{: #moffatCheck .checkbox}

Moffat is the more realistic profile for stars with a diffraction disk, Gaussian is faster.

### Search radius (px)
{: #radiusSpin .number}

Search radius of the PSF fit in pixels; adjust to the star size.

### MAD outlier factor
{: #madSpin .number}

Rejects PSF fits whose MAD (mean deviation from the model) is more than X times the median of all successful fits in this image.
Filters out noisy/unstable fits (hot pixels, blends, very faint candidates) that would otherwise show up in the vector map as physically implausible, isolated outliers (strong eccentricity right next to calm neighboring stars). 0 = filter disabled.

## Common tracking error

### Measured tracking error
{: #trackingInfoLabel .display}

The median elongation of all stars: ellipticity, eccentricity and the direction of the major axis (image coordinates: 0° = right, 90° = down).
Below an ellipticity of 0.03 it is negligible.

> Shows *Measured with Calculate* until the first Calculate, then the measured value.

### Subtract it from all stars
{: #subtractTrackingCheck .checkbox}

Optical aberrations form patterns that are symmetric around the optical axis and average out over the field; an elongation shared by all stars comes from tracking/guiding, wind or flexure.
Its median is always reported in the console; with this option it is also subtracted from every star before the vector map, streamlines, heatmap and the ring analysis are computed, so the optical pattern is not masked by the mount.
The CSV keeps the raw values in extra columns.
