import interact from 'interactjs';
import { combined_dict, team_dict, logos_disc } from "./config";
import { format_name } from "./transfers";
import { Command } from "../backend/command.js";

/**
 * F2/F3 "current grid" for the transfers tab. Same idea as the F1 grid (teams with their car
 * seats, a list of drivers on the left to drag in) but without affiliates. Every drop goes to the
 * worker, which answers with the refreshed grid, so the DOM is always rebuilt from the database.
 */

const seriesDropdown = document.getElementById("gridSeriesDropdown");
const seriesMenu = document.getElementById("gridSeriesMenu");
const juniorLayout = document.getElementById("juniorGridLayout");
const teamsColumn = document.getElementById("juniorTeamsColumn");
const poolDiv = document.getElementById("junior-pool");
const poolFilter = document.getElementById("juniorPoolFilter");

let currentSeries = 1;
let gridData = null;

function teamDisplayName(teamId) {
    return (combined_dict[teamId] || "").replace(/ \((F2|F3)\)$/, "");
}

function seriesOfTeam(teamId) {
    if (teamId >= 11 && teamId <= 21) return 2;
    if (teamId >= 22 && teamId <= 31) return 3;
    return null;
}

// F1-grid-only controls that make no sense for F2/F3
function f1OnlyControls() {
    return [
        document.getElementById("staffTransfersDropdown")?.closest(".dropdown-global"),
        document.querySelector("#driver_transfers .filter-container"),
        document.getElementById("lineupsViewButton"),
        document.querySelector("#driver_transfers .auto-contract"),
    ];
}

function setSeries(series) {
    currentSeries = series;
    const label = series === 1 ? "F1" : `F${series}`;
    seriesDropdown.dataset.value = String(series);
    seriesDropdown.querySelector(".dropdown-label").textContent = label;
    seriesMenu.querySelectorAll(".redesigned-dropdown-item").forEach((item) => {
        item.querySelector("i.bi-check")?.classList.toggle("unactive", item.dataset.value !== String(series));
    });

    const isJunior = series !== 1;
    const lineupsView = document.getElementById("lineupsView");
    if (isJunior && lineupsView && !lineupsView.classList.contains("d-none")) {
        document.getElementById("lineupsViewButton")?.click(); // closes it and resets its button
    }
    f1OnlyControls().forEach((el) => el?.classList.toggle("d-none", isJunior));
    document.getElementById("transfersMainLayout").classList.toggle("d-none", isJunior);
    juniorLayout.classList.toggle("d-none", !isJunior);

    if (isJunior) {
        gridData = null;
        teamsColumn.innerHTML = "";
        poolDiv.innerHTML = "";
        new Command("juniorGridRequest", { formula: series }).execute();
    }
}

seriesMenu.querySelectorAll(".redesigned-dropdown-item").forEach((item) => {
    const icon = document.createElement("i");
    icon.classList.add("bi", "bi-check", "unactive");
    item.appendChild(icon);
    item.addEventListener("click", () => setSeries(Number(item.dataset.value)));
});
seriesMenu.querySelector(".redesigned-dropdown-item[data-value='1'] i.bi-check")?.classList.remove("unactive");

/** A new save was loaded: go back to the F1 grid so nothing stale is shown */
export function resetJuniorGrid() {
    if (currentSeries !== 1) setSeries(1);
}

function buildJuniorLogo(teamId) {
    const wrap = document.createElement("div");
    wrap.className = `junior-formula-logo ${seriesOfTeam(teamId) === 2 ? "f2-team" : "f3-team"}`;
    wrap.title = combined_dict[teamId] || "";
    const img = document.createElement("img");
    img.src = logos_disc[teamId];
    img.dataset.juniorTeamId = teamId;
    wrap.appendChild(img);
    return wrap;
}

function buildDriverCard(driver) {
    const card = document.createElement("div");
    card.className = "junior-card";
    card.dataset.driverid = driver.driverId;
    card.dataset.name = driver.name;

    const nameContainer = document.createElement("div");
    nameContainer.className = "name-container";
    const spanName = document.createElement("span");
    const spanLastName = document.createElement("span");
    format_name(driver.name, driver.name.split(" "), spanName, spanLastName);
    spanLastName.classList.add("bold-font");
    // surname in the colour of the F1 team whose academy/reserve list they are on
    if (driver.f1TeamId && team_dict[driver.f1TeamId]) {
        spanLastName.classList.add(team_dict[driver.f1TeamId] + "font");
        card.title = `${combined_dict[driver.f1TeamId] || ""} ${driver.f1Pos > 2 ? "affiliate" : ""}`.trim();
    }
    nameContainer.appendChild(spanName);
    nameContainer.appendChild(spanLastName);
    card.appendChild(nameContainer);

    const meta = document.createElement("div");
    meta.className = "junior-card-meta";
    // in the pool, show where a driver currently races in the *other* junior series
    if (driver.juniorTeamId && seriesOfTeam(driver.juniorTeamId) !== currentSeries) {
        meta.appendChild(buildJuniorLogo(driver.juniorTeamId));
    }
    if (driver.age) {
        const age = document.createElement("span");
        age.className = "junior-card-age";
        age.textContent = driver.age;
        age.title = "Age";
        meta.appendChild(age);
    }
    card.appendChild(meta);
    return card;
}

function buildTeamCard(team) {
    const card = document.createElement("div");
    card.className = `team-template junior-team-card ${currentSeries === 2 ? "f2-card" : "f3-card"}`;
    card.dataset.teamid = team.teamId;

    const logoAndName = document.createElement("div");
    logoAndName.className = "new-logo-and-name";
    const logoWrap = document.createElement("div");
    logoWrap.className = "junior-team-card-logo";
    if (logos_disc[team.teamId]) {
        const img = document.createElement("img");
        img.src = logos_disc[team.teamId];
        logoWrap.appendChild(img);
    }
    const name = document.createElement("div");
    name.className = "team-name bold-font";
    name.textContent = teamDisplayName(team.teamId).toUpperCase();
    logoAndName.appendChild(logoWrap);
    logoAndName.appendChild(name);
    card.appendChild(logoAndName);

    const seatsDiv = document.createElement("div");
    seatsDiv.className = "drivers-section";
    team.seats.forEach((seat) => {
        const seatDiv = document.createElement("div");
        seatDiv.className = "junior-seat";
        seatDiv.dataset.teamid = team.teamId;
        seatDiv.dataset.pos = seat.pos;
        if (seat.driver) {
            seatDiv.appendChild(buildDriverCard(seat.driver));
        } else {
            const empty = document.createElement("div");
            empty.className = "junior-seat-empty bold-font";
            empty.textContent = `CAR ${seat.pos}`;
            seatDiv.appendChild(empty);
        }
        seatsDiv.appendChild(seatDiv);
    });
    card.appendChild(seatsDiv);
    return card;
}

function poolGroupLabel(driver) {
    if (driver.juniorTeamId) return currentSeries === 2 ? "F3 drivers" : "F2 drivers";
    if (driver.f1TeamId) return "F1 affiliates";
    return "Free agents";
}

export function loadJuniorGrid(data) {
    if (!data || Number(data.formula) !== currentSeries) return; // answer for a series no longer shown
    gridData = data;

    teamsColumn.innerHTML = "";
    data.teams.forEach((team) => teamsColumn.appendChild(buildTeamCard(team)));

    poolDiv.innerHTML = "";
    let lastGroup = null;
    data.pool.forEach((driver) => {
        const group = poolGroupLabel(driver);
        if (group !== lastGroup) {
            const header = document.createElement("div");
            header.className = "junior-pool-header bold-font";
            header.textContent = group;
            poolDiv.appendChild(header);
            lastGroup = group;
        }
        poolDiv.appendChild(buildDriverCard(driver));
    });
    applyPoolFilter();
}

function applyPoolFilter() {
    const q = poolFilter.value.trim().toLowerCase();
    poolDiv.querySelectorAll(".junior-card").forEach((card) => {
        card.classList.toggle("d-none", q !== "" && !card.dataset.name.toLowerCase().includes(q));
    });
    // hide a group header when nothing under it is visible
    poolDiv.querySelectorAll(".junior-pool-header").forEach((header) => {
        let el = header.nextElementSibling;
        let anyVisible = false;
        while (el && !el.classList.contains("junior-pool-header")) {
            if (!el.classList.contains("d-none")) anyVisible = true;
            el = el.nextElementSibling;
        }
        header.classList.toggle("d-none", !anyVisible);
    });
}

poolFilter.addEventListener("input", applyPoolFilter);

function findDriver(driverId) {
    const id = Number(driverId);
    for (const team of gridData?.teams || []) {
        for (const seat of team.seats) {
            if (seat.driver && Number(seat.driver.driverId) === id) return { driver: seat.driver, teamId: team.teamId, pos: seat.pos };
        }
    }
    const pooled = gridData?.pool.find(d => Number(d.driverId) === id);
    return pooled ? { driver: pooled, teamId: null, pos: null } : null;
}

function dropTargetAt(x, y, dragged) {
    for (const el of document.elementsFromPoint(x, y)) {
        if (dragged.contains(el)) continue;
        const seat = el.closest(".junior-seat");
        if (seat) return { seat };
        if (el.closest("#juniorPoolColumn")) return { pool: true };
    }
    return null;
}

function handleDrop(card, target) {
    const source = findDriver(card.dataset.driverid);
    if (!source || !target) return;

    if (target.pool) {
        if (source.teamId === null) return;
        new Command("juniorGridRelease", {
            formula: currentSeries,
            driverID: source.driver.driverId,
            driver: source.driver.name,
            team: teamDisplayName(source.teamId)
        }).execute();
        return;
    }

    const teamId = Number(target.seat.dataset.teamid);
    const pos = Number(target.seat.dataset.pos);
    if (source.teamId === teamId && source.pos === pos) return;

    const occupantId = target.seat.querySelector(".junior-card")?.dataset.driverid;
    const occupant = occupantId ? findDriver(occupantId) : null;

    // seat to seat with someone already there: they trade places
    if (source.teamId !== null && occupant) {
        new Command("juniorGridSwap", {
            formula: currentSeries,
            a: { driverID: source.driver.driverId, driver: source.driver.name, teamID: source.teamId, posInTeam: source.pos },
            b: { driverID: occupant.driver.driverId, driver: occupant.driver.name, teamID: teamId, posInTeam: pos }
        }).execute();
        return;
    }

    // pool to seat (anyone already in it goes back to the pool), or seat to an empty seat
    new Command("juniorGridAssign", {
        formula: currentSeries,
        driverID: source.driver.driverId,
        driver: source.driver.name,
        teamID: teamId,
        posInTeam: pos,
        team: occupant ? `${teamDisplayName(teamId)}, replacing ${occupant.driver.name}` : teamDisplayName(teamId)
    }).execute();
}

function clearDropHover() {
    document.querySelectorAll("#juniorGridLayout .drop-hover").forEach(el => el.classList.remove("drop-hover"));
}

interact('.junior-card').draggable({
    listeners: {
        start(event) {
            const target = event.target;
            const rect = target.getBoundingClientRect();
            target.style.width = rect.width + "px";
            target.style.position = "fixed";
            target.style.top = rect.top + "px";
            target.style.left = rect.left + "px";
            target.style.zIndex = 10;
            target.classList.add("dragging");
        },
        move(event) {
            const target = event.target;
            const x = (parseFloat(target.dataset.x) || 0) + event.dx;
            const y = (parseFloat(target.dataset.y) || 0) + event.dy;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.dataset.x = x;
            target.dataset.y = y;

            clearDropHover();
            const hovered = dropTargetAt(event.clientX, event.clientY, target);
            if (hovered?.seat) hovered.seat.classList.add("drop-hover");
            else if (hovered?.pool) document.getElementById("juniorPoolColumn").classList.add("drop-hover");
        },
        end(event) {
            const target = event.target;
            clearDropHover();
            const dropTarget = dropTargetAt(event.clientX, event.clientY, target);
            target.style.position = "relative";
            target.style.top = "auto";
            target.style.left = "auto";
            target.style.width = "auto";
            target.style.transform = "none";
            target.style.zIndex = 1;
            target.dataset.x = 0;
            target.dataset.y = 0;
            target.classList.remove("dragging");
            handleDrop(target, dropTarget);
        }
    }
});
