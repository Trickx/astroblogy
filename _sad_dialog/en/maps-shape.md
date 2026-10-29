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

## Simulator

The simulator draws the map for an image of random stars whose shapes follow a simple optical model, and evaluates it like the script.
Set the corrector spacing, the sensor tilt, tracking and collimation and watch which pattern each of them leaves in the ellipses, the streamlines and the Evaluation box - and how the optics model tells them apart.

<p class="sim-head">Errors</p>
<div class="sim">
  <label><span>Corrector spacing error: <b id="sh-vds"></b></span><input type="range" id="sh-ds" min="-3" max="3" step="0.1" value="-1" /></label>
  <label><span>Sensitivity: sag at r = 15 mm per mm of spacing error: <b id="sh-vsens"></b></span><input type="range" id="sh-sens" min="5" max="80" step="1" value="25" /></label>
  <label><span>Residual astigmatism of the corrector at r = 15 mm: <b id="sh-vast"></b></span><input type="range" id="sh-ast" min="0" max="40" step="1" value="10" /></label>
  <label><span>Sensor tilt: <b id="sh-vtilt"></b></span><input type="range" id="sh-tilt" min="0" max="0.5" step="0.01" value="0" /></label>
  <label><span>Direction of the tilt (away from the optics): <b id="sh-vtiltdir"></b></span><input type="range" id="sh-tiltdir" min="0" max="355" step="5" value="0" /></label>
  <label><span>Focus offset in the center: <b id="sh-vfocus"></b></span><input type="range" id="sh-focus" min="-40" max="40" step="1" value="0" /></label>
  <label><span>Tracking error (smear): <b id="sh-vtrk"></b></span><input type="range" id="sh-trk" min="0" max="5" step="0.1" value="0" /></label>
  <label><span>Direction of the tracking error: <b id="sh-vtrkdir"></b></span><input type="range" id="sh-trkdir" min="0" max="175" step="5" value="0" /></label>
  <label><span>Optical axis off the center, x: <b id="sh-vax"></b></span><input type="range" id="sh-ax" min="-6" max="6" step="0.5" value="0" /></label>
  <label><span>Optical axis off the center, y: <b id="sh-vay"></b></span><input type="range" id="sh-ay" min="-6" max="6" step="0.5" value="0" /></label>
</div>
<p class="sim-head">Optics and sensor</p>
<div class="sim">
  <label><span>Focal ratio: <b id="sh-vN"></b></span><input type="range" id="sh-N" min="2" max="10" step="0.1" value="6" /></label>
  <label><span>Focal length: <b id="sh-vF"></b></span><input type="range" id="sh-F" min="200" max="2500" step="10" value="500" /></label>
  <label><span>Seeing (FWHM): <b id="sh-vS"></b></span><input type="range" id="sh-S" min="1" max="5" step="0.1" value="2.5" /></label>
  <label><span>Sensor</span><select id="sh-sensor">
    <option value="23.5,15.6">APS-C (23.5 × 15.6 mm)</option>
    <option value="36,24">Full frame (36 × 24 mm)</option>
    <option value="17.3,13">Four Thirds (17.3 × 13 mm)</option>
    <option value="11.3,11.3">IMX533 (11.3 × 11.3 mm)</option>
  </select></label>
  <label><span>Pixel size (effective): <b id="sh-vP"></b></span><input type="range" id="sh-P" min="2" max="9" step="0.01" value="3.76" /></label>
</div>
<p class="sim-head">Measurement</p>
<div class="sim">
  <label><span>Measured stars: <b id="sh-vstars"></b></span><input type="range" id="sh-stars" min="100" max="4000" step="50" value="1000" /></label>
  <label><span>Noise of a single star's shape (χ): <b id="sh-vnoise"></b></span><input type="range" id="sh-noise" min="0" max="0.1" step="0.005" value="0.03" /></label>
  <button type="button" id="sh-reseed">New stars</button>
  <label class="check"><input type="checkbox" id="sh-subtract" checked="checked" /> Subtract it from all stars</label>
</div>
<p class="sim-head">Display</p>
<div class="sim">
  <label class="check"><input type="checkbox" id="sh-ellipses" checked="checked" /> Show star ellipses</label>
  <label><span>Vector scale: <b id="sh-vscale"></b></span><input type="range" id="sh-scale" min="0.2" max="4" step="0.1" value="1" /></label>
  <label class="check"><input type="checkbox" id="sh-cells" checked="checked" /> Cell averages with uncertainty</label>
  <label class="check"><input type="checkbox" id="sh-streamlines" checked="checked" /> Show streamlines (smoothed orientation trend)</label>
  <label><span>Smoothing radius (%): <b id="sh-vradius"></b></span><input type="range" id="sh-radius" min="3" max="40" step="1" value="12" /></label>
  <label class="check"><input type="checkbox" id="sh-sigonly" /> Hide where the direction is not significant</label>
  <label class="check"><input type="checkbox" id="sh-model" /> Optics model streamlines</label>
  <label class="check"><input type="checkbox" id="sh-modelsig" /> Hide the model where it is not significant</label>
  <label class="check"><input type="checkbox" id="sh-match" /> Model match per cell</label>
  <label class="check"><input type="checkbox" id="sh-defects" checked="checked" /> Singular points</label>
</div>
<div id="shape-sim">
  <canvas class="sim-canvas" id="sh-map" aria-label="Simulated star shape map"></canvas>
  <pre class="readout" id="sh-eval"></pre>
  <div class="readout" id="sh-truth"></div>
</div>

The *true* values below the Evaluation box come straight from the model, without noise; the map and the Evaluation box see only the measured stars.
The true values hold for the outermost point of each corner; the script pools the 2×2 corner cells, whose stars lie on average closer to the center, so it measures smaller values there.
Worth trying: a spacing error of either sign (radial or tangential edge), a tilt without spacing error (radial on one side, tangential on the other - a pattern the optics model cannot explain), a focus offset (the whole edge radial or tangential, like a spacing error), tracking with and without *Subtract it from all stars*, and an optical axis off the center (the axis of the pattern moves with it).

<div class="note"><p><b>Model:</b> the image is astigmatic, with a sagittal and a tangential focal surface on either side of the medial one, z = (κ ∓ α) · r², with r measured from the optical axis.
The corrector spacing error bends the medial surface (κ = s · Δs / 15 mm², as in the simulator of <a href="#maps-size">Maps › Size</a>); the residual astigmatism α of the corrector keeps the stars round where the sensor meets the medial surface and elongates them radially or tangentially in front of or behind it.
Which sign of the spacing error gives which pattern is set here to the rule of thumb of the handbook (radial = corrector too close); for a real corrector its manual has the last word.
The blurs add as second moments: the seeing, the defocus ellipse (|z<sub>T,S</sub> − z<sub>sensor</sub>| / N, radially and tangentially) and the tracking smear.
Left out: coma and every asymmetry (Maps › Coma), the tilt of the image plane that a decollimated system adds, diffraction and the sampling of the pixels; the orientation heatmap is not simulated.</p></div>
<script src="/pi-scripts/StarAberrationDiagnostics/dialog/shape-sim.js?v={{ site.time | date: '%s' }}"></script>
