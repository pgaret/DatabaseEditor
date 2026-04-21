import { queryDB } from "../dbManager";
import { removeNumber } from "./dbUtils";

// StatID -> override-file key (also shown as table column key)
export const DRIVER_STAT_ID_MAP = {
    2: "cornering",
    3: "braking",
    4: "control",
    5: "smoothness",
    6: "adaptability",
    7: "overtaking",
    8: "defending",
    9: "reactions",
    10: "accuracy"
};

export const DRIVER_STAT_KEYS = [
    "cornering", "braking", "control", "smoothness", "adaptability",
    "overtaking", "defending", "reactions", "accuracy",
    "improvability", "aggression", "marketability"
];

const DRIVER_DATA_KEYS = new Set(["improvability", "aggression", "marketability"]);
const DRIVER_DATA_COLUMNS = {
    improvability: "Improvability",
    aggression: "Aggression",
    marketability: "Marketability"
};

function parseName(raw) {
    if (!raw) return "";
    if (raw.includes("STRING_LITERAL")) {
        const m = raw.match(/\|([^|]+)\|/);
        return m ? m[1] : "";
    }
    const forename = raw.match(/StaffName_Forename_(?:Male|Female)_(\w+)/);
    if (forename) return removeNumber(forename[1]);
    const surname = raw.match(/StaffName_Surname_(\w+)/);
    if (surname) return removeNumber(surname[1]);
    return raw;
}

/**
 * Returns all drivers with the 12 stats needed for the driver preset table.
 * Shape: [{ staffId, name, firstName, lastName, teamId, retired,
 *           cornering, braking, control, smoothness, adaptability,
 *           overtaking, defending, reactions, accuracy,
 *           improvability, aggression, marketability }]
 */
export function fetchDriverPresetData() {
    const rows = queryDB(`
        SELECT
            bas.StaffID,
            bas.FirstName,
            bas.LastName,
            dri.Improvability,
            dri.Aggression,
            dri.Marketability,
            con.TeamID,
            gam.Retired
        FROM Staff_BasicData bas
        JOIN Staff_DriverData dri ON bas.StaffID = dri.StaffID
        LEFT JOIN Staff_Contracts con
            ON bas.StaffID = con.StaffID
            AND (con.ContractType = 0 OR con.ContractType IS NULL)
        LEFT JOIN Staff_GameData gam ON bas.StaffID = gam.StaffID
        GROUP BY bas.StaffID
        ORDER BY bas.LastName, bas.FirstName
    `, [], 'allRows') || [];

    const staffIds = rows.map(r => r[0]);
    if (!staffIds.length) return [];

    const statRows = queryDB(`
        SELECT StaffID, StatID, Val
        FROM Staff_PerformanceStats
        WHERE StatID BETWEEN 2 AND 10
          AND StaffID IN (${staffIds.map(() => '?').join(',')})
    `, staffIds, 'allRows') || [];

    const statsByDriver = {};
    for (const [sid, statId, val] of statRows) {
        if (!statsByDriver[sid]) statsByDriver[sid] = {};
        const key = DRIVER_STAT_ID_MAP[statId];
        if (key) statsByDriver[sid][key] = val;
    }

    const out = [];
    for (const row of rows) {
        const [staffId, firstRaw, lastRaw, improv, aggr, market, teamId, retired] = row;
        const firstName = parseName(firstRaw);
        const lastName = parseName(lastRaw);
        if (firstName === "Placeholder") continue;
        const name = `${firstName} ${lastName}`.trim();
        const stats = statsByDriver[staffId] || {};
        out.push({
            staffId,
            name,
            firstName,
            lastName,
            teamId: teamId ?? -1,
            retired: retired ?? 0,
            cornering: stats.cornering ?? 0,
            braking: stats.braking ?? 0,
            control: stats.control ?? 0,
            smoothness: stats.smoothness ?? 0,
            adaptability: stats.adaptability ?? 0,
            overtaking: stats.overtaking ?? 0,
            defending: stats.defending ?? 0,
            reactions: stats.reactions ?? 0,
            accuracy: stats.accuracy ?? 0,
            improvability: improv ?? 0,
            aggression: aggr ?? 0,
            marketability: market ?? 0
        });
    }
    return out;
}

/**
 * Applies an override map to the current save's DB.
 * @param {Object} overrides - { "First Last": { cornering: 95, ... } }
 * @returns {{ applied: number, skipped: string[] }}
 */
export function applyDriverStatOverrides(overrides) {
    if (!overrides || typeof overrides !== "object") {
        return { applied: 0, skipped: [] };
    }

    const nameKeys = Object.keys(overrides);
    if (!nameKeys.length) return { applied: 0, skipped: [] };

    const allDrivers = fetchDriverPresetData();
    const byName = new Map();
    for (const d of allDrivers) {
        byName.set(d.name, d);
    }

    const statIdByKey = {};
    for (const [statId, key] of Object.entries(DRIVER_STAT_ID_MAP)) {
        statIdByKey[key] = Number(statId);
    }

    let applied = 0;
    const skipped = [];

    for (const name of nameKeys) {
        const driver = byName.get(name);
        if (!driver) {
            skipped.push(name);
            continue;
        }

        const patch = overrides[name] || {};
        for (const [key, valRaw] of Object.entries(patch)) {
            const val = Number(valRaw);
            if (!Number.isFinite(val)) continue;
            const clamped = Math.max(0, Math.min(100, Math.round(val)));

            if (DRIVER_DATA_KEYS.has(key)) {
                queryDB(
                    `UPDATE Staff_DriverData SET ${DRIVER_DATA_COLUMNS[key]} = ? WHERE StaffID = ?`,
                    [clamped, driver.staffId],
                    'run'
                );
            } else if (statIdByKey[key] != null) {
                const statId = statIdByKey[key];
                const existing = queryDB(
                    `SELECT 1 FROM Staff_PerformanceStats WHERE StaffID = ? AND StatID = ?`,
                    [driver.staffId, statId],
                    'singleValue'
                );
                if (existing != null) {
                    queryDB(
                        `UPDATE Staff_PerformanceStats SET Val = ? WHERE StaffID = ? AND StatID = ?`,
                        [clamped, driver.staffId, statId],
                        'run'
                    );
                } else {
                    queryDB(
                        `INSERT INTO Staff_PerformanceStats (StaffID, StatID, Val, Max) VALUES (?, ?, ?, 100)`,
                        [driver.staffId, statId, clamped],
                        'run'
                    );
                }
            }
        }
        applied += 1;
    }

    return { applied, skipped };
}
