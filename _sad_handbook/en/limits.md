---
title: "Limits and good practice"
order: 140
---
- **Use unregistered, uncropped frames.**
  Every computation assumes that the image center is the optical axis.
  Registration, cropping or rotation destroy that.
- **Calibrated but unprocessed.**
  Stretching, deconvolution, noise reduction and star reduction change the star profiles.
- **Short exposures, good seeing.**
  Seeing and tracking add a blur that hides small optical errors.
  Several frames give more certainty than one.
- **A rich star field** - at least 150 measured stars, well spread up to the corners, where the errors are largest.
- **One frame cannot tell the sign of a defocus.**
  Where a correction has a direction (tilt, spacing), change it in small steps and measure again.
- **Geometric optics.**
  The conversions from blur to Δz ignore diffraction and seeing profiles; they are estimates to guide an adjustment, not measurements with a tolerance.
