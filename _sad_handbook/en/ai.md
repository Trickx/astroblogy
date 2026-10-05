---
title: "The AI review"
order: 130
---
On request, the script sends its results to Claude (Anthropic API) for a second opinion - after a Preview, after a series analysis, or both.
What is sent:

- the measured values of the chapters above as numbers (tracking, ring profile, FWHM surface and a 5×5 grid, quadrants, coma fit, optics), the rule-based assessment, and optionally the vector map as an image;
- for a series: one row per frame (side, hour angle, altitude, focus, the values above, SIP) and the comparison of the sides.

No image data other than the optional vector map leaves the computer.
The answer is forced into a fixed structure: an overall verdict, the order of corrections and, per finding, the measured values it rests on, what the stars look like, the derivation, the alternatives and why they fit less, what to do, how to check it in the next frame, and a confidence with its reason.
*Step by step* explains every technical term for beginners; *Short* keeps each point to a sentence or two.
Requests and answers can be saved as text files next to the frames.

<div class="note"><p>The AI weighs the same numbers the rules use - it can explain and connect them, but it
cannot see more than was measured. It needs an Anthropic API key; each request is billed to it.</p></div>
