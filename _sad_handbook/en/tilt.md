---
title: "Focus, sensor tilt and field curvature"
order: 70
---
### The physics: blur from defocus

The telescope forms a cone of light that converges to a point in the focal plane.
If the sensor sits a distance <i class="v">Δz</i> in front of or behind that plane, it cuts the cone and records a small disk instead of a point.
From the geometry of the cone (its opening is the aperture <i class="v">D</i> over the focal length <i class="v">f</i>, i.e. 1/N):

<figure><img src="fig/defocus-blur.svg" alt="Defocus blur" />
<figcaption>Figure 7 - A sensor out of focus by Δz records a disk of diameter d = Δz/N.</figcaption></figure>

<div class="eq"><div>d = Δz / N&nbsp;&nbsp;&nbsp; ⇔&nbsp;&nbsp;&nbsp; Δz = N · d,&nbsp;&nbsp;&nbsp; N = f / D</div><div><span class="c">a fast f/4 system reacts twice as strongly to the same Δz as an f/8 one</span></div></div>

The star in focus is not a point either (seeing, diffraction, optics): it has a size <i class="v">FWHM<sub>0</sub></i>.
Blurs of independent origin add approximately **in quadrature**, so the extra blur from defocus follows from the measured FWHM as

<div class="eq"><div>d = √( FWHM² − FWHM<sub>0</sub>² ) · p,&nbsp;&nbsp;&nbsp; Δz = N · d</div><div><span class="c">p = (effective) pixel pitch, converting pixels into micrometers</span></div></div>

This is the bridge from a star size in pixels to a distance in micrometers - and it needs pixel pitch, focal length and aperture, which the script takes from the dialog or the FITS header (XPIXSZ, FOCALLEN, APTDIA or FOCRATIO).

<div class="note"><p><b>The sign is lost.</b> A disk looks the same whether the sensor is in front of or
behind the focus. From one frame, Δz is only a magnitude - which way to turn a tilt screw has to be found by
trying (see figure 11).</p></div>

### What the errors look like

<figure><img src="fig/tilt-and-curvature.svg" alt="Tilt and curvature" />
<figcaption>Figure 8 - Left: a tilted sensor is in focus along one line and out of focus toward both edges, in opposite directions. Right: a curved focal surface meets a flat sensor only in the center; the stars grow toward every edge alike.</figcaption></figure>

- **Defocus** makes every star larger - but uniformly, so it shows up in the absolute FWHM rather than in its pattern.
  A telltale sign is a center that is *softer* than the edge: the focus was set on the edge, or a curved field was focused off the center.
- **Sensor tilt** makes one side of the frame soft and the opposite side sharp: a one-sided gradient.
- **Field curvature** makes the edge soft on all sides alike: a symmetric bowl.

### Method 1: Siril-style quadrants

Following Siril\'s \"Show tilt\", the frame is divided into four quadrants plus an inner circle and an outer ring around the center (radii relative to the half diagonal <i class="v">R</i>).
Each area gets the **25%-trimmed mean** of the star sizes (FWHM<sub>x</sub>+FWHM<sub>y</sub>)/2 - the lowest and highest quarter are discarded before averaging, which makes it robust against single bad fits.

<figure><img src="fig/siril-quadrants.svg" alt="Siril quadrants" />
<figcaption>Figure 9 - The areas of the quadrant evaluation.</figcaption></figure>

<div class="eq"><div>tilt = max(m<sub>1</sub>…m<sub>4</sub>) − min(m<sub>1</sub>…m<sub>4</sub>),&nbsp;&nbsp; in % of their mean</div><div>off-axis aberration = m<sub>outer</sub> − m<sub>inner</sub></div></div>

The **11×11 FWHM grid** is the same idea at a finer scale: one trimmed mean per cell, noisier but with more detail.
The **tilt axis** is derived from the quadrants.
Each quadrant\'s excess over the center gets a sign, the gradient of a plane through the four values gives the direction of the steepest rise, and with the optics known, its angle:

<div class="eq"><div>e<sub>q</sub> = sign(F<sub>q</sub>² − F<sub>0</sub>²) · √|F<sub>q</sub>² − F<sub>0</sub>²|,&nbsp;&nbsp; F<sub>0</sub> = m<sub>inner</sub></div><div>g<sub>x</sub> = [(e<sub>TR</sub> + e<sub>BR</sub>) − (e<sub>TL</sub> + e<sub>BL</sub>)] / W,&nbsp;&nbsp; g<sub>y</sub> = [(e<sub>BL</sub> + e<sub>BR</sub>) − (e<sub>TL</sub> + e<sub>TR</sub>)] / H</div><div>axis direction = atan2(g<sub>y</sub>, g<sub>x</sub>) (mod 180°),&nbsp;&nbsp; tilt angle = atan( N · √(g<sub>x</sub>² + g<sub>y</sub>²) )</div></div>

Per quadrant, the console also lists the defocus Δz = N · √(F<sub>q</sub>² − F<sub>0</sub>²) · p and the angle atan(Δz / distance) to the quadrant center at a quarter of the width and height.

### Method 2: the FWHM² surface

Quadrants mix tilt and curvature: a curved field makes all four quadrants soft, a tilt only two.
The script therefore fits a smooth surface to the squared FWHM of **every star**, with X and Y the position relative to the center divided by the half diagonal:

<div class="eq"><div>FWHM² = c<sub>0</sub> + c<sub>1</sub>·X + c<sub>2</sub>·Y + c<sub>3</sub>·(X² + Y²)</div></div>

<figure><img src="fig/fwhm-squared-surface.svg" alt="FWHM squared surface" />
<figcaption>Figure 10 - A cut through the surface along X. The symmetric term c₃ is the curvature (dashed); the linear terms c₁, c₂ tilt the bowl to one side (solid), which is the sensor tilt.</figcaption></figure>

The squares are fitted because blurs add in quadrature (see above): the symmetric term then measures the curvature, the linear terms the tilt, and the two no longer contaminate each other.
The fit is a robust least squares fit: four rounds in which stars whose residual exceeds 3 σ (σ from the median absolute residual) are left out.
From the coefficients:

<div class="eq"><div>FWHM<sub>center</sub> = √c<sub>0</sub>,&nbsp;&nbsp; FWHM<sub>edge</sub> = √(c<sub>0</sub> + c<sub>3</sub>)</div><div>G = √(c<sub>1</sub>² + c<sub>2</sub>²),&nbsp;&nbsp; softer side toward atan2(c<sub>2</sub>, c<sub>1</sub>)</div><div>FWHM<sub>soft side</sub> = √(c<sub>0</sub> + G),&nbsp;&nbsp; FWHM<sub>sharp side</sub> = √(c<sub>0</sub> − G)</div><div>Δz<sub>edge</sub> = N · √G · p,&nbsp;&nbsp; tilt angle = atan( Δz<sub>edge</sub> / (R · p) )</div><div>curvature sag = N · √|c<sub>3</sub>| · p</div><div>sharpest point = center − (c<sub>1</sub>, c<sub>2</sub>) / (2 c<sub>3</sub>) · R&nbsp;&nbsp; (if c<sub>3</sub> &gt; 0)</div></div>

A **negative c<sub>3</sub>** means the edge is sharper than the center - the frame is out of focus or was focused on the edge.
The script also flags a **defocus suspicion** when the median FWHM in the inner third (r &lt; ⅓ R) is more than 5% larger than in the outer third (r &gt; ⅔ R).
As long as that is the case, tilt and spacing verdicts are unreliable, which is why focus comes first in the suggested order.

### The 3D tilt plot

<figure><img src="fig/sign-ambiguity.svg" alt="Sign ambiguity" />
<figcaption>Figure 11 - Two tilts in opposite directions produce the same blur. The 3D plot therefore draws both planes.</figcaption></figure>

The pseudo-3D plot places the four quadrant values at their physical positions on the sensor (in mm) as signed Δz and fits a plane through the center.
Because the sign of Δz is unknown (see the note above), it draws **two mirror-image variants**.
Both are equally plausible; the tilt axis is the same for both.

### Verdicts

<div class="tbl"><table>
<tr><th>Value</th><th>OK</th><th>Note</th><th>Action</th></tr>
<tr><td>Tilt: (FWHM<sub>soft</sub> − FWHM<sub>sharp</sub>) / their mean</td><td>&lt; 5%</td><td>5 - 10%</td><td>&gt; 10%</td></tr>
<tr><td>Field curvature: (FWHM<sub>edge</sub> − FWHM<sub>center</sub>) / FWHM<sub>center</sub></td><td>≤ 15%</td><td>15 - 30%</td><td>&gt; 30%</td></tr>
<tr><td>Focus: defocus suspicion or c<sub>3</sub> &lt; 0</td><td></td><td></td><td>refocus first</td></tr>
</table></div>
