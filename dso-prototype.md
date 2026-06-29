---
layout: default
title: DSO Prototype
permalink: /dso-prototype/
---

<link rel="stylesheet" href="{{ '/assets/dso-app/prototype.css' | relative_url }}">

<div class="dso-app" id="dso-app">
  <header class="dso-hero">
    <p class="dso-kicker">Prototype</p>
    <h1>DSO Planner from XLSM</h1>
    <p>
      This prototype reads the workbook directly in your browser and turns the Main sheet
      into a searchable, filterable DSO list.
    </p>
  </header>

  <section class="dso-grid">
    <aside class="dso-panel">
      <div class="dso-field">
        <label for="dso-search">Search</label>
        <input id="dso-search" type="search" placeholder="Name, type, telescope...">
      </div>

      <div class="dso-field-grid">
        <div class="dso-field">
          <label for="dso-type">Type</label>
          <select id="dso-type">
            <option value="">All</option>
          </select>
        </div>
        <div class="dso-field">
          <label for="dso-telescope">Telescope</label>
          <select id="dso-telescope">
            <option value="">All</option>
          </select>
        </div>
      </div>

      <div class="dso-field-grid">
        <div class="dso-field">
          <label for="dso-hemisphere">N/S</label>
          <select id="dso-hemisphere">
            <option value="">All</option>
            <option value="N">N</option>
            <option value="S">S</option>
          </select>
        </div>
        <div class="dso-field">
          <label for="dso-max-mag">Max mag</label>
          <input id="dso-max-mag" type="number" step="0.1" placeholder="e.g. 12.0">
        </div>
      </div>

      <div class="dso-field">
        <label for="dso-sort">Sort</label>
        <select id="dso-sort">
          <option value="name">Name (A-Z)</option>
          <option value="mag">Magnitude (bright first)</option>
          <option value="alt">Altitude (high first)</option>
          <option value="type">Type (A-Z)</option>
        </select>
      </div>

      <p class="dso-note">
        Source file: <code>dsobjects/Wann_was_womit_aufnehmen_v 3.40.xlsm</code>
      </p>
      <p id="dso-status" class="dso-status">Loading workbook...</p>
    </aside>

    <div class="dso-photo-container">
      <img id="dso-photo" class="dso-photo" src="" alt="Object photo">
    </div>

    <section class="dso-results">
      <div class="dso-results-top">
        <strong id="dso-count">0</strong>
        <span>objects</span>
      </div>
      <div class="dso-table-wrap">
        <table class="dso-table" id="dso-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Mag</th>
              <th>Size</th>
              <th>Alt</th>
              <th>N/S</th>
              <th>Transit</th>
            </tr>
          </thead>
          <tbody id="dso-table-body"></tbody>
        </table>
      </div>
    </section>
  </section>
</div>

<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script>
  window.DSO_XLSM_URL = "{{ '/dsobjects/Wann_was_womit_aufnehmen_v 3.40.xlsm' | relative_url }}";
</script>
<script src="{{ '/assets/dso-app/prototype.js' | relative_url }}"></script>