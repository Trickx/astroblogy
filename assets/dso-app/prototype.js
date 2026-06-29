(function () {
  const root = document.getElementById("dso-app");
  if (!root) return;

  const searchEl = document.getElementById("dso-search");
  const typeEl = document.getElementById("dso-type");
  const telescopeEl = document.getElementById("dso-telescope");
  const hemisphereEl = document.getElementById("dso-hemisphere");
  const maxMagEl = document.getElementById("dso-max-mag");
  const sortEl = document.getElementById("dso-sort");
  const bodyEl = document.getElementById("dso-table-body");
  const countEl = document.getElementById("dso-count");
  const statusEl = document.getElementById("dso-status");

  const photoEl = document.getElementById("dso-photo");

  const state = {
    all: [],
    visible: [],
    selectedRowIndex: null
  };

  function text(v) {
    return String(v == null ? "" : v).trim();
  }

  function numberOrNull(v) {
    if (v == null || v === "") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function formatNum(v, d) {
    if (!Number.isFinite(v)) return "-";
    return v.toFixed(d == null ? 1 : d);
  }

  function titleCase(s) {
    const value = text(s);
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function toDateString(excelDate) {
    if (!Number.isFinite(excelDate) || excelDate < 1) return "";
    const ms = Math.round((excelDate - 25569) * 86400 * 1000);
    const dt = new Date(ms);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  }

  function buildHeaderIndex(headers) {
    const idx = new Map();
    headers.forEach((h, i) => {
      const k = text(h).toLowerCase();
      if (!k) return;
      if (!idx.has(k)) idx.set(k, []);
      idx.get(k).push(i);
    });
    return idx;
  }

  function pick(row, index, names, fallbackIndices) {
    for (let i = 0; i < names.length; i += 1) {
      const key = names[i].toLowerCase();
      if (!index.has(key)) continue;
      const cols = index.get(key);
      for (let j = 0; j < cols.length; j += 1) {
        const value = row[cols[j]];
        if (value != null && value !== "") return value;
      }
    }

    for (let i = 0; i < fallbackIndices.length; i += 1) {
      const value = row[fallbackIndices[i]];
      if (value != null && value !== "") return value;
    }

    return "";
  }

  function normalizeRows(rawRows) {
    const headerRowIdx = rawRows.findIndex((row) => {
      if (!Array.isArray(row) || !row.length) return false;

      // Some workbook variants swap Name/Type or include extra helper columns.
      const probe = row
        .slice(0, 8)
        .map((v) => text(v).toLowerCase())
        .filter(Boolean);

      return probe.includes("name") && probe.includes("type");
    });

    if (headerRowIdx < 0) {
      throw new Error("Header row not found in Main sheet.");
    }

    const headers = rawRows[headerRowIdx] || [];
    const idx = buildHeaderIndex(headers);
    const rows = rawRows.slice(headerRowIdx + 1);

    const items = [];
    rows.forEach((row) => {
      if (!row || !row.length) return;

      const name = text(pick(row, idx, ["name"], [1]));
      if (!name) return;

      const type = text(pick(row, idx, ["type"], [0]));
      const mag = numberOrNull(pick(row, idx, ["mag"], [10]));
      const size = text(pick(row, idx, ["° / '", "groesse", "gr\u00f6\u00dfe"], [9]));
      const alt = numberOrNull(pick(row, idx, ["alt"], [22]));
      const hemisphere = text(pick(row, idx, ["n/s"], [20])).toUpperCase();
      const telescope = text(pick(row, idx, ["teleskop"], [30]));
      const sensor = text(pick(row, idx, ["sensor"], [31]));

      const transitDateRaw = numberOrNull(pick(row, idx, ["date", "transit mez"], [19]));
      const transitAtRaw = numberOrNull(pick(row, idx, ["transit at", "transit (utc)"], [14]));
      const transitDate = toDateString(transitDateRaw);
      const transitAt = Number.isFinite(transitAtRaw) ? formatNum(transitAtRaw, 2) + " h" : "";

      const imagePath = text(pick(row, idx, ["path", "image"], [2]));
      const imageFilename = imagePath ? imagePath.split("/").pop() : "";

      items.push({
        name,
        type: titleCase(type),
        mag,
        size,
        alt,
        hemisphere,
        telescope,
        sensor,
        transit: [transitDate, transitAt].filter(Boolean).join(" "),
        imagePath: imageFilename ? `/assets/stellarium/nebulae/${imageFilename}` : ""
      });
    });

    return items;
  }

  function uniqueSorted(values) {
    const seen = new Set();
    values.forEach((v) => {
      const t = text(v);
      if (t) seen.add(t);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }

  function refillSelect(selectEl, values) {
    const current = selectEl.value;
    const frag = document.createDocumentFragment();

    const all = document.createElement("option");
    all.value = "";
    all.textContent = "All";
    frag.appendChild(all);

    values.forEach((v) => {
      const option = document.createElement("option");
      option.value = v;
      option.textContent = v;
      frag.appendChild(option);
    });

    selectEl.innerHTML = "";
    selectEl.appendChild(frag);
    selectEl.value = values.includes(current) ? current : "";
  }

  function populateControls() {
    refillSelect(typeEl, uniqueSorted(state.all.map((x) => x.type)));
    refillSelect(telescopeEl, uniqueSorted(state.all.map((x) => x.telescope)));
  }

  function compareBySort(a, b, sortMode) {
    if (sortMode === "mag") {
      const am = Number.isFinite(a.mag) ? a.mag : Number.POSITIVE_INFINITY;
      const bm = Number.isFinite(b.mag) ? b.mag : Number.POSITIVE_INFINITY;
      if (am !== bm) return am - bm;
      return a.name.localeCompare(b.name);
    }

    if (sortMode === "alt") {
      const aa = Number.isFinite(a.alt) ? a.alt : Number.NEGATIVE_INFINITY;
      const ba = Number.isFinite(b.alt) ? b.alt : Number.NEGATIVE_INFINITY;
      if (aa !== ba) return ba - aa;
      return a.name.localeCompare(b.name);
    }

    if (sortMode === "type") {
      const t = a.type.localeCompare(b.type);
      return t !== 0 ? t : a.name.localeCompare(b.name);
    }

    return a.name.localeCompare(b.name);
  }

  function showPhoto(imagePath) {
    if (!imagePath) {
      photoEl.src = "";
      photoEl.style.display = "none";
    } else {
      photoEl.src = imagePath;
      photoEl.style.display = "block";
    }
  }

  function renderTable() {
    bodyEl.innerHTML = "";

    if (!state.visible.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "dso-empty";
      td.textContent = "No objects match current filters.";
      tr.appendChild(td);
      bodyEl.appendChild(tr);
      countEl.textContent = "0";
      showPhoto("");
      return;
    }

    const frag = document.createDocumentFragment();
    state.visible.forEach((item, rowIdx) => {
      const tr = document.createElement("tr");
      if (state.selectedRowIndex === rowIdx) {
        tr.classList.add("dso-row-selected");
      }

      tr.addEventListener("click", () => {
        state.selectedRowIndex = rowIdx;
        renderTable();
        showPhoto(item.imagePath);
      });
      tr.style.cursor = "pointer";

      const cols = [
        item.name,
        item.type || "-",
        Number.isFinite(item.mag) ? formatNum(item.mag, 1) : "-",
        item.size || "-",
        Number.isFinite(item.alt) ? formatNum(item.alt, 1) : "-",
        item.hemisphere || "-",
        item.transit || "-"
      ];

      cols.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });

      frag.appendChild(tr);
    });

    bodyEl.appendChild(frag);
    countEl.textContent = String(state.visible.length);
  }

  function applyFilters() {
    const q = text(searchEl.value).toLowerCase();
    const type = text(typeEl.value);
    const telescope = text(telescopeEl.value);
    const hemisphere = text(hemisphereEl.value).toUpperCase();
    const maxMag = numberOrNull(maxMagEl.value);
    const sortMode = text(sortEl.value) || "name";

    state.visible = state.all
      .filter((item) => {
        if (q) {
          const hay = [item.name, item.type, item.telescope, item.sensor].join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }

        if (type && item.type !== type) return false;
        if (telescope && item.telescope !== telescope) return false;
        if (hemisphere && item.hemisphere !== hemisphere) return false;
        if (Number.isFinite(maxMag) && (!Number.isFinite(item.mag) || item.mag > maxMag)) return false;
        return true;
      })
      .sort((a, b) => compareBySort(a, b, sortMode));

    state.selectedRowIndex = null;
    renderTable();
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#8f2d23" : "#3f6b62";
  }

  function bindControls() {
    [searchEl, typeEl, telescopeEl, hemisphereEl, maxMagEl, sortEl].forEach((el) => {
      el.addEventListener("input", applyFilters);
      el.addEventListener("change", applyFilters);
    });
  }

  async function loadWorkbook() {
    if (typeof XLSX === "undefined") {
      throw new Error("SheetJS library failed to load.");
    }

    const url = window.DSO_XLSM_URL || "dsobjects/Wann_was_womit_aufnehmen_v 3.40.xlsm";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Could not fetch XLSM file: " + response.status + " " + response.statusText);
    }

    const bytes = await response.arrayBuffer();
    const wb = XLSX.read(bytes, {
      type: "array",
      cellFormula: false,
      cellHTML: false,
      cellText: true,
      raw: true
    });

    const sheet = wb.Sheets.Main || wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      throw new Error("Main sheet not found in workbook.");
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: ""
    });

    return normalizeRows(rows);
  }

  bindControls();

  loadWorkbook()
    .then((items) => {
      state.all = items;
      populateControls();
      applyFilters();
      setStatus("Workbook loaded. Filters are active.", false);
    })
    .catch((err) => {
      state.all = [];
      state.visible = [];
      renderTable();
      setStatus("Error: " + err.message, true);
      console.error(err);
    });
})();