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
    2: "Brake Cooling",
    3: "DRS Delta",
    4: "Drag Reduction",
    5: "Engine Cooling",
    6: "Fuel Efficiency",
    7: "Low Speed Downforce",
    8: "Medium Speed Downforce",
    9: "High Speed Downforce",
    10: "Power",
    11: "Performance Loss",
    12: "Performance Threshold",
    13: "Airflow Middle",
    14: "Operational Range",
    15: "Lifespan",
    16: "Weight"
};

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
                td.textContent = val != null ? val : "-";
                if (val != null) {
                    td.className = getFocusClass(val);
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

function getFocusClass(val) {
    if (val >= 0.8) return "focus-high";
    if (val <= 0.2) return "focus-low";
    return "focus-mid";
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

        const section = document.createElement("div");
        section.className = "preset-part-section";
        section.dataset.partType = partType;

        const partTitle = document.createElement("div");
        partTitle.className = "bold-font preset-part-title";
        partTitle.textContent = partName;
        section.appendChild(partTitle);

        const grid = document.createElement("div");
        grid.className = "preset-sliders-grid";

        for (const stat of partStats) {
            const sliderRow = document.createElement("div");
            sliderRow.className = "preset-slider-row";

            const label = document.createElement("label");
            label.className = "preset-slider-label";
            label.textContent = statPrettyNames[stat] || `Stat ${stat}`;

            const range = document.createElement("input");
            range.type = "range";
            range.min = "0";
            range.max = "1";
            range.step = "0.1";
            range.value = "0.5";
            range.className = "preset-slider";
            range.dataset.partType = partType;
            range.dataset.partStat = stat;

            const valDisplay = document.createElement("span");
            valDisplay.className = "preset-slider-value";
            valDisplay.textContent = "0.5";

            range.addEventListener("input", () => {
                valDisplay.textContent = range.value;
            });

            sliderRow.appendChild(label);
            sliderRow.appendChild(range);
            sliderRow.appendChild(valDisplay);
            grid.appendChild(sliderRow);
        }

        section.appendChild(grid);
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
        slider.nextElementSibling.textContent = "0.5";
    });
});
