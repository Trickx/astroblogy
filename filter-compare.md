---
layout: default
title: Filter Comparison
permalink: /filter-compare/
---

<style>
  #main_content_wrap .inner {
    max-width: none;
    width: 100%;
    margin: 0;
    padding-left: 0;
    padding-right: 0;
  }

  #main_content {
    padding-top: 0;
  }

  .fc-app {
    width: 100%;
    box-sizing: border-box;
    padding: 14px 0 24px;
  }

  .fc-hero,
  .fc-panel {
    width: 100%;
    box-sizing: border-box;
  }

  .fc-panel-controls {
    max-width: 320px;
  }

  .fc-panel-plot {
    min-width: 0;
  }
</style>

<link rel="stylesheet" href="{{ '/assets/filter-app/app.css' | relative_url }}">

<nav class="category-links blog-top-links" aria-label="Blog navigation links">
  <div class="category-link-list">
    <a class="button" href="{{ '/blog/' | relative_url }}">Blog Home</a>
    <a class="button" href="{{ '/galerie/' | relative_url }}">Gallery</a>
  </div>
  <div class="category-action-links">
    <a class="button" href="{{ '/pixinsight-workflow/' | relative_url }}">PI Workflow</a>
    <a class="button" href="{{ '/filter-compare/' | relative_url }}">Filter Comparator</a>
    <a class="button contact-link" href="{{ '/contact/' | relative_url }}">Contact</a>
  </div>
</nav>

<div class="fc-app" id="fc-app">
  <header class="fc-hero">
    <h1>Astro Filter Comparator</h1>
    <p>Interactive comparison of filter transmission curves. Select one or more filters to overlay their curves.</p>
  </header>

  <section class="fc-grid">
    <section class="fc-panel fc-panel-controls">
      <div class="fc-toolbar">
        <div class="fc-toolbar-field">
          <label class="fc-label" for="fc-search">Search filter</label>
          <input id="fc-search" class="fc-input" type="search" placeholder="Type a name..." aria-label="Search filters">
        </div>
      </div>

      <div class="fc-toolbar-actions">
        <button id="fc-rgb-toggle" class="fc-button" type="button" aria-pressed="false">Show RGB filters</button>
      </div>

      <div id="fc-filter-list" class="fc-list" aria-live="polite"></div>
    </section>

    <div class="fc-panel fc-panel-plot">
      <canvas id="fc-canvas" aria-label="Transmission plot"></canvas>
      <div id="fc-empty" class="fc-empty">Select at least one filter to display curves.</div>
      <div id="fc-legend" class="fc-legend"></div>
    </div>
  </section>
</div>

<script>
  window.FILTER_APP_DATA_URL = "{{ '/assets/filter-app/filters-index.json' | relative_url }}";
</script>
<script src="{{ '/assets/filter-app/app.js' | relative_url }}"></script>
