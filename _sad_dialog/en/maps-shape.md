---
title: "Maps › Shape"
menu: "Shape"
section: Maps
order: 50
shot: [SAD_Maps_Shape.png]
handbook: [shape, tracking, map, spacing]
---
The star shape map: the elongation and orientation of every star, and the patterns they form.
Radial and tangential patterns point to corrector spacing or field curvature, a one-sided pattern to tilt, parallel lines everywhere to tracking.

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

## Star ellipses

### Show star ellipses
{: #showEllipsesCheck .checkbox}

Draws the fitted ellipse of every star.
Uncheck to look at the streamlines or the orientation heatmap alone.

### Vector scale
{: #scaleSpin .number}

Size of the star ellipses here and of the arrows on the Coma map - purely visual.

### Cell averages with uncertainty
{: #shapeShowCellsCheck .checkbox}

One bar per cell of the 11×11 grid along the mean axis of its stars (averaged in the doubled angle, since an axis has no direction), its length the mean elongation.
The white fan shows the uncertainty of the axis (± standard error / (2 × elongation)).
Bright with fan: significantly elongated (≥ 2.45σ); thin and gray: round within the noise; gray dot: fewer than 5 stars.

## Streamlines

### Show streamlines (smoothed orientation trend)
{: #streamlinesCheck .checkbox}

Shows the large-scale trend of the PSF orientation as continuous lines (like field lines), smoothed over neighboring stars.
Radial pattern = under-corrected coma (corrector too close), concentric pattern = over-correction, defocus or field curvature, a pattern that differs between the two sides = tilt; all field lines parallel = tracking.
Easier to spot than the noisy per-star vector map alone.
Correctly accounts for the fact that the PSF orientation is only defined mod 180° (double-angle averaging).

White: the direction is significant there; gray: it is not (see the option below).

### Smoothing radius (%)
{: #streamlineRadiusSpin .number}

How far neighboring stars contribute to smoothing the orientation field, in % of the image diagonal.
Smaller = follows local detail more closely (noisier), larger = smoother, more large-scale trend.

### Hide where the direction is not significant
{: #shapeSignificantOnlyCheck .checkbox}

The streamlines show only a direction, never its strength: on pure noise they still look orderly.
They are therefore white where the smoothed elongation is at least 2.45 times its standard error (the local scatter of the stars over their effective number; pure noise exceeds that in 5% of the places) and gray elsewhere.
With this option the gray parts are left out.

## Optics model

### Optics model streamlines
{: #shapeShowModelCheck .checkbox}

Fits what optics can produce to all stars: a uniform term (tracking residue, astigmatism on the axis), linear terms (a decentered pattern, binodal astigmatism of a misaligned system) and a radial/tangential term growing with r² (field curvature, corrector spacing).
Draws its streamlines in violet (muted where it is not significant); \"Model match per cell\" below shows where the stars agree with it.
The Evaluation below gives how much of the pattern it explains and its residual chi²/dof (about 1 = explained down to the noise).

### Hide the model where it is not significant
{: #shapeModelSignificantOnlyCheck .checkbox}

The model lines are violet where the model\'s field is at least 2.45 times its standard error (from the uncertainty of the 7 fitted terms), and a muted gray-violet where it is not - near the points where its terms cancel, and wherever the stars do not pin it down.
With this option the muted parts are left out.

### Model match per cell
{: #shapeShowMatchCheck .checkbox}

Compares each cell with the optics model: the mean difference between the stars\' shapes and what the model predicts there, in units of its standard error (scatter of the stars / √n).

**Magenta**: 3σ or more - the cell holds structure no optics of the model produce (bent or pinched optics, dew, vignetting by an off-axis guider or the focuser, nebulosity, halos, double stars - or a pattern of higher order than the model).
About one magenta cell per frame is chance; the Evaluation gives the expected number.

**Green**: less than 3σ - the cell agrees with the model within its noise.

No frame: fewer than 5 stars.

### Singular points
{: #shapeShowDefectsCheck .checkbox}

Marks the points where the smoothed axis field has no direction, with their index: optics produce at most one +1 (radial or tangential pattern around the axis) or two +½ (the same split by a uniform term, or binodal astigmatism).
More points, and any −½, are noise in the smoothed field - a larger smoothing radius or more stars help.

## Orientation heatmap

### Show orientation heatmap (instead of the star field)
{: #orientationHeatmapCheck .checkbox}

Replaces the image background with a color-field heatmap of the PSF orientation (like the Seti Astro Suite\'s \"Orientation Map\", github.com/setiastro/setiastrosuite): θ is fitted per double-angle averaging (with 3-sigma clipping) as a smooth 2D polynomial surface over all stars (degree set below) and colored as the hue of an HSV color wheel - color gradients show the large-scale orientation trend (tilt/coma) more directly than the real star field.
Requires enough stars for the chosen fit degree, otherwise it automatically falls back to the normal background.

### Fit degree
{: #orientationHeatmapDegreeSpin .number}

Degree of the 2D polynomial fitted to the star orientations. 1 = a plane (pure, uniform tilt only - matches the Seti Astro Suite\'s default). 2 or higher lets the heatmap also follow local curvature (e.g. a coma pattern) that a plane cannot represent and that may otherwise only show up in the streamlines overlay - at the cost of being more sensitive to noise/outliers, especially near the image edges where fewer stars constrain the higher-order terms.

## Evaluation

### Evaluation
{: .display}

After Calculate: the elongated and round cells, the significance of the pattern, and how much of it the optics model explains.
