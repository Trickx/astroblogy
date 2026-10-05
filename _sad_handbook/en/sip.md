---
title: "Plate-solve distortion (SIP)"
order: 120
---
A plate solve finds where every pixel points in the sky.
Real optics do not map the sky perfectly onto a flat grid; the **SIP convention** (Simple Imaging Polynomial) stores the deviation as polynomials in the pixel coordinates <i class="v">u, v</i> relative to a reference pixel:

<div class="eq"><div>u′ = u + Σ A<sub>p,q</sub> · u<sup>p</sup> v<sup>q</sup>,&nbsp;&nbsp; v′ = v + Σ B<sub>p,q</sub> · u<sup>p</sup> v<sup>q</sup>,&nbsp;&nbsp; 2 ≤ p + q ≤ order</div></div>

<figure><img src="fig/sip-distortion.svg" alt="SIP distortion" />
<figcaption>Figure 18 - Quadratic distortion terms bend the pixel grid.</figcaption></figure>

This measures the **positions** of the stars - independent of their shapes, and a by-product of every solve.
The series analysis reads the six quadratic terms (p + q = 2) from the header.
They do not depend on the reference pixel, so they can be compared even when the rest of the solution is missing.
The script expresses them as the shift of the four image corners in pixels, and compares these between the sides.

### What it can and cannot tell

- **No measure of sensor tilt.**
  A tilt θ acts like a slight perspective and shifts a point at the distance r by only about tan θ · r² / f<sub>px</sub> (f<sub>px</sub> = focal length in pixels).
  At 750 mm and 4.29 µm pixels, 0.1° moves a corner by 0.07 px - the FWHM method (chapter 7) is far more sensitive.
  The report shows the tilt a pure perspective would need for the measured terms; a value of several degrees means they have other causes.
- **No measure of back focus.**
  The symmetric (pincushion/barrel) distortion of a corrector is a third-order term; many solvers only fit second order.
- **A good indicator of movement.**
  If the quadratic terms change at the flip, something in the optical train shifts under gravity - typically the primary mirror of a Newtonian, or a corrector moving in the drawtube.
  If the coma-free point moves as well, that supports it.

<div class="note"><p>A reversal of sign at the flip can also come from the solver working in a frame that
turns with the sky. To be sure, solve one frame per side with PixInsight's ImageSolver and compare. The terms
are compared only when all solutions refer to images of the same size.</p></div>
