---
title: "Tracking and guiding errors"
order: 50
---
### The error

If the mount does not follow the sky exactly - periodic error, poor guiding, wind, cable drag, a flexing guide scope - the whole image moves a little during the exposure.
Every star is smeared by the **same amount in the same direction**, regardless of where it is in the field.
This is the fingerprint that separates tracking from all optical errors, which vary across the field.

### The measurement

The script takes the **median** of the shape vectors of all stars.
The median ignores the minority of stars that are elongated by the optics near the edge and finds what almost all stars have in common:

<div class="eq"><div>m<sub>1</sub> = median(χ<sub>1</sub>),&nbsp;&nbsp; m<sub>2</sub> = median(χ<sub>2</sub>)</div><div>χ<sub>T</sub> = √(m<sub>1</sub>² + m<sub>2</sub>²),&nbsp;&nbsp; direction = ½ · atan2(m<sub>2</sub>, m<sub>1</sub>)</div><div><span class="c">χ<sub>T</sub> is converted back into an ellipticity for the report</span></div></div>

With the option *Subtract it from all stars*, this common part is removed from each star before all further analysis - by subtracting the vectors, which is exactly why the distortion χ is used:

<div class="eq"><div>χ′<sub>1</sub> = χ<sub>1</sub> − m<sub>1</sub>,&nbsp;&nbsp; χ′<sub>2</sub> = χ<sub>2</sub> − m<sub>2</sub></div></div>

<figure><img src="fig/tracking-component.svg" alt="Tracking component" />
<figcaption>Figure 6 - Left: a tracking error elongates every star alike. Right: removing it is a vector subtraction in the plane of the shape vectors.</figcaption></figure>

Only the shapes are corrected; the star sizes (FWHM) stay as measured.
The tracking error would otherwise mask the optical patterns, above all the radial/tangential pattern of chapter 8.

### Reading the value

<div class="tbl"><table>
<tr><th>Common ellipticity</th><th>Verdict</th></tr>
<tr><td>below 0.03</td><td>OK - tracking is clean</td></tr>
<tr><td>0.03 - 0.07</td><td>Note</td></tr>
<tr><td>above 0.07</td><td>Action: check guiding (RMS, calibration), balance, cable drag, wind, flexure</td></tr>
</table></div>

<div class="note"><p>A direction that stays the same over several frames points to the mount; one that
changes points to wind or random guiding errors. The <a href="#series">series analysis</a> compares both sides
of a meridian flip, where the balance changes.</p></div>
