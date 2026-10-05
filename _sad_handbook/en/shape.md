---
title: "Describing the shape of a star"
order: 40
---
The fitted ellipse has a major half axis <i class="v">a</i> (the larger FWHM) and a minor half axis <i class="v">b</i>, and its major axis points in a direction.
Three numbers describe how elongated it is - they carry the same information but behave differently in calculations:

<div class="eq"><div>eccentricity&nbsp;&nbsp; e = √(1 − b²/a²)</div><div>ellipticity&nbsp;&nbsp;&nbsp;&nbsp; ε = 1 − b/a = 1 − √(1 − e²)</div><div>distortion&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; χ = (a² − b²)/(a² + b²) = e²/(2 − e²)</div><div><span class="c">and back: e = √(2χ/(1 + χ))</span></div></div>

<figure><img src="fig/shape-measures.svg" alt="Shape measures" />
<figcaption>Figure 3 - The three measures for the same stars. The eccentricity rises fast even for slightly oval stars, which makes it sensitive for the colors of the map; the ellipticity reads like a percentage (0.10 = the short axis is 10% shorter); the distortion adds up correctly.</figcaption></figure>

The **eccentricity** colors the vector map.
The **ellipticity** is used wherever a verdict is spoken, because it is easy to read.
The **distortion** is used for averaging and subtracting: only its components add (approximately) linearly when two elongations combine, e.g. an elongation of the optics and one of the tracking.

### Direction and the 180° problem

<figure><img src="fig/psf-ellipse.svg" alt="PSF ellipse" />
<figcaption>Figure 4 - The fitted ellipse in image coordinates: x to the right, y downward. The angle ψ of the major axis is counted from the x axis; 90° points down.</figcaption></figure>

All directions in the script are given in **image coordinates**: x to the right, y downward, 0° = right, 90° = down.
DynamicPSF measures its angle <i class="v">θ</i> counterclockwise on the screen, so the direction of the major axis in image coordinates is <i class="v">ψ = −θ</i>.

An ellipse looks the same when turned by 180°: its orientation is only defined **modulo 180°**.
Averaging the angles directly therefore fails - two almost horizontal stars at 10° and 170° would average to a vertical 90°.
The standard remedy, used everywhere in the script, is the **double angle**: each orientation becomes a vector with the angle 2ψ, the vectors are averaged, and the angle of the mean is halved again.

<figure><img src="fig/double-angle.svg" alt="Double angle" />
<figcaption>Figure 5 - Averaging orientations: naive (left) and with the double angle (right).</figcaption></figure>

<div class="eq"><div>χ<sub>1</sub> = χ · cos 2ψ,&nbsp;&nbsp;&nbsp; χ<sub>2</sub> = χ · sin 2ψ</div><div>mean orientation = ½ · atan2( Σ w·χ<sub>2</sub>, Σ w·χ<sub>1</sub> )</div><div><span class="c">(χ<sub>1</sub>, χ<sub>2</sub>) is the "shape vector" of a star; w an optional weight</span></div></div>
