---
title: "Maps › Tilt"
menu: "Tilt"
section: Maps
order: 70
shot: [SAD_Maps_Tilt.png]
handbook: [tilt]
---
The tilt map in the style of Siril\'s *Show tilt*: the mean FWHM of the four quadrants as a quadrilateral, and the tilt axis.

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
