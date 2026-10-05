---
title: "Stars as a probe of the optics"
order: 20
---
A star is so far away that it is, for all practical purposes, a **point**.
Everything that turns this point into a small disk, an oval or a little comet on the sensor is done on the way: by the atmosphere, the mount, the telescope, a corrector, the camera.
The picture a point source makes is called the **point spread function (PSF)**.
Because every star in the frame passes through a different part of the optical system, the stars together form a map of how well the optics work at every position of the field.

The script reads this map.
For every star it measures four things:

- **Size** - how far the light is spread, as the full width at half maximum (FWHM).
- **Elongation** - how much the star deviates from a circle.
- **Orientation** - in which direction an elongated star points.
- **Asymmetry** - whether the light leans to one side, like the tail of a comet.

No single star tells much: seeing, noise and neighboring stars disturb each measurement.
The strength of the method lies in the **pattern** over hundreds of stars.
A focusing error, a tilted sensor, a wrong corrector distance, a decollimated mirror and a tracking error each leave a pattern of their own, and the chapters below explain which one - and how the script tells them apart.

<figure><img src="fig/star-profile.svg" alt="Star profile" />
<figcaption>Figure 1 - A cut through a star: the brightness per pixel (bars) and the fitted model (curve). The FWHM is the width at half the height above the background.</figcaption></figure>
