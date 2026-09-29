#engine v8

#feature-id    StarAberrationDiagnostics : Tricx > StarAberrationDiagnostics

#feature-info  Diagnostics of the optical system from the shapes of the stars.<br/> \
   <br/> \
   Measures every star across the field - elongation, FWHM and the asymmetry \
   of its profile - and maps sensor tilt, corrector spacing, field \
   curvature, coma and collimation as well as the tracking error shared by \
   all stars. A preview shows the vector map with switchable layers \
   (ellipses, streamlines, orientation heatmap, tilt overlay, coma field), \
   and an assessment judges the results and suggests corrections in the \
   order in which to work through them.<br/> \
   <br/> \
   Copyright &copy; 2026 Sven Kopetzki. GNU General Public License v3 or later.

#feature-icon  StarAberrationDiagnostics.svg

// The preview of the dialog uses the standard PJSR image view and splitter,
// as AperturePhotometry does.
#include <pjsr/controls/ImageView.js>
#include <pjsr/controls/Splitter.js>

/*
   StarAberrationDiagnostics.js
   ---------------------------------------------------------------------
   PixInsight PJSR script — V8 engine only (PixInsight 1.9.4 "Lockhart"+)
   Star detection + PSF fit (X, Y, FWHMx, FWHMy, Eccentricity, Rotation)
   and display as a vector map for tilt/coma diagnostics.

   Copyright (C) 2026 Sven Kopetzki

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <https://www.gnu.org/licenses/>.

   IMPORTANT: This script exclusively uses PixInsight's new V8 JavaScript
   runtime (>= 1.9.4). Its only #include directives are the PJSR image
   view and splitter controls of the dialog's preview.

   How it works:
     1. Optional: debayer (using the "SuperPixel" method) on a copy of the
        target image, if it is still an unprocessed Bayer mosaic (raw CFA)
        rather than a true RGB image. Interpolation-free 2x2 pixel
        grouping, so that the star profiles used for the tilt/coma
        measurement are not distorted by CFA pattern artifacts. The
        original is left untouched.
     2. Two-stage star detection on the (optionally debayered) target
        image, freely selectable via a ViewList: StarDetector (PixInsight's
        core star detector) supplies candidate positions; DynamicPSF
        itself does NOT search the field automatically as a process (see
        the comment at detectStarCandidates/fitStars) - it only fits a
        PSF model (Gaussian or Moffat) to a given candidate list.
     3. FWHMx, FWHMy, eccentricity and rotation angle are computed from
        sx/sy and theta.
     4. An ellipse is drawn for each star:
          - Major axis = eccentricity (scaled)
          - Minor axis = derived from the eccentricity (e = sqrt(1-(b/a)^2))
          - Angle = PSF rotation
          - Color = eccentricity (blue = round, red = strongly elongated)
        -> Radial elongation in the outer field = under-corrected coma,
           concentric = over-correction/defocus/field curvature, a pattern
           that differs between opposite sides = tilt, all stars elongated
           in the same direction = tracking. Coma itself is identified by
           the PSF asymmetry (flare direction), which the symmetric PSF
           models cannot show - see measureStarAsymmetry().
     5. Optionally, the data table can be exported as CSV.
     6. The "New Instance" icon (blue triangle, bottom left of the dialog)
        can be used to drop the current parameter set as a process icon on
        the workspace. Double-clicking this icon later reopens the dialog
        with the same settings.
        NOTE: Dragging the icon directly from the still-open dialog onto a
        target image is currently not supported by PixInsight for script
        processes (unlike native PCL processes) and results in "Attempt to
        execute a Script instance recursively".

   Note on the DynamicPSF table (empirically verified, see diagnostic
   runs): P.psf[i] actually has 18 columns, but the first 13 match exactly
   the originally assumed order:
     [ starIndex, function, circular, status, B, A, cx, cy, sx, sy,
       theta, beta, mad, ... 5 more, unused columns here ]
   IMPORTANT: status = 1 means "fit OK" (not 0, as originally assumed - all
   rows returned in the psf array had status=1).
   If your PixInsight build returns a different column order, the
   unconditional diagnostic output in fitStars() will reveal the raw row
   along with the status value distribution whenever 0 valid hits occur -
   adjust the IDX_* constants below accordingly.
   ---------------------------------------------------------------------
*/

CoreApplication.ensureMinimumVersion(1, 9, 4);

const VERSION = "0.9";
const TITLE = "Star Aberration Diagnostics";

// ---- Spaltenindizes in DynamicPSF.psf --------------------------------
const IDX_STARINDEX = 0;
const IDX_FUNCTION  = 1;
const IDX_CIRCULAR  = 2;
const IDX_STATUS    = 3;
const IDX_B         = 4;
const IDX_A         = 5;
const IDX_CX        = 6;
const IDX_CY        = 7;
const IDX_SX        = 8;
const IDX_SY        = 9;
const IDX_THETA     = 10;
const IDX_BETA      = 11;
const IDX_MAD       = 12;

let DEBUG_DUMP_RAW = false;

// Gauss-Sigma -> FWHM Umrechnungsfaktor
const SIGMA_TO_FWHM = 2 * Math.sqrt(2 * Math.log(2)); // ~2.35482

// Moffat core width alpha -> FWHM factor for a given beta
function moffatAlphaToFwhm(beta) {
   return 2 * Math.sqrt(Math.pow(2, 1 / beta) - 1);
}

// -----------------------------------------------------------------------
// The script's settings with their factory defaults. As a PersistentObject
// (pjsr/utility/PersistentObject.js, as in AperturePhotometry) they are
// remembered between runs in PixInsight's settings store
// (StarAberrationDiagnostics/<name>: LoadSettings/SaveSettings) and stored
// on a process icon by "New Instance" (<name>: SaveParameters), from which
// a drag&drop apply or a double-clicked icon reads them (LoadParameters).
// A new option needs its default below and a line in the property list.
const SETTINGS_MODULE = "StarAberrationDiagnostics";

var ScriptParameters = class extends PersistentObject {
   constructor() {
      super(SETTINGS_MODULE, "", [
         ["threshold",                   DataType.Double],
         ["radius",                      DataType.Int32],
         ["useMoffat",                   DataType.Boolean],
         ["vectorScale",                 DataType.Double],
         ["doExport",                    DataType.Boolean],
         ["debug",                       DataType.Boolean],
         ["debayer",                     DataType.Boolean],
         ["bayerPattern",                DataType.UTF16String],
         ["closeIntermediateWindows",    DataType.Boolean],
         ["madOutlierFactor",            DataType.Double],
         ["maxCandidates",               DataType.Int32],
         ["showSirilTilt",               DataType.Boolean],
         ["showStreamlines",             DataType.Boolean],
         ["streamlineRadiusPercent",     DataType.Double],
         ["pixelPitchUm",                DataType.Double],
         ["focalLengthMm",               DataType.Double],
         ["apertureMm",                  DataType.Double],
         ["show3DTiltPlot",              DataType.Boolean],
         ["showOrientationHeatmap",      DataType.Boolean],
         ["orientationHeatmapDegree",    DataType.Int32],
         ["showFwhmGrid",                DataType.Boolean],
         ["fwhmGridArcsec",              DataType.Boolean],
         ["opticsFromHeader",            DataType.Boolean],
         ["showStarAsymArrows",          DataType.Boolean],
         ["starAsymMinSigma",            DataType.Double],
         ["starAsymColorByStrength",     DataType.Boolean],
         ["hideEllipses",                DataType.Boolean],
         ["showTiltAxis",                DataType.Boolean],
         ["subtractTracking",            DataType.Boolean],
         ["measureAsymmetry",            DataType.Boolean],
         ["showComaStreamlines",         DataType.Boolean],
         ["comaStreamlineRadiusPercent", DataType.Double],
         ["comaStreamlineMinPercent",    DataType.Double],
         ["showComaArrows",              DataType.Boolean],
         ["opticsType",                  DataType.Int32]
      ]);

      this.threshold = 3.0;
      this.radius = 8;
      this.useMoffat = false;
      this.vectorScale = 1.0;
      this.doExport = true;
      this.debug = false;
      this.debayer = false;
      this.bayerPattern = "Auto"; // "Auto", "RGGB", "BGGR", "GBRG", "GRBG"
      this.closeIntermediateWindows = true; // close SuperPixel/side windows after processing
      this.madOutlierFactor = 3.0; // reject fits with MAD > factor x median(MAD); 0 = off
      this.maxCandidates = 1500; // max. candidates for the PSF fit (brightest first); 0 = no limit
      this.showSirilTilt = true; // show the Siril-style quadrant tilt polygon as an overlay
      this.showStreamlines = true; // show the smoothed trend as a streamlines overlay
      this.streamlineRadiusPercent = 12; // smoothing radius, % of the image diagonal
      this.pixelPitchUm = 0; // pixel pitch (µm); 0 = not specified, tilt angle computation off
      this.focalLengthMm = 0; // telescope focal length (mm); 0 = not specified
      this.apertureMm = 0; // telescope aperture (mm); 0 = not specified
      this.show3DTiltPlot = true; // pseudo-3D comparison plot (only if the above 3 values are set)
      this.showOrientationHeatmap = false; // PSF orientation as a color-field heatmap instead of the star field in the background
      this.orientationHeatmapDegree = 2; // 2D polynomial degree for the orientation heatmap fit; 1 = plane (pure tilt only), >=2 can also show curvature (e.g. coma)
      this.showFwhmGrid = false; // show an 11x11 per-cell FWHM grid instead of the 4-quadrant Siril tilt polygon
      this.fwhmGridArcsec = false; // FWHM grid values in arcseconds instead of pixels (needs pixel pitch + focal length)
      this.opticsFromHeader = true; // take pixel pitch/focal length/aperture from the FITS header where available
      this.showStarAsymArrows = false; // one asymmetry (coma flare) arrow per star
      this.starAsymMinSigma = 2.0; // per-star arrows only above this many sigma of the per-star asymmetry noise
      this.starAsymColorByStrength = false; // arrow color: false = alignment with the ellipse axis, true = strength
      this.hideEllipses = false; // hide the per-star ellipses (e.g. to look at the arrows alone)
      this.showTiltAxis = true; // draw the tilt axis line through the sensor center (part of the tilt overlay)
      this.subtractTracking = true; // subtract the field-wide median elongation (tracking/guiding) before drawing and analysis
      this.measureAsymmetry = true; // measure the PSF asymmetry (coma flare direction) and fit the coma-free point
      this.showComaStreamlines = true; // streamlines of the smoothed asymmetry (coma) field, orange with arrowheads
      this.comaStreamlineRadiusPercent = 24; // smoothing radius for the coma streamlines, % of the image diagonal
      this.comaStreamlineMinPercent = 20; // coma streamlines stop below this % of the field's (90th percentile) strength
      this.showComaArrows = true; // median asymmetry arrows on a coarse grid
      this.opticsType = 0; // optical system for the assessment's wording: index into OPTICS_TYPES (0 = unknown)
   }

   // Takes the values of all settings from an object with the same
   // property names (the dialog's collectParameters()).
   assign(source) {
      for (let i = 0; i < this.properties.length; ++i) {
         let name = this.properties[i][0];
         this[name] = source[name];
      }
   }
};

// The factory defaults, replaced by the settings remembered from the last
// run (if any); a process icon's parameters replace these again in main().
let parameters = new ScriptParameters();
parameters.LoadSettings();

// -----------------------------------------------------------------------
class StarRecord {
   constructor(x, y, fwhmX, fwhmY, ecc, thetaDeg) {
      this.x = x;
      this.y = y;
      this.fwhmX = fwhmX;
      this.fwhmY = fwhmY;
      this.eccentricity = ecc;
      this.rotation = thetaDeg;
   }
}

// -----------------------------------------------------------------------
// Simple progress display for loops we control ourselves (draw loops
// etc.). Guaranteed to print real, newline-terminated console lines at
// fixed percentage steps - deliberately NO \r overwrite, since that often
// never arrives as a visible line in non-interactive/batch runs (e.g.
// "-x=auto"). Additionally drives the native GUI progress bar
// (Console.progressStart/Update/End) if available - but that's irrelevant
// for text logs, hence not the only source. Checked defensively so a
// wrongly guessed/missing API doesn't crash (see the note at the top of
// the file on the constants/API question).
function withProgress(label, total) {
   let useNative = typeof Console.progressStart === "function" &&
      typeof Console.progressUpdate === "function" &&
      typeof Console.progressEnd === "function";
   if (useNative) {
      try {
         Console.progressStart(label, total);
      } catch (e) {
         useNative = false;
      }
   }

   let lastBucket = -1;
   let lastPercent = -1;
   const PERCENT_STEP = 10; // one line every 10% -> max. 11 lines in total

   return {
      update: function(value) {
         if (useNative) {
            try { Console.progressUpdate(value); } catch (e) { useNative = false; }
         }
         let percent = total > 0 ? Math.floor((value / total) * 100) : 100;
         if (percent !== lastPercent) {
            lastPercent = percent;
            Progress.advance(percent / 100);
         }
         let bucket = Math.floor(percent / PERCENT_STEP) * PERCENT_STEP;
         if (bucket === lastBucket)
            return;
         lastBucket = bucket;
         Console.writeln(format("%s: %d%% (%d/%d)", label, percent, value, total));
      },
      end: function() {
         if (useNative) {
            try { Console.progressEnd(); } catch (e) {}
         }
         if (lastBucket < 100)
            Console.writeln(format("%s: 100%% (done)", label));
      }
   };
}

// -----------------------------------------------------------------------
// Progress of a whole run for the dialog's progress bar. The run is split
// into steps, each covering a part [from, to] of the bar; withProgress()
// loops move the bar within the current step. Without a listener (no
// dialog, e.g. a drag&drop apply) this does nothing.
const Progress = {
   listener: null, // function(text, fraction), fraction in [0,1]; text null = finished
   text: "",
   from: 0,
   to: 0,
   step: function(text, from, to) {
      this.text = text;
      this.from = from;
      this.to = to;
      this.advance(0);
   },
   advance: function(fraction) {
      if (this.listener)
         this.listener(this.text, this.from + (this.to - this.from) * Math.range(fraction, 0, 1));
   },
   finish: function() {
      if (this.listener)
         this.listener(null, 0);
   }
};

// -----------------------------------------------------------------------
// Generic diagnostic dumper: lists all (including inherited/non-
// enumerable) properties of any PJSR object along with their values to
// the console. Used to empirically verify uncertain PCL API shapes (e.g.
// the return object of StarDetector.stars()) without being able to
// inspect PixInsight live.
function dumpObject(label, obj) {
   Console.writeln("--- " + label + " ---");
   if (obj === null || obj === undefined) {
      Console.writeln("  (null/undefined)");
      Console.writeln("--- end ---");
      return;
   }
   let names = Object.getOwnPropertyNames(obj);
   let proto = Object.getPrototypeOf(obj);
   if (proto) {
      let protoNames = Object.getOwnPropertyNames(proto);
      for (let i = 0; i < protoNames.length; ++i)
         if (names.indexOf(protoNames[i]) < 0)
            names.push(protoNames[i]);
   }
   for (let i = 0; i < names.length; ++i) {
      let name = names[i];
      if (name === "constructor")
         continue;
      let value;
      try { value = obj[name]; } catch (e) { value = "<error: " + e.message + ">"; }
      let desc;
      if (typeof value === "function")
         desc = "<function>";
      else if (value === null)
         desc = "null";
      else if (typeof value === "object")
         desc = "<object: " + Object.getOwnPropertyNames(value).join(", ") + ">";
      else
         desc = String(value);
      Console.writeln("  " + name + " = " + desc);
   }
   Console.writeln("--- end ---");
}

// -----------------------------------------------------------------------
// Stage 1: find candidate star positions with StarDetector (PixInsight's
// own core star detector, also used internally by StarAlignment among
// others). DynamicPSF as a process apparently only fits against a given
// P.stars table and does not itself search the field automatically (see
// diagnostic runs: P.stars.length stayed at 0 for every combination of
// autoPSF/threshold/searchRadius).
// Returns an array of DynamicPSF.stars rows ([viewIndex=0,
// channel=0, x0, y0, x1, y1]), or null on error. If candidateInfo is an
// array, it receives one {x, y, flux, size, bkg} entry per returned row
// (same index), used by reportRejections() to explain dropped candidates.
function detectStarCandidates(image, searchRadius, maxCandidates, candidateInfo) {
   if (typeof StarDetector === "undefined") {
      Console.criticalln("StarDetector is not available in this PixInsight version.");
      return null;
   }

   let D = new StarDetector;

   // StarDetector.stars() is a single, opaque native call with no
   // intermediate progress - on large images this can take a while with
   // no console output at all. At least show start/end/duration so it's
   // clear the script is still working.
   Console.writeln("StarDetector running (can take a moment on large images) ...");
   let t0 = Date.now();
   let rawStars;
   try {
      rawStars = D.stars(image);
   } catch (e) {
      Console.criticalln("StarDetector.stars() failed: " + e.message);
      return null;
   }
   Console.writeln(format("StarDetector finished after %.1f s.", (Date.now() - t0) / 1000));

   Console.noteln(rawStars.length + " candidate(s) found by StarDetector.");
   if (rawStars.length > 0)
      dumpObject("StarDetector candidate[0] (diagnostics)", rawStars[0]);

   // Limit the candidate count before the PSF fit (sorted descending by
   // brightness/flux, dropping the faintest first): the actual time sink
   // is not StarDetector but the subsequent blocking DynamicPSF fit over
   // ALL candidates - fewer, but brighter/more reliable candidates
   // directly reduce its runtime.
   if (maxCandidates > 0 && rawStars.length > maxCandidates) {
      let totalFound = rawStars.length;
      rawStars = rawStars.slice().sort(function(a, b) {
         return (b.flux || 0) - (a.flux || 0);
      }).slice(0, maxCandidates);
      Console.noteln(format("Limited to the %d brightest candidates (of %d found) - " +
         "reduces the runtime of the subsequent DynamicPSF fit.", maxCandidates, totalFound));
   }

   let boxes = [];
   let unrecognized = 0;
   for (let i = 0; i < rawStars.length; ++i) {
      let s = rawStars[i];
      let x, y;

      // Empirically confirmed (diagnostic dump): StarDetector candidates
      // carry x/y as direct numeric fields (not .pos.x/.pos.y).
      if (s && typeof s.x === "number" && typeof s.y === "number") {
         x = s.x; y = s.y;
      } else if (Array.isArray(s) && s.length >= 2 && typeof s[0] === "number") {
         x = s[0]; y = s[1];
      } else {
         ++unrecognized;
         continue;
      }

      let x0 = x - searchRadius, y0 = y - searchRadius;
      let x1 = x + searchRadius, y1 = y + searchRadius;

      // DynamicPSF.stars row format: according to a runtime error, exactly
      // 9 values are expected per row ("expected 9 values; got 6").
      // Reconstructed by analogy with the documented psf output table
      // (see header comment):
      // [ viewIndex, channel, status, x0, y0, x1, y1, cx, cy ].
      // Status: DynamicPSF.Star_DetectedOk, as used by the scripts shipped
      // with PixInsight (FWHMEccentricity, AperturePhotometry, 2DPlot).
      boxes.push([0, 0, dynamicPSFConstant("Star_DetectedOk", 0), x0, y0, x1, y1, x, y]);
      if (candidateInfo)
         candidateInfo.push({ x: x, y: y, flux: s.flux || 0, size: s.size || 0, bkg: s.bkg || 0 });
   }

   if (unrecognized > 0)
      Console.warningln(unrecognized + " candidate(s) with unknown format skipped " +
         "(see diagnostic dump above, adjust .pos/.rect access if needed).");

   return boxes;
}

// -----------------------------------------------------------------------
// Rejection analysis after DynamicPSF.executeGlobal(): explains why only
// part of the candidates produced a PSF row. DynamicPSF re-detects a star
// inside every search rectangle and silently drops candidates it cannot
// find there, so this compares fitted vs. dropped candidates using what is
// known about them (StarDetector size/flux, border distance, neighbors,
// peak level) and prints the raw status codes DynamicPSF reports.
//
// Status names are read at runtime from DynamicPSF's own enumeration
// constants (Star_* for P.stars, PSF_* for P.psf) instead of being guessed.

// Value of a DynamicPSF enumeration constant (static or via prototype,
// depending on the engine), or fallback if not available.
function dynamicPSFConstant(name, fallback) {
   let v = DynamicPSF[name];
   if (typeof v !== "number" && DynamicPSF.prototype)
      v = DynamicPSF.prototype[name];
   return (typeof v === "number") ? v : fallback;
}

// Map value -> name for all numeric DynamicPSF constants starting with
// prefix (e.g. "Star_" or "PSF_").
function dynamicPSFConstantNames(prefix) {
   let map = {};
   let sources = [DynamicPSF, DynamicPSF.prototype];
   for (let s = 0; s < sources.length; ++s) {
      if (!sources[s])
         continue;
      let names = Object.getOwnPropertyNames(sources[s]);
      for (let i = 0; i < names.length; ++i) {
         if (names[i].indexOf(prefix) !== 0)
            continue;
         let v;
         try { v = sources[s][names[i]]; } catch (e) { continue; }
         if (typeof v === "number" && !map.hasOwnProperty(v))
            map[v] = names[i].substring(prefix.length);
      }
   }
   return map;
}

function describeCode(map, code) {
   return code + "=" + (map.hasOwnProperty(code) ? map[code] : "?");
}

function countBy(values) {
   let counts = {};
   for (let i = 0; i < values.length; ++i)
      counts[values[i]] = (counts[values[i]] || 0) + 1;
   let parts = [];
   for (let k in counts)
      parts.push(k + ":" + counts[k]);
   return parts.join(", ");
}

function medianOf(values) {
   if (values.length === 0)
      return NaN;
   let v = values.slice().sort(function(a, b) { return a - b; });
   return v[Math.floor(v.length / 2)];
}

function reportRejections(P, image, starBoxes, candidateInfo, searchRadius) {
   const MAX_LISTED = DEBUG_DUMP_RAW ? 100 : 15;
   let n = starBoxes.length;
   let w = image.width, h = image.height;

   Console.writeln("--- Rejection analysis ---");

   let starNames = dynamicPSFConstantNames("Star_");
   let psfNames = dynamicPSFConstantNames("PSF_");
   let listNames = function(map) {
      let parts = [];
      for (let k in map)
         parts.push(k + "=" + map[k]);
      return parts.length > 0 ? parts.join(", ") : "(none found)";
   };
   Console.writeln("DynamicPSF star status codes: " + listNames(starNames));
   Console.writeln("DynamicPSF PSF status codes:  " + listNames(psfNames));

   // 1. What DynamicPSF wrote back into its stars table (status column).
   let starsAfter = P.stars;
   if (starsAfter && starsAfter.length > 0) {
      let codes = [];
      for (let i = 0; i < starsAfter.length; ++i)
         codes.push(describeCode(starNames, starsAfter[i][2]));
      Console.writeln(format("P.stars after fit: %d row(s), status column distribution (code:count): %s",
         starsAfter.length, countBy(codes)));
   } else {
      Console.writeln("P.stars after fit: empty (DynamicPSF did not write back its stars table).");
   }

   // 2. Status of the rows that did produce a PSF.
   let fitted = {};
   let psfCodes = [];
   for (let i = 0; i < P.psf.length; ++i) {
      let row = P.psf[i];
      fitted[row[IDX_STARINDEX]] = row[IDX_STATUS];
      let code = row[IDX_STATUS];
      psfCodes.push(describeCode(psfNames, code));
   }
   Console.writeln(format("P.psf: %d row(s) for %d candidate(s); status distribution: %s",
      P.psf.length, n, P.psf.length > 0 ? countBy(psfCodes) : "-"));

   if (!candidateInfo || candidateInfo.length !== n) {
      Console.writeln("(No StarDetector metadata available - detailed analysis skipped.)");
      Console.writeln("--- end ---");
      return;
   }

   // Global maximum as saturation reference (raw/debayered data often
   // does not reach 1.0, e.g. 14-bit data in a 16-bit container).
   let globalMax = image.maximum();
   let boxDiameter = 2 * searchRadius + 1;

   // Spatial grid for neighbor lookup (cell size = box size).
   let cell = Math.max(1, boxDiameter);
   let grid = {};
   for (let i = 0; i < n; ++i) {
      let key = Math.floor(candidateInfo[i].x / cell) + "," + Math.floor(candidateInfo[i].y / cell);
      (grid[key] = grid[key] || []).push(i);
   }

   let reasons = { edge: 0, tooLarge: 0, neighbor: 0, saturated: 0, none: 0 };
   // Same counts, broken down by the status DynamicPSF wrote back into
   // P.stars - shows which heuristic cause correlates with which code.
   let reasonsByStatus = {};
   let haveStarStatus = starsAfter && starsAfter.length === n;
   let dropped = [], kept = [];
   let listed = 0;

   for (let i = 0; i < n; ++i) {
      let c = candidateInfo[i];
      let isFitted = fitted.hasOwnProperty(i) && fitted[i] === dynamicPSFConstant("PSF_FittedOk", 1);
      (isFitted ? kept : dropped).push(c);
      if (isFitted)
         continue;

      let why = [];

      // Search box crosses the image border.
      if (c.x - searchRadius < 0 || c.y - searchRadius < 0 || c.x + searchRadius >= w || c.y + searchRadius >= h) {
         why.push("box crosses image border");
         ++reasons.edge;
      }

      // StarDetector size is the pixel count of the star's footprint;
      // its equivalent diameter vs. the search box.
      let diameter = 2 * Math.sqrt(c.size / Math.PI);
      if (diameter > boxDiameter) {
         why.push(format("star diameter ~%.1f px > box %d px", diameter, boxDiameter));
         ++reasons.tooLarge;
      }

      // Another candidate whose box overlaps this one.
      let gx = Math.floor(c.x / cell), gy = Math.floor(c.y / cell);
      let nearest = Infinity;
      for (let dx = -2; dx <= 2; ++dx)
         for (let dy = -2; dy <= 2; ++dy) {
            let list = grid[(gx + dx) + "," + (gy + dy)];
            if (!list)
               continue;
            for (let k = 0; k < list.length; ++k) {
               if (list[k] === i)
                  continue;
               let o = candidateInfo[list[k]];
               nearest = Math.min(nearest, Math.sqrt((o.x - c.x) * (o.x - c.x) + (o.y - c.y) * (o.y - c.y)));
            }
         }
      if (nearest < boxDiameter) {
         why.push(format("neighbor candidate at %.1f px", nearest));
         ++reasons.neighbor;
      }

      // Peak inside the search box close to the global maximum.
      let peak = NaN;
      try {
         let r = new Rect(Math.max(0, Math.floor(c.x - searchRadius)), Math.max(0, Math.floor(c.y - searchRadius)),
            Math.min(w, Math.ceil(c.x + searchRadius) + 1), Math.min(h, Math.ceil(c.y + searchRadius) + 1));
         peak = image.maximum(r);
      } catch (e) {}
      if (peak >= 0.98 * globalMax) {
         why.push(format("peak %.4f ~ saturated (image max %.4f)", peak, globalMax));
         ++reasons.saturated;
      }

      if (why.length === 0) {
         why.push("no obvious cause (likely below detection threshold / fit failed)");
         ++reasons.none;
      }

      if (haveStarStatus) {
         let st = describeCode(starNames, starsAfter[i][2]);
         let b = reasonsByStatus[st] = reasonsByStatus[st] || { n: 0, edge: 0, tooLarge: 0, neighbor: 0, saturated: 0, none: 0 };
         ++b.n;
         for (let j = 0; j < why.length; ++j) {
            if (why[j].indexOf("border") >= 0) ++b.edge;
            else if (why[j].indexOf("diameter") >= 0) ++b.tooLarge;
            else if (why[j].indexOf("neighbor") >= 0) ++b.neighbor;
            else if (why[j].indexOf("saturated") >= 0) ++b.saturated;
            else if (why[j].indexOf("no obvious") >= 0) ++b.none;
         }
         why.unshift("DynamicPSF star status " + st);
      }

      if (fitted.hasOwnProperty(i))
         why.unshift("PSF status " + describeCode(psfNames, fitted[i]));

      if (listed < MAX_LISTED) {
         Console.writeln(format("  dropped #%d at (%.1f, %.1f) flux=%.3g size=%d: %s",
            i, c.x, c.y, c.flux, c.size, why.join("; ")));
         ++listed;
      }
   }
   if (dropped.length > listed)
      Console.writeln(format("  ... %d more dropped candidate(s) not listed%s.",
         dropped.length - listed, DEBUG_DUMP_RAW ? "" : " (enable debug output for up to 100)"));

   Console.noteln(format("Dropped %d of %d candidate(s). Suspected causes (not exclusive): " +
      "border=%d, larger than search box=%d, overlapping neighbor=%d, saturated=%d, no obvious cause=%d",
      dropped.length, n, reasons.edge, reasons.tooLarge, reasons.neighbor, reasons.saturated, reasons.none));

   for (let st in reasonsByStatus) {
      let b = reasonsByStatus[st];
      Console.writeln(format("  star status %s: n=%d  border=%d, larger than box=%d, neighbor=%d, saturated=%d, no obvious cause=%d",
         st, b.n, b.edge, b.tooLarge, b.neighbor, b.saturated, b.none));
   }

   function stats(list, label) {
      Console.writeln(format("  %-8s n=%4d  median flux=%.3g  median size=%.0f px",
         label, list.length,
         medianOf(list.map(function(c) { return c.flux; })),
         medianOf(list.map(function(c) { return c.size; }))));
   }
   stats(kept, "fitted");
   stats(dropped, "dropped");
   Console.writeln(format("  search box = %d x %d px (radius %d)", boxDiameter, boxDiameter, searchRadius));
   Console.writeln("--- end ---");
}

// -----------------------------------------------------------------------
// Stage 2: compute the elliptical PSF fit (Gaussian/Moffat) for the given
// search rectangles (starBoxes).
function fitStars(view, starBoxes, threshold, searchRadius, useMoffat, madOutlierFactor, candidateInfo) {
   let P = new DynamicPSF;
   P.views = [[view.id]];

   // The format of P.stars is not known with certainty (reconstructed
   // empirically from a runtime error message) - with the wrong format,
   // the assignment fails immediately with a PCL error message. Catching
   // this here prevents a complete script crash and instead provides
   // useful diagnostics.
   try {
      P.stars = starBoxes;
   } catch (e) {
      Console.criticalln("P.stars assignment failed: " + e.message);
      if (starBoxes.length > 0)
         Console.writeln("First row (length " + starBoxes[0].length + "): [" + starBoxes[0].join(", ") + "]");
      return [];
   }

   P.autoPSF = false; // specify the model explicitly instead of choosing automatically
   P.circularPSF = false;
   P.gaussianPSF = !useMoffat;
   P.moffatPSF = useMoffat;
   P.autoAperture = true;
   // Re-detect and re-fit every star in P.stars instead of relying on
   // table state - set by all DynamicPSF-based scripts shipped with PixInsight.
   P.regenerate = true;
   P.searchRadius = searchRadius;
   P.threshold = threshold; // quality/aperture threshold in sigma

   // P.executeGlobal() is a single, blocking native call - while it runs,
   // no JS code (including any progress display) can run in between. At
   // least show start/end/duration.
   Console.writeln(format("DynamicPSF fit running (%d candidates) ...", starBoxes.length));
   let fitT0 = Date.now();
   try {
      P.executeGlobal();
   } catch (e) {
      Console.criticalln("DynamicPSF.executeGlobal() failed: " + e.message);
      return [];
   }
   Console.writeln(format("DynamicPSF fit finished after %.1f s.", (Date.now() - fitT0) / 1000));

   try {
      reportRejections(P, view.image, starBoxes, candidateInfo, searchRadius);
   } catch (e) {
      Console.warningln("Rejection analysis failed: " + e.message);
   }

   let stars = [];
   if (P.psf.length === 0) {
      Console.warningln("DynamicPSF: 0 of " + starBoxes.length + " candidate(s) successfully fitted.");
      if (starBoxes.length > 0)
         Console.writeln("Sample row P.stars[0] = [" + starBoxes[0].join(", ") + "]");
      return stars;
   }

   // First collect all rows with a successful fit (status===1).
   let accepted = [];
   for (let i = 0; i < P.psf.length; ++i) {
      let row = P.psf[i];
      if (row[IDX_STATUS] === dynamicPSFConstant("PSF_FittedOk", 1))
         accepted.push(row);
   }

   // MAD outlier filter: a row that was successfully "fitted" can still be
   // a noisy/unstable fit (hot pixel, blend, very faint candidate) - this
   // shows up as a disproportionately high MAD (mean absolute deviation
   // from the PSF model, column IDX_MAD) compared to the other stars in
   // the same image. Physically, neighboring stars should show similar
   // eccentricity/rotation (tilt/coma vary continuously across the field)
   // - an isolated, strongly deviating outlier right next to "normal"
   // stars is usually a fit artifact, not a real signal. Threshold =
   // madOutlierFactor * median(MAD), robust with respect to the actual
   // noise/signal strength of this particular image (instead of a fixed
   // absolute limit).
   let madCutoff = Infinity;
   let madMedian = 0;
   if (madOutlierFactor > 0 && accepted.length > 0) {
      let mads = accepted.map(function(row) { return row[IDX_MAD]; }).sort(function(a, b) { return a - b; });
      madMedian = mads[Math.floor(mads.length / 2)];
      if (madMedian > 0)
         madCutoff = madMedian * madOutlierFactor;
   }

   let rejectedByMad = 0;
   let badBeta = 0;
   for (let i = 0; i < accepted.length; ++i) {
      let row = accepted[i];

      if (row[IDX_MAD] > madCutoff) {
         ++rejectedByMad;
         Console.writeln(format("  MAD reject: star #%d at (%.1f, %.1f)  MAD=%.4g > cutoff %.4g (median %.4g)",
            row[IDX_STARINDEX], row[IDX_CX], row[IDX_CY], row[IDX_MAD], madCutoff, madMedian));
         continue;
      }

      let cx = row[IDX_CX];
      let cy = row[IDX_CY];
      let sx = row[IDX_SX];
      let sy = row[IDX_SY];
      let theta = row[IDX_THETA]; // degrees, CCW from the x-axis

      // sx/sy are the Gaussian sigma for a Gaussian fit, but the Moffat
      // core width alpha for a Moffat fit: FWHM = 2·alpha·sqrt(2^(1/beta) - 1).
      // The Gaussian factor would inflate Moffat FWHMs by 1.5x (beta = 1.5)
      // up to 2.7x (beta = 4) and more for larger beta.
      let toFwhm = SIGMA_TO_FWHM;
      if (useMoffat) {
         let beta = row[IDX_BETA];
         if (isFinite(beta) && beta > 0) {
            toFwhm = moffatAlphaToFwhm(beta);
         } else {
            ++badBeta;
         }
      }
      let fwhmX = sx * toFwhm;
      let fwhmY = sy * toFwhm;

      let major = Math.max(fwhmX, fwhmY);
      let minor = Math.min(fwhmX, fwhmY);
      let ecc = (major > 0) ? Math.sqrt(1 - (minor * minor) / (major * major)) : 0;

      stars.push(new StarRecord(cx, cy, fwhmX, fwhmY, ecc, theta));
   }

   if (badBeta > 0)
      Console.warningln(format("%d Moffat fit(s) without a valid beta (column IDX_BETA=%d) - Gaussian FWHM " +
         "factor used for those; check the column layout with the debug option.", badBeta, IDX_BETA));

   if (rejectedByMad > 0)
      Console.noteln(rejectedByMad + " fit(s) rejected as MAD outliers (factor " +
         madOutlierFactor + " x median).");

   Console.noteln(format("%d / %d stars successfully fitted.", stars.length, P.psf.length));

   // Diagnostics - unconditional: if, despite P.psf.length > 0, not a
   // single star remains, distinguish between "status filter not working"
   // (column layout presumably wrong) and "MAD filter rejected everything"
   // (madOutlierFactor possibly too strict).
   if (stars.length === 0 && accepted.length === 0) {
      Console.criticalln("All " + P.psf.length + " PSF rows were rejected by the status filter " +
         "(row[" + IDX_STATUS + "] !== 1) - column layout presumably wrong. Diagnostics:");
      Console.writeln("Raw psf[0] (length " + P.psf[0].length + ") = [" + P.psf[0].join(", ") + "]");

      let statusCounts = {};
      for (let i = 0; i < P.psf.length; ++i) {
         let v = P.psf[i][IDX_STATUS];
         statusCounts[v] = (statusCounts[v] || 0) + 1;
      }
      let parts = [];
      for (let k in statusCounts)
         parts.push(k + ":" + statusCounts[k]);
      Console.writeln("Distribution row[IDX_STATUS=" + IDX_STATUS + "] -> count: " + parts.join(", "));
   } else if (stars.length === 0 && accepted.length > 0) {
      Console.criticalln(accepted.length + " successful fits present, but all rejected by the " +
         "MAD outlier filter - madOutlierFactor (" + madOutlierFactor + ") is too strict.");
   }

   return stars;
}

// -----------------------------------------------------------------------
function exportCSV(stars, filePath) {
   let f = new File;
   f.createForWriting(filePath);
   // Eccentricity/Rotation_deg are the values drawn in the map (tracking-
   // corrected if that option is on); *_raw are the uncorrected fit values.
   // Asym*/M3* are empty if the asymmetry measurement was off or failed.
   f.outTextLn("X,Y,FWHMx,FWHMy,Eccentricity,Rotation_deg,Eccentricity_raw,Rotation_raw_deg,AsymX_px,AsymY_px,M3X,M3Y");
   let num = function(v, digits) {
      return (v === null || v === undefined) ? "" : v.toFixed(digits);
   };
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      f.outTextLn(format("%.3f,%.3f,%.3f,%.3f,%.4f,%.2f,",
         s.x, s.y, s.fwhmX, s.fwhmY, s.eccentricity, s.rotation) +
         [num(s.eccentricityRaw, 4), num(s.rotationRaw, 2), num(s.asymX, 4), num(s.asymY, 4),
          num(s.m3X, 4), num(s.m3Y, 4)].join(","));
   }
   f.close();
   Console.noteln("CSV exported to: " + filePath);
}

// -----------------------------------------------------------------------
// Color gradient: blue (round) -> red (strongly elongated)
function eccColor(ecc, eccMax) {
   let t = Math.max(0, Math.min(1, ecc / eccMax));
   let r = Math.round(255 * t);
   let b = Math.round(255 * (1 - t));
   let g = Math.round(64 * (1 - Math.abs(t - 0.5) * 2));
   return 0xFF000000 | (r << 16) | (g << 8) | b;
}

// -----------------------------------------------------------------------
// Recreation of Siril's "Show tilt" (src/algos/ccd-inspector.c,
// compute_tilt_values() + draw_polygon(), GPL, gitlab.com/free-astro/siril).
// Unlike our vector map (one vector per star, with direction), Siril
// aggregates over 4 image quadrants and only uses the mean FWHM
// (fwhmx+fwhmy)/2 - no eccentricity/rotation. It is overlaid here on top
// of our vector map in addition to it, not as a replacement for it.

// 25%-trimmed mean (like Siril's siril_stats_trmean_from_sorted_data with
// p=0.25): discards 25% of the lowest/highest values each before
// averaging - robust against individual outlier fits per quadrant.
function trimmedMean25(values) {
   let sorted = values.slice().sort(function(a, b) { return a - b; });
   let n = sorted.length;
   let k = Math.floor(n * 0.25);
   let trimmed = sorted.slice(k, n - k);
   if (trimmed.length === 0)
      trimmed = sorted; // fallback for very few values in this quadrant
   let sum = 0;
   for (let i = 0; i < trimmed.length; ++i)
      sum += trimmed[i];
   return sum / trimmed.length;
}

// Splits the stars into 4 quadrants around the image center and computes
// the trimmed mean FWHM per quadrant (Siril: m1..m4). Also, like Siril, an
// inner circle (25% of the half-diagonal radius) vs. an outer ring (>75%)
// for the "off-axis aberration" (a field-curvature/coma-like measure,
// independent of the quadrant tilt). Returns null if a quadrant is empty
// (like Siril's compute_tilt_values()).
function computeSirilTilt(stars, w, h) {
   let cx = w / 2, cy = h / 2;
   let quadrants = [[], [], [], []]; // 0=TL, 1=TR, 2=BL, 3=BR
   let inner = [], outer = [];
   let r = Math.sqrt(cx * cx + cy * cy);
   let r1 = 0.25 * r, r2 = 0.75 * r;

   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      let meanFwhm = (s.fwhmX + s.fwhmY) * 0.5;
      let left = s.x < cx, top = s.y < cy;
      let qi = top ? (left ? 0 : 1) : (left ? 2 : 3);
      quadrants[qi].push(meanFwhm);

      let dx = s.x - cx, dy = s.y - cy;
      let d2 = dx * dx + dy * dy;
      if (d2 < r1 * r1)
         inner.push(meanFwhm);
      else if (d2 > r2 * r2)
         outer.push(meanFwhm);
   }

   if (quadrants[0].length === 0 || quadrants[1].length === 0 ||
       quadrants[2].length === 0 || quadrants[3].length === 0 ||
       inner.length === 0 || outer.length === 0)
      return null;

   return {
      m1: trimmedMean25(quadrants[0]), // TL
      m2: trimmedMean25(quadrants[1]), // TR
      m3: trimmedMean25(quadrants[2]), // BL
      m4: trimmedMean25(quadrants[3]), // BR
      mInner: trimmedMean25(inner),
      mOuter: trimmedMean25(outer)
   };
}

// -----------------------------------------------------------------------
// Finer-grained alternative to computeSirilTilt()'s 4 quadrants: splits
// the image into a gridSize x gridSize grid of cells and computes the
// 25%-trimmed mean FWHM ((fwhmX+fwhmY)/2, same measure as the quadrants)
// per cell. Unlike computeSirilTilt(), an empty cell does not invalidate
// the whole result - at gridSize=11 (121 cells) some sparsely populated
// or empty cells, especially near the corners, are expected; those are
// simply left out (null) rather than failing the whole grid. Each cell
// naturally gets far fewer stars than a quadrant (~1/(gridSize/2)² as
// many on average), so individual cell values are noisier than the 4
// quadrant means - this trades statistical robustness for spatial
// resolution.
// Returns a gridSize x gridSize array of arrays (row-major, row 0 = top,
// column 0 = left), each entry either a number or null.
function computeFwhmGrid(stars, w, h, gridSize) {
   let cellW = w / gridSize, cellH = h / gridSize;
   let buckets = [];
   for (let r = 0; r < gridSize; ++r) {
      let row = [];
      for (let c = 0; c < gridSize; ++c)
         row.push([]);
      buckets.push(row);
   }

   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      let col = Math.min(gridSize - 1, Math.max(0, Math.floor(s.x / cellW)));
      let row = Math.min(gridSize - 1, Math.max(0, Math.floor(s.y / cellH)));
      buckets[row][col].push((s.fwhmX + s.fwhmY) * 0.5);
   }

   let grid = [];
   for (let r = 0; r < gridSize; ++r) {
      let row = [];
      for (let c = 0; c < gridSize; ++c)
         row.push(buckets[r][c].length > 0 ? trimmedMean25(buckets[r][c]) : null);
      grid.push(row);
   }
   return grid;
}

// Draws the grid computed by computeFwhmGrid(): thin grid lines dividing
// the image into cells, plus a small halo-backed text label per non-empty
// cell showing its trimmed mean FWHM. Alternative to
// drawSirilTiltPolygon() for a finer-grained (but per-cell noisier) view
// of the FWHM distribution across the field - same salmon-orange color
// family, so it reads as belonging to the same overlay.
// `scale` converts the per-cell FWHM from image pixels into the displayed
// unit (1 for pixels, arcsec/px for arcseconds); `unitLabel` is shown as a
// legend in the top-left corner.
function drawFwhmGrid(g, w, h, grid, scale, unitLabel) {
   let gridSize = grid.length;
   let cellW = w / gridSize, cellH = h / gridSize;
   let gridColor = 0xFFFFCCB2; // same salmon-orange as the Siril quadrant overlay

   g.antialiasing = true;
   g.pen = new Pen(0xB0000000, 3);
   for (let i = 0; i <= gridSize; ++i) {
      g.drawLine(i * cellW, 0, i * cellW, h);
      g.drawLine(0, i * cellH, w, i * cellH);
   }
   g.pen = new Pen(gridColor, 1);
   for (let i = 0; i <= gridSize; ++i) {
      g.drawLine(i * cellW, 0, i * cellW, h);
      g.drawLine(0, i * cellH, w, i * cellH);
   }

   let fontSize = Math.max(12, Math.round(Math.min(cellW, cellH) * 0.22));
   let font = new Font("Helvetica", fontSize);
   try { font.bold = true; } catch (e) { /* not critical */ }
   g.font = font;

   for (let r = 0; r < gridSize; ++r) {
      for (let c = 0; c < gridSize; ++c) {
         let value = grid[r][c];
         if (value === null)
            continue;
         let label = format("%.2f", value * scale);
         let ccx = (c + 0.5) * cellW, ccy = (r + 0.5) * cellH;
         let labelX = ccx - g.font.width(label) / 2;
         let labelY = ccy + fontSize / 3;
         drawTextWithHalo(g, labelX, labelY, label, gridColor, fontSize);
      }
   }

   let legend = "FWHM [" + unitLabel + "]";
   drawTextWithHalo(g, fontSize * 0.5, fontSize * 1.3, legend, gridColor, fontSize);
}

// Draws `text` at (x,y) using the current g.font, with a dark halo behind
// it (offset copies in several directions) so it stays readable against
// any background, including the fully saturated orientation heatmap.
// `fontSize` should match the size g.font was set to - it controls how
// far the halo is offset.
function drawTextWithHalo(g, x, y, text, color, fontSize) {
   let offset = Math.max(2, Math.round(fontSize * 0.06));
   g.pen = new Pen(0xE0000000, 1);
   for (let dy = -offset; dy <= offset; dy += offset)
      for (let dx = -offset; dx <= offset; dx += offset)
         if (dx !== 0 || dy !== 0)
            g.drawText(x + dx, y + dy, text);
   g.pen = new Pen(color, 1);
   g.drawText(x, y, text);
}

// -----------------------------------------------------------------------
// Computes the tilt axis: the line through the sensor center along which
// the plane fitted to the 4 (center-relative) quadrant FWHM values
// rises/falls most steeply - same underlying plane as build3DTiltPlot(),
// just evaluated directly in image pixel space here instead of physical
// mm/µm. The axis DIRECTION needs no physical units at all: it only
// depends on the relative sign/magnitude of each quadrant's FWHM excess
// over the center (tilt.mInner), and that stays the same regardless of
// whether that excess is expressed in FWHM pixels or converted to a
// physical Δz (the conversion is a positive scalar, common to all 4
// quadrants, so it cannot change the fitted plane's direction - only its
// steepness). The axis MAGNITUDE (an actual angle in degrees) does need
// the optical parameters to convert FWHM excess into a physical Δz, via
// the same f-number-based circle-of-confusion approximation as
// computeAndLogTiltAngles()/build3DTiltPlot() - if pixelPitchUm,
// focalLengthMm or apertureMm are missing (<= 0), angleDeg is null.
// Returns { directionDeg: 0..180, angleDeg: number|null }.
function computeTiltAxis(tilt, w, h, pixelPitchUm, focalLengthMm, apertureMm) {
   function signedExcessPx(fwhm, centerFwhm) {
      let diff = fwhm * fwhm - centerFwhm * centerFwhm;
      return (diff < 0 ? -1 : 1) * Math.sqrt(Math.abs(diff));
   }
   let eTL = signedExcessPx(tilt.m1, tilt.mInner);
   let eTR = signedExcessPx(tilt.m2, tilt.mInner);
   let eBL = signedExcessPx(tilt.m3, tilt.mInner);
   let eBR = signedExcessPx(tilt.m4, tilt.mInner);

   let px = w / 4, py = h / 4;
   let gradX = (px > 0) ? ((eTR + eBR) - (eTL + eBL)) / (4 * px) : 0; // FWHM-px per image-px, x
   let gradY = (py > 0) ? ((eBL + eBR) - (eTL + eTR)) / (4 * py) : 0; // FWHM-px per image-px, y
   let gradMag = Math.hypot(gradX, gradY);

   // Direction as an undirected line (0°..180°, relative to the horizontal
   // image axis) - a line has no arrowhead/sign, see build3DTiltPlot().
   let directionDeg = (gradMag > 1e-9)
      ? (((Math.atan2(gradY, gradX) * 180 / Math.PI) % 180) + 180) % 180
      : 0;

   let angleDeg = null;
   if (pixelPitchUm > 0 && focalLengthMm > 0 && apertureMm > 0) {
      let fRatio = focalLengthMm / apertureMm;
      angleDeg = Math.atan(fRatio * gradMag) * 180 / Math.PI;
   }

   return { directionDeg: directionDeg, angleDeg: angleDeg };
}

// Draws the tilt axis (see computeTiltAxis()) as a line through the
// sensor center, extended to the image edges, labeled with the axis
// direction (always available) and, if known, the physical tilt angle.
// Uses the same light-blue axis color as build3DTiltPlot()'s tilt axis,
// for visual consistency between the 2D vector map and the separate 3D
// comparison plot.
function drawTiltAxis(g, w, h, axis) {
   let cx = w / 2, cy = h / 2;
   let rad = axis.directionDeg * Math.PI / 180;
   let dirX = Math.cos(rad), dirY = Math.sin(rad);
   let halfW = w / 2, halfH = h / 2;
   let tX = (Math.abs(dirX) > 1e-9) ? halfW / Math.abs(dirX) : Infinity;
   let tY = (Math.abs(dirY) > 1e-9) ? halfH / Math.abs(dirY) : Infinity;
   let t = Math.min(tX, tY);
   let p1 = { x: cx + t * dirX, y: cy + t * dirY };
   let p2 = { x: cx - t * dirX, y: cy - t * dirY };

   let axisColor = 0xFF66E0FF; // light blue, same as build3DTiltPlot()'s tilt axis

   g.antialiasing = true;
   g.pen = new Pen(0xB0000000, 9);
   g.drawLine(p1.x, p1.y, p2.x, p2.y);
   g.pen = new Pen(axisColor, 4);
   g.drawLine(p1.x, p1.y, p2.x, p2.y);

   let label = (axis.angleDeg !== null)
      ? format("Tilt axis: %.3f° (dir. %.0f°)", axis.angleDeg, axis.directionDeg)
      : format("Tilt axis direction: %.0f°", axis.directionDeg);

   let fontSize = Math.round(Math.max(28, Math.max(w, h) * 0.009));
   let font = new Font("Helvetica", fontSize);
   try { font.bold = true; } catch (e) { /* not critical */ }
   g.font = font;

   // Place the label near one end of the axis, clamped so it doesn't run
   // off the image edge.
   let labelX = Math.max(fontSize, Math.min(p1.x, w - fontSize - g.font.width(label)));
   let labelY = Math.max(fontSize * 2, Math.min(p1.y, h - fontSize));
   drawTextWithHalo(g, labelX, labelY, label, axisColor, fontSize);
}

// Draws Siril's tilt quadrilateral - modeled on the actual rendering code
// (src/gui-gtk4/image_display.c, draw_analysis()), but with two deliberate
// deviations from the original: the corner points sit fixed at the
// geometric center of their respective quadrant (±w/4, ±h/4 from the image
// center) instead of - as in Siril - being shifted along the diagonal
// proportionally to the FWHM deviation (this directly shows which image
// region each value comes from); additionally, the inner circle from which
// the center value (Siril's "fwhm_centre"/mInner) is computed is drawn as
// a circle outline. Otherwise as in the original: 4 outer edges + both
// diagonals (an X through the center), large bold labels per corner,
// center value.
function drawSirilTiltPolygon(g, w, h, tilt) {
   let cx = w / 2, cy = h / 2;

   // Corner points = geometric center of the respective quadrant (fixed,
   // independent of the FWHM value - shows the actual region of origin).
   let pTL = { x: cx - w / 4, y: cy - h / 4 };
   let pTR = { x: cx + w / 4, y: cy - h / 4 };
   let pBL = { x: cx - w / 4, y: cy + h / 4 };
   let pBR = { x: cx + w / 4, y: cy + h / 4 };

   // Inner-circle radius as in computeSirilTilt() (25% of the
   // half-diagonal radius) - bounds the region from which tilt.mInner was computed.
   let innerRadius = 0.25 * Math.sqrt(cx * cx + cy * cy);

   // Color as in Siril (image_display.c: RGB 1.0/0.8/0.7 -> light salmon-orange)
   let tiltColor = 0xFFFFCCB2;

   g.antialiasing = true;

   // 4 outer edges + both diagonals (an X through the center) - exact
   // Cairo path from draw_analysis(): TL-TR, BL-BR, TL-BL, BR-TR, TR-BL(diag.), BR-TL(diag.).
   // Same halo+core weight throughout (dark halo under a bright tiltColor
   // core) so the whole quadrilateral reads as consistently styled and
   // stands out against any background, including the orientation heatmap.
   g.pen = new Pen(0xB0000000, 15);
   g.drawLine(pTL.x, pTL.y, pTR.x, pTR.y);
   g.drawLine(pBL.x, pBL.y, pBR.x, pBR.y);
   g.drawLine(pTL.x, pTL.y, pBL.x, pBL.y);
   g.drawLine(pBR.x, pBR.y, pTR.x, pTR.y);
   g.drawLine(pTR.x, pTR.y, pBL.x, pBL.y);
   g.drawLine(pBR.x, pBR.y, pTL.x, pTL.y);
   g.pen = new Pen(tiltColor, 7);
   g.drawLine(pTL.x, pTL.y, pTR.x, pTR.y);
   g.drawLine(pBL.x, pBL.y, pBR.x, pBR.y);
   g.drawLine(pTL.x, pTL.y, pBL.x, pBL.y);
   g.drawLine(pBR.x, pBR.y, pTR.x, pTR.y);
   g.drawLine(pTR.x, pTR.y, pBL.x, pBL.y);
   g.drawLine(pBR.x, pBR.y, pTL.x, pTL.y);

   // Draw the inner-circle region for the center value.
   g.drawEllipse(cx - innerRadius, cy - innerRadius, cx + innerRadius, cy + innerRadius);

   // Labels - noticeably larger/bold than Siril's fixed 20px/zoom, scaled
   // proportionally to the image size, and drawn with a dark halo (offset
   // copies behind the actual color) so they stay readable against any
   // background, including the orientation heatmap.
   let fontSize = Math.round(Math.max(36, Math.max(w, h) * 0.012));
   let font = new Font("Helvetica", fontSize);
   try { font.bold = true; } catch (e) { /* not critical */ }
   g.font = font;

   drawTextWithHalo(g, pTL.x, pTL.y - fontSize, format("%.2f", tilt.m1), tiltColor, fontSize);
   drawTextWithHalo(g, pTR.x, pTR.y - fontSize, format("%.2f", tilt.m2), tiltColor, fontSize);
   drawTextWithHalo(g, pBL.x, pBL.y + fontSize, format("%.2f", tilt.m3), tiltColor, fontSize);
   drawTextWithHalo(g, pBR.x, pBR.y + fontSize, format("%.2f", tilt.m4), tiltColor, fontSize);

   // Center value as in Siril: trimmed mean of the inner circle (mInner),
   // centered below the image center.
   drawTextWithHalo(g, cx, cy + fontSize, format("%.2f", tilt.mInner), tiltColor, fontSize);

   g.pen = new Pen(tiltColor, 2);
   g.drawEllipse(cx - 3, cy - 3, cx + 3, cy + 3);
}

// -----------------------------------------------------------------------
// Converts the Siril-style quadrant FWHM differences (tilt) into an
// estimated tilt angle in degrees. Chain: excess blur (quadratic relative
// to the sensor center, since focus and defocus blur tend to add in
// quadrature rather than linearly) -> physical defocus via the circle-of-
// confusion approximation (Δz = f-number * blur) -> tilt angle via
// tan(θ) = Δz / distance between image center and quadrant center (±w/4, ±h/4).
// The reference (Δz=0) is the sensor center (tilt.mInner, trimmed FWHM
// mean within the inner circle around the image center) rather than one
// of the 4 corner quadrants - otherwise, in a tie/close call, the first
// quadrant (top-left) would always be artificially chosen as the
// reference, even though autofocus/collimation is usually optimized for
// the image center.
// Only a rough estimate: geometric optics, no diffraction/seeing
// deconvolution, the quadrant mean is assumed representative of its
// geometric center. Returns nothing, logs directly.
function computeAndLogTiltAngles(tilt, w, h, pixelPitchUm, focalLengthMm, apertureMm) {
   let fRatio = focalLengthMm / apertureMm;
   let centerFwhm = tilt.mInner;

   let quadrants = [
      { name: "Top-left",  fwhm: tilt.m1 },
      { name: "Top-right", fwhm: tilt.m2 },
      { name: "Bottom-left", fwhm: tilt.m3 },
      { name: "Bottom-right", fwhm: tilt.m4 }
   ];

   let physWidthMm = w * pixelPitchUm / 1000;
   let physHeightMm = h * pixelPitchUm / 1000;
   // Distance from image center to quadrant center is the same for all 4
   // quadrants (symmetry around the center).
   let distMm = Math.sqrt((physWidthMm / 4) * (physWidthMm / 4) + (physHeightMm / 4) * (physHeightMm / 4));

   Console.noteln(format("--- Tilt angle estimate (f/%.2f, %.2f µm/px, reference: sensor center, FWHM=%.2f px) ---",
      fRatio, pixelPitchUm, centerFwhm));

   for (let i = 0; i < quadrants.length; ++i) {
      let q = quadrants[i];
      if (q.fwhm <= centerFwhm) {
         Console.noteln(format("%s: no excess relative to sensor center (FWHM %.2f <= %.2f px).",
            q.name, q.fwhm, centerFwhm));
         continue;
      }

      let excessPx = Math.sqrt(q.fwhm * q.fwhm - centerFwhm * centerFwhm);
      let excessUm = excessPx * pixelPitchUm;
      let defocusUm = fRatio * excessUm;

      let angleDeg = (distMm > 0) ? Math.atan((defocusUm / 1000) / distMm) * 180 / Math.PI : 0;

      Console.noteln(format("%s: FWHM=%.2f px, excess=%.2f px (%.1f µm), defocus≈%.1f µm, " +
         "distance=%.2f mm -> tilt angle≈%.3f°", q.name, q.fwhm, excessPx, excessUm, defocusUm, distMm, angleDeg));
   }
   Console.noteln("--- end (rough estimate - single frame, no calibration) ---");
}

// -----------------------------------------------------------------------
// Computes a SIGNED Δz estimate in µm from a quadrant's excess blur
// relative to the sensor center (same chain as computeAndLogTiltAngles:
// excess blur -> circle-of-confusion approximation Δz = f-number * blur;
// but here not clamped to 0, instead given the sign of fwhm-centerFwhm).
// The sign itself is physically NOT reliable - nearer/farther from the
// corrector cannot be determined from a single exposure (see the note at
// build3DTiltPlot). However, for the DIRECTION of a plane fitted to the 4
// quadrants (the tilt axis), only the relative magnitude between the
// quadrants matters: a uniform sign flip would not change the computed
// axis, only swap "up"/"down".
function signedDefocusUm(fwhm, centerFwhm, fRatio, pixelPitchUm) {
   let diff = fwhm * fwhm - centerFwhm * centerFwhm;
   let sign = (diff < 0) ? -1 : 1;
   return sign * fRatio * Math.sqrt(Math.abs(diff)) * pixelPitchUm;
}

// -----------------------------------------------------------------------
// Pseudo-3D comparison plot: a perfect (flat) sensor plane vs. the tilted
// plane computed from the quadrant Δz values. PJSR has no real 3D graphics
// library (unlike e.g. matplotlib in Siril's Distortion3D.py) - this is a
// classic isometric projection (2D lines that look like 3D), not a
// rotatable true 3D view.
//
// Instead of the two geometric corner-to-corner diagonals (which have
// nothing to do with the actual tilt direction), the tilt axis is drawn:
// the plane z = gradX*x + gradY*y fitted to the 4 (signed) quadrant Δz
// values is extended along its direction of steepest ascent/descent
// through the sensor center out to the image edge - this is the line that
// actually matters when adjusting two opposing tilt screws. The
// corresponding tilt angle is labeled at both ends, as well as at each of
// the 4 corners.
//
// IMPORTANT (physical limitation): Δz comes from the circle-of-confusion
// size (Δz = f-number * excess blur) and is therefore only a MAGNITUDE.
// Whether a quadrant is CLOSER to or FARTHER from the corrector than the
// sensor center (reference) cannot be determined from a single exposure
// without a focus sweep (multiple exposures at slightly shifted focus).
// Rather than hiding this indeterminacy behind a uniform "upward" choice,
// TWO mirror-image, equally plausible tilt planes are therefore drawn (in
// 2 colors): variant 1 with the sign computed from the quadrants, variant
// 2 exactly mirrored (all heights negated). Since the fitted plane passes
// linearly through the sensor center and TR/BL as well as TL/BR are
// exactly opposite positions, planeZ(BL)=-planeZ(TR) and
// planeZ(BR)=-planeZ(TL) hold automatically - e.g. if TR is positive, BL
// is correspondingly negative. The tilt axis is independent of this
// mirroring (it passes through the same sensor center at z=0 for both
// variants) and is drawn with its actual slope, including negative values.
function build3DTiltPlot(tilt, sensorWpx, sensorHpx, pixelPitchUm, focalLengthMm, apertureMm) {
   let fRatio = focalLengthMm / apertureMm;

   let quadrants = [
      { name: "TL", fwhm: tilt.m1, ux: -1, uy: -1 },
      { name: "TR", fwhm: tilt.m2, ux:  1, uy: -1 },
      { name: "BL", fwhm: tilt.m3, ux: -1, uy:  1 },
      { name: "BR", fwhm: tilt.m4, ux:  1, uy:  1 }
   ];

   // The reference (Δz=0) is the sensor center (tilt.mInner) rather than
   // one of the 4 corner quadrants, see the comment at computeAndLogTiltAngles().
   let centerFwhm = tilt.mInner;

   let physWidthMm = sensorWpx * pixelPitchUm / 1000;
   let physHeightMm = sensorHpx * pixelPitchUm / 1000;
   // Distance from image center to quadrant center, for the corner tilt
   // angles (as in computeAndLogTiltAngles(), called "distMm" there).
   let cornerDistMm = Math.sqrt((physWidthMm / 4) * (physWidthMm / 4) + (physHeightMm / 4) * (physHeightMm / 4));

   for (let i = 0; i < quadrants.length; ++i) {
      let q = quadrants[i];
      q.signedDzUm = signedDefocusUm(q.fwhm, centerFwhm, fRatio, pixelPitchUm);
      q.xMm = q.ux * physWidthMm / 4;
      q.yMm = q.uy * physHeightMm / 4;
   }

   // --- Tilt axis/plane: the plane z = gradX*x + gradY*y fitted to the 4
   // signed Δz values through the sensor center (z(0,0)=0). The 4 quadrant
   // centers lie symmetrically at (±px,±py) - the x and y components are
   // therefore orthogonal, and the least-squares fit reduces to the scaled
   // difference of the right/left resp. bottom/top means (derivation:
   // sum(x_i*z_i)/sum(x_i²) etc.).
   let px = physWidthMm / 4, py = physHeightMm / 4;
   let gradX = (px > 0) // TR+BR - (TL+BL), µm per mm in the x direction
      ? ((quadrants[1].signedDzUm + quadrants[3].signedDzUm) - (quadrants[0].signedDzUm + quadrants[2].signedDzUm)) / (4 * px)
      : 0;
   let gradY = (py > 0) // BL+BR - (TL+TR), µm per mm in the y direction
      ? ((quadrants[2].signedDzUm + quadrants[3].signedDzUm) - (quadrants[0].signedDzUm + quadrants[1].signedDzUm)) / (4 * py)
      : 0;
   let gradMagUmPerMm = Math.sqrt(gradX * gradX + gradY * gradY);
   let axisAngleDeg = Math.atan(gradMagUmPerMm / 1000) * 180 / Math.PI;
   // Direction of the axis as an undirected line (0°..180°, relative to
   // the horizontal image axis) - a line has no arrowhead/sign.
   let axisDirectionDeg = (gradMagUmPerMm > 1e-9)
      ? (((Math.atan2(gradY, gradX) * 180 / Math.PI) % 180) + 180) % 180
      : 0;

   // Corner heights of the fitted plane at the 4 quadrant centers - these
   // (not the raw, independently measured individual values) are drawn as
   // the "tilted rectangle", because only a plane automatically satisfies
   // the required diagonal symmetry: TR/BL and TL/BR sit at exactly
   // opposite (negated) positions, so for any linear plane through the
   // origin planeZ(BL)=-planeZ(TR) and planeZ(BR)=-planeZ(TL) always hold
   // - if TR is positive, BL is automatically negative.
   let maxDz = 0;
   for (let i = 0; i < quadrants.length; ++i) {
      let q = quadrants[i];
      q.planeZUm = gradX * q.xMm + gradY * q.yMm;
      q.angleDeg = (cornerDistMm > 0) ? Math.atan((Math.abs(q.planeZUm) / 1000) / cornerDistMm) * 180 / Math.PI : 0;
      maxDz = Math.max(maxDz, Math.abs(q.planeZUm));
   }

   // Axis through the sensor center at z=0 - by construction the fitted
   // plane always passes exactly through (0,0,0), regardless of the
   // (in any case unknown) sign variant.
   let axisP1 = { xMm: 0, yMm: 0, zUm: 0 };
   let axisP2 = { xMm: 0, yMm: 0, zUm: 0 };
   if (gradMagUmPerMm > 1e-9) {
      let dirX = gradX / gradMagUmPerMm, dirY = gradY / gradMagUmPerMm;
      let halfW = physWidthMm / 2, halfH = physHeightMm / 2;
      let tX = (Math.abs(dirX) > 1e-9) ? halfW / Math.abs(dirX) : Infinity;
      let tY = (Math.abs(dirY) > 1e-9) ? halfH / Math.abs(dirY) : Infinity;
      let t = Math.min(tX, tY);
      axisP1 = { xMm: t * dirX, yMm: t * dirY, zUm: t * gradMagUmPerMm };
      axisP2 = { xMm: -t * dirX, yMm: -t * dirY, zUm: -t * gradMagUmPerMm };
   }
   maxDz = Math.max(maxDz, Math.abs(axisP1.zUm), Math.abs(axisP2.zUm));
   if (maxDz <= 0)
      maxDz = 1; // avoid division by 0 if everything is identical

   // --- Prepare canvas & isometric projection ---
   let cw = 1000, ch = 750;
   let textMargin = 12;
   let backgroundColor = 0xFF1A1A1A; // near black: canvas background
   let bmp = new Bitmap(cw, ch);
   bmp.fill(backgroundColor);
   let g = new Graphics(bmp);
   g.antialiasing = true;

   let originX = cw / 2;
   let originY = ch * 0.58;
   let scale = (cw * 0.32) / (physWidthMm / 2); // mm -> px
   let cos30 = Math.cos(30 * Math.PI / 180);
   let sin30 = Math.sin(30 * Math.PI / 180);
   // Height exaggerated to ~22% of the smaller sensor extent on screen,
   // otherwise the µm height difference would be invisible next to the mm distances.
   let zExagPxPerUm = (Math.min(physWidthMm, physHeightMm) * scale * 0.22) / maxDz;

   function project(xMm, yMm, zUm) {
      return {
         x: originX + (xMm - yMm) * cos30 * scale,
         y: originY + (xMm + yMm) * sin30 * scale - zUm * zExagPxPerUm
      };
   }

   // Prevents labels from being cut off at the left/right canvas edge:
   // shifts the text inward as needed, instead of drawing it at a fixed
   // position (which can overshoot the edge for corners near the image
   // border).
   function drawTextClamped(x, y, text) {
      let textW = g.font.width(text);
      let clampedX = Math.max(textMargin, Math.min(x, cw - textMargin - textW));
      g.drawText(clampedX, y, text);
   }

   // Wraps text at word boundaries so each line fits within maxWidth
   // (current g.font) - complements drawTextClamped() (which only shifts,
   // but does not wrap) for legend texts whose length varies depending on
   // the numeric values/word choice and would otherwise be cut off at the edge.
   function wrapText(text, maxWidth) {
      let words = text.split(" ");
      let lines = [];
      let current = "";
      for (let i = 0; i < words.length; ++i) {
         let candidate = current.length ? (current + " " + words[i]) : words[i];
         if (current.length && g.font.width(candidate) > maxWidth) {
            lines.push(current);
            current = words[i];
         } else {
            current = candidate;
         }
      }
      if (current.length)
         lines.push(current);
      return lines;
   }

   // Draws text over multiple lines if needed (wrapped to the canvas
   // width) and returns the y position for the next line/text block.
   function drawTextBlock(x, y, text, lineHeight) {
      let lines = wrapText(text, cw - 2 * textMargin);
      for (let i = 0; i < lines.length; ++i)
         drawTextClamped(x, y + i * lineHeight, lines[i]);
      return y + lines.length * lineHeight;
   }

   let order = [0, 1, 3, 2]; // TL,TR,BR,BL - correct winding order of the rectangle

   // --- Colors (one definition per line) ---
   let flatColor = 0xFF808080;      // gray: flat reference plane
   let tiltColorA = 0xFFFFCCB2;     // salmon: variant 1 (computed sign)
   let tiltColorB = 0xFF9CFFA0;     // light green: variant 2 (mirrored)
   let axisColor = 0xFF66E0FF;      // light blue: tilt axis
   let connectorColor = 0xFF555555; // dark gray: connector lines flat -> tilted
   let legendColor = 0xFFCCCCCC;    // light gray: legend/note text

   // --- Flat reference plane (perfect, untilted sensor) ---
   let flatCorners = quadrants.map(function(q) { return project(q.xMm, q.yMm, 0); });
   g.pen = new Pen(flatColor, 1);
   for (let i = 0; i < 4; ++i) {
      let p1 = flatCorners[order[i]], p2 = flatCorners[order[(i + 1) % 4]];
      g.drawLine(p1.x, p1.y, p2.x, p2.y);
   }
   let flatCenter = project(0, 0, 0);
   g.drawEllipse(flatCenter.x - 3, flatCenter.y - 3, flatCenter.x + 3, flatCenter.y + 3);

   // --- Computed tilt plane: 2 mirror-image, equally plausible sign
   // variants (see the note at the start of the function) in 2 colors ---
   let tiltCornersA = quadrants.map(function(q) { return project(q.xMm, q.yMm, q.planeZUm); });
   let tiltCornersB = quadrants.map(function(q) { return project(q.xMm, q.yMm, -q.planeZUm); });
   g.pen = new Pen(tiltColorA, 3);
   for (let i = 0; i < 4; ++i) {
      let p1 = tiltCornersA[order[i]], p2 = tiltCornersA[order[(i + 1) % 4]];
      g.drawLine(p1.x, p1.y, p2.x, p2.y);
   }
   g.pen = new Pen(tiltColorB, 3);
   for (let i = 0; i < 4; ++i) {
      let p1 = tiltCornersB[order[i]], p2 = tiltCornersB[order[(i + 1) % 4]];
      g.drawLine(p1.x, p1.y, p2.x, p2.y);
   }

   // --- Tilt axis (instead of the two corner-to-corner diagonals) ---
   let axisPt1 = project(axisP1.xMm, axisP1.yMm, axisP1.zUm);
   let axisPt2 = project(axisP2.xMm, axisP2.yMm, axisP2.zUm);
   g.pen = new Pen(axisColor, 3);
   g.drawLine(axisPt1.x, axisPt1.y, axisPt2.x, axisPt2.y);

   // --- Connector lines (show the height difference) + corner labels ---
   let fontSize = 16;
   g.font = new Font("Helvetica", fontSize);
   for (let i = 0; i < 4; ++i) {
      let q = quadrants[i];
      let flat = flatCorners[i];
      let tpA = tiltCornersA[i];
      let tpB = tiltCornersB[i];

      g.pen = new Pen(connectorColor, 1);
      g.drawLine(flat.x, flat.y, tpA.x, tpA.y);
      g.drawLine(flat.x, flat.y, tpB.x, tpB.y);

      g.pen = new Pen(tiltColorA, 2);
      g.drawEllipse(tpA.x - 4, tpA.y - 4, tpA.x + 4, tpA.y + 4);
      g.pen = new Pen(tiltColorB, 2);
      g.drawEllipse(tpB.x - 4, tpB.y - 4, tpB.x + 4, tpB.y + 4);

      // One label per corner is enough (magnitude/angle are identical for
      // both variants, just mirrored) - placed at variant 1. "±" instead
      // of a fixed sign, because both signs are actually drawn at this
      // corner (variant 1 + variant 2), and a single "+"/"-" would falsely
      // suggest the sign is known (see the note at the start of the function).
      // Right-hand corner quadrants (ux>0) sit close to the right image
      // edge - place their label to the left instead of to the right
      // (in addition to the general clamp safeguard below).
      let label = format("%s: ±%.1f µm (%.3f°)", q.name, Math.abs(q.planeZUm), q.angleDeg);
      let labelX = (q.ux > 0) ? (tpA.x - 8 - g.font.width(label)) : (tpA.x + 8);
      drawTextClamped(labelX, tpA.y - 8, label);
   }

   // No label directly at the axis in the plot itself: depending on the
   // tilt direction, axisPt1 can end up arbitrarily close to a corner
   // label (where the text would overlap it and become unreadable) - the
   // tilt angle/direction is instead shown below as its own,
   // collision-free legend line in the axis color.

   // --- Legend / note text (multi-line, wrapped to the canvas width
   // instead of a fixed line count/length, so nothing gets cut off) ---
   let legendY = 30;
   g.pen = new Pen(legendColor, 1);
   g.font = new Font("Helvetica", 18);
   legendY = drawTextBlock(20, legendY, "Gray = flat sensor plane", 24);
   legendY = drawTextBlock(20, legendY, "Salmon/green = 2 mirror-image tilt variants", 24);
   legendY = drawTextBlock(20, legendY, "Light blue = tilt axis", 24) + 6;
   g.font = new Font("Helvetica", 15);
   legendY = drawTextBlock(20, legendY, format(
      "f/%.2f, %.2f µm/px, reference: sensor center (FWHM=%.2f px, assumed in focus)",
      fRatio, pixelPitchUm, centerFwhm), 20);
   g.pen = new Pen(axisColor, 1);
   legendY = drawTextBlock(20, legendY, format(
      "Tilt axis: %.3f° (direction %.0f° from the horizontal image axis)",
      axisAngleDeg, axisDirectionDeg), 20) + 4;
   g.pen = new Pen(legendColor, 1);
   drawTextBlock(20, legendY,
      "Note: Δz follows only from the blur (a magnitude) - whether a quadrant is closer to or farther " +
      "from the corrector is unknown without a focus sweep; both sign variants are equally plausible.",
      20);

   g.end();

   let newId = uniqueViewId("Aberration3D");
   let window = new ImageWindow(cw, ch, 3, 8, false, true, newId);
   window.mainView.beginProcess(UndoFlag.NoSwapFile);
   window.mainView.image.blend(bmp);
   window.mainView.endProcess();
   window.show();

   return window;
}

// -----------------------------------------------------------------------
// Streamlines: smoothed large-scale trend of the PSF orientation, in
// addition to the (noisy) per-star vectors.
//
// IMPORTANT: theta is only defined mod 180° (an ellipse at theta and
// theta+180° is identical) - this is a "director field", not a vector
// field with a well-defined sign. Naive angle averaging would, e.g. for
// 10° and 170° (almost identical orientation), incorrectly yield ~90°.
// Standard trick (double-angle representation, as used with structure
// tensors/directional statistics): double the angle, average in Cartesian
// coordinates, then halve again - correctly maps the 180° ambiguity onto
// a 360° quantity.

// Smooths the orientation field at point (x,y): weighted double-angle
// mean of all stars within the radius (Gaussian kernel, weight
// additionally scaled by eccentricity^2 - nearly round stars have a
// barely defined orientation and should barely influence the field).
// Returns null if there are no (meaningful) stars within the radius.
function orientationFieldAt(stars, x, y, radius) {
   let sumCos = 0, sumSin = 0, sumW = 0;
   let r2 = radius * radius;
   let sigma2 = 2 * (radius * 0.5) * (radius * 0.5);

   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      let dx = s.x - x, dy = s.y - y;
      let d2 = dx * dx + dy * dy;
      if (d2 > r2)
         continue;

      let kernel = Math.exp(-d2 / sigma2);
      let w = kernel * s.eccentricity * s.eccentricity;
      if (w <= 0)
         continue;

      let theta2 = 2 * s.rotation * Math.PI / 180;
      sumCos += w * Math.cos(theta2);
      sumSin += w * Math.sin(theta2);
      sumW += w;
   }

   if (sumW < 1e-6)
      return null;

   // DynamicPSF's theta is measured counter-clockwise on screen, while image
   // coordinates have y pointing down: the PSF's major axis therefore points
   // in the direction (cos(-theta), sin(-theta)) in image coordinates
   // (verified against second-moment measurements of the actual stars).
   return { angle: -Math.atan2(sumSin, sumCos) / 2 };
}

// Traces a single streamline starting at (x0,y0) in a direction
// (initialDx, initialDy). At each step, whichever of the two possible
// directions (theta, theta+180°) is closer to the previous step direction
// is chosen - otherwise the line could arbitrarily "flip" at every step
// due to the 180° ambiguity.
function traceStreamline(stars, x0, y0, initialDx, initialDy, radius, stepLen, maxSteps, w, h) {
   let points = [];
   let x = x0, y = y0;
   let prevDx = initialDx, prevDy = initialDy;

   for (let step = 0; step < maxSteps; ++step) {
      let field = orientationFieldAt(stars, x, y, radius);
      if (field === null)
         break;

      let dx = Math.cos(field.angle), dy = Math.sin(field.angle);
      if ((dx * prevDx + dy * prevDy) < 0) {
         dx = -dx; dy = -dy;
      }

      x += dx * stepLen;
      y += dy * stepLen;
      if (x < 0 || x > w || y < 0 || y > h)
         break;

      points.push([x, y]);
      prevDx = dx; prevDy = dy;
   }

   return points;
}

// Debug helper: checks that the streamlines (orientationFieldAt()) and the
// ellipses (drawOrientedEllipse()) interpret the PSF angle theta identically.
// Step 1 draws a test ellipse (theta=130.8°) on a small bitmap with the very
// routine used for the star ellipses and measures its major-axis direction
// from the second moments of the drawn pixels (atan2(dy,dx), y down). Step 2
// logs, for the most eccentric stars, theta and the streamline field
// direction, plus an eccentricity-weighted agreement over all stars
// (cos 2Δ: +1 = parallel, -1 = orthogonal).
function diagnoseOrientationConvention(stars, radius) {
   let size = 201, c = 100, testDeg = 130.8;
   let tb = new Bitmap(size, size);
   tb.fill(0xFF000000);
   let tg = new Graphics(tb);
   tg.antialiasing = false;
   tg.pen = new Pen(0xFFFFFFFF, 2);
   drawOrientedEllipse(tg, c, c, 80, 30, testDeg);
   tg.end();

   let sxx = 0, syy = 0, sxy = 0, sn = 0;
   for (let y = 0; y < size; ++y)
      for (let x = 0; x < size; ++x)
         if ((tb.pixel(x, y) & 0xFF) > 128) {
            let dx = x - c, dy = y - c;
            sxx += dx * dx; syy += dy * dy; sxy += dx * dy; ++sn;
         }
   if (sn === 0) {
      Console.warningln("Orientation diagnostic: test ellipse not found in test bitmap.");
      return;
   }
   let measuredDeg = 0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI;
   let fold = function(a) { return ((a % 180) + 180) % 180; };
   Console.noteln("--- Orientation diagnostic ---");
   Console.writeln(format("test ellipse drawn with theta=%.1f°: measured major-axis direction = %.1f° (mod 180; must equal theta)",
      testDeg, fold(measuredDeg)));

   let sumPar = 0, sumW = 0;
   let rows = [];
   for (let i = 0; i < stars.length; ++i) {
      let st = stars[i];
      let field = orientationFieldAt(stars, st.x, st.y, radius);
      if (field === null)
         continue;
      let fDeg = field.angle * 180 / Math.PI;
      let w = st.eccentricity * st.eccentricity;
      sumPar += w * Math.cos(2 * (fDeg + st.rotation) * Math.PI / 180);
      sumW += w;
      rows.push({ st: st, fDeg: fDeg });
   }
   rows.sort(function(a, b) { return b.st.eccentricity - a.st.eccentricity; });
   for (let i = 0; i < Math.min(10, rows.length); ++i) {
      let r = rows[i];
      Console.writeln(format("star (%.0f,%.0f) ecc=%.2f image angle (-theta)=%.1f° | streamline field %.1f° | diff (mod 180) = %.1f°",
         r.st.x, r.st.y, r.st.eccentricity, fold(-r.st.rotation), fold(r.fDeg), fold(r.fDeg + r.st.rotation)));
   }
   if (sumW > 0)
      Console.writeln(format("weighted agreement streamline field vs. star ellipse: %.3f (+1 = parallel, -1 = orthogonal, 0 = unrelated)", sumPar / sumW));
}

// Seeds streamlines on a regular grid and traces them in both directions
// from each seed point. Returns an array of point lists (one per line,
// [[x,y], [x,y], ...]).
function generateStreamlines(stars, w, h, radius) {
   let spacing = radius * 0.6; // half the previous seed spacing (was radius * 1.2), for a denser grid
   let stepLen = radius * 0.25;
   let maxSteps = 200;

   let lines = [];
   for (let sy = spacing / 2; sy < h; sy += spacing) {
      for (let sx = spacing / 2; sx < w; sx += spacing) {
         let field0 = orientationFieldAt(stars, sx, sy, radius);
         if (field0 === null)
            continue;

         let dx0 = Math.cos(field0.angle), dy0 = Math.sin(field0.angle);
         let fwd = traceStreamline(stars, sx, sy, dx0, dy0, radius, stepLen, maxSteps, w, h);
         let bwd = traceStreamline(stars, sx, sy, -dx0, -dy0, radius, stepLen, maxSteps, w, h);

         let full = bwd.slice().reverse().concat([[sx, sy]]).concat(fwd);
         if (full.length > 2)
            lines.push(full);
      }
   }
   return lines;
}

// Draws an ellipse centered at (cx,cy) whose major semi-axis a points in the
// direction (cos thetaDeg, sin thetaDeg) in image coordinates (y pointing
// down) - the same convention the streamlines use. The caller passes the
// image-coordinate angle (-theta of the PSF). Built from line segments with explicit math instead of
// Graphics.rotateTransformation(), whose sense of rotation/handling of
// negative angles turned out not to be reliable for this purpose.
function drawOrientedEllipse(g, cx, cy, a, b, thetaDeg) {
   const N = 48;
   let t = thetaDeg * Math.PI / 180;
   let ct = Math.cos(t), st = Math.sin(t);
   let px = 0, py = 0;
   for (let i = 0; i <= N; ++i) {
      let phi = 2 * Math.PI * i / N;
      let u = a * Math.cos(phi), v = b * Math.sin(phi);
      let x = cx + u * ct - v * st;
      let y = cy + u * st + v * ct;
      if (i > 0)
         g.drawLine(px, py, x, y);
      px = x; py = y;
   }
}

// Draws the streamlines as continuous, semi-transparent curves -
// deliberately subtle (thin, bright, partially transparent) so they show
// the rough trend in the background without obscuring the per-star
// vectors/the tilt overlay in front of them.
function drawStreamlines(g, lines) {
   g.antialiasing = true;

   // Draw a dark halo first, then a bright core on top - plain
   // semi-transparent white (earlier version) got lost on bright/
   // saturated backgrounds (e.g. the orientation heatmap). With the halo,
   // the lines stay readable regardless of the background.
   g.pen = new Pen(0xA0000000, 4);
   for (let i = 0; i < lines.length; ++i) {
      let pts = lines[i];
      for (let j = 1; j < pts.length; ++j)
         g.drawLine(pts[j - 1][0], pts[j - 1][1], pts[j][0], pts[j][1]);
   }

   g.pen = new Pen(0xFFFFFFFF, 2);
   for (let i = 0; i < lines.length; ++i) {
      let pts = lines[i];
      for (let j = 1; j < pts.length; ++j)
         g.drawLine(pts[j - 1][0], pts[j - 1][1], pts[j][0], pts[j][1]);
   }
}

// -----------------------------------------------------------------------
function uniqueViewId(base) {
   let id = base;
   let n = 1;
   while (View.viewById(id) !== null) {
      id = base + "_" + n;
      ++n;
   }
   return id;
}

// -----------------------------------------------------------------------
// Creates an independent copy of a view (its own window, its own pixel
// data) with the same geometry/bit depth as the original.
function duplicateView(view, newId) {
   // Color images need at least 3 channels (otherwise the ImageWindow
   // constructor throws "Invalid number of channels").
   let numberOfChannels = view.image.isColor ? 3 : 1;
   let w = new ImageWindow(1, 1, numberOfChannels, view.window.bitsPerSample, view.window.isFloatSample,
      view.image.isColor, newId);
   w.mainView.beginProcess(UndoFlag.NoSwapFile);
   w.mainView.image.assign(view.image);
   w.mainView.endProcess();

   // Copy FITS keywords from the original (among others the CFA/Bayer
   // pattern metadata that Debayer("Auto") needs for pattern recognition)
   // - .assign() only copies pixel data, not window metadata.
   try {
      w.keywords = view.window.keywords;
   } catch (e) {
      Console.warningln("Could not transfer FITS keywords to the copy: " + e.message);
   }

   return w;
}

// -----------------------------------------------------------------------
// A view stretched for display, as a bitmap of its full size - the dialog
// preview of the target image and the background of the vector map, as in
// AperturePhotometry. Image.render() applies no screen stretch, so a linear
// image would render as a black rectangle: the view's display function is
// applied to a copy of the image, or the core's automatic stretch when the
// view carries none. The view itself is not changed.
function renderStretchedBitmap(view) {
   let image = new Image;
   image.assign(view.image);

   let stf = view.stf;
   let isIdentity = true;
   if (stf)
      for (let c = 0; c < stf.length && isIdentity; ++c)
         if (stf[c][0] !== 0.5 || stf[c][1] !== 0 || stf[c][2] !== 1)
            isIdentity = false;
   if (isIdentity)
      stf = image.computeAutoStretch();
   image.applyDisplayFunction(stf);

   let bmp = image.render();
   image.free();
   return bmp;
}

// -----------------------------------------------------------------------
// Builds the list of [i,j] exponent pairs for a 2D polynomial of degree
// `deg`: terms x^i*y^j for every i+j <= deg, ordered by total degree then
// by i. deg=1 gives the 3 terms of a plane ([0,0],[1,0],[0,1]); deg=2 adds
// the 3 quadratic terms (6 total); etc.
function polyExponents(deg) {
   let exps = [];
   for (let total = 0; total <= deg; ++total)
      for (let i = 0; i <= total; ++i)
         exps.push([i, total - i]);
   return exps;
}

// Solves the n x n system M*x = v via Gaussian elimination with partial
// pivoting. Returns the solution array, or null if M is (numerically) singular.
function solveLinearSystem(M, v) {
   let n = v.length;
   let A = M.map((row, i) => row.concat([v[i]]));
   for (let col = 0; col < n; ++col) {
      let maxRow = col, maxVal = Math.abs(A[col][col]);
      for (let r = col + 1; r < n; ++r) {
         if (Math.abs(A[r][col]) > maxVal) { maxVal = Math.abs(A[r][col]); maxRow = r; }
      }
      if (maxVal < 1e-12)
         return null;
      if (maxRow !== col) { let tmp = A[col]; A[col] = A[maxRow]; A[maxRow] = tmp; }
      for (let r = col + 1; r < n; ++r) {
         let factor = A[r][col] / A[col][col];
         for (let c = col; c <= n; ++c)
            A[r][c] -= factor * A[col][c];
      }
   }
   let x = new Array(n).fill(0);
   for (let r = n - 1; r >= 0; --r) {
      let sum = A[r][n];
      for (let c = r + 1; c < n; ++c)
         sum -= A[r][c] * x[c];
      x[r] = sum / A[r][r];
   }
   return x;
}

// Fits z ≈ Σ coeff_k * x^i_k * y^j_k (terms given by `exps`, see
// polyExponents()) over the (mask-active) points via least squares (normal
// equations, solved with solveLinearSystem()) - generalizes the earlier
// plane-only fit for the orientation heatmap, see
// computeOrientationHeatmapBitmap(). Returns the coefficient array in the
// same order as `exps`, or null for a singular/underdetermined system
// (e.g. too few active points for the chosen degree).
function fitPoly2DLS(xs, ys, zs, mask, exps) {
   let nTerms = exps.length;
   let M = [];
   for (let r = 0; r < nTerms; ++r)
      M.push(new Array(nTerms).fill(0));
   let v = new Array(nTerms).fill(0);

   let activeCount = 0;
   for (let p = 0; p < xs.length; ++p) {
      if (mask && !mask[p])
         continue;
      ++activeCount;
      let x = xs[p], y = ys[p], z = zs[p];
      let basis = new Array(nTerms);
      for (let k = 0; k < nTerms; ++k)
         basis[k] = Math.pow(x, exps[k][0]) * Math.pow(y, exps[k][1]);
      for (let r = 0; r < nTerms; ++r) {
         v[r] += basis[r] * z;
         for (let c = 0; c < nTerms; ++c)
            M[r][c] += basis[r] * basis[c];
      }
   }
   if (activeCount < nTerms)
      return null;

   return solveLinearSystem(M, v);
}

// Evaluates the polynomial with coefficients `coeffs` (matching `exps`,
// see polyExponents()) at (x,y).
function evalPoly2D(coeffs, exps, x, y) {
   let z = 0;
   for (let k = 0; k < exps.length; ++k)
      z += coeffs[k] * Math.pow(x, exps[k][0]) * Math.pow(y, exps[k][1]);
   return z;
}

// -----------------------------------------------------------------------
// Converts a hue value [0..1) (saturation/value = 1) to [r,g,b] with
// values in [0..1] each - the standard HSV color wheel, as used by the
// Seti Astro Suite's orientation heatmap (matplotlib colormap "hsv").
function hsvToRgb(h) {
   let i = Math.floor(h * 6) % 6;
   let f = h * 6 - Math.floor(h * 6);
   let q = 1 - f;
   switch (i) {
      case 0: return [1, f, 0];
      case 1: return [q, 1, 0];
      case 2: return [0, 1, f];
      case 3: return [0, q, 1];
      case 4: return [f, 0, 1];
      default: return [1, 0, q];
   }
}

// -----------------------------------------------------------------------
// Orientation heatmap as in the Seti Astro Suite (github.com/setiastro/
// setiastrosuite, compute_orientation_surface() in setiastrosuiteQT6.py):
// the PSF rotation is only defined mod 180°, so instead of theta itself, a
// double-angle representation (s=sin2θ, c=cos2θ) is fitted per star as a
// least-squares 2D polynomial of degree `degree` over x,y (with iterative
// 3-sigma clipping against outliers). degree=1 (a plane) only shows a
// uniform, monotonic gradient - it cannot represent the local curvature
// that a real coma pattern produces (the streamlines overlay, being a
// local fit, can show such curvature even when the heatmap looks flat);
// degree=2 or higher lets the heatmap follow that curvature too, at the
// cost of being more sensitive to noise/outliers, especially near the
// image edges where fewer stars constrain the higher-order terms.
// The fitted surface is smooth, so a pixel loop over the full image would
// just be needlessly slow - it is therefore evaluated cell-wise (~1/200
// of the long image side per cell), converted back to
// θ_fit = 0.5*atan2(s,c), encoded as the hue of an HSV color wheel
// (S=V=1) - identical to the Seti Astro Suite's "Orientation Map" - and
// the cell is filled via Graphics.fillRect().
// Returns null if there are too few stars for the chosen degree, or a
// singular system of equations prevents a meaningful fit.
function computeOrientationHeatmapBitmap(stars, w, h, degree) {
   let exps = polyExponents(degree);
   if (stars.length < 2 * exps.length)
      return null;

   let scale = Math.max(w, h) / 2;
   let cx = w / 2, cy = h / 2;
   let xs = [], ys = [], sArr = [], cArr = [];
   for (let i = 0; i < stars.length; ++i) {
      let st = stars[i];
      let theta = st.rotation * Math.PI / 180;
      xs.push((st.x - cx) / scale);
      ys.push((st.y - cy) / scale);
      sArr.push(Math.sin(2 * theta));
      cArr.push(Math.cos(2 * theta));
   }

   const SIGMA_CLIP = 3.0, MAX_ITER = 3;
   let mask = null, solS = null, solC = null;
   for (let iter = 0; iter < MAX_ITER; ++iter) {
      solS = fitPoly2DLS(xs, ys, sArr, mask, exps);
      solC = fitPoly2DLS(xs, ys, cArr, mask, exps);
      if (solS === null || solC === null)
         return null;

      let resid = [];
      for (let i = 0; i < xs.length; ++i) {
         let fitS = evalPoly2D(solS, exps, xs[i], ys[i]);
         let fitC = evalPoly2D(solC, exps, xs[i], ys[i]);
         resid.push(Math.hypot(sArr[i] - fitS, cArr[i] - fitC));
      }
      let active = mask ? resid.filter((_, i) => mask[i]) : resid;
      let meanR = active.reduce((a, b) => a + b, 0) / active.length;
      let variance = active.reduce((a, b) => a + (b - meanR) * (b - meanR), 0) / active.length;
      let std = Math.sqrt(variance);

      let newMask = resid.map(r => std === 0 || r < SIGMA_CLIP * std);
      let activeCount = newMask.filter(Boolean).length;
      let prevCount = mask ? mask.filter(Boolean).length : xs.length;
      if (activeCount === prevCount || activeCount < 2 * exps.length)
         break;
      mask = newMask;
   }

   // Draw directly in cell blocks onto a full-size bitmap (instead of
   // computing a coarse grid and upscaling it) - bitmap scaling (e.g.
   // scaledToSize) is not reliably available in PJSR, whereas
   // Graphics.fillRect()/Brush are standard PCL bindings. A cell size of
   // ~1/200 of the long image side gives an optically smooth color field
   // at image widths of several thousand pixels, for the fitted surface
   // that is smooth anyway.
   let cellSize = Math.max(4, Math.round(Math.max(w, h) / 200));
   let bmp = new Bitmap(w, h);
   let g = new Graphics(bmp);
   for (let py = 0; py < h; py += cellSize) {
      let py1 = Math.min(h, py + cellSize);
      let yn = ((py + py1) / 2 - cy) / scale;
      for (let px = 0; px < w; px += cellSize) {
         let px1 = Math.min(w, px + cellSize);
         let xn = ((px + px1) / 2 - cx) / scale;
         let fitS = evalPoly2D(solS, exps, xn, yn);
         let fitC = evalPoly2D(solC, exps, xn, yn);
         let thetaFit = 0.5 * Math.atan2(fitS, fitC);
         let hue = (thetaFit + Math.PI / 2) / Math.PI;
         hue = hue - Math.floor(hue);
         let rgb = hsvToRgb(hue);
         let color = 0xFF000000 |
            (Math.round(rgb[0] * 255) << 16) |
            (Math.round(rgb[1] * 255) << 8) |
            Math.round(rgb[2] * 255);
         g.fillRect(px, py, px1, py1, new Brush(color));
      }
   }
   g.end();

   return bmp;
}

// -----------------------------------------------------------------------
// Searches the (including non-enumerable, static as well as prototype)
// properties of a PCL process class for a numeric constant whose name
// contains one of the given search patterns (case-insensitive). More
// robust than an exact name comparison, since the exact spelling of
// the symbolic constants of process classes can differ between
// PixInsight versions/builds.
function findPclConstant(cls, patterns) {
   let sources = [cls, cls.prototype];
   for (let s = 0; s < sources.length; ++s) {
      let names = Object.getOwnPropertyNames(sources[s]);
      for (let p = 0; p < patterns.length; ++p) {
         let pat = patterns[p].toLowerCase();
         for (let i = 0; i < names.length; ++i) {
            let value;
            try { value = sources[s][names[i]]; } catch (e) { continue; }
            if (typeof value === "number" && names[i].toLowerCase().indexOf(pat) >= 0)
               return { name: names[i], value: value };
         }
      }
   }
   return null;
}

// Diagnostic helper function: lists all numeric constants of a PCL
// process class to the console (static and via the prototype).
function dumpPclConstants(cls) {
   Console.writeln("--- " + cls.name + " numeric constants ---");
   [cls, cls.prototype].forEach(function(src, idx) {
      let names = Object.getOwnPropertyNames(src);
      for (let i = 0; i < names.length; ++i) {
         let value;
         try { value = src[names[i]]; } catch (e) { continue; }
         if (typeof value === "number")
            Console.writeln("  [" + (idx === 0 ? "static" : "prototype") + "] " + names[i] + " = " + value);
      }
   });
   Console.writeln("--- end ---");
}

// -----------------------------------------------------------------------
// Applies the debayer process (method "SuperPixel") to a copy of the
// target image - the original is left unchanged. SuperPixel groups each
// 2x2 Bayer block directly into one RGB pixel without interpolation
// (halving the resolution on each axis), so unlike VNG/bilinear, no
// PSF-broadening interpolation is introduced - important because this
// script relies on unaltered star profiles (eccentricity/rotation) for
// the tilt/coma diagnostics.
// Returns the new (debayered) view, or null on error.
// bayerPattern: "Auto", "RGGB", "BGGR", "GBRG" or "GRBG". "Auto" requires
// CFA metadata in the image (see duplicateView) - if this is missing
// ("Unable to acquire CFA pattern information"), the pattern must be
// specified explicitly here.
function debayerSuperPixel(view, bayerPattern) {
   let dupId = uniqueViewId(view.id + "_debayered");
   let dupWindow = duplicateView(view, dupId);

   // Remember the set of windows before execution, to be able to detect
   // unwanted side windows afterward (e.g. a grayscale/luminance
   // intermediate window created by Debayer's noise evaluation).
   let idsBefore = ImageWindow.windows.map(function(w) { return w.mainView.id; });

   let P = new Debayer;

   // Disable noise evaluation: not used by this script, only costs time
   // and apparently creates an extra intermediate window.
   try {
      P.evaluateNoise = false;
   } catch (e) {
      Console.warningln("Could not disable P.evaluateNoise: " + e.message);
   }

   let patternName = bayerPattern || "Auto";
   let pattern = findPclConstant(Debayer, [patternName.toLowerCase()]);
   if (pattern === null) {
      Console.criticalln("Bayer pattern constant for '" + patternName + "' not found. " +
         "All available Debayer constants for diagnostics follow:");
      dumpPclConstants(Debayer);
      dupWindow.forceClose();
      return null;
   }
   Console.noteln(format("Bayer pattern: %s = %d", pattern.name, pattern.value));
   P.bayerPattern = pattern.value;

   let method = findPclConstant(Debayer, ["superpixel", "super_pixel", "super pixel"]);
   if (method === null) {
      Console.criticalln("Could not automatically find the 'SuperPixel' debayer method. " +
         "All available Debayer constants for diagnostics follow:");
      dumpPclConstants(Debayer);
      dupWindow.forceClose();
      return null;
   }
   Console.noteln(format("Debayer method detected: %s = %d", method.name, method.value));
   P.debayerMethod = method.value;

   if (!P.executeOn(dupWindow.mainView)) {
      Console.criticalln("Debayer (SuperPixel) could not be applied to " + dupWindow.mainView.id + ".");
      dupWindow.forceClose();
      return null;
   }

   // Close unwanted side windows newly created during debayer execution
   // (e.g. a grayscale/luminance intermediate window from noise
   // evaluation) - everything except the actual debayered result.
   let newWindows = ImageWindow.windows;
   for (let i = 0; i < newWindows.length; ++i) {
      let w = newWindows[i];
      if (w === dupWindow)
         continue;
      if (idsBefore.indexOf(w.mainView.id) < 0) {
         Console.noteln("Closing side window: " + w.mainView.id);
         w.forceClose();
      }
   }

   dupWindow.show();
   Console.noteln("Debayer (SuperPixel) applied -> " + dupWindow.mainView.id +
      " (" + dupWindow.mainView.image.width + " x " + dupWindow.mainView.image.height + ")");

   return dupWindow.mainView;
}

// -----------------------------------------------------------------------
// Extended diagnostics: tracking component, PSF asymmetry (coma), radial/
// tangential decomposition and a FWHM² surface fit that separates tilt
// from field curvature.
//
// Conventions used throughout this block (same as the rest of the script):
// image coordinates with y pointing DOWN, the PSF major axis points in the
// image direction psi = -rotation (see orientationFieldAt()).
//
// Shape measures:
//   eccentricity  e   = sqrt(1 - b²/a²)          (what DynamicPSF/the map use)
//   ellipticity   eps = 1 - b/a                  (more intuitive, used in the ring table)
//   distortion    chi = (a² - b²) / (a² + b²)    (the only one of the three whose
//                                                 components add approximately
//                                                 linearly - used for averaging and
//                                                 for subtracting the tracking component)

function distortionFromEcc(e) {
   return e * e / (2 - e * e);
}

function eccFromDistortion(chi) {
   chi = Math.max(0, Math.min(0.999999, chi));
   return Math.sqrt(2 * chi / (1 + chi));
}

function ellipticityFromEcc(e) {
   return 1 - Math.sqrt(Math.max(0, 1 - e * e));
}

// Image-coordinate angle (radians) of the PSF major axis.
function starImageAngle(s) {
   return -s.rotation * Math.PI / 180;
}

// Solves an ordinary least-squares problem z ≈ rows[i] · coeffs over all
// active points (mask[i] true or mask null) via the normal equations.
function solveLeastSquares(rows, zs, mask) {
   let n = rows[0].length;
   let M = [];
   for (let r = 0; r < n; ++r)
      M.push(new Array(n).fill(0));
   let v = new Array(n).fill(0);
   let count = 0;
   for (let i = 0; i < rows.length; ++i) {
      if (mask && !mask[i])
         continue;
      ++count;
      let b = rows[i];
      for (let r = 0; r < n; ++r) {
         v[r] += b[r] * zs[i];
         for (let c = 0; c < n; ++c)
            M[r][c] += b[r] * b[c];
      }
   }
   if (count < n)
      return null;
   return solveLinearSystem(M, v);
}

// Robust least squares: repeats solveLeastSquares() with 3-sigma (MAD)
// clipping of the residuals. Returns { coeffs, mask } or null.
function solveLeastSquaresClipped(rows, zs, iterations) {
   let mask = null, coeffs = null;
   for (let it = 0; it < iterations; ++it) {
      coeffs = solveLeastSquares(rows, zs, mask);
      if (coeffs === null)
         return null;
      let resid = rows.map(function(b, i) {
         let z = 0;
         for (let k = 0; k < b.length; ++k)
            z += b[k] * coeffs[k];
         return zs[i] - z;
      });
      let sigma = 1.4826 * medianOf(resid.map(Math.abs));
      if (!(sigma > 0))
         break;
      mask = resid.map(function(r) { return Math.abs(r) < 3 * sigma; });
   }
   return { coeffs: coeffs, mask: mask };
}

// -----------------------------------------------------------------------
// (2) Tracking component: the median distortion vector over the whole
// field. Optical aberrations (coma, astigmatism, field curvature) form
// patterns that are (approximately) symmetric around the optical axis and
// therefore average out over the field; a uniform elongation shared by all
// stars comes from tracking/guiding, wind or flexure. Returns the
// component; applyTrackingCorrection() subtracts it from every star.
function computeTrackingComponent(stars) {
   let c1 = [], c2 = [];
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      let chi = distortionFromEcc(s.eccentricity);
      let psi = starImageAngle(s);
      c1.push(chi * Math.cos(2 * psi));
      c2.push(chi * Math.sin(2 * psi));
   }
   let m1 = medianOf(c1), m2 = medianOf(c2);
   let chi = Math.hypot(m1, m2);
   let ecc = eccFromDistortion(chi);
   return {
      chi1: m1,
      chi2: m2,
      chi: chi,
      eccentricity: ecc,
      ellipticity: ellipticityFromEcc(ecc),
      angleDeg: ((0.5 * Math.atan2(m2, m1) * 180 / Math.PI) % 180 + 180) % 180
   };
}

function applyTrackingCorrection(stars, tracking) {
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      let chi = distortionFromEcc(s.eccentricity);
      let psi = starImageAngle(s);
      let c1 = chi * Math.cos(2 * psi) - tracking.chi1;
      let c2 = chi * Math.sin(2 * psi) - tracking.chi2;
      s.eccentricity = eccFromDistortion(Math.hypot(c1, c2));
      s.rotation = -(0.5 * Math.atan2(c2, c1)) * 180 / Math.PI;
      // fwhmX/fwhmY are deliberately left untouched: they feed the FWHM
      // (size) statistics, not the shape.
   }
}

function logTrackingComponent(tracking, subtracted) {
   Console.noteln("--- Tracking / global elongation ---");
   Console.writeln(format("Median elongation over the whole field: ellipticity %.3f (eccentricity %.2f), " +
      "major axis at %.0f° (image coordinates: 0° = +x/right, 90° = +y/down).",
      tracking.ellipticity, tracking.eccentricity, tracking.angleDeg));
   if (tracking.ellipticity < 0.03)
      Console.writeln("-> negligible (< 0.03): tracking/guiding looks clean.");
   else
      Console.writeln("-> a uniform elongation shared by all stars comes from tracking/guiding, wind or " +
         "flexure, not from the optics.");
   Console.writeln(subtracted
      ? "This component has been SUBTRACTED from every star before drawing and analysis."
      : "Not subtracted (option disabled) - it is contained in the vector map and all shape statistics.");
}

// -----------------------------------------------------------------------
// (1) PSF asymmetry per star. Gaussian and Moffat models are point-
// symmetric, so the fit alone cannot tell on which side of the core a
// comatic flare sits. Measured here directly on the pixels, relative to
// the PSF-fit center (cx, cy):
//   asymX/Y  = flux centroid inside the aperture minus fit center (px)
//   m3X/Y    = normalized third moment Σ w·ρ²·ρ / Σ w with ρ = d/σ
//              (dimensionless, independent of star size; weights the
//              outer profile more strongly than the centroid does)
// Both vectors point toward the flare. Stars that are saturated, too
// close to the border or without a positive signal get null values.
function measureStarAsymmetry(image, stars) {
   let w = image.width, h = image.height;
   let nc = image.numberOfChannels;
   let measured = 0;

   let progress = withProgress("Measuring PSF asymmetry", stars.length);
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      s.asymX = s.asymY = s.m3X = s.m3Y = null;

      let fwhm = 0.5 * (s.fwhmX + s.fwhmY);
      let sigma = fwhm / SIGMA_TO_FWHM;
      let rAp = Math.min(25, Math.max(3, 4 * sigma + 1));
      let rIn = rAp + 2, rOut = rAp + 6;
      let x0 = Math.floor(s.x - rOut), x1 = Math.ceil(s.x + rOut);
      let y0 = Math.floor(s.y - rOut), y1 = Math.ceil(s.y + rOut);
      if (x0 < 0 || y0 < 0 || x1 >= w || y1 >= h || !(sigma > 0)) {
         progress.update(i + 1);
         continue;
      }

      let px = [], bgVals = [];
      let peak = 0;
      for (let y = y0; y <= y1; ++y) {
         for (let x = x0; x <= x1; ++x) {
            let v = 0;
            for (let c = 0; c < nc; ++c)
               v += image.sample(x, y, c);
            v /= nc;
            let dx = x - s.x, dy = y - s.y;
            let r = Math.sqrt(dx * dx + dy * dy);
            if (r <= rAp) {
               px.push([dx, dy, v]);
               if (v > peak) peak = v;
            } else if (r >= rIn && r <= rOut) {
               bgVals.push(v);
            }
         }
      }

      if (peak >= 0.95 || bgVals.length < 10) { // saturated or no background ring
         progress.update(i + 1);
         continue;
      }

      let bg = medianOf(bgVals);
      let sw = 0, sx = 0, sy = 0, s3x = 0, s3y = 0;
      for (let k = 0; k < px.length; ++k) {
         let wgt = px[k][2] - bg;
         if (wgt <= 0)
            continue;
         let rx = px[k][0] / sigma, ry = px[k][1] / sigma;
         let rho2 = rx * rx + ry * ry;
         sw += wgt;
         sx += wgt * px[k][0];
         sy += wgt * px[k][1];
         s3x += wgt * rho2 * rx;
         s3y += wgt * rho2 * ry;
      }
      if (sw > 0) {
         s.asymX = sx / sw;
         s.asymY = sy / sw;
         s.m3X = s3x / sw;
         s.m3Y = s3y / sw;
         ++measured;
      }
      progress.update(i + 1);
   }
   progress.end();
   Console.writeln(format("PSF asymmetry measured for %d / %d stars.", measured, stars.length));
   return measured;
}

// Fits the coma field model v(P) = k · (P - P0) / rMax to the per-star
// asymmetry vectors (third moment). Third-order coma grows linearly with
// the field distance and points radially away from the optical axis;
// miscollimation shifts that axis, i.e. adds a constant term. Solved as a
// linear problem in (k, ox, oy):
//   vx = k·X/rMax + ox,  vy = k·Y/rMax + oy   (X, Y relative to the image center)
// The coma-free point is where v = 0: P0 = center - (ox, oy)/k · rMax.
// Uncertainty via bootstrap resampling of the stars.
function fitComaField(stars, w, h, useCentroid) {
   let cx = w / 2, cy = h / 2;
   let rMax = Math.hypot(cx, cy);
   let pts = [];
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      let vx = useCentroid ? s.asymX : s.m3X;
      let vy = useCentroid ? s.asymY : s.m3Y;
      if (vx === null || vx === undefined)
         continue;
      pts.push([(s.x - cx) / rMax, (s.y - cy) / rMax, vx, vy]);
   }
   if (pts.length < 30)
      return null;

   function fit(sample) {
      let rows = [], zs = [];
      for (let i = 0; i < sample.length; ++i) {
         let p = sample[i];
         rows.push([p[0], 1, 0]); zs.push(p[2]);
         rows.push([p[1], 0, 1]); zs.push(p[3]);
      }
      let res = solveLeastSquaresClipped(rows, zs, 3);
      if (res === null || Math.abs(res.coeffs[0]) < 1e-12)
         return null;
      let k = res.coeffs[0], ox = res.coeffs[1], oy = res.coeffs[2];
      return { k: k, ox: ox, oy: oy, x0: cx - ox / k * rMax, y0: cy - oy / k * rMax };
   }

   let main = fit(pts);
   if (main === null)
      return null;

   const N_BOOT = 100;
   let bx = [], by = [], bk = [];
   for (let b = 0; b < N_BOOT; ++b) {
      let sample = new Array(pts.length);
      for (let i = 0; i < pts.length; ++i)
         sample[i] = pts[Math.floor(Math.random() * pts.length)];
      let r = fit(sample);
      if (r !== null) {
         bx.push(r.x0); by.push(r.y0); bk.push(r.k);
      }
   }
   function sd(a) {
      if (a.length < 2) return NaN;
      let m = a.reduce(function(p, q) { return p + q; }, 0) / a.length;
      return Math.sqrt(a.reduce(function(p, q) { return p + (q - m) * (q - m); }, 0) / (a.length - 1));
   }
   // Robust spread for the position (a few bootstrap runs with k ≈ 0 can
   // throw P0 arbitrarily far away and would dominate a plain SD).
   function robustSd(a) {
      if (a.length < 2) return NaN;
      let m = medianOf(a);
      return 1.4826 * medianOf(a.map(function(q) { return Math.abs(q - m); }));
   }

   main.n = pts.length;
   main.rMax = rMax;
   main.kSd = sd(bk);
   main.x0Sd = robustSd(bx);
   main.y0Sd = robustSd(by);
   main.significant = Math.abs(main.k) > 3 * main.kSd;
   return main;
}

function logComaField(fitM3, fitCentroid, w, h, pixelPitchEffUm) {
   Console.noteln("--- Coma field (PSF asymmetry) ---");
   if (fitM3 === null) {
      Console.warningln("Too few stars with a valid asymmetry measurement - coma field skipped.");
      return;
   }
   let cx = w / 2, cy = h / 2;
   Console.writeln(format("Stars used: %d. Coma strength at the field edge k = %.3f ± %.3f " +
      "(third moment, dimensionless; positive = flare points AWAY from the coma-free point, " +
      "negative = toward it, i.e. over-corrected).", fitM3.n, fitM3.k, fitM3.kSd));
   if (fitCentroid !== null)
      Console.writeln(format("Cross-check with the centroid offset: k = %.3f ± %.3f px, coma-free point (%.0f, %.0f).",
         fitCentroid.k, fitCentroid.kSd, fitCentroid.x0, fitCentroid.y0));

   if (!fitM3.significant) {
      Console.writeln("-> No significant field-dependent coma (|k| < 3σ): either well corrected, or the " +
         "signal is too weak for a single frame. The coma-free point is NOT determinable.");
      return;
   }

   let dx = fitM3.x0 - cx, dy = fitM3.y0 - cy;
   let dist = Math.hypot(dx, dy);
   let line = format("Coma-free point: (%.0f ± %.0f, %.0f ± %.0f) px, image center (%.0f, %.0f) -> offset %.0f px " +
      "= %.0f%% of the half diagonal", fitM3.x0, fitM3.x0Sd, fitM3.y0, fitM3.y0Sd, cx, cy, dist,
      100 * dist / fitM3.rMax);
   if (pixelPitchEffUm > 0)
      line += format(" = %.2f mm on the sensor", dist * pixelPitchEffUm / 1000);
   Console.writeln(line + ".");
   Console.writeln("Caveats: an uneven tracking drift during the exposure also adds a constant asymmetry " +
      "and shifts this point; with a coma corrector k is small, which amplifies every error. " +
      "Compare several short exposures before touching the collimation screws.");
}

// Draws the coma field: median asymmetry arrows on a coarse grid (per-star
// arrows are too noisy to read; optional) plus the coma-free point with its
// bootstrap uncertainty.
function drawComaOverlay(g, w, h, stars, comaFit, vectorScale, showArrows) {
   const NX = 9, NY = 6;
   let cellW = w / NX, cellH = h / NY;
   let cells = [];
   for (let j = 0; j < NY; ++j)
      for (let i = 0; i < NX; ++i)
         cells.push({ vx: [], vy: [] });
   for (let k = 0; k < stars.length; ++k) {
      let s = stars[k];
      if (s.m3X === null || s.m3X === undefined)
         continue;
      let i = Math.min(NX - 1, Math.max(0, Math.floor(s.x / cellW)));
      let j = Math.min(NY - 1, Math.max(0, Math.floor(s.y / cellH)));
      cells[j * NX + i].vx.push(s.m3X);
      cells[j * NX + i].vy.push(s.m3Y);
   }

   let arrowColor = 0xFFFFA020; // orange
   let scale = Math.min(cellW, cellH) * 0.45 * vectorScale; // length for |m3| = 1
   g.antialiasing = true;

   function arrow(x0, y0, x1, y1, width, color) {
      let ang = Math.atan2(y1 - y0, x1 - x0);
      let head = Math.max(8, Math.hypot(x1 - x0, y1 - y0) * 0.3);
      g.pen = new Pen(color, width);
      g.drawLine(x0, y0, x1, y1);
      g.drawLine(x1, y1, x1 - head * Math.cos(ang - 0.45), y1 - head * Math.sin(ang - 0.45));
      g.drawLine(x1, y1, x1 - head * Math.cos(ang + 0.45), y1 - head * Math.sin(ang + 0.45));
   }

   for (let j = 0; j < NY && showArrows; ++j) {
      for (let i = 0; i < NX; ++i) {
         let c = cells[j * NX + i];
         if (c.vx.length < 5)
            continue;
         let vx = medianOf(c.vx), vy = medianOf(c.vy);
         let x0 = (i + 0.5) * cellW, y0 = (j + 0.5) * cellH;
         let x1 = x0 + vx * scale, y1 = y0 + vy * scale;
         arrow(x0, y0, x1, y1, 9, 0xB0000000);
         arrow(x0, y0, x1, y1, 4, arrowColor);
      }
   }

   if (comaFit !== null && comaFit.significant &&
       comaFit.x0 > -w && comaFit.x0 < 2 * w && comaFit.y0 > -h && comaFit.y0 < 2 * h) {
      let markColor = 0xFFFF40FF; // magenta
      let rX = Math.max(10, isFinite(comaFit.x0Sd) ? comaFit.x0Sd : 10);
      let rY = Math.max(10, isFinite(comaFit.y0Sd) ? comaFit.y0Sd : 10);
      let arm = Math.max(30, Math.max(w, h) * 0.015);
      for (let pass = 0; pass < 2; ++pass) {
         g.pen = pass === 0 ? new Pen(0xB0000000, 9) : new Pen(markColor, 4);
         g.drawEllipse(comaFit.x0 - rX, comaFit.y0 - rY, comaFit.x0 + rX, comaFit.y0 + rY);
         g.drawLine(comaFit.x0 - arm, comaFit.y0, comaFit.x0 + arm, comaFit.y0);
         g.drawLine(comaFit.x0, comaFit.y0 - arm, comaFit.x0, comaFit.y0 + arm);
      }
      let fontSize = Math.round(Math.max(28, Math.max(w, h) * 0.009));
      let font = new Font("Helvetica", fontSize);
      try { font.bold = true; } catch (e) { /* not critical */ }
      g.font = font;
      let label = "Coma-free point";
      let labelX = Math.max(fontSize, Math.min(comaFit.x0 + arm + 6, w - fontSize - g.font.width(label)));
      let labelY = Math.max(fontSize * 2, Math.min(comaFit.y0 - arm, h - fontSize));
      drawTextWithHalo(g, labelX, labelY, label, markColor, fontSize);
   }
}

// -----------------------------------------------------------------------
// Coma streamlines: the same idea as the elongation streamlines
// (generateStreamlines()), but traced through the smoothed asymmetry field
// (third moment m3X/m3Y) instead of the ellipse orientation. Differences:
//   - m3 is a true vector (flare direction, 360°), so it is averaged
//     directly and the lines have a real flow direction (arrowheads);
//   - weights are the plain Gaussian kernel (no eccentricity weighting -
//     the asymmetry does not depend on the elongation);
//   - lines STOP where the smoothed asymmetry falls below a threshold
//     (relative to the strongest part of the field), so weak regions such
//     as the coma-free zone do not fake a direction.
// Pure under-corrected coma gives lines diverging from the coma-free point
// (a source); over-corrected coma gives lines converging on it (a sink).
// Smoothed asymmetry vector at (x, y), or null if too few stars nearby.
function comaFieldAt(stars, x, y, radius) {
   let r2 = radius * radius;
   let sigma2 = 2 * (radius * 0.5) * (radius * 0.5);
   let sx = 0, sy = 0, sw = 0, n = 0;
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      if (s.m3X === null || s.m3X === undefined)
         continue;
      let dx = s.x - x, dy = s.y - y;
      let d2 = dx * dx + dy * dy;
      if (d2 > r2)
         continue;
      let wgt = Math.exp(-d2 / sigma2);
      sx += wgt * s.m3X;
      sy += wgt * s.m3Y;
      sw += wgt;
      ++n;
   }
   if (n < 8 || sw < 1e-6)
      return null;
   let vx = sx / sw, vy = sy / sw;
   return { vx: vx, vy: vy, mag: Math.hypot(vx, vy) };
}

// Traces one coma streamline from (x0, y0) along (dir = +1) or against
// (dir = -1) the flow. Stops at the image edge, below minMag, or where the
// flow reverses (at a source/sink).
function traceComaStreamline(stars, x0, y0, dir, radius, stepLen, maxSteps, w, h, minMag) {
   let points = [];
   let x = x0, y = y0;
   let prevDx = 0, prevDy = 0;
   for (let step = 0; step < maxSteps; ++step) {
      let f = comaFieldAt(stars, x, y, radius);
      if (f === null || f.mag < minMag)
         break;
      let dx = dir * f.vx / f.mag, dy = dir * f.vy / f.mag;
      if (step > 0 && dx * prevDx + dy * prevDy < 0)
         break;
      x += dx * stepLen;
      y += dy * stepLen;
      if (x < 0 || x > w || y < 0 || y > h)
         break;
      points.push([x, y]);
      prevDx = dx; prevDy = dy;
   }
   return points;
}

// Seeds coma streamlines on a regular grid. The stop threshold is
// minPercent % of the 90th percentile of the field magnitude at the seed
// points. Each returned line is ordered ALONG the flow.
function generateComaStreamlines(stars, w, h, radius, minPercent) {
   let spacing = radius * 0.6;
   let stepLen = radius * 0.2;
   let maxSteps = 200;

   let seeds = [];
   for (let sy = spacing / 2; sy < h; sy += spacing)
      for (let sx = spacing / 2; sx < w; sx += spacing) {
         let f = comaFieldAt(stars, sx, sy, radius);
         if (f !== null)
            seeds.push({ x: sx, y: sy, mag: f.mag });
      }
   if (seeds.length === 0)
      return { lines: [], minMag: 0 };

   let mags = seeds.map(function(s) { return s.mag; }).sort(function(a, b) { return a - b; });
   let p90 = mags[Math.min(mags.length - 1, Math.floor(0.9 * mags.length))];
   let minMag = p90 * minPercent / 100;

   let lines = [];
   for (let i = 0; i < seeds.length; ++i) {
      let sd = seeds[i];
      if (sd.mag < minMag)
         continue;
      let fwd = traceComaStreamline(stars, sd.x, sd.y, +1, radius, stepLen, maxSteps, w, h, minMag);
      let bwd = traceComaStreamline(stars, sd.x, sd.y, -1, radius, stepLen, maxSteps, w, h, minMag);
      let full = bwd.slice().reverse().concat([[sd.x, sd.y]]).concat(fwd);
      if (full.length > 2)
         lines.push(full);
   }
   return { lines: lines, minMag: minMag };
}

// Draws the coma streamlines in orange (halo + core) with arrowheads at
// regular distances along each line, pointing along the flow (a line
// shorter than that distance gets one arrowhead at its middle).
function drawComaStreamlines(g, w, h, lines) {
   let color = 0xFFFFB040;
   let head = Math.max(12, Math.max(w, h) * 0.006);
   let spacing = Math.max(6 * head, 0.05 * Math.hypot(w, h)); // arc length between arrowheads
   let drawHead = function(x, y, ang) {
      g.drawLine(x, y, x - head * Math.cos(ang - 0.45), y - head * Math.sin(ang - 0.45));
      g.drawLine(x, y, x - head * Math.cos(ang + 0.45), y - head * Math.sin(ang + 0.45));
   };
   g.antialiasing = true;
   for (let pass = 0; pass < 2; ++pass) {
      g.pen = pass === 0 ? new Pen(0xA0000000, 5) : new Pen(color, 2);
      for (let i = 0; i < lines.length; ++i) {
         let pts = lines[i];
         let length = 0;
         for (let j = 1; j < pts.length; ++j) {
            g.drawLine(pts[j - 1][0], pts[j - 1][1], pts[j][0], pts[j][1]);
            length += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
         }

         // Arrowheads centered on the line: n of them, spacing apart.
         let n = Math.max(1, Math.floor(length / spacing));
         let next = (length - (n - 1) * spacing) / 2; // arc length of the first one
         let run = 0;
         for (let j = 1; j < pts.length && n > 0; ++j) {
            let dx = pts[j][0] - pts[j - 1][0], dy = pts[j][1] - pts[j - 1][1];
            let seg = Math.hypot(dx, dy);
            while (n > 0 && seg > 0 && run + seg >= next) {
               let t = (next - run) / seg;
               drawHead(pts[j - 1][0] + t * dx, pts[j - 1][1] + t * dy, Math.atan2(dy, dx));
               next += spacing;
               --n;
            }
            run += seg;
         }
      }
   }
}

// -----------------------------------------------------------------------
// One asymmetry arrow per star, for comparing the coma estimate (flare
// direction, m3) with the ellipse estimate star by star. Starts at the star
// center and points toward the flare; length ∝ |m3| (scaled with the vector
// scale like the ellipses). Arrows below minSigma x the per-star noise are
// skipped - the noise is estimated from the inner field (r < 25 % of the
// half diagonal), where the coma itself is close to zero.
// Color modes:
//   byStrength = false: alignment with the ellipse axis, |cos Δ| -
//       green = parallel (coma shapes the star), red = perpendicular
//       (elongation from something else), yellow in between; gray where
//       the star is nearly round and the ellipse axis is undefined
//   byStrength = true:  blue -> red by |m3| (like the ellipse colors)
function drawStarAsymmetryArrows(g, w, h, stars, vectorScale, minSigma, byStrength, quiet) {
   let cx = w / 2, cy = h / 2;
   let rMax = Math.hypot(cx, cy);
   let inner = [], mags = [];
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      if (s.m3X === null || s.m3X === undefined)
         continue;
      mags.push(Math.hypot(s.m3X, s.m3Y));
      if (Math.hypot(s.x - cx, s.y - cy) < 0.25 * rMax)
         inner.push(s.m3X, s.m3Y);
   }
   if (mags.length === 0)
      return;
   let noise = inner.length >= 20 ? 1.4826 * medianOf(inner.map(Math.abs)) : 0;
   let minMag = minSigma * noise;
   let sorted = mags.slice().sort(function(a, b) { return a - b; });
   let magMax = sorted[Math.floor(0.95 * (sorted.length - 1))] || 1;

   const LENGTH_PER_UNIT = 35; // px for |m3| = 1 at vector scale 1
   const ROUND_ELLIPTICITY = 0.05;
   let drawn = 0;
   g.antialiasing = true;
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      if (s.m3X === null || s.m3X === undefined)
         continue;
      let mag = Math.hypot(s.m3X, s.m3Y);
      if (mag < minMag || mag <= 0)
         continue;
      let len = Math.min(150, mag * LENGTH_PER_UNIT * vectorScale);
      let ux = s.m3X / mag, uy = s.m3Y / mag;
      let x1 = s.x + ux * len, y1 = s.y + uy * len;

      let col;
      if (byStrength) {
         col = eccColor(mag, magMax);
      } else if (ellipticityFromEcc(s.eccentricity) < ROUND_ELLIPTICITY) {
         col = 0xFFA0A0A0;
      } else {
         let t = Math.abs(Math.cos(Math.atan2(uy, ux) - starImageAngle(s))); // 1 parallel, 0 perpendicular
         let r = Math.round(255 * Math.min(1, 2 * (1 - t)));
         let gr = Math.round(255 * Math.min(1, 2 * t));
         col = 0xFF000000 | (r << 16) | (gr << 8) | 0x30;
      }

      let head = Math.max(4, len * 0.3);
      let ang = Math.atan2(uy, ux);
      g.pen = new Pen(col, 2);
      g.drawLine(s.x, s.y, x1, y1);
      g.drawLine(x1, y1, x1 - head * Math.cos(ang - 0.45), y1 - head * Math.sin(ang - 0.45));
      g.drawLine(x1, y1, x1 - head * Math.cos(ang + 0.45), y1 - head * Math.sin(ang + 0.45));
      ++drawn;
   }
   if (!quiet)
      Console.writeln(format("Per-star asymmetry arrows: %d of %d drawn (noise %.3f from the inner field, " +
         "threshold %.3f = %.1f sigma; color: %s).", drawn, mags.length, noise, minMag, minSigma,
         byStrength ? "strength" : "alignment with the ellipse axis"));
}

// Draws the tracking component (computeTrackingComponent()) as a legend in
// the lower-left corner: a double-headed bar in the direction of the
// common elongation, length proportional to the ellipticity (full length
// = ellipticity 0.3), plus a text label. Placed in the corner rather than
// the image center, where the Siril overlay's center FWHM label and the
// coma arrows already sit. Drawn whether or not the component was
// subtracted - the label says which.
function drawTrackingMarker(g, w, h, tracking, subtracted) {
   const FULL_SCALE_ELLIPTICITY = 0.3;
   let color = 0xFF60FF60; // green, distinct from the tilt (blue), Siril (yellow) and coma (orange/magenta) overlays
   let fontSize = Math.round(Math.max(28, Math.max(w, h) * 0.009));
   let font = new Font("Helvetica", fontSize);
   try { font.bold = true; } catch (e) { /* not critical */ }
   g.font = font;

   let boxR = Math.max(60, Math.min(w, h) * 0.06); // half the bar length at full scale
   let cx = fontSize + boxR;
   let cy = h - 3 * fontSize - boxR;

   // Reference circle = full scale, so the bar length can be read off.
   g.antialiasing = true;
   g.pen = new Pen(0x90000000, 5);
   g.drawEllipse(cx - boxR, cy - boxR, cx + boxR, cy + boxR);
   g.pen = new Pen(0xA0FFFFFF, 2);
   g.drawEllipse(cx - boxR, cy - boxR, cx + boxR, cy + boxR);

   let half = boxR * Math.min(1, tracking.ellipticity / FULL_SCALE_ELLIPTICITY);
   let a = tracking.angleDeg * Math.PI / 180; // image coordinates, y down
   let dx = Math.cos(a) * half, dy = Math.sin(a) * half;
   let head = Math.max(8, half * 0.25);
   function bar(width, col) {
      g.pen = new Pen(col, width);
      g.drawLine(cx - dx, cy - dy, cx + dx, cy + dy);
      if (half > 2) {
         for (let sgn = -1; sgn <= 1; sgn += 2) {
            let ex = cx + sgn * dx, ey = cy + sgn * dy;
            let ang = Math.atan2(sgn * dy, sgn * dx);
            g.drawLine(ex, ey, ex - head * Math.cos(ang - 0.45), ey - head * Math.sin(ang - 0.45));
            g.drawLine(ex, ey, ex - head * Math.cos(ang + 0.45), ey - head * Math.sin(ang + 0.45));
         }
      }
   }
   bar(11, 0xB0000000);
   bar(5, color);

   drawTextWithHalo(g, cx - boxR, cy + boxR + fontSize * 1.2,
      format("Tracking: eps %.3f @ %.0f°", tracking.ellipticity, tracking.angleDeg), color, fontSize);
   drawTextWithHalo(g, cx - boxR, cy + boxR + fontSize * 2.4,
      subtracted ? "(subtracted from the map)" : "(NOT subtracted - contained in the map)", color, fontSize);
}

// -----------------------------------------------------------------------
// (3) Radial/tangential decomposition per ring:
//   eps_rad = eps · cos 2(psi - phi)   phi = azimuth of the star around the center
//   > 0: major axis points radially (toward/away from the center)
//   < 0: major axis tangential (concentric around the center)
// plus the radial component of the asymmetry (third moment):
//   > 0: flare points outward (under-corrected coma, as in a bare Newtonian)
//   < 0: flare points inward (over-corrected coma)
// Writes the ring table and the verdict to con (the Console by default) and
// returns the outer-field verdict for assessImage().
function analyzeRadialTangential(stars, w, h, haveAsymmetry, con) {
   con = con || Console;
   let cx = w / 2, cy = h / 2;
   let rMax = Math.hypot(cx, cy);
   const NR = 6;
   let rings = [];
   for (let k = 0; k < NR; ++k)
      rings.push({ fwhm: [], eps: [], epsRad: [], m3Rad: [], alignSum: 0, alignW: 0 });

   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      let dx = s.x - cx, dy = s.y - cy;
      let r = Math.hypot(dx, dy) / rMax;
      let k = Math.min(NR - 1, Math.floor(r * NR));
      let phi = Math.atan2(dy, dx);
      let eps = ellipticityFromEcc(s.eccentricity);
      rings[k].fwhm.push(0.5 * (s.fwhmX + s.fwhmY));
      rings[k].eps.push(eps);
      rings[k].epsRad.push(eps * Math.cos(2 * (starImageAngle(s) - phi)));
      if (haveAsymmetry && s.m3X !== null && s.m3X !== undefined) {
         rings[k].m3Rad.push(s.m3X * Math.cos(phi) + s.m3Y * Math.sin(phi));
         // Alignment flare direction vs. ellipse axis: cos 2Δ, weighted by
         // ellipticity and flare strength (both directions must be defined).
         let wgt = eps * Math.hypot(s.m3X, s.m3Y);
         rings[k].alignSum += wgt * Math.cos(2 * (Math.atan2(s.m3Y, s.m3X) - starImageAngle(s)));
         rings[k].alignW += wgt;
      }
   }

   con.noteln("--- Radial / tangential decomposition (rings around the image center) ---");
   con.writeln("r/rMax      n   FWHM[px]  ellipt.  eps_rad   asym_rad   align");
   con.writeln("            (eps_rad: + radial, - tangential/concentric; asym_rad: + flare outward, - inward;");
   con.writeln("             align: flare vs. ellipse axis, +1 parallel = coma shapes the star, -1 perpendicular)");
   for (let k = 0; k < NR; ++k) {
      let rg = rings[k];
      if (rg.eps.length < 5)
         continue;
      con.writeln(format("%.2f-%.2f %5d   %6.2f    %6.3f   %7.3f   %s   %s",
         k / NR, (k + 1) / NR, rg.eps.length, medianOf(rg.fwhm), medianOf(rg.eps), medianOf(rg.epsRad),
         rg.m3Rad.length >= 5 ? format("%7.3f", medianOf(rg.m3Rad)) : "   n/a",
         rg.alignW > 0 ? format("%6.2f", rg.alignSum / rg.alignW) : "  n/a"));
   }

   // Verdict from the outer field (r > 0.6 rMax, rings 4..6).
   let outerEps = [], outerM3 = [], innerFwhm = [], outerFwhm = [];
   for (let k = 0; k < NR; ++k) {
      if (k >= 4) {
         outerEps = outerEps.concat(rings[k].epsRad);
         outerM3 = outerM3.concat(rings[k].m3Rad);
         outerFwhm = outerFwhm.concat(rings[k].fwhm);
      } else if (k <= 1) {
         innerFwhm = innerFwhm.concat(rings[k].fwhm);
      }
   }
   if (outerEps.length < 10) {
      con.writeln("Too few stars in the outer field for a verdict.");
      return { eRad: null, outerAsym: null, defocusSuspect: false };
   }
   let eRad = medianOf(outerEps);
   // 5% margin: on a flat field the two medians otherwise cross by chance.
   let defocusSuspect = innerFwhm.length >= 5 && medianOf(innerFwhm) > 1.05 * medianOf(outerFwhm);

   if (eRad > 0.04)
      con.writeln(format("Outer field: stars elongated RADIALLY (eps_rad = %.3f, pattern \"B\"). " +
         "With a coma corrector/flattener this usually means under-correction - rule of thumb: " +
         "INCREASE the corrector-sensor distance.", eRad));
   else if (eRad < -0.04)
      con.writeln(format("Outer field: stars elongated TANGENTIALLY / concentric (eps_rad = %.3f, pattern \"A\"). " +
         "Rule of thumb: DECREASE the corrector-sensor distance - BUT the same pattern is produced by " +
         "defocus combined with field curvature/astigmatism.", eRad));
   else
      con.writeln(format("Outer field: no significant radial/tangential pattern (eps_rad = %.3f).", eRad));

   let outerAsym = null;
   if (outerM3.length >= 10) {
      outerAsym = medianOf(outerM3);
      con.writeln(format("Outer field asymmetry: asym_rad = %.3f -> %s", outerAsym,
         Math.abs(outerAsym) < 0.1 ? "no clear comatic flare." :
         (outerAsym > 0 ? "flare points OUTWARD (under-corrected coma)." : "flare points INWARD (over-corrected coma).")));
   }

   if (defocusSuspect)
      con.warningln("The center is SOFTER than the outer field - the frame is probably out of focus " +
         "(or focused on the field edge). Radial/tangential patterns are not reliable for judging " +
         "corrector spacing on such a frame; use a well-focused one.");

   return { eRad: eRad, outerAsym: outerAsym, defocusSuspect: defocusSuspect };
}

// -----------------------------------------------------------------------
// (4) FWHM² surface fit over all stars:
//   FWHM² = c0 + c1·X + c2·Y + c3·(X² + Y²)      X, Y = (x - cx, y - cy) / rMax
// c3 is the rotationally symmetric part (field curvature plus other
// off-axis blur) and c1/c2 the one-sided part (tilt). Unlike the 4-
// quadrant evaluation, the symmetric part is no longer counted as tilt.
// Physical conversion as elsewhere in this script: excess blur ->
// defocus Δz = f-number · blur. This is a rough single-frame estimate: the
// sign (towards/away from the corrector) is not determinable, and a pure
// tilt around a perfectly focused center would appear partly in c3.
// Writes to con (the Console by default) and returns the fitted values for
// assessImage(), or null when there are too few stars.
function fitFwhmSurface(stars, w, h, pixelPitchEffUm, focalLengthMm, apertureMm, con) {
   con = con || Console;
   let cx = w / 2, cy = h / 2;
   let rMax = Math.hypot(cx, cy);
   let rows = [], zs = [];
   for (let i = 0; i < stars.length; ++i) {
      let s = stars[i];
      let X = (s.x - cx) / rMax, Y = (s.y - cy) / rMax;
      let f = 0.5 * (s.fwhmX + s.fwhmY);
      rows.push([1, X, Y, X * X + Y * Y]);
      zs.push(f * f);
   }
   con.noteln("--- FWHM² surface fit (tilt vs. field curvature) ---");
   let res = (rows.length >= 20) ? solveLeastSquaresClipped(rows, zs, 4) : null;
   if (res === null) {
      con.warningln("Too few stars / singular system - surface fit skipped.");
      return null;
   }
   let c = res.coeffs;
   let physical = pixelPitchEffUm > 0 && focalLengthMm > 0 && apertureMm > 0;
   let fRatio = physical ? focalLengthMm / apertureMm : 0;
   let signedSqrt = function(v) { return (v < 0 ? -1 : 1) * Math.sqrt(Math.abs(v)); };

   let fCenter = Math.sqrt(Math.max(0, c[0]));
   let fEdge = Math.sqrt(Math.max(0, c[0] + c[3]));
   con.writeln(format("FWHM center %.2f px, FWHM at the field edge (rotationally symmetric part) %.2f px.",
      fCenter, fEdge));

   // Field curvature
   let curvBlurPx = signedSqrt(c[3]);
   let sagUm = physical ? fRatio * Math.abs(curvBlurPx) * pixelPitchEffUm : null;
   let line = format("Symmetric off-axis blur at the edge: %.2f px", curvBlurPx);
   if (physical)
      line += format(" -> field curvature sag ≈ %.0f µm between center and corner (f/%.2f; sign not determinable)",
         sagUm, fRatio);
   con.writeln(line + ".");
   if (c[3] < 0)
      con.writeln("   (negative: the edge is SHARPER than the center - frame focused off-center or defocused " +
         "with a curved field)");

   // Tilt
   let G = Math.hypot(c[1], c[2]);
   let dirDeg = ((Math.atan2(c[2], c[1]) * 180 / Math.PI) + 360) % 360;
   let dF2 = G; // FWHM² difference between center and edge along the gradient
   let fBad = Math.sqrt(Math.max(0, c[0] + dF2)), fGood = Math.sqrt(Math.max(0, c[0] - dF2));
   let dzUm = null, tiltDeg = null;
   line = format("One-sided part (tilt): FWHM along the gradient %.2f px (edge at %.0f°) vs. %.2f px (opposite edge)",
      fBad, dirDeg, fGood);
   if (physical) {
      dzUm = fRatio * Math.sqrt(G) * pixelPitchEffUm;
      tiltDeg = Math.atan((dzUm / 1000) / (rMax * pixelPitchEffUm / 1000)) * 180 / Math.PI;
      line += format(" -> Δz ≈ ±%.0f µm at the edge, tilt ≈ %.3f°", dzUm, tiltDeg);
   }
   con.writeln(line + ".");
   con.writeln("   (direction in image coordinates: 0° = right, 90° = down; the softer side is at that angle)");

   let x0 = null, y0 = null;
   if (c[3] > 0) {
      x0 = cx - c[1] / (2 * c[3]) * rMax;
      y0 = cy - c[2] / (2 * c[3]) * rMax;
      con.writeln(format("Sharpest point of the fitted surface: (%.0f, %.0f) px, image center (%.0f, %.0f).",
         x0, y0, cx, cy));
   }
   if (!physical)
      con.writeln("Enter pixel pitch, focal length and aperture to get Δz in µm and the tilt angle.");
   return { c: c, x0: x0, y0: y0, fCenter: fCenter, fEdge: fEdge, sagUm: sagUm,
            tiltDirDeg: dirDeg, fBad: fBad, fGood: fGood, dzUm: dzUm, tiltDeg: tiltDeg };
}

// -----------------------------------------------------------------------
// Analysis and drawing are separate steps, so that the dialog's preview can
// switch layers on and off without measuring the stars again:
//
//   analyzeView()      the expensive part - debayer, star detection, PSF
//                      fit, PSF asymmetry, coma field and the stretched
//                      background. Depends only on the settings in
//                      analysisKey(); the result is kept by the dialog.
//   starsFor()         the stars with or without the tracking component,
//                      cached per setting in the analysis.
//   reportAnalysis()   the console summary (tracking, coma, rings, FWHM
//                      surface, tilt) - once per Preview/Apply.
//   renderVectorMap()  draws the enabled layers onto the background. Layers
//                      that need a computation of their own (heatmap,
//                      streamlines, coma streamlines) are cached in the
//                      analysis under the settings they depend on.

// The settings the analysis depends on. When they differ from those of a
// kept analysis, the analysis has to be run again.
function analysisKey(view, p) {
   return JSON.stringify([view.id, p.threshold, p.radius, p.useMoffat, p.madOutlierFactor,
      p.maxCandidates, p.debayer, p.debayer ? p.bayerPattern : ""]);
}

// Returns the value of a layer cached in the analysis under the given
// name, computing it when it is missing or was computed for another key.
// Only the latest value per layer is kept.
function cachedLayer(analysis, name, key, compute) {
   let entry = analysis.layers[name];
   if (!entry || entry.key !== key) {
      entry = { key: key, value: compute() };
      analysis.layers[name] = entry;
   }
   return entry.value;
}

// The stars of an analysis, with the tracking component subtracted or not.
// The analysis keeps the stars as measured; the correction works on copies.
function starsFor(analysis, subtractTracking) {
   return cachedLayer(analysis, "stars", subtractTracking, function() {
      let stars = analysis.stars.map(function(s) {
         return Object.assign(Object.create(Object.getPrototypeOf(s)), s);
      });
      if (subtractTracking)
         applyTrackingCorrection(stars, analysis.tracking);
      return stars;
   });
}

// Runs the expensive part of the diagnostics on a target image (see the
// overview above). p holds the settings under the names of
// ScriptParameters. The PSF asymmetry is measured when measureAsymmetry
// is true - the dialog's preview always measures it, so that the coma
// layers can be switched on later. A debayer intermediate window is closed
// when p.closeIntermediateWindows or closeIntermediate is set. viewBitmap
// is an optional renderStretchedBitmap() of the view, reused as the
// background. Returns null when no stars could be measured.
function analyzeView(view, p, measureAsymmetry, closeIntermediate, viewBitmap) {
   // Optional preprocessing step: debayer (SuperPixel) on a copy of the
   // target image. The original is left untouched; from here on, all
   // further steps operate on the debayered image.
   // A color image is no Bayer mosaic: it is never debayered (the dialog
   // disables the option for it; a process icon may still carry it).
   let debayer = p.debayer && !view.image.isColor;
   if (p.debayer && !debayer)
      Console.warningln("Debayer skipped: the target image is a color image, not a Bayer mosaic.");
   let targetView = view;
   if (debayer) {
      Progress.step("Debayering (SuperPixel)", 0, 0.05);
      let debayeredView = debayerSuperPixel(view, p.bayerPattern);
      if (debayeredView === null)
         return null;
      targetView = debayeredView;
   }
   // Save the ID before possibly closing the intermediate window (access
   // to .id after forceClose() would no longer be reliable).
   let targetViewId = targetView.id;
   let closeTarget = function() {
      if (debayer && (p.closeIntermediateWindows || closeIntermediate)) {
         Console.noteln("Closing SuperPixel intermediate window: " + targetViewId);
         targetView.window.forceClose();
      }
   };

   // Stage 1: find candidate star positions once with StarDetector -
   // does not depend on the PSF fit threshold, hence outside the retry loop.
   let candidateInfo = [];
   Progress.step("Detecting stars", 0.05, 0.12);
   let starBoxes = detectStarCandidates(targetView.image, p.radius, p.maxCandidates, candidateInfo);
   if (starBoxes === null) {
      closeTarget();
      return null;
   }

   if (starBoxes.length === 0) {
      Console.criticalln("StarDetector found no candidates. " +
         "Possible causes: image not yet debayered (Bayer mosaic instead of true RGB), " +
         "uncalibrated raw image, or no star field in the image area.");
      closeTarget();
      return null;
   }

   // Stage 2: elliptical PSF fit (Gaussian/Moffat). If the chosen fit
   // quality threshold results in 0 successful fits (e.g. because it was
   // chosen too strictly for a single, unstacked subframe), the script
   // automatically works its way down with lower values instead of
   // aborting immediately without a result.
   const MIN_THRESHOLD = 0.2;
   let t = p.threshold;
   let stars = [];
   for (let attempt = 1; ; ++attempt) {
      Console.writeln(format("Fit attempt %d: threshold=%.2f  search radius=%d  Moffat=%s",
         attempt, t, p.radius, p.useMoffat ? "true" : "false"));

      Progress.step(format("Fitting PSFs of %d stars", starBoxes.length), 0.12, 0.65);
      stars = fitStars(targetView, starBoxes, t, p.radius, p.useMoffat, p.madOutlierFactor, candidateInfo);
      if (stars.length > 0 || t <= MIN_THRESHOLD || attempt >= 6)
         break;

      let next = Math.max(MIN_THRESHOLD, t * 0.6);
      Console.warningln(format("No fits at threshold=%.2f - automatically reducing to %.2f ...", t, next));
      t = next;
   }

   if (stars.length === 0) {
      Console.criticalln("Still no successful PSF fit even after automatic threshold reduction, " +
         "although " + starBoxes.length + " candidate(s) were found by StarDetector. " +
         "Consider adjusting the search radius (see the diagnostic output above).");
      closeTarget();
      return null;
   }

   if (t !== p.threshold)
      Console.noteln(format("Note: threshold automatically reduced from %.2f to %.2f. " +
         "Enter this value directly in the dialog for future runs.", p.threshold, t));

   // Extended diagnostics (see the block above renderVectorMap()). Keep the
   // raw shape for the CSV export before an optional tracking correction.
   for (let i = 0; i < stars.length; ++i) {
      stars[i].eccentricityRaw = stars[i].eccentricity;
      stars[i].rotationRaw = stars[i].rotation;
   }

   let w = targetView.image.width, h = targetView.image.height;

   // The PSF asymmetry and the coma field depend only on the pixels and the
   // fitted centers, not on the tracking correction.
   let comaFit = null, comaFitCentroid = null;
   if (measureAsymmetry) {
      Progress.step("Measuring PSF asymmetry", 0.65, 0.78);
      measureStarAsymmetry(targetView.image, stars);
      comaFit = fitComaField(stars, w, h, false);
      comaFitCentroid = fitComaField(stars, w, h, true);
   }

   // The background: the target image stretched for display. Without
   // debayering, that is the bitmap the dialog already shows (viewBitmap).
   Progress.step("Rendering the background", 0.78, 0.85);
   let background = (targetView === view && viewBitmap) ? viewBitmap : renderStretchedBitmap(targetView);

   // Close the SuperPixel/debayer intermediate window by default after
   // processing (nothing needs its pixels any more at this point).
   closeTarget();

   return {
      key: analysisKey(view, p),
      targetViewId: targetViewId,
      debayer: debayer,
      w: w,
      h: h,
      stars: stars,
      tracking: computeTrackingComponent(stars),
      hasAsymmetry: measureAsymmetry,
      comaFit: comaFit,
      comaFitCentroid: comaFitCentroid,
      background: background,
      layers: {}
   };
}

// The optics used for the physical conversions: the dialog values, or
// those of the FITS header where present when p.opticsFromHeader is set.
// SuperPixel debayering halves the resolution: one output pixel spans 2x2
// sensor pixels. All physical conversions (Δz, tilt angle, 3D plot,
// coma-free point in mm, FWHM grid in arcseconds) must use this effective
// pitch - the dialog value is the physical sensor pixel pitch.
function resolveOptics(view, p, debayer, verbose) {
   let optics = { pixelPitchUm: p.pixelPitchUm, focalLengthMm: p.focalLengthMm, apertureMm: p.apertureMm };

   // Optics from the FITS header take precedence over the dialog values
   // where present (the dialog's own values are kept as the fallback for
   // images without these keywords).
   if (p.opticsFromHeader) {
      let hdr = readOpticsFromHeader(view);
      let used = [];
      if (hdr.pixelPitchUm > 0) {
         optics.pixelPitchUm = hdr.pixelPitchUm;
         used.push(format("pixel pitch %.2f µm (%s)", optics.pixelPitchUm, hdr.sources.pixelPitchUm));
      }
      if (hdr.focalLengthMm > 0) {
         optics.focalLengthMm = hdr.focalLengthMm;
         used.push(format("focal length %.1f mm (%s)", optics.focalLengthMm, hdr.sources.focalLengthMm));
      }
      if (hdr.apertureMm > 0) {
         optics.apertureMm = hdr.apertureMm;
         used.push(format("aperture %.1f mm (%s)", optics.apertureMm, hdr.sources.apertureMm));
      }
      if (verbose)
         Console.writeln(used.length > 0
            ? "Optics from FITS header: " + used.join(", ") + ". Missing values: dialog input."
            : "No optics keywords (XPIXSZ, FOCALLEN, APTDIA/FOCRATIO) in the FITS header - using dialog input.");
   }

   if (debayer) {
      if (verbose && optics.pixelPitchUm > 0)
         Console.writeln(format("SuperPixel debayer: effective pixel pitch %.2f µm (2 x %.2f µm) used for all " +
            "physical conversions.", 2 * optics.pixelPitchUm, optics.pixelPitchUm));
      optics.pixelPitchUm *= 2;
   }
   optics.physical = optics.pixelPitchUm > 0 && optics.focalLengthMm > 0 && optics.apertureMm > 0;
   return optics;
}

// A console that discards everything: the dialog evaluates an analysis
// again whenever a setting changes, without repeating the report.
const SILENT_CONSOLE = {
   write: function() {}, writeln: function() {}, noteln: function() {},
   warningln: function() {}, criticalln: function() {}
};

// The console summary of an analysis for the given settings, written to con
// (the Console by default, or SILENT_CONSOLE to only compute). Returns the
// Siril-style quadrant evaluation (tilt, null when not possible) and the
// measured values that assessImage() judges (metrics).
function reportAnalysis(analysis, stars, p, optics, con) {
   con = con || Console;
   let verbose = con === Console;
   let w = analysis.w, h = analysis.h;
   let showComa = analysis.hasAsymmetry && p.measureAsymmetry;

   if (verbose) {
      logTrackingComponent(analysis.tracking, p.subtractTracking);
      if (showComa)
         logComaField(analysis.comaFit, analysis.comaFitCentroid, w, h, optics.pixelPitchUm);
   }
   let rings = analyzeRadialTangential(stars, w, h, showComa, con);
   let surface = fitFwhmSurface(stars, w, h, optics.pixelPitchUm, optics.focalLengthMm, optics.apertureMm, con);

   if (p.showSirilTilt && p.showFwhmGrid && p.fwhmGridArcsec) {
      if (optics.pixelPitchUm > 0 && optics.focalLengthMm > 0)
         con.writeln(format("FWHM grid in arcseconds: %.3f″/px (pitch %.2f µm, focal length %.0f mm).",
            206.265 * optics.pixelPitchUm / optics.focalLengthMm, optics.pixelPitchUm, optics.focalLengthMm));
      else
         con.warningln("FWHM grid in arcseconds needs pixel pitch and focal length - showing pixels.");
   }

   // Siril-style quadrant evaluation: for the overlay, the optional tilt
   // angle computation and the assessment.
   let tilt = computeSirilTilt(stars, w, h);
   if (tilt === null) {
      if (p.showSirilTilt || optics.physical)
         con.warningln("Siril tilt evaluation: at least one quadrant/ring has no stars - skipped.");
   } else {
      if (p.showSirilTilt) {
         let best = Math.min(tilt.m1, tilt.m2, tilt.m3, tilt.m4);
         let worst = Math.max(tilt.m1, tilt.m2, tilt.m3, tilt.m4);
         let ref = (tilt.m1 + tilt.m2 + tilt.m3 + tilt.m4) / 4;
         con.noteln(format(
            "Siril-Style Tilt: Sensor tilt[FWHM]=%.2f (%.0f%%), Off-axis aberration[FWHM]=%.2f",
            worst - best, ((worst - best) / ref) * 100, tilt.mOuter - tilt.mInner));
      }
      if (optics.physical && verbose)
         computeAndLogTiltAngles(tilt, w, h, optics.pixelPitchUm, optics.focalLengthMm, optics.apertureMm);
   }

   return {
      tilt: tilt,
      metrics: {
         n: stars.length, w: w, h: h,
         tracking: analysis.tracking, trackingSubtracted: p.subtractTracking,
         rings: rings, surface: surface, siril: tilt,
         coma: showComa ? analysis.comaFit : undefined // undefined: not measured, null: too few stars
      }
   };
}

// -----------------------------------------------------------------------
// Assessment: judges the measured values of reportAnalysis() and suggests
// corrections, as one would read the console report. Each finding has a
// level (OK, Note, Action), a topic, what was found and what to do; the
// actions come back in the order in which they are best worked through
// (focus before tracking before tilt ...). The thresholds are starting
// points, not calibrated limits. Where the direction of a correction
// depends on the optical system, the optics type decides the wording
// (unknown: both cases are named).
const OPTICS_TYPES = ["Unknown", "Uncorrected (e.g. bare Newtonian)", "With corrector / flattener / reducer"];
const OPTICS_UNKNOWN = 0, OPTICS_UNCORRECTED = 1, OPTICS_CORRECTED = 2;
const ASSESS_OK = 0, ASSESS_NOTE = 1, ASSESS_ACTION = 2;

function assessImage(m, opticsType) {
   let findings = [];
   let add = function(level, topic, text, advice) {
      findings.push({ level: level, topic: topic, text: text, advice: advice || "" });
   };
   // A direction in image coordinates (0° = right, 90° = down) in words.
   let side = function(deg) {
      const NAMES = ["right", "lower right", "bottom", "lower left", "left", "upper left", "top", "upper right"];
      return NAMES[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
   };
   let pct = function(v) { return format("%.0f%%", 100 * v); };
   let ifCorrector = (opticsType === OPTICS_UNKNOWN) ? "If a corrector or flattener is used: rule of thumb, " :
      "Rule of thumb: ";

   if (m.n < 150)
      add(ASSESS_NOTE, "Data", format("Only %d stars measured - the verdicts below are uncertain.", m.n),
         "Lower the detection threshold, raise the maximum number of stars, or expose longer.");

   // Focus first: a defocused frame falsifies the tilt and spacing verdicts.
   let s = m.surface;
   let focusBad = (m.rings && m.rings.defocusSuspect) || (s !== null && s.c[3] < 0);
   if (focusBad)
      add(ASSESS_ACTION, "Focus", "The image center is softer than the field edge: the frame is probably out of " +
         "focus, or focused on the edge.", "Refocus on the center. Tilt and spacing verdicts are unreliable until then.");
   let caveat = focusBad ? " Uncertain: the frame seems out of focus." : "";

   let t = m.tracking;
   if (t) {
      if (t.ellipticity < 0.03) {
         add(ASSESS_OK, "Tracking", format("No significant common elongation (%.3f).", t.ellipticity));
      } else {
         let advice = "Check guiding (RMS, calibration), balance, cable drag, wind and flexure. An axis that stays " +
            "the same over several frames points to the mount, a changing one to wind.";
         if (!m.trackingSubtracted)
            advice += " Enable \"Subtract it from all stars\" so that it does not mask the optical patterns.";
         add(t.ellipticity > 0.07 ? ASSESS_ACTION : ASSESS_NOTE, "Tracking",
            format("All stars share an elongation of %.3f along %.0f° (image coordinates).", t.ellipticity, t.angleDeg),
            advice);
      }
   }

   if (s !== null) {
      let rel = (s.fBad - s.fGood) / Math.max(1e-6, 0.5 * (s.fBad + s.fGood));
      if (rel < 0.05) {
         add(ASSESS_OK, "Tilt", format("No significant one-sided blur (%s between opposite edges).", pct(rel)));
      } else {
         let text = format("The %s side is softer: FWHM %.2f px against %.2f px on the opposite side (%s).",
            side(s.tiltDirDeg), s.fBad, s.fGood, pct(rel));
         if (s.dzUm !== null)
            text += format(" Δz ≈ ±%.0f µm at the edge, tilt ≈ %.3f°.", s.dzUm, s.tiltDeg);
         if (m.siril) {
            let q = [m.siril.m1, m.siril.m2, m.siril.m3, m.siril.m4];
            let mean = (q[0] + q[1] + q[2] + q[3]) / 4;
            text += format(" Quadrants differ by %s.", pct((Math.max.apply(null, q) - Math.min.apply(null, q)) / mean));
         }
         add(rel > 0.10 ? ASSESS_ACTION : ASSESS_NOTE, "Tilt", text + caveat,
            format("Adjust the tilt of the camera on the axis toward the %s (%.0f° in image coordinates). Whether " +
               "that side has to move toward or away from the optics cannot be told from one frame: change it " +
               "slightly and compare.", side(s.tiltDirDeg), s.tiltDirDeg));
      }
   }

   // The field edge: radial or tangential elongation (corrector spacing).
   let r = m.rings;
   if (!r || r.eRad === null) {
      add(ASSESS_NOTE, "Spacing", "Too few stars in the outer field for a radial/tangential verdict.");
   } else if (Math.abs(r.eRad) <= 0.04) {
      add(ASSESS_OK, "Spacing", format("No radial or tangential pattern at the field edge (eps_rad %.3f).", r.eRad));
   } else {
      let level = Math.abs(r.eRad) > 0.08 ? ASSESS_ACTION : ASSESS_NOTE;
      if (r.eRad > 0) {
         let text = format("Stars at the field edge are elongated radially (eps_rad %.3f).", r.eRad);
         if (opticsType === OPTICS_UNCORRECTED)
            add(ASSESS_NOTE, "Spacing", text + " This is the normal coma of an uncorrected system.",
               "A coma corrector would remove it; there is no spacing to adjust.");
         else
            add(level, "Spacing", text + " With a corrector or flattener this usually means under-correction." + caveat,
               ifCorrector + "increase the corrector-sensor distance in small steps (e.g. 0.5 mm) and measure again.");
      } else {
         let text = format("Stars at the field edge are elongated tangentially, concentric around the center " +
            "(eps_rad %.3f).", r.eRad);
         if (opticsType === OPTICS_UNCORRECTED)
            add(level, "Spacing", text + " In an uncorrected system this is field curvature or astigmatism." + caveat,
               "Check the focus; a field flattener or corrector would reduce it.");
         else
            add(level, "Spacing", text + caveat,
               ifCorrector + "decrease the corrector-sensor distance in small steps. Defocus combined with field " +
               "curvature looks the same, so check the focus first.");
      }
   }

   // Off-axis blur (field curvature).
   if (s !== null && s.fCenter > 0) {
      let rel = (s.fEdge - s.fCenter) / s.fCenter;
      if (rel > 0.15) {
         let text = format("Stars at the field edge are %s larger than in the center (FWHM %.2f against %.2f px).",
            pct(rel), s.fEdge, s.fCenter);
         if (s.sagUm !== null)
            text += format(" That is about %.0f µm of focus difference.", s.sagUm);
         let advice = (opticsType === OPTICS_UNCORRECTED) ?
               "Expected for an uncorrected system; a flattener or corrector would reduce it." :
            (opticsType === OPTICS_CORRECTED) ?
               "The corrector does not flatten the field fully: check its spacing (see Spacing)." :
               "With a corrector or flattener, check its spacing (see Spacing); without one this is expected.";
         add(rel > 0.30 ? ASSESS_ACTION : ASSESS_NOTE, "Field curvature", text + caveat, advice);
      } else if (rel >= 0) {
         add(ASSESS_OK, "Field curvature", format("Field edge and center are about equally sharp (%s).", pct(rel)));
      }
   }

   // Coma and collimation (PSF asymmetry).
   let c = m.coma;
   if (c === undefined) {
      add(ASSESS_NOTE, "Coma", "Not measured.", "Enable \"Measure PSF asymmetry\" on the Coma tab.");
   } else if (c === null) {
      add(ASSESS_NOTE, "Coma", "Too few stars with a valid asymmetry measurement.");
   } else if (!c.significant) {
      add(ASSESS_OK, "Coma", format("No significant field-dependent coma (k = %.3f ± %.3f).", c.k, c.kSd));
   } else {
      if (c.k > 0) {
         let text = format("Under-corrected coma: the flares point away from the coma-free point (k = %.3f ± %.3f).",
            c.k, c.kSd);
         if (opticsType === OPTICS_UNCORRECTED)
            add(ASSESS_NOTE, "Coma", text + " Normal for an uncorrected Newtonian.", "A coma corrector would remove it.");
         else
            add(ASSESS_ACTION, "Coma", text, ifCorrector + "increase the corrector-sensor distance in small steps.");
      } else {
         add(ASSESS_ACTION, "Coma", format("Over-corrected coma: the flares point toward the coma-free point " +
            "(k = %.3f ± %.3f).", c.k, c.kSd), ifCorrector + "decrease the corrector-sensor distance in small steps.");
      }

      let dx = c.x0 - m.w / 2, dy = c.y0 - m.h / 2;
      let dist = Math.hypot(dx, dy);
      let off = dist / c.rMax;
      let sd = Math.hypot(c.x0Sd, c.y0Sd);
      if (off > 0.15 && isFinite(sd) && dist > 2 * sd) {
         let dirDeg = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
         let advice = (opticsType === OPTICS_UNCORRECTED) ? "Collimate the primary and secondary mirror." :
            (opticsType === OPTICS_CORRECTED) ? "Collimate the optics, or check the corrector for tilt or decentering." :
               "Collimate the optics; with a corrector, also check it for tilt or decentering.";
         // Uneven tracking adds a constant asymmetry along the drift, which
         // shifts the coma-free point in the same way (see logComaField()).
         if (t && t.ellipticity >= 0.03) {
            let d = Math.abs(((dirDeg - t.angleDeg) % 180 + 180) % 180);
            if (Math.min(d, 180 - d) < 20)
               advice += " Caution: the offset lies along the tracking elongation and may come from uneven " +
                  "tracking - compare several frames first.";
         }
         add(ASSESS_ACTION, "Collimation", format("The coma-free point lies %s of the half diagonal off the center, " +
            "toward the %s (%.0f°).", pct(off), side(dirDeg), dirDeg), advice);
      } else {
         add(ASSESS_OK, "Collimation", format("The coma-free point is near the center (%s of the half diagonal).",
            pct(off)));
      }
   }

   const ORDER = ["Focus", "Tracking", "Tilt", "Collimation", "Spacing", "Coma", "Field curvature", "Data"];
   let actions = findings.filter(function(f) { return f.level === ASSESS_ACTION; });
   actions.sort(function(a, b) { return ORDER.indexOf(a.topic) - ORDER.indexOf(b.topic); });
   return { findings: findings, actions: actions };
}

// The assessment as text with console tags, for the Console and the
// dialog's Assessment page (a TextBox interprets the same tags).
function formatAssessment(assessment) {
   const LABELS = ["OK", "Note", "Action"];
   let lines = [];
   if (assessment.actions.length === 0) {
      lines.push("<b>No corrections needed.</b>");
   } else {
      lines.push("<b>Suggested order of corrections:</b>");
      for (let i = 0; i < assessment.actions.length; ++i)
         lines.push(format("   %d. %s", i + 1, assessment.actions[i].topic));
   }
   for (let i = 0; i < assessment.findings.length; ++i) {
      let f = assessment.findings[i];
      lines.push("");
      lines.push("<b>[" + LABELS[f.level] + "] " + f.topic + ":</b> " + f.text);
      if (f.advice.length > 0)
         lines.push("   → " + f.advice);
   }
   return lines.join("<br>");
}

// Draws the vector map of an analysis with the given settings and returns
// it as a bitmap of the size of the target image. With verbose, notes and
// progress are written to the console; the dialog redraws its preview
// without them whenever a layer is switched.
function renderVectorMap(analysis, p, optics, verbose) {
   let w = analysis.w, h = analysis.h;
   let stars = starsFor(analysis, p.subtractTracking);
   let showComa = analysis.hasAsymmetry && p.measureAsymmetry;

   let background = analysis.background;
   if (p.showOrientationHeatmap) {
      let heatmap = cachedLayer(analysis, "heatmap", p.subtractTracking + "/" + p.orientationHeatmapDegree, function() {
         Console.writeln("Computing orientation heatmap ...");
         let bmp = computeOrientationHeatmapBitmap(stars, w, h, p.orientationHeatmapDegree);
         if (bmp === null)
            Console.warningln(format("Orientation heatmap: too few stars for a meaningful " +
               "degree-%d fit - using the normal background instead.", p.orientationHeatmapDegree));
         return bmp;
      });
      if (heatmap !== null)
         background = heatmap;
   }

   // The cached background stays untouched: the layers are drawn on a copy.
   let bmp = new Bitmap(w, h);
   bmp.fill(0xff000000);
   let g = new Graphics(bmp);
   g.drawBitmap(0, 0, background);
   g.antialiasing = true;

   // Draw the streamlines (smoothed large-scale trend) first, so they sit
   // in the background and the per-star vectors/tilt overlay on top of
   // them stay readable.
   if (p.showStreamlines) {
      let lines = cachedLayer(analysis, "streamlines", p.subtractTracking + "/" + p.streamlineRadiusPercent, function() {
         let radius = Math.sqrt(w * w + h * h) * (p.streamlineRadiusPercent / 100);
         Console.writeln("Computing streamlines ...");
         let slT0 = Date.now();
         if (DEBUG_DUMP_RAW)
            diagnoseOrientationConvention(stars, radius);
         let result = generateStreamlines(stars, w, h, radius);
         Console.writeln(format("Streamlines finished after %.1f s (%d lines).",
            (Date.now() - slT0) / 1000, result.length));
         return result;
      });
      drawStreamlines(g, lines);
   }

   // Coma streamlines (asymmetry field) on top of the elongation
   // streamlines; need the asymmetry measurement.
   if (p.showComaStreamlines && showComa) {
      let lines = cachedLayer(analysis, "comaStreamlines",
         p.comaStreamlineRadiusPercent + "/" + p.comaStreamlineMinPercent, function() {
         let radius = Math.sqrt(w * w + h * h) * (p.comaStreamlineRadiusPercent / 100);
         Console.writeln("Computing coma streamlines ...");
         let cT0 = Date.now();
         let res = generateComaStreamlines(stars, w, h, radius, p.comaStreamlineMinPercent);
         Console.writeln(format("Coma streamlines finished after %.1f s (%d lines, stop below |m3| = %.3f).",
            (Date.now() - cT0) / 1000, res.lines.length, res.minMag));
         return res.lines;
      });
      drawComaStreamlines(g, w, h, lines);
   } else if (p.showComaStreamlines && verbose) {
      Console.warningln("Coma streamlines need \"Measure PSF asymmetry\" - skipped.");
   }

   if (!p.hideEllipses) {
      let eccMax = 0;
      for (let i = 0; i < stars.length; ++i)
         eccMax = Math.max(eccMax, stars[i].eccentricity);
      if (eccMax <= 0) eccMax = 1;

      let progress = verbose ? withProgress("Drawing vector map", stars.length) : null;
      for (let i = 0; i < stars.length; ++i) {
         let s = stars[i];
         let len = s.eccentricity * p.vectorScale * 100; // px, scaled for visibility

         // Instead of a double-headed arrow, the PSF shape is drawn as an
         // ellipse: the unambiguous direction that a single arrowhead would
         // suggest doesn't exist anyway (theta and theta+180° describe the
         // same ellipse). Major semi-axis = half the vector length
         // (length/orientation as with the former double-headed arrow),
         // minor semi-axis derived from the eccentricity
         // (e = sqrt(1-(b/a)^2)), so the shape and size of the ellipse
         // directly show the measured eccentricity.
         let a = len / 2;
         let e = s.eccentricity;
         let b = a * Math.sqrt(Math.max(0, 1 - e * e));

         let col = eccColor(s.eccentricity, eccMax);

         // Ellipse: major axis = a (length/orientation as with the former
         // double-headed arrow), minor axis = b (from the eccentricity)
         g.pen = new Pen(col, 2);
         drawOrientedEllipse(g, s.x, s.y, a, b, -s.rotation); // image angle = -theta (y down)

         // small dot at the centroid
         g.pen = new Pen(0xFFFFFFFF, 1);
         g.drawEllipse(s.x - 1.5, s.y - 1.5, s.x + 1.5, s.y + 1.5);

         if (progress)
            progress.update(i + 1);
      }
      if (progress)
         progress.end();
   }

   if (p.showStarAsymArrows && showComa)
      drawStarAsymmetryArrows(g, w, h, stars, p.vectorScale, p.starAsymMinSigma, p.starAsymColorByStrength, !verbose);
   else if (p.showStarAsymArrows && verbose)
      Console.warningln("Per-star asymmetry arrows need \"Measure PSF asymmetry\" - skipped.");

   if (p.showSirilTilt) {
      let tilt = computeSirilTilt(stars, w, h);
      if (tilt !== null) {
         if (p.showFwhmGrid) {
            let fwhmGrid = computeFwhmGrid(stars, w, h, 11);
            // optics.pixelPitchUm is the effective pitch (2x after SuperPixel
            // debayering, see resolveOptics()).
            let gridScale = 1, gridUnit = "px";
            if (p.fwhmGridArcsec && optics.pixelPitchUm > 0 && optics.focalLengthMm > 0) {
               gridScale = 206.265 * optics.pixelPitchUm / optics.focalLengthMm;
               gridUnit = "arcsec"; // plain text: the ″ glyph is not guaranteed in the bitmap font
            }
            drawFwhmGrid(g, w, h, fwhmGrid, gridScale, gridUnit);
         } else {
            drawSirilTiltPolygon(g, w, h, tilt);
         }

         if (p.showTiltAxis) {
            let axis = computeTiltAxis(tilt, w, h, optics.pixelPitchUm, optics.focalLengthMm, optics.apertureMm);
            drawTiltAxis(g, w, h, axis);
         }
      }
   }

   if (showComa)
      drawComaOverlay(g, w, h, stars, analysis.comaFit, p.vectorScale, p.showComaArrows);

   if (analysis.tracking)
      drawTrackingMarker(g, w, h, analysis.tracking, p.subtractTracking);

   g.end();
   return bmp;
}

// -----------------------------------------------------------------------
// Reads pixel pitch, focal length and aperture from the FITS header of the
// view's window, where available:
//   pixel pitch  XPIXSZ (µm; by convention already includes binning)
//   focal length FOCALLEN (mm)
//   aperture     APTDIA (mm), otherwise FOCALLEN / FOCRATIO
// Values outside a plausible range are ignored. Returns an object with the
// three values (0 = not found) and, per value, the keyword it came from.
function readOpticsFromHeader(view) {
   let result = { pixelPitchUm: 0, focalLengthMm: 0, apertureMm: 0, sources: {} };
   let keywords = [];
   try {
      keywords = view.window.keywords;
   } catch (e) {
      Console.warningln("Could not read FITS keywords: " + e.message);
      return result;
   }
   let values = {};
   for (let i = 0; i < keywords.length; ++i) {
      let name = String(keywords[i].name).trim().toUpperCase();
      let raw = String(keywords[i].value).trim().replace(/^'+|'+$/g, "").trim();
      let v = parseFloat(raw);
      if (isFinite(v) && !(name in values))
         values[name] = v;
   }
   function take(name, lo, hi) {
      let v = values[name];
      return (v !== undefined && v >= lo && v <= hi) ? v : 0;
   }

   let pitch = take("XPIXSZ", 0.5, 50);
   if (pitch > 0) {
      result.pixelPitchUm = pitch;
      result.sources.pixelPitchUm = "XPIXSZ";
   }
   let focal = take("FOCALLEN", 10, 20000);
   if (focal > 0) {
      result.focalLengthMm = focal;
      result.sources.focalLengthMm = "FOCALLEN";
   }
   let aperture = take("APTDIA", 10, 3000);
   if (aperture > 0) {
      result.apertureMm = aperture;
      result.sources.apertureMm = "APTDIA";
   } else {
      let fRatio = take("FOCRATIO", 1, 50);
      if (fRatio > 0 && focal > 0) {
         result.apertureMm = focal / fRatio;
         result.sources.apertureMm = "FOCALLEN/FOCRATIO";
      }
   }
   return result;
}

// -----------------------------------------------------------------------
// Runs the diagnostics for a given target image: the analysis (unless a
// kept one is passed in), the console summary and the vector map, then -
// unless previewOnly - the map window, the optional 3D plot and CSV export.
// p holds the settings under the names of ScriptParameters (the script's
// parameters object or the dialog's current settings). Used by the
// interactive dialog (Preview and Apply) and by the direct drag&drop apply
// ("New Instance" onto a target image). viewBitmap: see analyzeView().
// Returns { analysis, bitmap, assessment }, or null when the analysis failed.
function processView(view, p, previewOnly, analysis, viewBitmap) {
   DEBUG_DUMP_RAW = p.debug;

   // Permanently remember all options of this run for future runs (even
   // without a process icon).
   if (p !== parameters)
      parameters.assign(p);
   parameters.SaveSettings();

   // The preview always measures the PSF asymmetry and always closes a
   // debayer intermediate window (see analyzeView()).
   if (!analysis) {
      analysis = analyzeView(view, p, previewOnly || p.measureAsymmetry, previewOnly, viewBitmap);
      if (analysis === null)
         return null;
   } else {
      Console.writeln("Reusing the star measurement of the preview.");
   }

   let optics = resolveOptics(view, p, analysis.debayer, true);
   let stars = starsFor(analysis, p.subtractTracking);
   Progress.step("Evaluating", 0.85, 0.88);
   let report = reportAnalysis(analysis, stars, p, optics);
   let tilt = report.tilt;
   let assessment = assessImage(report.metrics, p.opticsType);
   Console.noteln("--- Assessment ---");
   Console.writeln(formatAssessment(assessment));
   Progress.step("Drawing the vector map", 0.88, 1);
   let bmp = renderVectorMap(analysis, p, optics, true);

   if (!previewOnly) {
      if (p.show3DTiltPlot && !optics.physical)
         Console.warningln("3D sensor tilt plot skipped: it needs pixel pitch, focal length and aperture " +
            "(General tab or FITS header).");
      if (tilt !== null && optics.physical && p.show3DTiltPlot)
         build3DTiltPlot(tilt, analysis.w, analysis.h, optics.pixelPitchUm, optics.focalLengthMm, optics.apertureMm);

      let newId = uniqueViewId("AberrationMap_" + analysis.targetViewId);
      let window = new ImageWindow(analysis.w, analysis.h, 3, 8, false, true, newId);
      window.mainView.beginProcess(UndoFlag.NoSwapFile);
      window.mainView.image.blend(bmp);
      window.mainView.endProcess();
      window.show();
      window.zoomToFit();

      if (p.doExport) {
         let path = File.systemTempDirectory + "/" + analysis.targetViewId + "_aberration.csv";
         exportCSV(stars, path);
      }
   }

   Console.noteln("Done.");
   return { analysis: analysis, bitmap: bmp, assessment: assessment };
}

// -----------------------------------------------------------------------
// The dialog is laid out like AperturePhotometry: the parameters are
// grouped by topic into the pages of a TabBox, each page holding GroupBoxes
// with right-aligned field labels of one common width, next to a preview of
// the target image. Options that only matter when another one is checked
// are disabled otherwise (updateControls).
class StarAberrationDialog extends Dialog {
   constructor(view) {
      super();

      let d = this;
      this.view = view;


      this.windowTitle = TITLE + " " + VERSION;

      // Field labels share one width so that all edit fields line up;
      // check boxes are indented to the same column.
      const LABEL_ALIGNMENT = TextAlignment.Right | TextAlignment.VertCenter;
      this.labelWidth = Math.max(
         this.font.width("Min. strength (sigma):"),
         this.font.width("Smoothing radius (%):"),
         this.font.width("Max. stars (0 = all):")) + this.logicalPixelsToPhysical(6);

      let fieldLabel = function(text) {
         let label = new Label(d);
         label.text = text;
         label.textAlignment = LABEL_ALIGNMENT;
         label.setFixedWidth(d.labelWidth);
         return label;
      };
      let fieldRow = function(label, control) {
         let row = new HorizontalSizer;
         row.spacing = 4;
         row.add(label);
         row.add(control);
         row.addStretch();
         return row;
      };
      let checkRow = function(check) {
         let row = new HorizontalSizer;
         row.addUnscaledSpacing(d.labelWidth + d.logicalPixelsToPhysical(4));
         row.add(check);
         row.addStretch();
         return row;
      };
      let groupBox = function(title, items) {
         let group = new GroupBox(d);
         group.title = title;
         group.sizer = new VerticalSizer;
         group.sizer.margin = 6;
         group.sizer.spacing = 4;
         for (let i = 0; i < items.length; ++i)
            group.sizer.add(items[i]);
         return group;
      };
      // A tab page: the check box that enables its layer (if any) on top,
      // followed by the group boxes.
      let page = function(enableCheck, groups) {
         let control = new Control(d);
         control.sizer = new VerticalSizer;
         control.sizer.margin = 6;
         control.sizer.spacing = 6;
         if (enableCheck)
            control.sizer.add(enableCheck);
         for (let i = 0; i < groups.length; ++i)
            control.sizer.add(groups[i]);
         control.sizer.addStretch();
         return control;
      };

      // ---- Target / debayer (General page) --------------------------------

      this.label = new Label(this);
      // We leave the default alignment (left/vertically centered) as-is,
      // to stay independent of the exact name of the alignment constants.

      this.updateLabel = function() {
         if (d.view && d.view.id.length > 0)
            d.label.text = d.view.image.width + " x " + d.view.image.height + " pixels, " +
               d.view.image.numberOfChannels + " channel(s)";
         else
            d.label.text = "No target image selected.";
      };

      // Input view selectable: list of all open main images
      this.viewListLabel = fieldLabel("Target image:");
      this.viewList = new ViewList(this);
      this.viewList.getMainViews(); // main images only, no previews
      if (view)
         this.viewList.currentView = view;
      this.viewList.onViewSelected = function(v) {
         d.view = v;
         if (d.applyHeaderOptics)
            d.applyHeaderOptics();
         d.updateLabel();
         d.updateControls();
         d.updatePreview();
      };

      let viewRow = new HorizontalSizer;
      viewRow.spacing = 4;
      viewRow.add(this.viewListLabel);
      viewRow.add(this.viewList, 100);

      let infoRow = new HorizontalSizer;
      infoRow.addUnscaledSpacing(this.labelWidth + this.logicalPixelsToPhysical(4));
      infoRow.add(this.label, 100);
      this.updateLabel();

      // Debayer (SuperPixel) as a preprocessing step
      this.debayerCheck = new CheckBox(this);
      this.debayerCheck.text = "Debayer (SuperPixel) before star detection";
      this.debayerCheck.checked = parameters.debayer;
      this.debayerCheck.toolTip =
         "<p>Creates a debayered copy of the target image (SuperPixel method: direct " +
         "2x2 pixel grouping without interpolation, half resolution) and continues working " +
         "on this copy. The original image is left unchanged. Only enable this if the target " +
         "image is still an unprocessed Bayer mosaic (not true RGB); it is disabled for color " +
         "images.</p>";

      // Bayer pattern (fallback, if "Auto" fails due to missing CFA metadata:
      // "Unable to acquire CFA pattern information")
      this.bayerPatternLabel = fieldLabel("Bayer pattern:");
      this.bayerPatternCombo = new ComboBox(this);
      this.bayerPatternItems = ["Auto", "RGGB", "BGGR", "GBRG", "GRBG"];
      for (let i = 0; i < this.bayerPatternItems.length; ++i)
         this.bayerPatternCombo.addItem(this.bayerPatternItems[i]);
      let bpIndex = this.bayerPatternItems.indexOf(parameters.bayerPattern);
      this.bayerPatternCombo.currentItem = (bpIndex >= 0) ? bpIndex : 0;
      this.bayerPatternCombo.toolTip =
         "<p>'Auto' reads the Bayer pattern from the image's FITS/RAW metadata. " +
         "If that fails ('Unable to acquire CFA pattern information'), manually select the " +
         "actual sensor pattern here (see the camera specification).</p>";

      // Automatically close intermediate windows (SuperPixel debayer
      // result + any noise-evaluation side windows) after processing
      this.closeWindowsCheck = new CheckBox(this);
      this.closeWindowsCheck.text = "Close intermediate windows after processing";
      this.closeWindowsCheck.checked = parameters.closeIntermediateWindows;
      this.closeWindowsCheck.toolTip =
         "<p>Closes the debayered SuperPixel intermediate window as well as any side windows " +
         "created during the debayer step (e.g. noise evaluation) once the vector map has " +
         "finished drawing. Only relevant if debayering is enabled.</p>";

      // ---- Detection -----------------------------------------------------

      // Threshold
      this.thresholdLabel = fieldLabel("Threshold (sigma):");
      this.thresholdSpin = new NumericEdit(this);
      this.thresholdSpin.setRange(0.5, 10);
      this.thresholdSpin.setValue(parameters.threshold);
      this.thresholdSpin.setPrecision(2);
      this.thresholdSpin.toolTip =
         "<p>Star detection threshold in units of the background noise. Lower = more, but " +
         "possibly less reliable stars.</p>";

      // Search radius
      this.radiusLabel = fieldLabel("Search radius (px):");
      this.radiusSpin = new SpinBox(this);
      this.radiusSpin.setRange(3, 50);
      this.radiusSpin.value = parameters.radius;
      this.radiusSpin.toolTip = "<p>Search radius of the PSF fit in pixels; adjust to the star size.</p>";

      // Limit the candidate count before the PSF fit (brightest first) -
      // the actual time sink is the blocking DynamicPSF fit over ALL
      // candidates, not StarDetector itself.
      this.maxCandLabel = fieldLabel("Max. stars (0 = all):");
      this.maxCandSpin = new SpinBox(this);
      this.maxCandSpin.setRange(0, 50000);
      this.maxCandSpin.value = parameters.maxCandidates;
      this.maxCandSpin.toolTip =
         "<p>Limits the number of candidates passed to DynamicPSF to the N " +
         "brightest (sorted by StarDetector flux). The PSF fit is a single, " +
         "blocking call with no visible intermediate progress - fewer candidates " +
         "directly shorten its runtime. 0 = fit all found candidates.</p>";

      // PSF function
      this.moffatCheck = new CheckBox(this);
      this.moffatCheck.text = "Moffat PSF instead of Gaussian";
      this.moffatCheck.checked = parameters.useMoffat;
      this.moffatCheck.toolTip =
         "<p>Moffat is the more realistic profile for stars with a diffraction disk, " +
         "Gaussian is faster.</p>";

      // MAD outlier filter: rejects fits with a disproportionately poor
      // model fit (noisy/unstable) relative to the median of all
      // successful fits in this image.
      this.madLabel = fieldLabel("MAD outlier factor:");
      this.madSpin = new NumericEdit(this);
      this.madSpin.setRange(0, 20);
      this.madSpin.setValue(parameters.madOutlierFactor);
      this.madSpin.setPrecision(1);
      this.madSpin.toolTip =
         "<p>Rejects PSF fits whose MAD (mean deviation from the model) is more than " +
         "X times the median of all successful fits in this image. Filters out " +
         "noisy/unstable fits (hot pixels, blends, very faint candidates) that " +
         "would otherwise show up in the vector map as physically implausible, isolated " +
         "outliers (strong eccentricity right next to calm neighboring stars). " +
         "0 = filter disabled.</p>";

      // ---- Vector map ----------------------------------------------------

      // Vector scale
      this.scaleLabel = fieldLabel("Vector scale:");
      this.scaleSpin = new NumericEdit(this);
      this.scaleSpin.setRange(0.1, 10);
      this.scaleSpin.setValue(parameters.vectorScale);
      this.scaleSpin.setPrecision(2);
      this.scaleSpin.toolTip = "<p>Length of the drawn vectors and arrows - purely visual.</p>";

      // Stored as "hideEllipses"; shown as the enable switch of the layer.
      this.showEllipsesCheck = new CheckBox(this);
      this.showEllipsesCheck.text = "Show star ellipses";
      this.showEllipsesCheck.checked = !parameters.hideEllipses;
      this.showEllipsesCheck.toolTip = "<p>Draws the fitted ellipse of every star. Uncheck to look at the " +
         "other layers alone, e.g. the per-star asymmetry arrows.</p>";

      // Tracking component (field-wide median elongation)
      // The measured tracking component of the kept analysis (see
      // computeTrackingComponent()), shown above the option.
      this.trackingInfoLabel = new Label(this);
      this.trackingInfoLabel.wordWrapping = true;
      this.trackingInfoLabel.useRichText = true;
      this.trackingInfoLabel.toolTip = "<p>The median elongation of all stars: ellipticity, " +
         "eccentricity and the direction of the major axis (image coordinates: 0° = right, " +
         "90° = down). Below an ellipticity of 0.03 it is negligible.</p>";
      this.updateTrackingInfo = function() {
         let t = d.analysis ? d.analysis.tracking : null;
         if (!t) {
            d.trackingInfoLabel.text = "<i>Measured with Preview.</i>";
            return;
         }
         d.trackingInfoLabel.text = format("Ellipticity <b>%.3f</b> (eccentricity %.2f), axis %.0f°", t.ellipticity,
               t.eccentricity, t.angleDeg) + "<br/>" +
            ((t.ellipticity < 0.03) ? "Negligible: tracking/guiding looks clean." :
               "Shared by all stars: tracking/guiding, wind or flexure.");
      };
      let trackingInfoRow = new HorizontalSizer;
      trackingInfoRow.addUnscaledSpacing(this.labelWidth + this.logicalPixelsToPhysical(4));
      trackingInfoRow.add(this.trackingInfoLabel, 100);

      this.subtractTrackingCheck = new CheckBox(this);
      this.subtractTrackingCheck.text = "Subtract it from all stars";
      this.subtractTrackingCheck.checked = parameters.subtractTracking;
      this.subtractTrackingCheck.toolTip =
         "<p>Optical aberrations form patterns that are symmetric around the optical axis and " +
         "average out over the field; an elongation shared by all stars comes from tracking/" +
         "guiding, wind or flexure. Its median is always reported in the console; with this " +
         "option it is also subtracted from every star before the vector map, streamlines, " +
         "heatmap and the ring analysis are computed, so the optical pattern is not masked by " +
         "the mount. The CSV keeps the raw values in extra columns.</p>";

      // Streamlines (smoothed trend)
      this.streamlinesCheck = new CheckBox(this);
      this.streamlinesCheck.text = "Show streamlines (smoothed orientation trend)";
      this.streamlinesCheck.checked = parameters.showStreamlines;
      this.streamlinesCheck.toolTip =
         "<p>Shows the large-scale trend of the PSF orientation as continuous lines " +
         "(like field lines), smoothed over neighboring stars. Radial pattern = under-corrected " +
         "coma (corrector too close), concentric pattern = over-correction, defocus or field " +
         "curvature, a pattern that differs between the two sides = tilt; all field lines " +
         "parallel = tracking. Easier to spot than the noisy per-star vector map " +
         "alone. Correctly accounts for the fact that the PSF orientation is only " +
         "defined mod 180° (double-angle averaging).</p>";

      this.streamlineRadiusLabel = fieldLabel("Smoothing radius (%):");
      this.streamlineRadiusSpin = new NumericEdit(this);
      this.streamlineRadiusSpin.setRange(2, 50);
      this.streamlineRadiusSpin.setValue(parameters.streamlineRadiusPercent);
      this.streamlineRadiusSpin.setPrecision(1);
      this.streamlineRadiusSpin.toolTip =
         "<p>How far neighboring stars contribute to smoothing the orientation field, in % of " +
         "the image diagonal. Smaller = follows local detail more closely (noisier), larger = " +
         "smoother, more large-scale trend.</p>";

      // Orientation heatmap (as in the Seti Astro Suite, see
      // github.com/setiastro/setiastrosuite) as the background instead of
      // the stretched star field.
      this.orientationHeatmapCheck = new CheckBox(this);
      this.orientationHeatmapCheck.text = "Show orientation heatmap (instead of the star field)";
      this.orientationHeatmapCheck.checked = parameters.showOrientationHeatmap;
      this.orientationHeatmapCheck.toolTip =
         "<p>Replaces the image background with a color-field heatmap of the PSF orientation " +
         "(like the Seti Astro Suite's \"Orientation Map\", github.com/setiastro/" +
         "setiastrosuite): θ is fitted per double-angle averaging (with 3-sigma clipping) as a " +
         "smooth 2D polynomial surface over all stars (degree set below) and colored as the " +
         "hue of an HSV color wheel - color gradients show the large-scale orientation trend " +
         "(tilt/coma) more directly than the real star field. Requires enough stars for the " +
         "chosen fit degree, otherwise it automatically falls back to the normal background.</p>";

      this.orientationHeatmapDegreeLabel = fieldLabel("Fit degree:");
      this.orientationHeatmapDegreeSpin = new SpinBox(this);
      this.orientationHeatmapDegreeSpin.setRange(1, 4);
      this.orientationHeatmapDegreeSpin.value = parameters.orientationHeatmapDegree;
      this.orientationHeatmapDegreeSpin.toolTip =
         "<p>Degree of the 2D polynomial fitted to the star orientations. 1 = a plane (pure, " +
         "uniform tilt only - matches the Seti Astro Suite's default). 2 or higher lets the " +
         "heatmap also follow local curvature (e.g. a coma pattern) that a plane cannot " +
         "represent and that may otherwise only show up in the streamlines overlay - at the " +
         "cost of being more sensitive to noise/outliers, especially near the image edges " +
         "where fewer stars constrain the higher-order terms.</p>";

      // ---- Tilt ----------------------------------------------------------

      // Siril-style tilt overlay (quadrant polygon)
      this.sirilTiltCheck = new CheckBox(this);
      this.sirilTiltCheck.text = "Show Siril-style tilt overlay (quadrant polygon)";
      this.sirilTiltCheck.checked = parameters.showSirilTilt;
      this.sirilTiltCheck.toolTip =
         "<p>Overlays a yellow quadrilateral on the image in addition to the vector map, " +
         "recreated from Siril's \"Show tilt\" (ccd-inspector.c): one corner point per " +
         "image quadrant, radius proportional to the deviation of that quadrant's mean FWHM " +
         "from the average of all four. Complements our per-star vectors with Siril's " +
         "compact, aggregated view.</p>";

      this.fwhmGridCheck = new CheckBox(this);
      this.fwhmGridCheck.text = "11×11 FWHM grid instead of the quadrant polygon";
      this.fwhmGridCheck.checked = parameters.showFwhmGrid;
      this.fwhmGridCheck.toolTip =
         "<p>Replaces the 4-quadrant polygon above with a finer 11×11 grid: the trimmed mean " +
         "FWHM is computed and labeled per cell instead of per quadrant. Only active if " +
         "\"Show Siril-style tilt overlay\" is also checked. Higher spatial resolution than " +
         "the 4 quadrants, but each cell only gets a fraction of the star field, so " +
         "individual cell values are noisier than the quadrant means - the tilt axis and the " +
         "console summary still use the more robust 4-quadrant computation regardless of this " +
         "setting.</p>";

      this.fwhmGridArcsecCheck = new CheckBox(this);
      this.fwhmGridArcsecCheck.text = "FWHM grid in arcseconds instead of pixels";
      this.fwhmGridArcsecCheck.checked = parameters.fwhmGridArcsec;
      this.fwhmGridArcsecCheck.toolTip =
         "<p>Shows the 11×11 grid values in arcseconds (″) instead of image pixels, using " +
         "206.265 × pixel pitch [µm] / focal length [mm]. Needs pixel pitch and focal length " +
         "on the General page (with SuperPixel debayering, twice the pitch is used automatically); falls " +
         "back to pixels with a console warning otherwise. Only affects the grid display.</p>";

      this.tiltAxisCheck = new CheckBox(this);
      this.tiltAxisCheck.text = "Show tilt axis";
      this.tiltAxisCheck.checked = parameters.showTiltAxis;
      this.tiltAxisCheck.toolTip =
         "<p>Draws the light-blue tilt axis through the sensor center, derived from the " +
         "4-quadrant FWHM evaluation, with its angle/direction label. Only active if " +
         "\"Show Siril-style tilt overlay\" is also checked.</p>";

      // ---- Optics (General page) -----------------------------------------

      // Optional inputs for the tilt angle computation (in degrees). All
      // three fields must be > 0, otherwise the computation is skipped -
      // purely optional, the rest of the script works unchanged without
      // these values.
      this.opticsFromHeaderCheck = new CheckBox(this);
      this.opticsFromHeaderCheck.text = "Read the values from the FITS header";
      this.opticsFromHeaderCheck.checked = parameters.opticsFromHeader;
      this.opticsFromHeaderCheck.toolTip =
         "<p>Uses XPIXSZ (pixel pitch, by convention including binning), FOCALLEN and APTDIA " +
         "(or FOCALLEN/FOCRATIO) from the target image's FITS header. The fields below are " +
         "filled in when a target image is selected; values found in the header take " +
         "precedence at run time, the fields remain the fallback for missing keywords. Always " +
         "the physical sensor pitch - the doubling after SuperPixel debayering is applied " +
         "automatically.</p>";

      this.pixelPitchLabel = fieldLabel("Pixel pitch (µm):");
      this.pixelPitchSpin = new NumericEdit(this);
      this.pixelPitchSpin.setRange(0, 50);
      this.pixelPitchSpin.setValue(parameters.pixelPitchUm);
      this.pixelPitchSpin.setPrecision(2);
      this.pixelPitchSpin.toolTip =
         "<p>Physical pixel size of the sensor in micrometers (e.g. 4.31 for a Canon EOS 550D). " +
         "0 = not specified, the tilt angle computation is then skipped. Always enter the " +
         "physical sensor pitch - with SuperPixel debayering the script automatically uses " +
         "twice this value (one output pixel = 2x2 sensor pixels).</p>";

      this.focalLengthLabel = fieldLabel("Focal length (mm):");
      this.focalLengthSpin = new NumericEdit(this);
      this.focalLengthSpin.setRange(0, 10000);
      this.focalLengthSpin.setValue(parameters.focalLengthMm);
      this.focalLengthSpin.setPrecision(0);
      this.focalLengthSpin.toolTip = "<p>Focal length of the telescope in mm (e.g. 750 for a Skywatcher 150P).</p>";

      this.apertureLabel = fieldLabel("Aperture (mm):");
      this.apertureSpin = new NumericEdit(this);
      this.apertureSpin.setRange(0, 2000);
      this.apertureSpin.setValue(parameters.apertureMm);
      this.apertureSpin.setPrecision(0);
      this.apertureSpin.toolTip =
         "<p>Aperture of the telescope in mm (e.g. 150 for a Skywatcher 150P). " +
         "Together with the focal length, this gives the f-number (focal length/aperture).</p>";

      // The optical system decides the wording of the assessment where the
      // direction of a correction depends on it (see assessImage()).
      this.opticsTypeLabel = fieldLabel("Optics type:");
      this.opticsTypeCombo = new ComboBox(this);
      for (let i = 0; i < OPTICS_TYPES.length; ++i)
         this.opticsTypeCombo.addItem(OPTICS_TYPES[i]);
      this.opticsTypeCombo.currentItem = Math.range(parameters.opticsType, 0, OPTICS_TYPES.length - 1);
      this.opticsTypeCombo.toolTip =
         "<p>The optical system, for the suggestions of the Assessment page. An uncorrected system " +
         "(e.g. a bare Newtonian) shows coma and field curvature by design; with a coma corrector, " +
         "field flattener or reducer, the same patterns point to its spacing. With Unknown, the " +
         "suggestions name both cases.</p>";

      // Fill the optics fields from the selected image's FITS header (only
      // the values actually found; the others keep what the user entered).
      this.applyHeaderOptics = function() {
         if (!d.opticsFromHeaderCheck.checked || !d.view || d.view.id.length === 0)
            return;
         let hdr = readOpticsFromHeader(d.view);
         if (hdr.pixelPitchUm > 0) d.pixelPitchSpin.setValue(hdr.pixelPitchUm);
         if (hdr.focalLengthMm > 0) d.focalLengthSpin.setValue(hdr.focalLengthMm);
         if (hdr.apertureMm > 0) d.apertureSpin.setValue(hdr.apertureMm);
      };
      this.opticsFromHeaderCheck.onCheck = function(checked) {
         if (checked)
            d.applyHeaderOptics();
         d.updateControls();
         d.refreshPreview();
      };
      this.applyHeaderOptics();

      this.tiltPlot3DCheck = new CheckBox(this);
      this.tiltPlot3DCheck.text = "3D sensor tilt plot";
      this.tiltPlot3DCheck.checked = parameters.show3DTiltPlot;
      this.tiltPlot3DCheck.toolTip =
         "<p>Opens a separate window with an isometric 2D graphic (PJSR has no true 3D): " +
         "a flat reference plane next to the tilted plane computed from the Δz values. " +
         "Created by Apply, not by Preview. Disabled until pixel pitch, focal length and " +
         "aperture are set.</p>";

      // ---- Coma ----------------------------------------------------------

      // PSF asymmetry / coma field
      this.measureAsymmetryCheck = new CheckBox(this);
      this.measureAsymmetryCheck.text = "Measure PSF asymmetry (coma direction, coma-free point)";
      this.measureAsymmetryCheck.checked = parameters.measureAsymmetry;
      this.measureAsymmetryCheck.toolTip =
         "<p>Gaussian/Moffat fits are point-symmetric and cannot show on which side of the core " +
         "a comatic flare sits. This option measures the flux centroid and the third moment of " +
         "each star directly on the pixels relative to the PSF-fit center, draws the median " +
         "flare direction on a coarse grid (orange arrows), fits the coma field " +
         "v = k·(P − P0) and marks the coma-free point P0 (magenta) with its bootstrap " +
         "uncertainty. Adds a few seconds of runtime.</p>";

      this.comaStreamlinesCheck = new CheckBox(this);
      this.comaStreamlinesCheck.text = "Show coma streamlines (orange with arrows)";
      this.comaStreamlinesCheck.checked = parameters.showComaStreamlines;
      this.comaStreamlinesCheck.toolTip =
         "<p>Streamlines through the smoothed PSF-asymmetry field (flare direction) instead of the " +
         "ellipse orientation. Unlike the elongation streamlines they have a real direction " +
         "(arrowheads) and stop where the coma becomes weak. Under-corrected coma: lines diverge " +
         "from the coma-free point (source); over-corrected: they converge on it (sink). " +
         "Deviations from straight radial lines show what a simple coma model cannot, e.g. a " +
         "tilted corrector. Requires \"Measure PSF asymmetry\".</p>";

      this.comaStreamlineRadiusLabel = fieldLabel("Smoothing radius (%):");
      this.comaStreamlineRadiusSpin = new NumericEdit(this);
      this.comaStreamlineRadiusSpin.setRange(5, 60);
      this.comaStreamlineRadiusSpin.setValue(parameters.comaStreamlineRadiusPercent);
      this.comaStreamlineRadiusSpin.setPrecision(1);
      this.comaStreamlineRadiusSpin.toolTip =
         "<p>Smoothing radius of the asymmetry field, in % of the image diagonal. The per-star " +
         "asymmetry is much noisier than the ellipse orientation, so this radius should be " +
         "larger than the one for the elongation streamlines (default: about twice).</p>";

      this.comaStreamlineMinLabel = fieldLabel("Stop below (%):");
      this.comaStreamlineMinSpin = new NumericEdit(this);
      this.comaStreamlineMinSpin.setRange(0, 90);
      this.comaStreamlineMinSpin.setValue(parameters.comaStreamlineMinPercent);
      this.comaStreamlineMinSpin.setPrecision(0);
      this.comaStreamlineMinSpin.toolTip =
         "<p>A line ends where the smoothed asymmetry drops below this percentage of the field's " +
         "strength (90th percentile over the seed points). Higher = only the clearly comatic " +
         "regions, lower = lines reach further into the coma-free zone (noisier).</p>";

      this.comaArrowsCheck = new CheckBox(this);
      this.comaArrowsCheck.text = "Show coma arrows (median per grid cell, length = strength)";
      this.comaArrowsCheck.checked = parameters.showComaArrows;
      this.comaArrowsCheck.toolTip =
         "<p>Orange arrows on a 9×6 grid with the median flare direction per cell. Unlike the " +
         "streamlines, their length shows the strength directly. Requires \"Measure PSF " +
         "asymmetry\".</p>";

      this.starAsymArrowsCheck = new CheckBox(this);
      this.starAsymArrowsCheck.text = "Show one asymmetry arrow per star";
      this.starAsymArrowsCheck.checked = parameters.showStarAsymArrows;
      this.starAsymArrowsCheck.toolTip =
         "<p>Draws the measured flare direction of every star as an arrow from the star center " +
         "(length = strength, scaled with the vector scale), for a star-by-star comparison with " +
         "the ellipses. Default color: alignment with the ellipse axis - green = parallel (coma " +
         "shapes the star), red = perpendicular (elongation from defocus/field curvature/" +
         "astigmatism), gray = star nearly round. Arrows below the threshold are hidden. " +
         "Requires \"Measure PSF asymmetry\".</p>";

      this.starAsymMinLabel = fieldLabel("Min. strength (sigma):");
      this.starAsymMinSpin = new NumericEdit(this);
      this.starAsymMinSpin.setRange(0, 10);
      this.starAsymMinSpin.setValue(parameters.starAsymMinSigma);
      this.starAsymMinSpin.setPrecision(1);
      this.starAsymMinSpin.toolTip =
         "<p>The per-star asymmetry is noisy. Its noise is estimated from the inner field, where " +
         "the coma is close to zero; only arrows stronger than this many sigma are drawn. " +
         "0 = draw all.</p>";

      this.starAsymColorCheck = new CheckBox(this);
      this.starAsymColorCheck.text = "Color by strength instead of alignment";
      this.starAsymColorCheck.checked = parameters.starAsymColorByStrength;

      // ---- Output --------------------------------------------------------

      // Export CSV
      this.exportCheck = new CheckBox(this);
      this.exportCheck.text = "Export data table as CSV (system temp directory)";
      this.exportCheck.checked = parameters.doExport;

      // Debug
      this.debugCheck = new CheckBox(this);
      this.debugCheck.text = "Print raw data of the first PSF row to the console (debug)";
      this.debugCheck.checked = parameters.debug;

      // Options that only take effect together with another one are
      // disabled while that one is off (their values are kept).
      this.updateControls = function() {
         // Only a single-channel image can be a Bayer mosaic.
         d.debayerCheck.enabled = !d.isColorTarget();
         let debayer = d.debayerCheck.enabled && d.debayerCheck.checked;
         d.bayerPatternLabel.enabled = debayer;
         d.bayerPatternCombo.enabled = debayer;
         d.closeWindowsCheck.enabled = debayer;

         d.streamlineRadiusLabel.enabled = d.streamlinesCheck.checked;
         d.streamlineRadiusSpin.enabled = d.streamlinesCheck.checked;
         d.orientationHeatmapDegreeLabel.enabled = d.orientationHeatmapCheck.checked;
         d.orientationHeatmapDegreeSpin.enabled = d.orientationHeatmapCheck.checked;

         let tilt = d.sirilTiltCheck.checked;
         d.fwhmGridCheck.enabled = tilt;
         d.fwhmGridArcsecCheck.enabled = tilt && d.fwhmGridCheck.checked;
         d.tiltAxisCheck.enabled = tilt;

         let asym = d.measureAsymmetryCheck.checked;
         let comaLines = asym && d.comaStreamlinesCheck.checked;
         let starArrows = asym && d.starAsymArrowsCheck.checked;
         d.comaStreamlinesCheck.enabled = asym;
         d.comaStreamlineRadiusLabel.enabled = comaLines;
         d.comaStreamlineRadiusSpin.enabled = comaLines;
         d.comaStreamlineMinLabel.enabled = comaLines;
         d.comaStreamlineMinSpin.enabled = comaLines;
         d.comaArrowsCheck.enabled = asym;
         d.starAsymArrowsCheck.enabled = asym;
         d.starAsymMinLabel.enabled = starArrows;
         d.starAsymMinSpin.enabled = starArrows;
         d.starAsymColorCheck.enabled = starArrows;

         // The 3D plot needs all three optics values (filled in from the
         // FITS header when that option is set).
         d.tiltPlot3DCheck.enabled = d.pixelPitchSpin.value > 0 && d.focalLengthSpin.value > 0 &&
            d.apertureSpin.value > 0;
      };

      this.isColorTarget = function() {
         return d.view !== null && d.view !== undefined && d.view.id.length > 0 && d.view.image.isColor;
      };

      // The dialog's settings as an object with the names of
      // ScriptParameters, as processView() takes them.
      this.collectParameters = function() {
         return {
            threshold: d.thresholdSpin.value,
            radius: d.radiusSpin.value,
            useMoffat: d.moffatCheck.checked,
            vectorScale: d.scaleSpin.value,
            doExport: d.exportCheck.checked,
            debug: d.debugCheck.checked,
            debayer: d.debayerCheck.checked, // kept for mono images; analyzeView() skips it for color ones
            bayerPattern: d.bayerPatternItems[d.bayerPatternCombo.currentItem],
            closeIntermediateWindows: d.closeWindowsCheck.checked,
            madOutlierFactor: d.madSpin.value,
            maxCandidates: d.maxCandSpin.value,
            showSirilTilt: d.sirilTiltCheck.checked,
            showStreamlines: d.streamlinesCheck.checked,
            streamlineRadiusPercent: d.streamlineRadiusSpin.value,
            pixelPitchUm: d.pixelPitchSpin.value,
            focalLengthMm: d.focalLengthSpin.value,
            apertureMm: d.apertureSpin.value,
            show3DTiltPlot: d.tiltPlot3DCheck.checked,
            showOrientationHeatmap: d.orientationHeatmapCheck.checked,
            orientationHeatmapDegree: d.orientationHeatmapDegreeSpin.value,
            showFwhmGrid: d.fwhmGridCheck.checked,
            fwhmGridArcsec: d.fwhmGridArcsecCheck.checked,
            opticsFromHeader: d.opticsFromHeaderCheck.checked,
            showStarAsymArrows: d.starAsymArrowsCheck.checked,
            starAsymMinSigma: d.starAsymMinSpin.value,
            starAsymColorByStrength: d.starAsymColorCheck.checked,
            hideEllipses: !d.showEllipsesCheck.checked,
            showTiltAxis: d.tiltAxisCheck.checked,
            subtractTracking: d.subtractTrackingCheck.checked,
            measureAsymmetry: d.measureAsymmetryCheck.checked,
            showComaStreamlines: d.comaStreamlinesCheck.checked,
            comaStreamlineRadiusPercent: d.comaStreamlineRadiusSpin.value,
            comaStreamlineMinPercent: d.comaStreamlineMinSpin.value,
            showComaArrows: d.comaArrowsCheck.checked,
            opticsType: d.opticsTypeCombo.currentItem
         };
      };

      // Every change of a setting updates the dependent controls and
      // redraws the preview when it shows a vector map (refreshPreview).
      let settingChanged = function() {
         d.updateControls();
         d.refreshPreview();
      };
      [this.debayerCheck, this.closeWindowsCheck, this.moffatCheck, this.showEllipsesCheck,
       this.subtractTrackingCheck, this.streamlinesCheck, this.orientationHeatmapCheck,
       this.sirilTiltCheck, this.fwhmGridCheck, this.fwhmGridArcsecCheck, this.tiltAxisCheck,
       this.tiltPlot3DCheck, this.measureAsymmetryCheck, this.comaStreamlinesCheck,
       this.comaArrowsCheck, this.starAsymArrowsCheck, this.starAsymColorCheck,
       this.exportCheck, this.debugCheck].forEach(function(c) { c.onCheck = settingChanged; });
      [this.thresholdSpin, this.radiusSpin, this.maxCandSpin, this.madSpin, this.scaleSpin,
       this.streamlineRadiusSpin, this.orientationHeatmapDegreeSpin, this.pixelPitchSpin,
       this.focalLengthSpin, this.apertureSpin, this.comaStreamlineRadiusSpin,
       this.comaStreamlineMinSpin, this.starAsymMinSpin].forEach(function(c) { c.onValueUpdated = settingChanged; });
      this.bayerPatternCombo.onItemSelected = settingChanged;
      this.opticsTypeCombo.onItemSelected = settingChanged;

      // New Instance (blue drag icon): drops a process icon with the
      // current settings on the workspace. Dragging directly onto a
      // target image is currently not supported by PixInsight for script
      // processes (results in "execute a Script instance recursively") -
      // instead: drop the icon on the workspace, close the dialog, later
      // reopen it with the same settings by double-clicking the icon.
      this.newInstanceButton = new ToolButton(this);
      this.newInstanceButton.icon = this.scaledResource(":/process-interface/new-instance.png");
      this.newInstanceButton.setScaledFixedSize(20, 20);
      this.newInstanceButton.toolTip =
         "<p>Drop the current settings as a process icon on the workspace. " +
         "Double-clicking the dropped icon later reopens the dialog with " +
         "the same settings.</p>" +
         "<p><b>Note:</b> Dragging directly onto an image is not supported for script " +
         "processes in current PixInsight versions.</p>";
      this.newInstanceButton.onMousePress = () => {
         this.hasFocus = true;

         parameters.assign(d.collectParameters());
         parameters.SaveParameters();

         this.pushed = false;
         this.dialog.newInstance();
      };

      // Buttons
      // The analysis of the last Preview (see analyzeView()) is kept while
      // the dialog is open. Switching layers or changing their settings
      // then only redraws the map; Preview and Apply reuse it as long as
      // the detection settings and the target image are unchanged.
      this.analysis = null;
      this.previewStale = false; // the detection settings differ from those of the kept analysis

      this.keptAnalysis = function(p) {
         return (d.analysis && d.analysis.key === analysisKey(d.view, p)) ? d.analysis : null;
      };

      this.showMap = function(bmp) {
         d.previewStale = false;
         d.setPreviewBitmap(bmp, "Preview of <i>" + d.analysis.targetViewId + "</i>");
      };

      // Redraws the vector map in the preview from the kept analysis, or
      // marks it as outdated when the detection settings have changed.
      this.refreshPreview = function() {
         if (!d.analysis)
            return;
         let p = d.collectParameters();
         if (d.keptAnalysis(p) === null) {
            if (!d.previewStale) {
               d.previewStale = true;
               d.preview.setStatusMessage("<b>Detection settings changed</b> - click Preview to update the map");
            }
            return;
         }
         DEBUG_DUMP_RAW = p.debug;
         let optics = resolveOptics(d.view, p, d.analysis.debayer, false);
         d.showMap(renderVectorMap(d.analysis, p, optics, false));
         d.updateAssessment();
      };

      // The Assessment page: the assessment of the kept analysis with the
      // current settings (tracking subtraction, optics, optics type), computed
      // again without console output whenever a setting changes.
      this.assessmentBox = new TextBox(this);
      this.assessmentBox.readOnly = true;
      this.assessmentBox.setScaledMinSize(300, 200);
      this.updateAssessment = function() {
         if (!d.analysis) {
            d.assessmentBox.text = "<i>Click Preview to assess the image.</i>";
            return;
         }
         let p = d.collectParameters();
         let optics = resolveOptics(d.view, p, d.analysis.debayer, false);
         let report = reportAnalysis(d.analysis, starsFor(d.analysis, p.subtractTracking), p, optics, SILENT_CONSOLE);
         d.assessmentBox.text = formatAssessment(assessImage(report.metrics, p.opticsType));
      };

      this.checkTarget = function() {
         if (d.view && d.view.id.length > 0)
            return true;
         (new MessageBox("Please select a target image first.", TITLE, StdIcon.Error, StdButton.Ok)).execute();
         return false;
      };

      this.previewButton = new PushButton(this);
      this.previewButton.text = "Preview";
      this.previewButton.toolTip =
         "<p>Runs the analysis with the current settings and shows the vector map in the " +
         "preview, without opening a window, exporting the CSV file or drawing the 3D plot. " +
         "The PSF asymmetry is always measured, so that the coma layers can be switched on " +
         "later.</p>" +
         "<p>After that, the layers and their settings can be changed without measuring the " +
         "stars again: the preview is redrawn at once. Only a change of the detection " +
         "settings or the target image needs a new Preview.</p>";
      this.previewButton.onClick = function() {
         if (!d.checkTarget())
            return;
         let p = d.collectParameters();
         let result = d.runBusy(function() { return processView(d.view, p, true, d.keptAnalysis(p), d.viewBitmap); });
         if (result) {
            d.analysis = result.analysis;
            d.updateTrackingInfo();
            d.showMap(result.bitmap);
            d.assessmentBox.text = formatAssessment(result.assessment);
         }
      };

      this.applyButton = new PushButton(this);
      this.applyButton.text = "Apply";
      this.applyButton.toolTip = "<p>Opens the vector map in a new window. The star measurement " +
         "of the preview is reused when its detection settings are still current.</p>";
      this.applyButton.onClick = function() {
         if (!d.checkTarget())
            return;
         let p = d.collectParameters();
         let result = d.runBusy(function() { return processView(d.view, p, false, d.keptAnalysis(p), d.viewBitmap); });
         d.done(result ? 1 : 0);
      };

      this.cancelButton = new PushButton(this);
      this.cancelButton.text = "Cancel";
      this.cancelButton.onClick = function() {
         d.done(0);
      };

      // Progress bar of a Preview/Apply run, right of the New Instance
      // button; hidden while nothing is computed. PJSR has no progress bar
      // control, so it is drawn here.
      this.progressText = null;
      this.progressFraction = 0;
      this.progressBar = new Control(this);
      this.progressBar.setScaledFixedSize(340, 20);
      this.progressBar.visible = false;
      this.progressBar.onPaint = function(x0, y0, x1, y1) {
         if (d.progressText === null)
            return;
         let g = new Graphics(this);
         let w = this.width, h = this.height;
         g.fillRect(0, 0, w, h, new Brush(0xffd8d8d8));
         g.fillRect(0, 0, Math.round(w * d.progressFraction), h, new Brush(0xff6fa8dc));
         g.pen = new Pen(0xff808080);
         g.drawRect(0, 0, w - 1, h - 1);
         g.pen = new Pen(0xff000000);
         let text = format("%s ... %d%%", d.progressText, Math.round(100 * d.progressFraction));
         g.drawText((w - this.font.width(text)) / 2, (h + this.font.ascent - this.font.descent) / 2, text);
         g.end();
      };

      // Progress listener (see Progress): repaints the bar and lets the
      // dialog process its events, so that it stays responsive.
      this.progressListener = function(text, fraction) {
         d.progressText = text;
         d.progressFraction = fraction;
         d.progressBar.visible = text !== null;
         d.progressBar.repaint();
         CoreApplication.processEvents();
      };

      // Runs a computation with the progress bar shown. The parameters and
      // buttons are disabled meanwhile: processing events would otherwise
      // let a second Preview start in the middle of the first.
      this.runBusy = function(task) {
         let controls = [d.parameters_TabBox, d.previewButton, d.applyButton, d.cancelButton,
                         d.newInstanceButton, d.preview];
         controls.forEach(function(c) { c.enabled = false; });
         Progress.listener = d.progressListener;
         try {
            return task();
         } finally {
            Progress.finish();
            Progress.listener = null;
            controls.forEach(function(c) { c.enabled = true; });
         }
      };

      let buttonRow = new HorizontalSizer;
      buttonRow.spacing = 6;
      buttonRow.add(this.newInstanceButton);
      buttonRow.add(this.progressBar);
      buttonRow.addStretch();
      buttonRow.add(this.previewButton);
      buttonRow.add(this.applyButton);
      buttonRow.add(this.cancelButton);


      // ---- Preview -------------------------------------------------------

      // The target image or the vector map, stretched for display, in the
      // standard PJSR image view: zoom buttons, mouse wheel zoom, scroll
      // bars and dragging, as in AperturePhotometry.
      this.preview = new ImageView(this);
      // The free room around an image smaller than the view takes the
      // dialog's background color instead of the default dark gray.
      if ((this.backgroundColor & 0x00ffffff) !== 0)
         this.preview.viewportCanvasColor = this.backgroundColor;

      // ImageView zooms in 1:n steps only, so its own zoom to fit leaves the
      // image well smaller than the view. Here, fitting shows the bitmap
      // scaled to exactly fill the view (at ImageView's 1:1) and follows the
      // size of the view; the zoom buttons and the mouse wheel leave the
      // fitted view for the next 1:n step of the full bitmap.
      const PREVIEW_FIT_SOURCE_SIZE = 3000; // longer side of the copy fitted views are scaled from
      this.previewFull = null;      // the bitmap shown, at full size
      this.previewFitSource = null; // a reduced copy of it, for fast refitting
      this.previewFitting = true;   // the fitted view is shown
      this.previewFitScale = 1;     // fitted view: scale of previewFull on the screen
      let viewport = this.preview.scrollbox.viewport;

      this.fitPreview = function() {
         let full = d.previewFull;
         if (!full || viewport.width <= 0 || viewport.height <= 0)
            return;
         d.previewFitting = true;
         let k = Math.min(viewport.width / full.width, viewport.height / full.height);
         if (k >= 1) {
            d.previewFitScale = 1;
            d.preview.setImage(full);
            return;
         }
         let fw = Math.max(1, Math.floor(full.width * k)), fh = Math.max(1, Math.floor(full.height * k));
         d.previewFitScale = fw / full.width;
         d.preview.setImage(d.previewFitSource.scaledTo(fw, fh));
         d.preview.zoomVal_Label.text = format("1:%.2f", 1 / d.previewFitScale);
      };

      // Leaves the fitted view for the full bitmap at the 1:n (or n:1) zoom
      // next to the fitted scale: direction +1 larger, -1 smaller, 0 1:1.
      this.leaveFit = function(direction) {
         let s = d.previewFitScale;
         let zoom = 1;
         if (direction > 0)
            zoom = (s >= 1) ? 2 : ((Math.ceil(1 / s) - 1 > 1) ? -(Math.ceil(1 / s) - 1) : 1);
         else if (direction < 0)
            zoom = (s >= 1) ? -2 : -(Math.floor(1 / s) + 1);
         d.previewFitting = false;
         d.preview.setImage(d.previewFull);
         if (zoom !== 1)
            d.preview.regenerate(null, zoom);
      };

      this.preview.zoomIn_Button.onMousePress = function() {
         if (d.previewFitting)
            d.leaveFit(+1);
         else
            d.preview.zoomIn();
      };
      this.preview.zoomOut_Button.onMousePress = function() {
         if (d.previewFitting)
            d.leaveFit(-1);
         else
            d.preview.zoomOut();
      };
      this.preview.zoom11_Button.onMousePress = function() {
         if (d.previewFitting)
            d.leaveFit(0);
         else
            d.preview.zoom1_1();
      };
      this.preview.zoomFit_Button.onMousePress = function() {
         d.fitPreview();
      };

      // ImageView's own viewport handlers are kept and extended.
      let imageViewWheel = viewport.onMouseWheel;
      viewport.onMouseWheel = function(x, y, delta, buttonState, modifiers) {
         if (d.previewFitting)
            d.leaveFit((delta > 0) ? -1 : +1);
         else if (typeof imageViewWheel === "function")
            imageViewWheel.call(this, x, y, delta, buttonState, modifiers);
      };
      let imageViewResize = viewport.onResize;
      viewport.onResize = function(newWidth, newHeight) {
         if (typeof imageViewResize === "function")
            imageViewResize.call(this, newWidth, newHeight);
         if (d.previewFitting)
            d.fitPreview();
      };
      // The coordinates readout of a fitted view in pixels of the full bitmap.
      let imageViewMove = viewport.onMouseMove;
      viewport.onMouseMove = function(x, y, buttonState, modifiers) {
         if (typeof imageViewMove === "function")
            imageViewMove.call(this, x, y, buttonState, modifiers);
         if (d.previewFitting && d.previewFitScale < 1 && d.preview.xValue_Label.text !== "---") {
            let pt = d.preview.viewportToImage(x, y);
            d.preview.xValue_Label.text = format("%8.2f", pt.x / d.previewFitScale);
            d.preview.yValue_Label.text = format("%8.2f", pt.y / d.previewFitScale);
         }
      };

      // Shows a bitmap in the preview. A bitmap of the same size replaces
      // the one shown without changing zoom and position (switching layers,
      // the map of the image shown); another size is fitted into the view.
      this.setPreviewBitmap = function(bmp, status) {
         if (bmp === null) {
            d.previewFull = d.previewFitSource = null;
            d.preview.clear();
            d.preview.forceRedraw();
         } else {
            let sameSize = d.previewFull !== null &&
               d.previewFull.width === bmp.width && d.previewFull.height === bmp.height;
            d.previewFull = bmp;
            let k = Math.min(1, PREVIEW_FIT_SOURCE_SIZE / Math.max(bmp.width, bmp.height));
            d.previewFitSource = (k < 1) ?
               bmp.scaledTo(Math.max(1, Math.round(bmp.width * k)), Math.max(1, Math.round(bmp.height * k))) : bmp;
            if (!sameSize || d.previewFitting)
               d.fitPreview();
            else
               d.preview.regenerate(bmp);
         }
         d.preview.setStatusMessage(status || "");
      };

      // Shows the target image; a kept analysis belongs to the previous one.
      this.updatePreview = function() {
         d.analysis = null;
         d.updateTrackingInfo();
         d.updateAssessment();
         d.previewStale = false;
         let bmp = null;
         d.viewBitmap = null;
         if (d.view && d.view.id.length > 0) {
            try {
               bmp = d.viewBitmap = renderStretchedBitmap(d.view);
            } catch (x) {
               Console.warningln("Preview: " + x);
            }
         }
         d.setPreviewBitmap(bmp, bmp ? "<i>" + d.view.id + "</i>" : "No target image selected");
      };

      // ---- Layout --------------------------------------------------------

      // How to take a frame that the analysis can judge well. The analysis
      // takes the image center for the optical axis, needs stars in every
      // quadrant and ring, skips saturated stars and fits linear data.
      this.tipsLabel = new Label(this);
      this.tipsLabel.wordWrapping = true;
      this.tipsLabel.useRichText = true;
      this.tipsLabel.text =
         "<ul style='margin-left:-20px;'>" +
         "<li><b>Exposure:</b> single subframes of about 10-60 s: long enough for many stars with " +
         "good signal, short enough that seeing and tracking errors do not dominate. No saturated " +
         "stars (they are skipped).</li>" +
         "<li><b>Focus</b> carefully on the image center (Bahtinov mask or FWHM) and let the " +
         "optics reach thermal equilibrium first.</li>" +
         "<li><b>Star field:</b> rich and even up to the corners, above 45° altitude; avoid bright " +
         "nebulae and the Milky Way's dust lanes.</li>" +
         "<li><b>Unprocessed:</b> linear, not cropped, rotated, registered, drizzled or " +
         "deconvolved - the image center must stay the optical axis. Raw CFA frames: enable " +
         "Debayer.</li>" +
         "<li><b>Filter:</b> luminance or a mono camera's broadband filter; with a color camera, " +
         "the combined channels.</li>" +
         "<li><b>Compare</b> several frames, and after every adjustment; a stack blurs tracking " +
         "effects but also mixes frames with different guiding.</li>" +
         "</ul>";

      // Five pages: what all layers share (General), the star measurement
      // (Detection), the layers of the map, and the assessment. Each layer
      // starts with the check box that enables it - on top of its group box,
      // or of the page for the coma layers - which in turn enables its
      // settings (updateControls).
      this.general_Control = page(null, [
         groupBox("Target", [viewRow, infoRow]),
         groupBox("Debayer", [
            checkRow(this.debayerCheck),
            fieldRow(this.bayerPatternLabel, this.bayerPatternCombo),
            checkRow(this.closeWindowsCheck)]),
         groupBox("Optics", [
            fieldRow(this.opticsTypeLabel, this.opticsTypeCombo),
            checkRow(this.opticsFromHeaderCheck),
            fieldRow(this.pixelPitchLabel, this.pixelPitchSpin),
            fieldRow(this.focalLengthLabel, this.focalLengthSpin),
            fieldRow(this.apertureLabel, this.apertureSpin),
            checkRow(this.tiltPlot3DCheck)]),
         groupBox("Output", [
            checkRow(this.exportCheck),
            checkRow(this.debugCheck)]),
         groupBox("Tips for the test frame", [this.tipsLabel])
      ]);

      this.detection_Control = page(null, [
         groupBox("Star detection", [
            fieldRow(this.thresholdLabel, this.thresholdSpin),
            fieldRow(this.maxCandLabel, this.maxCandSpin)]),
         groupBox("PSF fit", [
            checkRow(this.moffatCheck),
            fieldRow(this.radiusLabel, this.radiusSpin),
            fieldRow(this.madLabel, this.madSpin)]),
         groupBox("Common tracking error", [
            trackingInfoRow,
            checkRow(this.subtractTrackingCheck)])
      ]);

      this.vectorMap_Control = page(null, [
         groupBox("Star ellipses", [
            this.showEllipsesCheck,
            fieldRow(this.scaleLabel, this.scaleSpin)]),
         groupBox("Streamlines", [
            this.streamlinesCheck,
            fieldRow(this.streamlineRadiusLabel, this.streamlineRadiusSpin)]),
         groupBox("Orientation heatmap", [
            this.orientationHeatmapCheck,
            fieldRow(this.orientationHeatmapDegreeLabel, this.orientationHeatmapDegreeSpin)]),
         groupBox("Tilt overlay", [
            this.sirilTiltCheck,
            checkRow(this.fwhmGridCheck),
            checkRow(this.fwhmGridArcsecCheck),
            checkRow(this.tiltAxisCheck)])
      ]);

      this.coma_Control = page(this.measureAsymmetryCheck, [
         groupBox("Coma field", [
            checkRow(this.comaStreamlinesCheck),
            fieldRow(this.comaStreamlineRadiusLabel, this.comaStreamlineRadiusSpin),
            fieldRow(this.comaStreamlineMinLabel, this.comaStreamlineMinSpin),
            checkRow(this.comaArrowsCheck)]),
         groupBox("Per-star arrows", [
            checkRow(this.starAsymArrowsCheck),
            fieldRow(this.starAsymMinLabel, this.starAsymMinSpin),
            checkRow(this.starAsymColorCheck)])
      ]);

      // The assessment fills its page.
      this.assessment_Control = new Control(this);
      this.assessment_Control.sizer = new VerticalSizer;
      this.assessment_Control.sizer.margin = 6;
      this.assessment_Control.sizer.add(this.assessmentBox, 100);

      this.parameters_TabBox = new TabBox(this);
      this.parameters_TabBox.addPage(this.general_Control, "General");
      this.parameters_TabBox.addPage(this.detection_Control, "Detection");
      this.parameters_TabBox.addPage(this.vectorMap_Control, "Elongation / FWHM");
      this.parameters_TabBox.addPage(this.coma_Control, "Coma");
      this.parameters_TabBox.addPage(this.assessment_Control, "Assessment");

      // The signature of the script, as in AperturePhotometry.
      this.information_Label = new Label(this);
      this.information_Label.cssId = "SCPInfoLabel";
      this.information_Label.minWidth = 45 * this.font.width('M');
      this.information_Label.wordWrapping = true;
      this.information_Label.useRichText = true;
      this.information_Label.text = "<p><b>" + TITLE + " version " + VERSION + "</b><br/>" +
         "Measures the shape of every star across the field - elongation, FWHM and coma " +
         "asymmetry - and maps sensor tilt, corrector spacing, collimation and tracking errors, " +
         "with an assessment and suggested corrections.</p>";

      // Preview and parameters side by side, with a splitter between them
      // whose position is remembered.
      this.content_Sizer = new HorizontalSizer;
      this.content_Sizer.add(this.preview, 100);
      this.panel_Splitter = new HorizontalSplitter(this, this.content_Sizer, this.preview, this.parameters_TabBox);
      this.panel_Splitter.settingsKey = SETTINGS_MODULE + "/panelFraction";
      this.content_Sizer.add(this.panel_Splitter);
      this.content_Sizer.add(this.parameters_TabBox);

      this.sizer = new VerticalSizer;
      this.sizer.margin = 8;
      this.sizer.spacing = 6;
      this.sizer.add(this.information_Label);
      this.sizer.add(this.content_Sizer, 100);
      this.sizer.addSpacing(2);
      this.sizer.add(buttonRow);

      this.userResizable = true;

      // The minimum size of the dialog is that of its contents with the
      // preview at 400x300 logical pixels (as in AperturePhotometry); it
      // opens larger, so the preview gets most of the room.
      this.preview.setScaledFixedSize(400, 300);
      this.ensureLayoutUpdated();
      this.adjustToContents();
      this.setMinSize();
      this.panel_Splitter.minFirstSize = this.preview.width;
      this.panel_Splitter.minSecondSize = this.parameters_TabBox.width;
      this.preview.setVariableSize();
      this.resize(this.logicalPixelsToPhysical(1150), this.logicalPixelsToPhysical(720));
      this.panel_Splitter.restoreState();
      this.onResize = function() { d.panel_Splitter.checkMinimumSize(d); };

      this.updateControls();
      this.updatePreview();

      // The view has its final size only once the dialog is shown.
      this.onShow = function() {
         d.fitPreview();
      };
   }
}

// -----------------------------------------------------------------------
function main() {
   Console.show();
   Console.writeln("=== " + TITLE + " v" + VERSION + " ===");

   // Adopt parameters previously saved via "New Instance" or recorded on
   // a process icon (if any).
   parameters.LoadParameters();

   if (Parameters.isViewTarget) {
      // The script instance was applied directly to a target image via
      // drag&drop ("blue triangle") - run without a dialog.
      processView(Parameters.targetView, parameters, false);
      return;
   }

   // The target image can be freely chosen in the dialog via the
   // ViewList - here it is enough for at least one image window to be open.
   let windows = ImageWindow.windows;
   if (windows.length === 0) {
      (new MessageBox("No open image window found.", TITLE, StdIcon.Error, StdButton.Ok)).execute();
      return;
   }

   let activeWindow = ImageWindow.activeWindow;
   let initialView = (activeWindow !== null) ? activeWindow.currentView : windows[0].mainView;

   let dialog = new StarAberrationDialog(initialView);
   dialog.execute();
   // Frees the bitmaps of the image view (see pjsr/controls/ImageView.js).
   dialog.preview.reset();
}

main();
