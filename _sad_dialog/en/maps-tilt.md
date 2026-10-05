---
title: "Maps › Tilt"
menu: "Tilt"
section: Maps
order: 70
shot: [SAD_Maps_Tilt.png]
handbook: [tilt]
---
The tilt map in the style of Siril\'s *Show tilt*: the mean FWHM of the four quadrants as a quadrilateral, and the tilt axis.

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

## Tilt axis

### Show tilt axis
{: #tiltAxisCheck .checkbox}

Draws the light-blue tilt axis through the sensor center, derived from the 4-quadrant FWHM evaluation, with its angle/direction label.

### Reading the map
{: .display}

The yellow quadrilateral is recreated from Siril\'s \"Show tilt\" (ccd-inspector.c): one corner point per image quadrant, its distance from the center proportional to the deviation of that quadrant\'s mean FWHM from the average of all four.
Coarser than the 11×11 grid of Star size, but each quadrant has a quarter of all stars.
The light-blue tilt axis runs through the sensor center along the steepest rise of the plane through the four quadrants.

## Evaluation

### Evaluation
{: .display}

After Calculate: the FWHM of the four quadrants, the tilt and - with pixel pitch, focal length and aperture - &Delta;z and the tilt angle.
