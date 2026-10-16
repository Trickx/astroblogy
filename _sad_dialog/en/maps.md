---
title: "Maps"
menu: "All maps"
section: Maps
order: 35
---
The Maps tab has one sub-tab per map: [Size](#maps-size), [Shape](#maps-shape), [Coma](#maps-coma) and [Tilt](#maps-tilt).
Above the sub-tabs sits one setting that applies to all four.

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
