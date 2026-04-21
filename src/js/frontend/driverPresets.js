import { Command } from "../backend/command.js";
import { confirmModal } from "./renderer";
import driverStatOverrides from "../../data/driver_stat_overrides.json";

const theadEl = document.getElementById("driverPresetsThead");
const tbodyEl = document.getElementById("driverPresetsTbody");
const searchEl = document.getElementById("driverPresetsSearch");
const exportBtn = document.getElementById("driverPresetsExportBtn");
const dirtyIndicator = document.getElementById("driverPresetsDirtyIndicator");
const pageSizeEl = document.getElementById("driverPresetsPageSize");
const pagePrevEl = document.getElementById("driverPresetsPagePrev");
const pageNextEl = document.getElementById("driverPresetsPageNext");
const pageInfoEl = document.getElementById("driverPresetsPageInfo");

const STAT_COLUMNS = [
    { key: "cornering",     label: "Cor" },
    { key: "braking",       label: "Brk" },
    { key: "control",       label: "Ctl" },
    { key: "smoothness",    label: "Smo" },
    { key: "adaptability",  label: "Adp" },
    { key: "overtaking",    label: "Ovt" },
    { key: "defending",     label: "Def" },
    { key: "reactions",     label: "Rct" },
    { key: "accuracy",      label: "Acc" },
    { key: "improvability", label: "Imp" },
    { key: "aggression",    label: "Agg" },
    { key: "marketability", label: "Mkt" }
];

const AVG_EXCLUDED = new Set(["improvability", "aggression", "marketability"]);
const AVG_KEYS = STAT_COLUMNS.filter(c => !AVG_EXCLUDED.has(c.key)).map(c => c.key);

function computeAvg(eff) {
    if (!eff) return null;
    let sum = 0, n = 0;
    for (const k of AVG_KEYS) {
        const v = Number(eff[k]);
        if (Number.isFinite(v)) { sum += v; n++; }
    }
    return n ? sum / n : null;
}

const STAT_LABELS_FULL = {
    cornering: "Cornering", braking: "Braking", control: "Control",
    smoothness: "Smoothness", adaptability: "Adaptability", overtaking: "Overtaking",
    defending: "Defending", reactions: "Reactions", accuracy: "Accuracy",
    improvability: "Improvability", aggression: "Aggression", marketability: "Marketability"
};

// DB values as fetched (untouched reference)
let dbDrivers = [];
// Effective values shown in table = DB + committed overrides + session edits
let effective = new Map(); // name -> { ...stats }
// Session edits (name -> { key -> newValue }), only for cells the user changed this session
let sessionEdits = new Map();
let sortKey = "avg";
let sortDir = -1; // 1 asc, -1 desc
let searchTerm = "";
let dataLoaded = false;
let pageSize = 50;
let pageIndex = 0;

function clampStat(v) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}

export function load_driver_presets(drivers) {
    dbDrivers = Array.isArray(drivers) ? drivers : [];
    rebuildEffective();
    dataLoaded = true;
    pageIndex = 0;
    renderTable();
}

function rebuildEffective() {
    effective = new Map();
    for (const d of dbDrivers) {
        const base = {};
        for (const col of STAT_COLUMNS) base[col.key] = d[col.key];

        const override = driverStatOverrides[d.name];
        if (override) {
            for (const col of STAT_COLUMNS) {
                if (override[col.key] != null) base[col.key] = clampStat(override[col.key]);
            }
        }

        const edits = sessionEdits.get(d.name);
        if (edits) {
            for (const [k, v] of Object.entries(edits)) {
                base[k] = clampStat(v);
            }
        }

        effective.set(d.name, base);
    }
}

function getDbValue(name, key) {
    const d = dbDrivers.find(x => x.name === name);
    return d ? d[key] : null;
}

function renderTable() {
    renderHeader();
    renderBody();
    updateDirtyIndicator();
}

function renderHeader() {
    theadEl.innerHTML = "";
    const row = document.createElement("tr");

    const nameTh = document.createElement("th");
    nameTh.className = "driver-presets-col-name sortable";
    nameTh.textContent = "Driver";
    nameTh.dataset.sortKey = "name";
    if (sortKey === "name") nameTh.classList.add(sortDir > 0 ? "sort-asc" : "sort-desc");
    row.appendChild(nameTh);

    const avgTh = document.createElement("th");
    avgTh.className = "driver-presets-col-avg sortable";
    avgTh.textContent = "Avg";
    avgTh.title = `Average of ${AVG_KEYS.map(k => STAT_LABELS_FULL[k]).join(", ")}`;
    avgTh.dataset.sortKey = "avg";
    if (sortKey === "avg") avgTh.classList.add(sortDir > 0 ? "sort-asc" : "sort-desc");
    row.appendChild(avgTh);

    for (const col of STAT_COLUMNS) {
        const th = document.createElement("th");
        th.className = "driver-presets-col-stat sortable";
        th.textContent = col.label;
        th.title = STAT_LABELS_FULL[col.key];
        th.dataset.sortKey = col.key;
        if (sortKey === col.key) th.classList.add(sortDir > 0 ? "sort-asc" : "sort-desc");
        row.appendChild(th);
    }

    theadEl.appendChild(row);
}

function renderBody() {
    tbodyEl.innerHTML = "";

    const filtered = dbDrivers.filter(d => {
        if (!searchTerm) return true;
        return d.name.toLowerCase().includes(searchTerm);
    });

    filtered.sort((a, b) => {
        let av, bv;
        if (sortKey === "name") {
            av = a.name.toLowerCase();
            bv = b.name.toLowerCase();
        } else if (sortKey === "avg") {
            av = computeAvg(effective.get(a.name)) ?? 0;
            bv = computeAvg(effective.get(b.name)) ?? 0;
        } else {
            av = effective.get(a.name)?.[sortKey] ?? 0;
            bv = effective.get(b.name)?.[sortKey] ?? 0;
        }
        if (av < bv) return -1 * sortDir;
        if (av > bv) return 1 * sortDir;
        return 0;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (pageIndex >= totalPages) pageIndex = totalPages - 1;
    if (pageIndex < 0) pageIndex = 0;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, total);
    const pageRows = filtered.slice(start, end);

    const frag = document.createDocumentFragment();
    for (const d of pageRows) {
        frag.appendChild(buildRow(d));
    }
    tbodyEl.appendChild(frag);

    renderPagination(total, start, end, totalPages);
}

function renderPagination(total, start, end, totalPages) {
    if (pageInfoEl) {
        pageInfoEl.textContent = total === 0
            ? "0–0 of 0"
            : `${start + 1}–${end} of ${total}`;
    }
    if (pagePrevEl) pagePrevEl.disabled = pageIndex <= 0;
    if (pageNextEl) pageNextEl.disabled = pageIndex >= totalPages - 1;
}

function buildRow(d) {
    const tr = document.createElement("tr");
    tr.dataset.name = d.name;

    const nameTd = document.createElement("td");
    nameTd.className = "driver-presets-name-cell bold-font";
    nameTd.textContent = d.name;
    tr.appendChild(nameTd);

    const eff = effective.get(d.name) || {};

    const avgTd = document.createElement("td");
    avgTd.className = "driver-presets-avg-cell";
    const avgVal = computeAvg(eff);
    avgTd.textContent = avgVal == null ? "—" : avgVal.toFixed(1);
    avgTd.dataset.name = d.name;
    tr.appendChild(avgTd);

    for (const col of STAT_COLUMNS) {
        const td = document.createElement("td");
        td.className = "driver-presets-stat-cell";

        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = "100";
        input.step = "1";
        input.className = "driver-presets-stat-input";
        input.value = eff[col.key] ?? "";
        input.dataset.name = d.name;
        input.dataset.statKey = col.key;

        markInputState(input, d.name, col.key, eff[col.key]);

        td.appendChild(input);
        tr.appendChild(td);
    }

    return tr;
}

function markInputState(input, name, key, currentVal) {
    const dbVal = getDbValue(name, key);
    const diffFromDb = currentVal != null && Number(currentVal) !== Number(dbVal);
    const hasSessionEdit = sessionEdits.get(name)?.[key] != null;

    input.classList.toggle("cell-overridden", diffFromDb && !hasSessionEdit);
    input.classList.toggle("cell-edited", hasSessionEdit);
}

theadEl.addEventListener("click", (e) => {
    const th = e.target.closest("th.sortable");
    if (!th) return;
    const key = th.dataset.sortKey;
    if (sortKey === key) sortDir = -sortDir;
    else { sortKey = key; sortDir = 1; }
    renderTable();
});

function updateAvgCell(name) {
    if (AVG_EXCLUDED.size && AVG_KEYS.length) {
        const row = tbodyEl.querySelector(`tr[data-name="${CSS.escape(name)}"]`);
        if (!row) return;
        const avgTd = row.querySelector(".driver-presets-avg-cell");
        if (!avgTd) return;
        const avg = computeAvg(effective.get(name));
        avgTd.textContent = avg == null ? "—" : avg.toFixed(1);
    }
}

tbodyEl.addEventListener("input", (e) => {
    const input = e.target.closest("input.driver-presets-stat-input");
    if (!input) return;
    const name = input.dataset.name;
    const key = input.dataset.statKey;
    if (input.value === "") return;

    const newVal = clampStat(input.value);
    const edits = sessionEdits.get(name) || {};
    edits[key] = newVal;
    sessionEdits.set(name, edits);

    const eff = effective.get(name);
    if (eff) eff[key] = newVal;

    markInputState(input, name, key, newVal);
    updateAvgCell(name);
    updateDirtyIndicator();
});

tbodyEl.addEventListener("change", (e) => {
    const input = e.target.closest("input.driver-presets-stat-input");
    if (!input) return;
    const name = input.dataset.name;
    const key = input.dataset.statKey;
    const clamped = clampStat(input.value || 0);
    input.value = clamped;
    const edits = sessionEdits.get(name) || {};
    edits[key] = clamped;
    sessionEdits.set(name, edits);
    const eff = effective.get(name);
    if (eff) eff[key] = clamped;
    markInputState(input, name, key, clamped);
    updateAvgCell(name);
    updateDirtyIndicator();
});

if (searchEl) {
    searchEl.addEventListener("input", () => {
        searchTerm = searchEl.value.trim().toLowerCase();
        pageIndex = 0;
        renderBody();
    });
}

if (pageSizeEl) {
    pageSizeEl.addEventListener("change", () => {
        const v = parseInt(pageSizeEl.value, 10);
        if (Number.isFinite(v) && v > 0) {
            pageSize = v;
            pageIndex = 0;
            renderBody();
        }
    });
}

if (pagePrevEl) {
    pagePrevEl.addEventListener("click", () => {
        if (pageIndex > 0) {
            pageIndex -= 1;
            renderBody();
        }
    });
}

if (pageNextEl) {
    pageNextEl.addEventListener("click", () => {
        pageIndex += 1;
        renderBody();
    });
}

function buildExportMap() {
    const out = {};
    for (const d of dbDrivers) {
        const eff = effective.get(d.name);
        if (!eff) continue;
        const diff = {};
        for (const col of STAT_COLUMNS) {
            const cur = eff[col.key];
            const dbVal = d[col.key];
            if (cur != null && Number(cur) !== Number(dbVal)) {
                diff[col.key] = Number(cur);
            }
        }
        if (Object.keys(diff).length) {
            out[d.name] = diff;
        }
    }
    return out;
}

function updateDirtyIndicator() {
    if (!dirtyIndicator) return;
    const count = sessionEdits.size;
    if (count === 0) {
        dirtyIndicator.textContent = "";
        dirtyIndicator.classList.remove("active");
    } else {
        dirtyIndicator.textContent = `${count} driver${count === 1 ? "" : "s"} edited`;
        dirtyIndicator.classList.add("active");
    }
}

if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        if (!dataLoaded) {
            confirmModal("Load a save file first.");
            return;
        }
        const map = buildExportMap();
        const json = JSON.stringify(map, null, 2) + "\n";
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "driver_stat_overrides.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

export function request_driver_presets() {
    const cmd = new Command("driverPresetDataRequest", {});
    cmd.execute();
}

export function apply_driver_presets() {
    const map = dataLoaded ? buildExportMap() : clone(driverStatOverrides);
    if (!Object.keys(map).length) {
        confirmModal("No driver overrides to apply.");
        return;
    }
    const cmd = new Command("applyDriverStatOverrides", { overrides: map });
    cmd.execute();
    sessionEdits = new Map();
    updateDirtyIndicator();
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
}
