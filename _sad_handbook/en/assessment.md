---
title: "The assessment and the order of corrections"
order: 100
---
The Assessment tab turns the values of the previous chapters into findings, each judged as **OK**, **Note** or **Action**, with what was found and what to do.
Where the direction of a correction depends on the optical system, the *Optics type* (unknown, uncorrected, with corrector) decides the wording.

The actions are sorted into the order in which they are best worked through, because the errors mask each other:

1. **Focus** - a defocused frame falsifies the tilt and spacing verdicts.
2. **Tracking** - a common elongation hides the radial/tangential pattern and shifts the coma-free point.
3. **Tilt** - a one-sided blur, fixed in the camera connection.
4. **Collimation** - moves the optical axis, around which everything else is measured.
5. **Spacing** - the corrector distance, judged from the edge pattern.
6. **Coma** - strength and sign of the coma field.
7. **Field curvature** - what remains at the edge.
8. **Data** - fewer than 150 stars make all verdicts uncertain.
{: .steps}

<div class="note"><p><b>Exception for clear decollimation:</b> A tilted optical axis also tilts the image plane
against the sensor, and then shows up as tilt - the script cannot tell this apart from a sensor that sits askew. If
the coma-free point lies clearly off the image center and tilt is reported at the same time, collimate first and
measure again, and only then correct the tilt.</p></div>

<div class="note"><p>All thresholds are starting points, not calibrated limits. Seeing, exposure time and the
number of stars change what a single frame can tell.</p>
<p>Where these errors typically come from in a Newtonian and what helps against each is summarized on a separate
page (in German): <a href="de/newton.html" hreflang="de">Typische Fehler eines Newton-Teleskops</a>.</p></div>
