---
layout: default
title: PI Tools
permalink: /pi-tools/
---

<style>
  .pi-tools-intro {
    margin-bottom: 1.5rem;
  }

  .pi-tools-intro > p:last-child {
    max-width: 72ch;
    margin-bottom: 0;
    color: var(--muted);
    line-height: 1.7;
  }

  .pi-tool-list {
    padding: 0 1.5rem;
  }

  .pi-tool-entry {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(180px, 30%);
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid var(--line);
  }

  .pi-tool-entry:first-child {
    padding-top: 0.5rem;
  }

  .pi-tool-entry:last-child {
    border-bottom: 0;
  }

  .pi-tool-entry h2 {
    margin: 0 0 0.6rem;
    font-size: 1.45rem;
  }

  .pi-tool-entry h2 a:hover,
  .pi-tool-entry h2 a:focus-visible,
  .pi-tool-link:hover,
  .pi-tool-link:focus-visible {
    color: var(--accent);
  }

  .pi-tool-entry p {
    margin: 0 0 0.8rem;
    color: var(--muted);
    line-height: 1.7;
  }

  .pi-tool-link {
    color: var(--text);
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-underline-offset: 0.2em;
  }

  .pi-tool-entry img {
    width: 100%;
    max-height: 180px;
    object-fit: contain;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: rgba(5, 11, 20, 0.65);
  }

  .pi-tools-discontinued {
    padding: 0 1.5rem;
    margin-top: 1rem;
  }

  .pi-tools-discontinued h2 {
    margin: 0 0 0.6rem;
    font-size: 1.1rem;
    color: var(--muted);
  }

  .pi-tools-discontinued p {
    max-width: 72ch;
    margin: 0 0 0.8rem;
    color: var(--muted);
    line-height: 1.7;
  }

  @media (max-width: 640px) {
    .pi-tools-discontinued {
      padding: 0 1rem;
    }

    .pi-tool-list {
      padding: 0 1rem;
    }

    .pi-tool-entry {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .pi-tool-entry img {
      max-height: 220px;
    }
  }
</style>

<nav class="category-links blog-top-links" aria-label="Site navigation">
  <div class="category-link-list">
    <a class="button" href="{{ '/galerie/' | relative_url }}">Gallery</a>
    <a class="button" href="{{ '/blog/' | relative_url }}">Blog</a>
  </div>
  <div class="category-action-links">
    <a class="button" href="{{ '/pixinsight-workflow/' | relative_url }}">PI Workflow</a>
    <a class="button" href="{{ '/filter-compare/' | relative_url }}">Filter Comparator</a>
    <a class="button contact-link" href="{{ '/contact/' | relative_url }}">Contact</a>
  </div>
</nav>

<section class="section-intro pi-tools-intro">
  <p class="section-label">PixInsight</p>
  <h1>PI Tools</h1>
  <p>Scripts and processes for PixInsight. Each tool's page has the repository link, installation steps and further details.</p>
</section>

<section class="gallery-section pi-tool-list" aria-label="PixInsight tools">
  <article class="pi-tool-entry">
    <div>
      <h2><a href="{{ '/pi-scripts/CanonBandingReduction/' | relative_url }}">CanonBandingReduction</a></h2>
      <p>Reduces the horizontal banding that affects images from some Canon DSLRs by equalizing the background brightness of each row, with optional highlight protection. Georg Viehoever's original script has been ported to the current PJSR library, so it runs on PixInsight 1.9.4 and later, and now includes a preview with zoom and screen transfer function (STF) controls.</p>
      <a class="pi-tool-link" href="{{ '/pi-scripts/CanonBandingReduction/' | relative_url }}">Repository and installation</a>
    </div>
    <img src="{{ '/pi-scripts/CanonBandingReduction/CanonBandingReduction.png' | relative_url }}" alt="CanonBandingReduction script window with preview" loading="lazy">
  </article>

  <article class="pi-tool-entry">
    <div>
      <h2><a href="{{ '/pi-scripts/FilterZWOFit/' | relative_url }}">FilterZWOFit</a></h2>
      <p>ASIAIR cannot write filter information to the image header. FilterZWOFit lets you pick a filter from a predefined list and writes it to the FILTER keyword in the FITS header, either for the active image or in batch mode for all images in a selected folder.</p>
      <a class="pi-tool-link" href="{{ '/pi-scripts/FilterZWOFit/' | relative_url }}">Repository and installation</a>
    </div>
    <img src="{{ '/pi-scripts/FilterZWOFit/FilterZWOFit.png' | relative_url }}" alt="FilterZWOFit in PixInsight" loading="lazy">
  </article>

  <article class="pi-tool-entry">
    <div>
      <h2><a href="{{ '/pi-scripts/Finder/' | relative_url }}">Finder</a></h2>
      <p>A native PixInsight search window for all installed processes and PJSR scripts. Matches are filtered by name while typing and launched with Return or a double click. Finder can open when PixInsight starts and shrinks to a narrow search line while it does not have the focus.</p>
      <a class="pi-tool-link" href="{{ '/pi-scripts/Finder/' | relative_url }}">Repository and installation</a>
    </div>
    <img src="{{ '/pi-scripts/Finder/Finder.png' | relative_url }}" alt="Finder window listing processes that match the search text" loading="lazy">
  </article>

  <article class="pi-tool-entry">
    <div>
      <h2><a href="{{ '/pi-scripts/HistogramViewer/' | relative_url }}">HistogramViewer</a></h2>
      <p>A native PixInsight histogram and statistics viewer that follows the active image. It offers RGB and grayscale views, logarithmic axes, zoom and range controls, percentiles and clipping statistics. A native PCL port of Seti Astro's original histogram tool; it replaces the earlier PJSR script Histogram.</p>
      <a class="pi-tool-link" href="{{ '/pi-scripts/HistogramViewer/' | relative_url }}">Repository and installation</a>
    </div>
    <img src="{{ '/pi-scripts/HistogramViewer/Histogram.png' | relative_url }}" alt="HistogramViewer window" loading="lazy">
  </article>

  <article class="pi-tool-entry">
    <div>
      <h2><a href="{{ '/pi-scripts/RemovePedestal/' | relative_url }}">RemovePedestal</a></h2>
      <p>Subtracts a constant pedestal from an image, based on the minimum, a low percentile or the first non-zero value. The pedestal can be calculated per channel or globally; the result is clipped to [0, 1]. Also ported from Seti Astro Suite Pro.</p>
      <a class="pi-tool-link" href="{{ '/pi-scripts/RemovePedestal/' | relative_url }}">Repository and installation</a>
    </div>
    <img src="{{ '/pi-scripts/RemovePedestal/RemovePedestal.png' | relative_url }}" alt="RemovePedestal script window" loading="lazy">
  </article>

  <article class="pi-tool-entry">
    <div>
      <h2><a href="{{ '/pi-scripts/StarAberrationDiagnostics/' | relative_url }}">StarAberrationDiagnostics</a></h2>
      <p>Uses star shapes across the field to diagnose optical and tracking problems such as sensor tilt, incorrect corrector spacing, field curvature, coma and tracking errors. It can also analyze a series of frames.</p>
      <a class="pi-tool-link" href="{{ '/pi-scripts/StarAberrationDiagnostics/' | relative_url }}">Repository, installation and handbook</a>
    </div>
    <img src="{{ '/pi-scripts/StarAberrationDiagnostics/StarAberrationDiagnostics.png' | relative_url }}" alt="StarAberrationDiagnostics vector map preview" loading="lazy">
  </article>

  <article class="pi-tool-entry">
    <div>
      <h2><a href="{{ '/pi-scripts/Temp4DarksMatter/' | relative_url }}">Temp4DarksMatter</a></h2>
      <p>Lets owners of uncooled DSLR and mirrorless cameras match dark frames to light frames by temperature. The script recursively scans folders of light and dark frames and writes a CAL-TEMP FITS keyword, derived from CCD-TEMP using a configurable rounding step and a fallback temperature. PixInsight's WBPP script uses CAL-TEMP to pair darks with lights.</p>
      <a class="pi-tool-link" href="{{ '/pi-scripts/Temp4DarksMatter/' | relative_url }}">Repository and installation</a>
    </div>
    <img src="{{ '/pi-scripts/Temp4DarksMatter/Temp4DarksMatter.png' | relative_url }}" alt="Temp4DarksMatter script window" loading="lazy">
  </article>
</section>

<section class="pi-tools-discontinued" aria-label="Discontinued tools">
  <h2>Discontinued</h2>
  <p><strong>Histogram</strong> (PJSR script): discontinued in October 2026 and replaced by the native module <a class="pi-tool-link" href="{{ '/pi-scripts/HistogramViewer/' | relative_url }}">HistogramViewer</a>. Its update repository is offline; if you added it in PixInsight, remove the entry under Resources &gt; Updates &gt; Manage Repositories. <a class="pi-tool-link" href="{{ '/pi-scripts/Histogram/' | relative_url }}">Details</a></p>
</section>