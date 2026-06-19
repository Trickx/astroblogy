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

On one hand side, the bracket shall be adjustable in length to support multiple belt sizes and lens diameters.
On the other hand side, it shall be possible to remove the tension from the belt to not stress the lens over a long period of time.
Last but not least, the design shall be simple.

![EAF BRacket](/assets/images/blog/canon/EAF_Bracket.png)

### References

* [Makerworld 3D Printer Files]()


![Fusion 360](/assets/images/blog/canon/Fusion360.png)
* [Fusion360 Design File (f3z)](/assets/images/blog/canon/Canon_70-300mm_L_IS_USM_Astro_Rig.f3z)