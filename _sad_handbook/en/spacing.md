---
title: "Radial and tangential patterns: corrector spacing"
order: 80
---
### The error

A coma corrector, field flattener or reducer is designed for one exact distance to the sensor (the back focus, e.g. 55 mm).
At the wrong distance it corrects too little or too much, and the stars at the field edge become elongated - either **radially**, pointing toward the center like spokes, or **tangentially**, lying along circles around the center.
In an uncorrected system (a bare Newtonian), radial elongation is simply its natural coma.

<figure><img src="fig/radial-and-tangential.svg" alt="Radial and tangential" />
<figcaption>Figure 12 - Radial (left) and tangential (right) elongation at the field edge.</figcaption></figure>

### The measurement

For each star at the position angle <i class="v">φ</i> (seen from the image center), the script measures how much of its elongation lies along the radius:

<figure><img src="fig/radial-ellipticity.svg" alt="Radial ellipticity" />
<figcaption>Figure 13 - The radial component of a star's ellipticity.</figcaption></figure>

<div class="eq"><div>eps_rad = ε · cos 2(ψ − φ)</div><div><span class="c">+ε for a star along the radius, −ε across it, 0 at 45° - tracking errors cancel out over a full ring</span></div></div>

The stars are grouped into six rings (r/R = 0-⅙, ⅙-⅓, … 5/6-1).
Per ring the console lists the number of stars, median FWHM, ellipticity, eps_rad, the radial flare direction asym_rad (chapter 9) and an alignment value between flare and elongation (+1: the flare lies along the elongation, i.e. coma shapes the star).
The verdict uses the median eps_rad over the outer third (r &gt; ⅔ R), with at least 10 stars:

<div class="tbl"><table>
<tr><th>eps_rad (outer third)</th><th>Pattern</th><th>Rule of thumb of the script</th></tr>
<tr><td>|eps_rad| ≤ 0.04</td><td>none</td><td>OK</td></tr>
<tr><td>&gt; +0.04 (action above 0.08)</td><td>radial</td><td>with a corrector: under-corrected - increase the corrector-sensor distance in small steps (e.g. 0.5 mm); uncorrected system: normal coma</td></tr>
<tr><td>&lt; −0.04 (action below −0.08)</td><td>tangential</td><td>decrease the distance - but defocus combined with field curvature looks the same, so check the focus first</td></tr>
</table></div>

<div class="note"><p>The direction of the correction is a rule of thumb that holds for many correctors; the
manual of your corrector has the final word. Change the distance in small steps and measure again.</p></div>
