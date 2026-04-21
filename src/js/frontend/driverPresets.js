import { Command } from "../backend/command.js";
import { confirmModal } from "./renderer";
import driverStatOverrides from "../../data/driver_stat_overrides.json";

const theadEl = document.getElementById("driverPresetsThead");
const tbodyEl = document.getElementById("driverPresetsTbody");
const searchEl = document.getElementById("driverPresetsSearch");
const exportBtn = document.getElementById("driverPresetsExportBtn");
const dirtyIndicator = document.getElementById("driverPresetsDirtyIndicator");

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
let sortKey = "name";
let sortDir = 1; // 1 asc, -1 desc
let searchTerm = "";
let dataLoaded = false;

function clampStat(v) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}

export function load_driver_presets(drivers) {
    dbDrivers = Array.isArray(drivers) ? drivers : [];
    rebuildEffective();
    dataLoaded = true;
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
        } else {
            av = effective.get(a.name)?.[sortKey] ?? 0;
            bv = effective.get(b.name)?.[sortKey] ?? 0;
        }
        if (av < bv) return -1 * sortDir;
        if (av > bv) return 1 * sortDir;
        return 0;
    });

    const frag = document.createDocumentFragment();
    for (const d of filtered) {
        frag.appendChild(buildRow(d));
    }
    tbodyEl.appendChild(frag);
}

function buildRow(d) {
    const tr = document.createElement("tr");
    tr.dataset.name = d.name;

    const nameTd = document.createElement("td");
    nameTd.className = "driver-presets-name-cell bold-font";
    nameTd.textContent = d.name;
    tr.appendChild(nameTd);

    const eff = effective.get(d.name) || {};
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
    updateDirtyIndicator();
});

if (searchEl) {
    searchEl.addEventListener("input", () => {
        searchTerm = searchEl.value.trim().toLowerCase();
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
