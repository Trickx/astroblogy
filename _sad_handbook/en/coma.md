---
title: "Coma and collimation"
order: 90
---
### The error

**Coma** turns stars into small comets: a bright core with a fan of light on one side.
In a Newtonian it grows linearly with the distance from the optical axis and points away from it; a coma corrector removes it - or over-corrects it, when it sits at the wrong distance.
The point where the coma vanishes marks the **optical axis**.
If the mirrors are decollimated (or a corrector is decentered or tilted), this **coma-free point** moves away from the image center.

<div class="note"><p>Why coma arises, how strong it is at a given focal ratio and how a corrector and decollimation
change it is explained on a separate page (in German): <a href="de/koma.html" hreflang="de">Koma - wie sie
entsteht</a>, with computed ray traces and an interactive simulator.</p></div>

### Why the fit cannot see it

Gaussian and Moffat are point-symmetric models: they fit an ellipse around the core and cannot tell on which side the fan sits.
The script measures the asymmetry directly on the pixels instead, relative to the fitted center:

<figure><img src="fig/coma-star.svg" alt="Coma star" />
<figcaption>Figure 14 - A comatic star. The flux centroid lies off the fit center toward the flare; the third moment weights the outer light and shows it more clearly.</figcaption></figure>

- Aperture radius r<sub>ap</sub> = 4σ + 1 px (limited to 3 … 25 px), σ = FWHM/2.3548; background = median of a ring from r<sub>ap</sub>+2 to r<sub>ap</sub>+6 px.
- Weights w = pixel value − background (only positive ones).
- Stars at the border, without a background ring or with a peak at 95% of the range (saturated) are skipped.
{: .steps}

<div class="eq"><div>centroid offset = Σ w · d / Σ w</div><div>third moment&nbsp;&nbsp; m<sub>3</sub> = Σ w · ρ² · ρ / Σ w,&nbsp;&nbsp; ρ = d / σ</div><div><span class="c">d = pixel position relative to the fit center; ρ makes m<sub>3</sub> independent of the star size</span></div></div>

### The coma field

Third-order coma is linear in the field position.
Around the coma-free point <i class="v">P<sub>0</sub></i>, the asymmetry vector of a star at position <i class="v">P</i> is therefore modeled as

<div class="eq"><div>m<sub>3</sub>(P) = k · (P − P<sub>0</sub>) / R</div><div>linear in (k, o<sub>x</sub>, o<sub>y</sub>):&nbsp; m<sub>3,x</sub> = k·X + o<sub>x</sub>,&nbsp; m<sub>3,y</sub> = k·Y + o<sub>y</sub></div><div>P<sub>0</sub> = center − (o<sub>x</sub>, o<sub>y</sub>) / k · R</div></div>

<figure><img src="fig/coma-field.svg" alt="Coma field" />
<figcaption>Figure 15 - The coma field. With k &gt; 0 the flares point away from P₀, with k &lt; 0 toward it.</figcaption></figure>

- **k &gt; 0**: flares point away from P<sub>0</sub> - under-corrected (normal for a bare Newtonian).
- **k &lt; 0**: flares point toward P<sub>0</sub> - over-corrected.

At least 30 stars with a valid asymmetry are needed.
The fit is robust (3σ clipping, three rounds).
Its uncertainty comes from a **bootstrap**: the fit is repeated 100 times on random resamples of the stars; the spread of k is its standard deviation, that of P<sub>0</sub> a robust spread (MAD), because a few resamples with k ≈ 0 can throw P<sub>0</sub> arbitrarily far.
The coma counts as **significant** when |k| &gt; 3 · spread(k).
A cross-check fits the same model to the centroid offsets.

### Collimation

The script suggests collimating when P<sub>0</sub> lies more than **15% of the half diagonal** off the center and more than twice its own uncertainty.
One caution is built in: an uneven tracking drift adds a constant asymmetry and shifts P<sub>0</sub> along the drift.
If the offset lies within 20° of the tracking elongation, the suggestion says so - compare several frames before touching the collimation screws.

### Coma streamlines

Unlike an orientation, m<sub>3</sub> is a true vector with a direction.
The coma streamlines follow its Gaussian-smoothed field (at least 8 stars in the radius) with arrowheads, and stop where the field becomes weaker than a set percentage of its strong part - so the coma-free zone does not fake a direction.
Under-corrected coma looks like a source, over-corrected coma like a sink.
