---
title: Astro Rig for Canon EF 70-300mm L IS USM
date: 19.06.2026
summary: Documentation of my custom astro rig for the Canon EF 70-300mm L IS USM, including CAD files and 3D-printable parts.
image: /assets/images/blog/canon/AstroRigCanon.jpg
---

There are many 3D-printed solutions available for mounting a camera and telephoto lens on an equatorial mount, each with its own advantages and drawbacks. This project is my take on the concept, designed in Fusion 360 and shared here for anyone who may find it useful.

![Astro Rig Canon](/assets/images/blog/canon/AstroRigCanon2.jpg)

## Considerations

### Dovetail Rails

Let's start from the bottom. I prefer to avoid applying unnecessary loads to 3D-printed parts, so I decided to use off-the-shelf dovetail rails for mounting the entire setup to the telescope mount.

The rails I use are sold under the "Angeleyes" brand and can easily be found on AliExpress by searching for "Angeleyes Dovetail Plate". The bottom rail is 180 mm long, while the top rail measures 150 mm.

Using standard rails also keeps the design flexible, allowing additional accessories such as an autofocus bracket to be attached. Although a 150 mm rail would have been sufficient for the base, the longer rail provides more freedom when balancing the rig.

![Fusion360 Rendering](/assets/images/blog/canon/AstroRigCanonRendered.png)

### Belt Type & Pulley

For reasons of availability and cost, I chose a 6 mm wide GT2 timing belt instead of T2.5 or other belt profiles. The current setup uses a GT2 timing belt with 180 teeth (360 mm pitch length).

The drive pulley features 12 teeth, resulting in a maximum gear ratio of 12:160. When selecting the pulley, pay close attention to the internal bore. My ZWO EAF uses an output shaft with a diameter of only 4 mm, so not every off-the-shelf pulley will fit.

### Lens Mounting Brackets

There is not much to say about the lens brackets themselves. The design was inspired by this [Makerworld model](https://makerworld.com/de/models/155596-canon-70-200-f-4-usm-rig).

The brackets are attached to the dovetail rail using M5 screws, while the upper and lower bracket sections are joined with an M4 screw. The design includes pockets for standard DIN hex nuts.

To prevent scratches on the lens, I applied a layer of Tesa PET Fleece Tape 51608 between the lens and the brackets. The tape is relatively thin but should still be taken into account when determining the bracket diameters.

### Drive Belt Ring

Special thanks go to Raúl Pérez for publishing his [Parametric GT2 Pulley on GrabCAD](https://grabcad.com/library/parametric-gt2-pulley-1). His work greatly simplified the design of the GT2 ring that mounts around the lens.

One of my main goals was to allow unlimited rotation without mechanical end stops.

The GT2 ring was printed in TPU, providing enough flexibility to gently slide it over the lens's rubber focus ring without requiring glue or additional fasteners.

![GT2 TPU Lens Ring](/assets/images/blog/canon/GT2_Ring_TPU.png)

My initial design was intended for PLA or PETG. In retrospect, it turned out to be somewhat overengineered, but it works perfectly well. If TPU printing is not an option, this version is a suitable alternative.

![GT2 Lens Ring](/assets/images/blog/canon/GT2_Ring.png)

Both versions provide a length of 160 teeth (320 mm pitch length).

### ZWO EAF Mounting Bracket

The mounting bracket was designed with several requirements in mind:

- Adjustable length to accommodate different belt sizes and lens diameters
- Ability to release belt tension when the system is stored for extended periods
- A simple and easy-to-print design

![EAF Bracket](/assets/images/blog/canon/EAF_Bracket.png)

### References

* [Makerworld 3D Printer Files](https://makerworld.com/en/models/2952751-canon-70-300mm-l-is-usm-astro-rig)

[![Makerworld 3D Printer Files](/assets/images/blog/canon/Makerworld.png)](https://makerworld.com/en/models/2952751-canon-70-300mm-l-is-usm-astro-rig)

* [Fusion360 Design File (f3z)](/assets/images/blog/canon/Canon_70-300mm_L_IS_USM_Astro_Rig.f3z)

[![Fusion360 Design File (f3z)](/assets/images/blog/canon/Fusion360.png)](/assets/images/blog/canon/Canon_70-300mm_L_IS_USM_Astro_Rig.f3z)
