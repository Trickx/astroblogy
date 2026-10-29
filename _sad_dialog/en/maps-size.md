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

## Simulator

The simulator draws the map for an image of random stars whose size follows a simple optical model, and evaluates it like the script.
Set the corrector spacing and the sensor tilt and watch how field curvature, tilt and focus show up in the cells and in the Evaluation box - and how many stars it takes to tell them from the noise.

<p class="sim-head">Errors</p>
<div class="sim">
  <label><span>Corrector spacing error: <b id="ss-vds"></b></span><input type="range" id="ss-ds" min="-3" max="3" step="0.1" value="1" /></label>
  <label><span>Sensitivity: sag at r = 15 mm per mm of spacing error: <b id="ss-vsens"></b></span><input type="range" id="ss-sens" min="5" max="80" step="1" value="25" /></label>
  <label><span>Sensor tilt: <b id="ss-vtilt"></b></span><input type="range" id="ss-tilt" min="0" max="0.5" step="0.01" value="0.05" /></label>
  <label><span>Direction of the tilt (away from the optics): <b id="ss-vtiltdir"></b></span><input type="range" id="ss-tiltdir" min="0" max="355" step="5" value="0" /></label>
  <label><span>Focus offset in the center: <b id="ss-vfocus"></b></span><input type="range" id="ss-focus" min="-40" max="40" step="1" value="0" /></label>
</div>
<p class="sim-head">Optics and sensor</p>
<div class="sim">
  <label><span>Focal ratio: <b id="ss-vN"></b></span><input type="range" id="ss-N" min="2" max="10" step="0.1" value="6" /></label>
  <label><span>Focal length: <b id="ss-vF"></b></span><input type="range" id="ss-F" min="200" max="2500" step="10" value="500" /></label>
  <label><span>Seeing (FWHM): <b id="ss-vS"></b></span><input type="range" id="ss-S" min="1" max="5" step="0.1" value="2.5" /></label>
  <label><span>Sensor</span><select id="ss-sensor">
    <option value="23.5,15.6">APS-C (23.5 × 15.6 mm)</option>
    <option value="36,24">Full frame (36 × 24 mm)</option>
    <option value="17.3,13">Four Thirds (17.3 × 13 mm)</option>
    <option value="11.3,11.3">IMX533 (11.3 × 11.3 mm)</option>
  </select></label>
  <label><span>Pixel size (effective): <b id="ss-vP"></b></span><input type="range" id="ss-P" min="2" max="9" step="0.01" value="3.76" /></label>
</div>
<p class="sim-head">Measurement and display</p>
<div class="sim">
  <label><span>Measured stars: <b id="ss-vstars"></b></span><input type="range" id="ss-stars" min="100" max="4000" step="50" value="1000" /></label>
  <label><span>Scatter of a single star's FWHM: <b id="ss-vscatter"></b></span><input type="range" id="ss-scatter" min="0" max="25" step="1" value="8" /></label>
  <button type="button" id="ss-reseed">New stars</button>
  <label class="check"><input type="radio" name="ss-mode" value="px" /> FWHM in pixels</label>
  <label class="check"><input type="radio" name="ss-mode" value="arcsec" /> FWHM in arcseconds</label>
  <label class="check"><input type="radio" name="ss-mode" value="ratio" checked="checked" /> Ratio to the center</label>
  <label class="check"><input type="checkbox" id="ss-details" /> Uncertainty and star count</label>
</div>
<div id="size-sim">
  <canvas class="sim-canvas" id="ss-map" aria-label="Simulated star size map, 11 × 11 cells"></canvas>
  <pre class="readout" id="ss-eval"></pre>
  <div class="readout" id="ss-truth"></div>
  <canvas class="sim-canvas" id="ss-section" aria-label="Section along both diagonals: image shell and sensor"></canvas>
</div>

The section below the map shows, along both diagonals, where the stars are focused (the image shell) and where the sensor is; the gap between them is the defocus Δz of the stars there.
The *true* values above it come straight from the model; the map and the Evaluation box see only the measured stars, with their scatter and the trimmed mean of the script.
The true values hold for the outermost point of each corner; the script pools the 2×2 corner cells, whose stars lie on average closer to the center, so it measures smaller ratios there.

<div class="note"><p><b>Model:</b> the corrector spacing error bends the image shell into a paraboloid, z = s · Δs · (r / 15 mm)², with the sensitivity s of the corrector; the sensor is a plane tilted by the angle and shifted by the focus offset.
A star is blurred by d = |Δz| / N, added to the seeing in quadrature: FWHM² = FWHM₀² + d², the same relation the handbook uses to turn a FWHM back into Δz.
Left out: astigmatism and the radial or tangential elongation it causes (Maps › Shape), coma, diffraction and the sampling of the pixels.
The sensitivity depends on the corrector and is not known in general; the default only gives a plausible order of magnitude.</p></div>
<script src="/pi-scripts/StarAberrationDiagnostics/dialog/size-sim.js?v={{ site.time | date: '%s' }}"></script>
