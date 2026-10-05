---
title: "The vector map, streamlines and heatmap"
order: 60
---
The vector map draws every star as an ellipse at its position, its length and color given by the eccentricity (blue round to red elongated), its direction by ψ.
Hundreds of small ellipses are hard to read, so two layers show the **large-scale trend**.

### Streamlines

At any point of the image, the script computes a smoothed orientation from the stars around it: a Gaussian-weighted double-angle mean within a radius <i class="v">R</i> (a percentage of the image diagonal).
Nearly round stars have a poorly defined direction, so each star is weighted additionally by the square of its eccentricity:

<div class="eq"><div>w = exp( −d² / (2 (R/2)²) ) · e²,&nbsp;&nbsp;&nbsp; for all stars at a distance d &lt; R</div><div>orientation = ½ · atan2( Σ w · sin 2ψ, Σ w · cos 2ψ )</div></div>

A streamline follows this field in small steps.
Since an orientation has no arrowhead, the script chooses at every step the one of the two directions that continues the previous step - otherwise the line could turn back at random.
Streamlines show at a glance whether the stars are aligned radially, concentrically or all in one direction.

### Orientation heatmap

The heatmap (after the Seti Astro Suite) fits two smooth **polynomial surfaces** of a chosen degree over the whole image, one to sin 2θ and one to cos 2θ of all stars, with the coordinates normalized to ±1.
Three rounds of 3σ clipping remove outliers.
At every point the fitted angle <i class="v">θ = ½ · atan2(s, c)</i> is shown as a hue of a color wheel.
A plane (degree 1) can only show a steady gradient; degree 2 and more can follow the curved patterns of coma, but becomes more sensitive to noise near the edges where few stars constrain it.
