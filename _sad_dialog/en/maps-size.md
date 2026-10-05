---
title: "Maps › Size"
menu: "Size"
section: Maps
order: 40
shot: [SAD_Maps_Size.png]
handbook: [tilt, spacing]
---
The star size map: the FWHM in an 11&times;11 grid, each cell compared with the center.
It shows field curvature, corrector spacing and sensor tilt as a pattern of larger stars towards the edge or one side.

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

## Legend

### Fill colors
{: .display}

The 11×11 grid shows per cell its FWHM (25%-trimmed mean) in pixels and/or arcseconds and its ratio to the center (inner 3×3 cells): ×1.17 = 17% larger stars than in the center.
The fill follows the ratio and its class: green ≤ 1.10 good (as sharp as the center, or sharper), yellow slight, orange clear (around 1.25), red ≥ 1.50 strong - only where the cell differs from the center by at least 2σ (or is good anyway); an unfilled cell cannot be told from the center.

Hatched, value in (brackets): uncertain - fewer than 5 stars, or a standard error above 10% of the value.

The Evaluation box gives the center FWHM, the corners (median ratio of the 2×2 corner blocks: field curvature / spacing) and the tilt (relative difference of the more unequal diagonal, with its significance: &lt; 5% unremarkable, 5-10% slight, > 10% worth correcting).
The console lists the details.
Each cell has only a fraction of the stars: the tilt axis and the tilt angles use the 4 quadrants.

**Green or not significant?**
Green means the cell is at most 10% larger than the center - good, whatever the noise.
*Not significant* (unfilled) means the cell looks more than 10% larger, but the difference to the center is less than 2&sigma;: a deterioration is not proven there, nor ruled out.

**Uncertain or not significant?**
*Uncertain* (hatched) means the cell itself is not measured well enough - fewer than 5 stars or a standard error above 10% - and is not judged at all.
*Not significant* means the cell is measured well, but its difference to the center is within the noise.

## FWHM grid: each cell shows

### FWHM in pixels
{: #fwhmPxRadio .option}

Each cell shows its FWHM in image pixels (3.15 px).

### FWHM in arcseconds
{: #fwhmArcsecRadio .option}

Each cell shows its FWHM in arcseconds (2.07\"), using 206.265 × pixel pitch \[µm] / focal length \[mm].
Needs pixel pitch and focal length (Setup › General; with SuperPixel debayering, twice the pitch is used automatically) - pixels otherwise.

### Ratio to the center
{: #fwhmRatioRadio .option}

Each cell shows its FWHM relative to the center (inner 3×3 cells): ×1.17 = 17% larger stars than in the center - the value the fill and the assessment are based on.

### Uncertainty and star count
{: #fwhmGridDetailsCheck .checkbox}

Adds a smaller line to every cell: ± the 1σ uncertainty of its FWHM (its standard error, 1.4826 × MAD / √n - not the scatter of the stars; in pixels, or in arcseconds when only those are shown) and *n* = number of stars.
Two cells differ reliably only when their difference exceeds about 2-3 × √(σ₁² + σ₂²).

## Evaluation

### Evaluation
{: .display}

After Calculate: the center FWHM, the cell counts per class, the corners (field curvature / spacing), the tilt along the more unequal diagonal and the spread of the outer ring.
