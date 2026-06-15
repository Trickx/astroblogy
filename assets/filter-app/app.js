(function () {
  const dataUrl = window.FILTER_APP_DATA_URL || "assets/filter-app/filters-index.json";
  const canvas = document.getElementById("fc-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const listEl = document.getElementById("fc-filter-list");
  const legendEl = document.getElementById("fc-legend");
  const searchEl = document.getElementById("fc-search");
  const rgbToggleEl = document.getElementById("fc-rgb-toggle");
  const emptyEl = document.getElementById("fc-empty");

  const palette = [
    "#0f766e", "#b45309", "#1d4ed8", "#be185d", "#4d7c0f", "#7c3aed",
    "#0f172a", "#047857", "#92400e", "#334155", "#c026d3", "#0369a1",
    "#b91c1c", "#15803d", "#6d28d9", "#0f766e"
  ];

  const state = {
    all: [],
    visible: [],
    selectedIds: new Set(),
    showRgbFilters: false,
    filterCache: new Map(),
    indexBaseUrl: null,
    canvasWidth: 0,
    canvasHeight: 0,
  };

  function absoluteDataUrl(relativePath) {
    if (!state.indexBaseUrl) return relativePath;
    return new URL(relativePath, state.indexBaseUrl).toString();
  }

  function resizeCanvas() {
    const container = canvas.parentElement;
    if (!container) return;

    const width = Math.max(720, Math.floor(container.clientWidth));
    const legendHeight = legendEl ? Math.ceil(legendEl.getBoundingClientRect().height) : 0;
    const availableHeight = container.clientHeight - legendHeight - 20;
    const height = Math.max(320, Math.floor(availableHeight));

    if (width === state.canvasWidth && height === state.canvasHeight) {
      return;
    }

    state.canvasWidth = width;
    state.canvasHeight = height;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
  }

  function colorFor(index) {
    return palette[index % palette.length];
  }

  function displayFilterName(name) {
    return String(name || "").replace(/\s*\((?:FITS|CSV)\)$/i, "").trim();
  }

  function isRgbFilter(filter) {
    return /_([RGB])$/i.test(filter.id) || /_([RGB])$/i.test(filter.name) || /_([RGB])$/i.test(filter.fileName);
  }

  function syncRgbToggleLabel() {
    if (!rgbToggleEl) return;
    const label = state.showRgbFilters ? "Hide RGB filters" : "Show RGB filters";
    rgbToggleEl.textContent = label;
    rgbToggleEl.setAttribute("aria-pressed", String(state.showRgbFilters));
    rgbToggleEl.setAttribute("aria-label", label);
  }

  function buildList() {
    const q = (searchEl.value || "").trim().toLowerCase();
    state.visible = state.all.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(q) || f.fileName.toLowerCase().includes(q);
      const matchesRgbVisibility = state.showRgbFilters || !isRgbFilter(f);
      return matchesSearch && matchesRgbVisibility;
    });

    listEl.innerHTML = "";
    const frag = document.createDocumentFragment();
    state.visible.forEach((f) => {
      const row = document.createElement("label");
      row.className = "fc-item";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.selectedIds.has(f.id);
      input.addEventListener("change", () => {
        if (input.checked) state.selectedIds.add(f.id);
        else state.selectedIds.delete(f.id);
        refreshPlot();
      });

      const name = document.createElement("span");
      name.className = "fc-name";
      name.textContent = displayFilterName(f.name);

      row.appendChild(input);
      row.appendChild(name);
      frag.appendChild(row);
    });

    listEl.appendChild(frag);
  }

  function getSelectedFilters() {
    return state.all.filter((f) => state.selectedIds.has(f.id));
  }

  async function ensureFiltersLoaded(metaList) {
    const toLoad = metaList.filter((f) => !state.filterCache.has(f.id));
    if (!toLoad.length) return;

    await Promise.all(toLoad.map(async (meta) => {
      const url = absoluteDataUrl(meta.dataUrl);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Could not load filter file: " + meta.fileName);
      }
      const payload = await response.json();
      state.filterCache.set(meta.id, payload);
    }));
  }

  function drawAxes(plot, xMin, xMax, yMax) {
    drawSpectralBackground(plot, xMin, xMax);

    ctx.strokeStyle = "#aaa391";
    ctx.lineWidth = 1;
    ctx.strokeRect(plot.left, plot.top, plot.width, plot.height);

    ctx.fillStyle = "#5f5a50";
    ctx.font = "12px Georgia, serif";

    for (let i = 0; i <= 8; i += 1) {
      const x = plot.left + (i / 8) * plot.width;
      const nm = Math.round(xMin + (i / 8) * (xMax - xMin));
      ctx.strokeStyle = "rgba(185,180,166,0.35)";
      ctx.beginPath();
      ctx.moveTo(x, plot.top);
      ctx.lineTo(x, plot.top + plot.height);
      ctx.stroke();
      ctx.fillText(String(nm), x - 14, plot.top + plot.height + 18);
    }

    for (let i = 0; i <= 5; i += 1) {
      const y = plot.top + plot.height - (i / 5) * plot.height;
      const tv = Math.round((i / 5) * yMax);
      ctx.strokeStyle = "rgba(185,180,166,0.35)";
      ctx.beginPath();
      ctx.moveTo(plot.left, y);
      ctx.lineTo(plot.left + plot.width, y);
      ctx.stroke();
      ctx.fillText(String(tv), plot.left - 30, y + 4);
    }

    ctx.fillStyle = "#3b372f";
    ctx.font = "13px Georgia, serif";
    ctx.fillText("Wavelength (nm)", plot.left + plot.width / 2 - 45, plot.top + plot.height + 38);

    ctx.save();
    ctx.translate(plot.left - 48, plot.top + plot.height / 2 + 40);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Transmission (%)", 0, 0);
    ctx.restore();

    drawSpectralLineMarkers(plot, xMin, xMax);
  }

  function drawSpectralLineMarkers(plot, xMin, xMax) {
    const lines = [
      { wl: 393.4, label: "Ca K" },
      { wl: 396.8, label: "Ca H" },
      { wl: 486.1, label: "Hβ" },
      { wl: 500.7, label: "OIII" },
      { wl: 517.0, label: "Mg" },
      { wl: 589.3, label: "Na D" },
      { wl: 656.3, label: "Hα" },
      { wl: 672.0, label: "SII" }
    ];

    function xFor(wl) {
      return plot.left + ((wl - xMin) / (xMax - xMin)) * plot.width;
    }

    ctx.save();
    ctx.strokeStyle = "rgba(20, 20, 20, 0.55)";
    ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
    ctx.lineWidth = 1;
    ctx.font = "11px Georgia, serif";

    const markerTop = plot.top + plot.height * 0.90;
    const markerBottom = plot.top + plot.height * 0.99;

    lines.forEach((line, idx) => {
      if (line.wl < xMin || line.wl > xMax) {
        return;
      }

      const x = xFor(line.wl);
      ctx.beginPath();
      ctx.moveTo(x, markerTop);
      ctx.lineTo(x, markerBottom);
      ctx.stroke();

      const xOffset = idx % 2 === 0 ? -3 : 3;
      ctx.save();
      ctx.translate(x + xOffset, markerTop - 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(line.label, 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }

  function drawSpectralBackground(plot, xMin, xMax) {
    function xFor(wl) {
      return plot.left + ((wl - xMin) / (xMax - xMin)) * plot.width;
    }

    const uvStart = xFor(300);
    const visStart = xFor(380);
    const visEnd = xFor(750);
    const irEnd = xFor(1100);

    ctx.save();

    // UV and near-IR soft zones around visible spectrum.
    ctx.fillStyle = "rgba(183, 152, 255, 0.12)";
    ctx.fillRect(uvStart, plot.top, Math.max(0, visStart - uvStart), plot.height);

    ctx.fillStyle = "rgba(255, 192, 120, 0.14)";
    ctx.fillRect(visEnd, plot.top, Math.max(0, irEnd - visEnd), plot.height);

    // Visible spectrum gradient from violet to red.
    const grad = ctx.createLinearGradient(visStart, 0, visEnd, 0);
    grad.addColorStop(0.00, "rgba(120, 90, 220, 0.20)");
    grad.addColorStop(0.18, "rgba(80, 120, 255, 0.20)");
    grad.addColorStop(0.36, "rgba(70, 190, 240, 0.20)");
    grad.addColorStop(0.54, "rgba(80, 200, 130, 0.20)");
    grad.addColorStop(0.72, "rgba(240, 210, 90, 0.20)");
    grad.addColorStop(1.00, "rgba(230, 110, 90, 0.20)");
    ctx.fillStyle = grad;
    ctx.fillRect(visStart, plot.top, Math.max(0, visEnd - visStart), plot.height);

    // Boundaries for visible range.
    ctx.strokeStyle = "rgba(100, 100, 100, 0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(visStart, plot.top);
    ctx.lineTo(visStart, plot.top + plot.height);
    ctx.moveTo(visEnd, plot.top);
    ctx.lineTo(visEnd, plot.top + plot.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zone labels.
    ctx.fillStyle = "rgba(60, 56, 49, 0.85)";
    ctx.font = "12px Georgia, serif";
    ctx.fillText("UV", uvStart + 8, plot.top + 16);
    ctx.fillText("Visible", visStart + 10, plot.top + 16);
    ctx.fillText("Near IR", visEnd + 8, plot.top + 16);

    ctx.restore();
  }

  function drawCurve(plot, filter, color, xMin, xMax, yMax) {
    const wl = filter.wl;
    const t = filter.t;
    if (!wl || !t || !wl.length || wl.length !== t.length) return;

    ctx.beginPath();
    let started = false;
    for (let i = 0; i < wl.length; i += 1) {
      const xVal = wl[i];
      if (xVal < xMin || xVal > xMax) continue;
      const yVal = t[i];
      const x = plot.left + ((xVal - xMin) / (xMax - xMin)) * plot.width;
      const y = plot.top + plot.height - (Math.max(0, Math.min(yVal, yMax)) / yMax) * plot.height;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawLegend(filters) {
    legendEl.innerHTML = "";
    const frag = document.createDocumentFragment();

    filters.forEach((f, i) => {
      const item = document.createElement("div");
      item.className = "fc-legend-item";

      const chip = document.createElement("span");
      chip.className = "fc-chip";
      chip.style.background = colorFor(i);

      const text = document.createElement("span");
      text.textContent = displayFilterName(f.name);

      item.appendChild(chip);
      item.appendChild(text);
      frag.appendChild(item);
    });

    legendEl.appendChild(frag);
  }

  function draw() {
    resizeCanvas();

    const selected = getSelectedFilters()
      .map((meta) => state.filterCache.get(meta.id))
      .filter((f) => !!f);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const plot = { left: 76, top: 24, width: canvas.width - 104, height: canvas.height - 96 };

    if (!selected.length) {
      emptyEl.style.display = "block";
      drawAxes(plot, 300, 1100, 100);
      legendEl.innerHTML = "";
      return;
    }

    emptyEl.style.display = "none";

    const xMin = 300;
    const xMax = 1100;
    let yMax = 0;

    selected.forEach((f) => {
      for (let i = 0; i < f.t.length; i += 1) {
        if (f.t[i] > yMax) yMax = f.t[i];
      }
    });

    yMax = Math.max(20, Math.ceil((yMax || 100) / 10) * 10);

    drawAxes(plot, xMin, xMax, yMax);

    selected.forEach((f, i) => drawCurve(plot, f, colorFor(i), xMin, xMax, yMax));
    drawLegend(selected);
  }

  searchEl.addEventListener("input", () => buildList());

  if (rgbToggleEl) {
    rgbToggleEl.addEventListener("click", () => {
      state.showRgbFilters = !state.showRgbFilters;
      syncRgbToggleLabel();
      buildList();
    });
    syncRgbToggleLabel();
  }

  async function refreshPlot() {
    try {
      const selectedMeta = getSelectedFilters();
      if (!selectedMeta.length) {
        draw();
        return;
      }
      await ensureFiltersLoaded(selectedMeta);
      draw();
    } catch (err) {
      emptyEl.style.display = "block";
      emptyEl.textContent = "Unable to load selected filter data.";
      console.error(err);
    }
  }

  fetch(dataUrl)
    .then((r) => {
      if (!r.ok) throw new Error("Could not load filter data");
      return r.json();
    })
    .then((payload) => {
      state.indexBaseUrl = new URL(dataUrl, window.location.href);
      state.all = Array.isArray(payload.filters) ? payload.filters : [];
      buildList();
      draw();
    })
    .catch((err) => {
      emptyEl.style.display = "block";
      emptyEl.textContent = "Unable to load filter data.";
      console.error(err);
    });

  window.addEventListener("resize", () => {
    draw();
  });
})();
