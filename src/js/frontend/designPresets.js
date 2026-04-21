import { Command } from "../backend/command.js";
import { part_full_names } from "./config";
import { request_driver_presets, apply_driver_presets } from "./driverPresets.js";

const presetsExisting = document.getElementById("presetsExisting");
const presetsSubtabs = document.getElementById("presetsSubtabs");
const presetsSlidersSection = document.getElementById("presetsSlidersSection");
const presetsDriversSection = document.getElementById("presetsDriversSection");
const applySliderPresetsBtn = document.getElementById("applySliderPresetsBtn");
const applyDriverPresetsBtn = document.getElementById("applyDriverPresetsBtn");

const statPrettyNames = {
    0: "Airflow Front",
    1: "Airflow Sensitivity",
    2: "Tyre Preservation",
    3: "DRS Delta",
    4: "Drag Reduction",
    5: "Engine Cooling",
    7: "Low Speed",
    8: "Medium Speed",
    9: "High Speed",
    13: "Airflow Middle",
    15: "Minimum Lifespan"
};

export function load_design_presets(data) {
    renderPresetsTables(data);
}

function renderPresetsTables(data) {
    const { presets, defaultPartsStats, partsNames } = data;
    presetsExisting.innerHTML = "";

    const partTypes = Object.keys(defaultPartsStats).map(Number).sort((a, b) => a - b);

    for (const partType of partTypes) {
        const partName = part_full_names[partType] || partsNames[partType] || `Part ${partType}`;
        const partStats = defaultPartsStats[partType];

        const relevantPresets = presets.filter(p => p.parts[partType]);
        if (relevantPresets.length === 0) continue;

        const card = document.createElement("div");
        card.className = "preset-card";

        const title = document.createElement("h6");
        title.className = "bold-font preset-card-title";
        title.textContent = partName;
        card.appendChild(title);

        const table = document.createElement("table");
        table.className = "preset-table";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const nameHeader = document.createElement("th");
        nameHeader.textContent = "Preset";
        headerRow.appendChild(nameHeader);

        for (const stat of partStats) {
            const th = document.createElement("th");
            th.textContent = statPrettyNames[stat] || `Stat ${stat}`;
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        for (const preset of relevantPresets) {
            const row = document.createElement("tr");
            const nameCell = document.createElement("td");
            nameCell.className = "bold-font preset-name-cell";
            nameCell.textContent = formatPresetName(preset.name);
            row.appendChild(nameCell);

            for (const stat of partStats) {
                const td = document.createElement("td");
                const val = preset.parts[partType]?.[stat];
                if (val != null) {
                    td.appendChild(createMiniBar(val));
                } else {
                    td.textContent = "-";
                }
                row.appendChild(td);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        card.appendChild(table);
        presetsExisting.appendChild(card);
    }
}

function createMiniBar(val) {
    const wrapper = document.createElement("div");
    wrapper.className = "preset-mini-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "preset-mini-bar";

    const fill = document.createElement("div");
    fill.className = "preset-mini-bar-fill";
    fill.style.width = (val * 100) + "%";

    bar.appendChild(fill);

    const label = document.createElement("span");
    label.className = "preset-mini-bar-label";
    label.textContent = val;

    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    return wrapper;
}

function formatPresetName(name) {
    return name.replace(/([A-Z])/g, " $1").trim();
}

if (presetsSubtabs) {
    presetsSubtabs.addEventListener("click", (e) => {
        const tab = e.target.closest("a.nav-link[data-preset-mode]");
        if (!tab) return;
        e.preventDefault();
        const mode = tab.dataset.presetMode;
        presetsSubtabs.querySelectorAll("a.nav-link[data-preset-mode]").forEach(t => {
            t.classList.toggle("active", t === tab);
        });
        presetsSlidersSection.classList.toggle("hide", mode !== "sliders");
        presetsDriversSection.classList.toggle("hide", mode !== "drivers");

        if (mode === "drivers") {
            request_driver_presets();
        }
    });
}

if (applySliderPresetsBtn) {
    applySliderPresetsBtn.addEventListener("click", () => {
        const cmd = new Command("applySliderPresets", {});
        cmd.execute();
    });
}

if (applyDriverPresetsBtn) {
    applyDriverPresetsBtn.addEventListener("click", () => {
        apply_driver_presets();
    });
}
