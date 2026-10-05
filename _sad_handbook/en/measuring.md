---
title: "Finding and measuring the stars"
order: 30
---
### Debayering raw color frames

A color camera records a **Bayer mosaic**: each pixel sees only red, green or blue.
An unprocessed mosaic cannot be measured directly - the color pattern would look like structure in every star.
The usual debayer methods fill in the missing colors by **interpolation**, which softens every star a little and in a direction-dependent way.
That would falsify exactly what the script measures.

The script therefore uses the **SuperPixel** method: each 2×2 block (one red, two green, one blue pixel) becomes one color pixel, without any interpolation.
The image has half the resolution, and every length converted to micrometers uses the **effective pixel pitch** of twice the physical pitch.

<figure><img src="fig/superpixel-debayer.svg" alt="SuperPixel debayer" />
<figcaption>Figure 2 - SuperPixel debayering: each 2×2 block of the mosaic becomes one pixel.</figcaption></figure>

### Detection

PixInsight\'s <code>StarDetector</code> finds the candidates.
If the option *Max. stars* is set, only the brightest ones are kept (sorted by flux) - they give the most reliable fits, and the fit is the slow part.

### The PSF fit

For every candidate, PixInsight\'s <code>DynamicPSF</code> fits an **elliptical model** to the pixels inside a search box (the *search radius*).
Two models are available.
In the coordinates <i class="v">u, v</i> along the axes of the ellipse (rotated by the angle <i class="v">θ</i>) they read:

<div class="eq"><div>Gaussian:&nbsp;&nbsp; I(u, v) = B + A · exp( −u²/(2σ<sub>x</sub>²) − v²/(2σ<sub>y</sub>²) )</div><div>Moffat:&nbsp;&nbsp;&nbsp;&nbsp; I(u, v) = B + A / ( 1 + u²/α<sub>x</sub>² + v²/α<sub>y</sub>² )<sup>β</sup></div><div><span class="c">B background, A amplitude, σ or α the width along each axis, β the steepness of the Moffat wings</span></div></div>

The Moffat profile has broader wings than the Gaussian and describes real stars (seeing, diffraction) often better; the Gaussian is faster.
From the widths the script computes the FWHM along each axis:

<div class="eq"><div>Gaussian:&nbsp;&nbsp; FWHM = 2 √(2 ln 2) · σ ≈ 2.3548 · σ</div><div>Moffat:&nbsp;&nbsp;&nbsp;&nbsp; FWHM = 2 α · √(2<sup>1/β</sup> − 1)</div></div>

Using the Gaussian factor for a Moffat fit would be a serious mistake: depending on β it would inflate the FWHM by a factor of 1.5 to 2.7 and more.

### Quality control

<ul>
  <li><b>Detection threshold.</b> A fit counts only above this significance. If not a single star passes, the
      script lowers the threshold step by step (×0.6, down to 0.2) instead of giving up, and says so.</li>
  <li><b>MAD outliers.</b> DynamicPSF reports for each fit the mean absolute deviation (MAD) between model and
      pixels. Hot pixels, blended pairs or very faint stars produce badly fitting models with a large MAD. A
      fit is dropped when
      <div class="eq"><div>MAD &gt; factor · median(MAD of all fits)</div></div>
      The limit adapts to each frame's noise instead of being a fixed number.</li>
  <li><b>Saturation</b> is checked for the asymmetry measurement (chapter 9): a star whose peak reaches 95% of
      the full range has a flat top and is skipped there.</li>
</ul>
