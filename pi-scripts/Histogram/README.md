# Histogram

PJSR script for PixInsight 1.9.5 using the V8 JavaScript engine. It displays
the active view's histogram in a non-destructive analysis window.

## Features

- 512 bins with linear or logarithmic X-axis
- Optional logarithmic Y-axis
- Separate RGB curves and grayscale support
- Selectable image/view source and RGB channel visibility switches
- Process icons via the blue New Instance triangle
- Min, max, median, mean, standard deviation, MAD, variance, IQR, percentiles,
  and clipping counts
- Reproducible sampling for very large images
- Zoom and range controls for detailed histogram inspection

## Installation

1. Open `Script > Feature Scripts...` in PixInsight.
2. Add this project's folder as a script directory.
3. Start `Histogram.js` from `Script > Tricx > Histogram`.

The script uses only PJSR V8 built-in types and the Image, Graphics, and Dialog
APIs. It requires no external libraries or a newer PixInsight version.

The statistical calculations are inspired by SetiAstro Suite Pro. Its PyQt6
interface and Python code are not included in this PixInsight script.