---
title: "Maps › Coma"
menu: "Coma"
section: Maps
order: 60
shot: [SAD_Maps_Coma.png]
handbook: [coma]
---
The coma map: on which side of each star its flare sits.
Under- and over-corrected coma, a decentered corrector and the collimation of a reflector show here, with the coma-free point.

## Above all map tabs

### Show
{: #mapSourceCombo .list}

- Target image (Calculate)
- Series static: *group* (*n* frames)

**Target image (Calculate)**: the image measured by Calculate - to check the settings on one frame before running a series.

**Series static**: after Analyze series, the stars of all frames (or of one side of the flip) pooled.
Each frame loses its dynamic tracking (its own uniform term less the mean of the group) and its FWHM is scaled to the median center FWHM, so the seeing drops out: what remains is fixed to the sensor - the optics, plus any constant tracking, which a single camera angle cannot tell from astigmatism on the axis.
With n frames the standard errors are about √n smaller.
The background is dark: the pooled stars belong to no single frame.

## Coma field

### Measure PSF asymmetry (coma direction, coma-free point)
{: #measureAsymmetryCheck .checkbox}

Gaussian/Moffat fits are point-symmetric and cannot show on which side of the core a comatic flare sits.
This option measures the flux centroid and the third moment of each star directly on the pixels relative to the PSF-fit center, draws the median flare direction on a coarse grid (orange arrows), fits the coma field v = k·(P − P0) and marks the coma-free point P0 (magenta) with its bootstrap uncertainty.
Adds a few seconds of runtime.

### Show coma streamlines (orange with arrows)
{: #comaStreamlinesCheck .checkbox}

Streamlines through the smoothed PSF-asymmetry field (flare direction) instead of the ellipse orientation.
Unlike the elongation streamlines they have a real direction (arrowheads) and stop where the coma becomes weak.
Under-corrected coma: lines diverge from the coma-free point (source); over-corrected: they converge on it (sink).
Deviations from straight radial lines show what a simple coma model cannot, e.g. a tilted corrector.
Requires \"Measure PSF asymmetry\".

### Smoothing radius (%)
{: #comaStreamlineRadiusSpin .number}

Smoothing radius of the asymmetry field, in % of the image diagonal.
The per-star asymmetry is much noisier than the ellipse orientation, so this radius should be larger than the one for the elongation streamlines (default: about twice).

### Stop below (%)
{: #comaStreamlineMinSpin .number}

A line ends where the smoothed asymmetry drops below this percentage of the field\'s strength (90th percentile over the seed points).
Higher = only the clearly comatic regions, lower = lines reach further into the coma-free zone (noisier).

### Show coma arrows (median per grid cell, length = strength)
{: #comaArrowsCheck .checkbox}

Orange arrows on a 9×6 grid with the median flare direction per cell.
Unlike the streamlines, their length shows the strength directly.
Requires \"Measure PSF asymmetry\".

## Per-star arrows

### Show one asymmetry arrow per star
{: #starAsymArrowsCheck .checkbox}

Draws the measured flare direction of every star as an arrow from the star center (length = strength, scaled with the vector scale), for a star-by-star comparison with the ellipses.
Default color: alignment with the ellipse axis - green = parallel (coma shapes the star), red = perpendicular (elongation from defocus/field curvature/astigmatism), gray = star nearly round.
Arrows below the threshold are hidden.
Requires \"Measure PSF asymmetry\".

### Min. strength (sigma)
{: #starAsymMinSpin .number}

The per-star asymmetry is noisy.
Its noise is estimated from the inner field, where the coma is close to zero; only arrows stronger than this many sigma are drawn. 0 = draw all.

### Color by strength instead of alignment
{: #starAsymColorCheck .checkbox}

> Colors the per-star arrows by their strength instead of their alignment with the ellipse axis.
