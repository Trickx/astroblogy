---
title: Astro Rig for Canon EF 70-300mm L ISM USM
date: 19.06.2026
summary: Description and documentation of my Canon astro-rig including CAD files.
image: /assets/images/blog/canon/AstroRigCanon.jpg
---

There are many 3D-printed setups available in the web to mount a photo lens + camera combination onto a astro mount. All of them have their pros and cons. This is my version based on a Fusion360 design, which I gonna share with you.

## Considerations

### Dove Tail Rails
Let's start bottom up. I don't like applying forces to 3D printed parts more than necessary. So, I decided to go with off-the-shelf dove tail to mount everything onto my astro mount.
My ones are labelled "Angeleyes" and are easily being found at AliExpress when searching for "Angelyes Dovetail Plate". My bottom one has a length of 180mm and the top one 150mm.
This way I'm also flexible to attach a mounting bracket for an auto focusser.

![Search Sequence](/assets/images/blog/canon/AstroRigCanonRendered.png)

### Lens Mounting Brackets

There is not much much to write about the lens mounting brackets. The brackets are mountes onto the dove tail rail with M5 screws.
The conncetion between top and bottom part is fixed with a M4 screw. The desigen includes holes for corresponding DIN hex nuts.
Tape to protect lens.


### Drive Belt

My honor goes to Raúl Pérez  who published a [Parametric GT2 pulley on Grabcad](https://grabcad.com/library/parametric-gt2-pulley-1). His work simplified designing the needed GT2 ring mounted on the lens.
My desire was to have the option to rotate endlessly without hitting any end point. 

I printed the GT2 ring with TPU to achieve required flexibility to gently shift if onto the rubber ring of the lens without any further glue or something.

![GT2 TPU Lens Ring](/assets/images/blog/canon/GT2_Ring_TPU.png)

My first design was prepared for PLA or PETG. I turned out being overengineered, but would also work. If you can't print TPU try this one.

![GT2 Lens Ring](/assets/images/blog/canon/GT2_Ring.png)

### ZWO EAF Mounting Bracket

The ZWO EAF mounting bracket was designed with three main goals in mind: flexibility, ease of use, and simplicity.

First, the bracket is adjustable in length, allowing it to accommodate different timing belt lengths and a wide range of lens diameters. Second, the belt tension can be released when the focuser is not in use, preventing unnecessary stress on the lens and focus mechanism during long periods of storage. Finally, the overall design was kept as simple as possible to make printing and assembly straightforward.

![EAF BRacket](/assets/images/blog/canon/EAF_Bracket.png)

The camera body—and therefore the lens—should remain freely rotatable to allow framing the target exactly as desired. This rotation can be adjusted without the need for any tools.

For the locking knobs, I was inspired by the design used in the [Makerworld Canon 70-200 F/4 USM Rig](https://makerworld.com/en/models/155596-canon-70-200-f-4-usm-rig?from=search#profileId-170314). The original design is based on socket head cap screws (DIN 912). After testing it, I found that the printed knob was prone to cracking under higher tightening forces. In my revised version, I replaced the socket head cap screw with a hexagon head screw (DIN 933), resulting in a significantly more robust and durable design.

![Hex Screw Knob](/assets/images/blog/canon/HexScrewKnob.png)

The bracket is clamped onto the dove tail rial using a M6 hexagon nut. The updated design includes a hexagonal pocket for the M6 nut, preventing it from rotating together with the screw—a common issue in my previous design that made tightening and loosening unnecessarily difficult.

![Hex Screw Dovetail Mount](/assets/images/blog/canon/HexScrewDovetail.png)

### References
![Makerworld Screenshot](/assets/images/blog/canon/Makerworld.png)
* [Makerworld 3D Printer Files](https://makerworld.com/en/models/2952751-canon-70-300mm-l-is-usm-astro-rig)

![Fusion 360 Screenshot](/assets/images/blog/canon/Fusion360.png)
* [Fusion360 Design File (f3z)](/assets/images/blog/canon/Canon_70-300mm_L_IS_USM_Astro_Rig.f3z)