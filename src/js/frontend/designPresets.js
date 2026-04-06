import { Command } from "../backend/command.js";
import { part_full_names } from "./config";
import { confirmModal } from "./renderer";

const presetsExisting = document.getElementById("presetsExisting");
const presetsSliders = document.getElementById("presetsSliders");
const presetAddBtn = document.getElementById("presetAddBtn");
const presetNameInput = document.getElementById("presetNameInput");

let cachedData = null;

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

// Category grouping matching the in-game design focus UI
const statCategories = {
    "Velocity":   [3, 4],
    "Downforce":  [7, 8, 9],
    "Cooling":    [2, 5],
    "Airflow":    [0, 1, 13],
    "Durability": [15]
};

// Which stats each part type actually has (mirrors defaultPartsStats from carConstants)
// Order matches the game UI: Velocity → Downforce → Cooling → Airflow → Durability
function getGroupedStats(partStats) {
    const groups = [];
    for (const [category, statIds] of Object.entries(statCategories)) {
        const matching = statIds.filter(s => partStats.includes(s));
        if (matching.length > 0) {
            groups.push({ category, stats: matching });
        }
    }
    return groups;
}

export function load_design_presets(data) {
    cachedData = data;
    renderPresetsTables(data);
    renderAddForm(data);
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

function renderAddForm(data) {
    const { defaultPartsStats } = data;
    presetsSliders.innerHTML = "";

    const partTypes = Object.keys(defaultPartsStats).map(Number).sort((a, b) => a - b);

    for (const partType of partTypes) {
        const partName = part_full_names[partType] || `Part ${partType}`;
        const partStats = defaultPartsStats[partType];
        const groups = getGroupedStats(partStats);

        const section = document.createElement("div");
        section.className = "preset-part-section";
        section.dataset.partType = partType;

        const partHeader = document.createElement("div");
        partHeader.className = "preset-part-header";

        const partTitle = document.createElement("div");
        partTitle.className = "bold-font preset-part-title";
        partTitle.textContent = partName;
        partHeader.appendChild(partTitle);

        section.appendChild(partHeader);

        for (const group of groups) {
            const catLabel = document.createElement("div");
            catLabel.className = "preset-category-label bold-font";
            catLabel.textContent = group.category;
            section.appendChild(catLabel);

            for (const stat of group.stats) {
                const sliderRow = document.createElement("div");
                sliderRow.className = "preset-slider-row";

                const label = document.createElement("label");
                label.className = "preset-slider-label";
                label.textContent = statPrettyNames[stat] || `Stat ${stat}`;

                const trackWrap = document.createElement("div");
                trackWrap.className = "preset-slider-track-wrap";

                const range = document.createElement("input");
                range.type = "range";
                range.min = "0";
                range.max = "1";
                range.step = "0.05";
                range.value = "0.5";
                range.className = "preset-slider";
                range.dataset.partType = partType;
                range.dataset.partStat = stat;

                const valDisplay = document.createElement("span");
                valDisplay.className = "preset-slider-value";
                valDisplay.textContent = "50%";

                range.addEventListener("input", () => {
                    valDisplay.textContent = Math.round(range.value * 100) + "%";
                });

                trackWrap.appendChild(range);

                sliderRow.appendChild(label);
                sliderRow.appendChild(trackWrap);
                sliderRow.appendChild(valDisplay);
                section.appendChild(sliderRow);
            }
        }

        presetsSliders.appendChild(section);
    }
}

function collectFormData() {
    const name = presetNameInput.value.trim();
    if (!name) return null;

    const parts = {};
    presetsSliders.querySelectorAll(".preset-slider").forEach(slider => {
        const partType = slider.dataset.partType;
        const partStat = slider.dataset.partStat;
        if (!parts[partType]) parts[partType] = {};
        parts[partType][partStat] = parseFloat(slider.value);
    });

    return { name, parts };
}

presetAddBtn.addEventListener("click", () => {
    const formData = collectFormData();
    if (!formData) {
        confirmModal("Please enter a preset name.");
        return;
    }

    const cmd = new Command("addDesignPreset", formData);
    cmd.execute();

    presetNameInput.value = "";
    presetsSliders.querySelectorAll(".preset-slider").forEach(slider => {
        slider.value = "0.5";
        slider.nextElementSibling.textContent = "50%";
    });
});
