---
title: "Series: before and after the meridian flip"
order: 110
---
### Why a flip helps

A German equatorial mount has to turn the telescope around when the target crosses the meridian.
After this **meridian flip**, the tube is turned by 180° around its axis relative to gravity.
Anything that **sags or shifts under its own weight** - a focuser drawtube, a camera on a long adapter, a primary mirror in its cell (\"mirror flop\"), a loose corrector - moves to the other side.
Anything **fixed** in the optical train stays as it is.

<figure><img src="fig/meridian-flip.svg" alt="Meridian flip" />
<figcaption>Figure 16 - Before and after the flip, gravity acts on the optical train from opposite sides.</figcaption></figure>

Comparing frames of both sides therefore answers a question one frame cannot: **is an error fixed, or mechanical?**
A tilt that turns with the side calls for tightening the focuser and the adapters - adjusting the tilt would only fit one side.
A tilt that stays calls for the tilt adjustment.

### Which side is a frame on?

1. **Manual** - set in the list.
2. **PIERSIDE** - written by N.I.N.A. and most ASCOM/INDI capture programs (West before the meridian, telescope pointing east; East after the flip).
3. **A camera angle that turns by 180°** - e.g. ROTATOR as written by the ASIAIR from its plate solve (also POSANGLE, ANGLE, CROTA2).
   Frames within 45° of the first angle form one group, those within 45° of the opposite angle the other; the hour angles of their members name the groups.
4. **The hour angle** - from the time, the target\'s right ascension α and the site longitude λ (east positive):
{: .steps}

<div class="eq"><div>GMST = 280.46061837° + 360.98564736629° · d&nbsp;&nbsp; (d = days since 2000-01-01 12:00 UT)</div><div>hour angle HA = GMST + λ − α</div><div><span class="c">HA ≤ −0.05 h: West (the meridian is not reached yet) · HA ≥ +0.5 h: East · in between: unknown, the flip may come late</span></div></div>

### The comparison

Every frame is measured with the same settings.
Per side and value the script takes the **median** and a robust spread σ = 1.4826 · MAD, which estimates the standard deviation without being fooled by single outliers.
The standard error of a median is about 1.253 σ/√n.
A value **changes at the flip** when both hold:

<div class="eq"><div>|median<sub>East</sub> − median<sub>West</sub>| &gt; 3 · 1.253 · √( σ<sub>W</sub>²/n<sub>W</sub> + σ<sub>E</sub>²/n<sub>E</sub> )</div><div>and the difference exceeds a practical minimum</div></div>

<figure><img src="fig/series-comparison.svg" alt="Series comparison" />
<figcaption>Figure 17 - A value that jumps at the flip: the difference between the medians is large compared to the scatter within each side.</figcaption></figure>

<div class="tbl"><table>
<tr><th>Value</th><th>Practical minimum</th><th>A change at the flip means</th></tr>
<tr><td>FWHM center / edge</td><td>5%</td><td>refocusing, temperature or focuser slip</td></tr>
<tr><td>Tilt (as a vector: size and direction)</td><td>3 points</td><td>sag or play in camera, focuser, adapter</td></tr>
<tr><td>Edge elongation eps_rad</td><td>0.02</td><td>play in corrector or drawtube, or a different focus</td></tr>
<tr><td>Tracking elongation</td><td>0.02</td><td>balance (east/west heavy), DEC backlash, cable drag</td></tr>
<tr><td>Coma k</td><td>-</td><td>corrector or spacing with play</td></tr>
<tr><td>Coma-free point (vector)</td><td>10% of R</td><td>mirror flop, loose secondary or corrector</td></tr>
<tr><td>Plate-solve distortion (chapter 12)</td><td>1 px</td><td>a part of the optics shifts - or a solver convention</td></tr>
</table></div>

With fewer than 3 frames on a side, there is no verdict.
Vectors (tilt, coma-free point, distortion) are compared as vectors: their direction can turn while their length stays.

### Drift over the night

Temperature and altitude change slowly, and the frames of one side follow each other in time - a drift can therefore look like a jump at the flip.
The script subtracts each side\'s median and correlates what remains with the time.
With at least 6 frames, a correlation |r| ≥ 0.6 and a total change above the practical minimum, the value is reported as **drifting**, with a warning where it may have faked a change at the flip.
If the focuser position (FOCPOS) differs between the sides, the report notes that the frames were refocused.
