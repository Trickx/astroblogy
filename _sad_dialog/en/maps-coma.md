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

## Simulator

The simulator draws the map for an image of random comatic stars and evaluates it like the script.
Set the residual coma of the corrector and a decollimation and watch the arrows, the streamlines and the coma-free point - and what the console reports.

<p class="sim-head">Optics</p>
<div class="sim">
  <label><span>Residual field coma: <b id="co-vcorr"></b></span><input type="range" id="co-corr" min="-1" max="1" step="0.05" value="1" /></label>
  <label><span>Decollimation x (constant coma): <b id="co-vdx"></b></span><input type="range" id="co-dx" min="-8" max="8" step="0.5" value="0" /></label>
  <label><span>Decollimation y (constant coma): <b id="co-vdy"></b></span><input type="range" id="co-dy" min="-8" max="8" step="0.5" value="0" /></label>
  <label><span>Focal ratio: <b id="co-vN"></b></span><input type="range" id="co-N" min="2.8" max="10" step="0.1" value="4" /></label>
  <label><span>Focal length: <b id="co-vF"></b></span><input type="range" id="co-F" min="200" max="2500" step="10" value="800" /></label>
  <label><span>Seeing (FWHM): <b id="co-vS"></b></span><input type="range" id="co-S" min="1" max="5" step="0.1" value="2.5" /></label>
  <label><span>Sensor</span><select id="co-sensor">
    <option value="23.5,15.6">APS-C (23.5 × 15.6 mm)</option>
    <option value="36,24">Full frame (36 × 24 mm)</option>
    <option value="17.3,13">Four Thirds (17.3 × 13 mm)</option>
    <option value="11.3,11.3">IMX533 (11.3 × 11.3 mm)</option>
  </select></label>
  <label><span>Pixel size (effective): <b id="co-vP"></b></span><input type="range" id="co-P" min="2" max="9" step="0.01" value="3.76" /></label>
</div>
<p class="sim-head">Measurement</p>
<div class="sim">
  <label><span>Measured stars: <b id="co-vstars"></b></span><input type="range" id="co-stars" min="100" max="4000" step="50" value="1000" /></label>
  <label><span>Noise of a single star's m3: <b id="co-vnoise"></b></span><input type="range" id="co-noise" min="0" max="1" step="0.01" value="0.15" /></label>
  <button type="button" id="co-reseed">New stars</button>
  <label class="check"><input type="checkbox" id="co-measure" checked="checked" /> Measure PSF asymmetry (coma direction, coma-free point)</label>
</div>
<p class="sim-head">Display</p>
<div class="sim">
  <label class="check"><input type="checkbox" id="co-streamlines" checked="checked" /> Show coma streamlines (orange with arrows)</label>
  <label><span>Smoothing radius (%): <b id="co-vradius"></b></span><input type="range" id="co-radius" min="5" max="55" step="1" value="24" /></label>
  <label><span>Stop below (%): <b id="co-vmin"></b></span><input type="range" id="co-min" min="0" max="90" step="5" value="20" /></label>
  <label class="check"><input type="checkbox" id="co-arrows" checked="checked" /> Show coma arrows (median per grid cell, length = strength)</label>
  <label class="check"><input type="checkbox" id="co-stararrows" /> Show one asymmetry arrow per star</label>
  <label><span>Min. strength (sigma): <b id="co-vminsigma"></b></span><input type="range" id="co-minsigma" min="0" max="10" step="0.5" value="2" /></label>
  <label class="check"><input type="checkbox" id="co-bystrength" /> Color by strength instead of alignment</label>
  <label><span>Vector scale: <b id="co-vscale"></b></span><input type="range" id="co-scale" min="0.02" max="2" step="0.02" value="0.1" /></label>
</div>
<div id="coma-sim">
  <canvas class="sim-canvas" id="co-map" aria-label="Simulated coma map"></canvas>
  <pre class="readout" id="co-eval"></pre>
  <div class="readout" id="co-truth"></div>
</div>

Below the map are the lines the script writes to the console, and below them the *true* values of the model; the dashed cyan circle marks the true coma-free point, the magenta cross the fitted one.
Worth trying: the residual coma from 1 (no corrector) through 0 (matching corrector) to negative values (over-corrected, the arrows point inward); a decollimation without corrector (the coma-free point moves by the decollimation divided by the residual coma, so a small residual moves it far); and a well-corrected system with much noise, where the coma-free point can no longer be determined.
In the model the third moment grows more slowly than the coma itself where the coma is strong; the linear field model of the script then puts the coma-free point a little off the true one - further than its bootstrap uncertainty says.

<div class="note"><p><b>Model:</b> third-order coma as on the page <a href="/pi-scripts/StarAberrationDiagnostics/de/koma.html">Koma - wie sie entsteht</a> (German): a star at the field position P gets the coma vector c = q · P − D, with the residual q of the field coma and the constant coma D of a decollimation; its length is C = |c| / (16 N²), as for a paraboloid.
What the script measures of such a star depends only on the ratio of C to the seeing; it is traced once with rays when the page loads: the core center and σ by adaptive moments (in place of the PSF fit), then the third moment, the centroid offset and the elongation inside an aperture of 4.5 σ.
Left out: astigmatism, field curvature and tilt (Maps › Shape), an uneven tracking drift (it adds a constant asymmetry and shifts the coma-free point just like a decollimation), diffraction, saturation and the sampling of the pixels.
The vector scale here is not the one of the dialog: the simulated map is much smaller than a real frame.</p></div>
<script src="/pi-scripts/StarAberrationDiagnostics/dialog/coma-sim.js?v={{ site.time | date: '%s' }}"></script>
