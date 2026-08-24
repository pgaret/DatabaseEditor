import { computeWeightedOverall } from './utils.js';

const IMP_THRESHOLD = 75;
const BOOST_PER_SAVE = 2;

function computeStatFloor(improvability) {
  return Math.round(55 + improvability * 0.3);
}

function computeStatCeiling(improvability) {
  return Math.round(75 + improvability * 0.2);
}

export function prospectDevelopment(db) {
  let changed = false;

  const prospects = db.exec(`
    SELECT dd.StaffID, dd.Improvability
    FROM Staff_DriverData dd
    JOIN Staff_GameData gd ON dd.StaffID = gd.StaffID
    WHERE dd.Improvability >= ${IMP_THRESHOLD}
      AND gd.Retired = 0
  `);

  if (!prospects.length || !prospects[0].values.length) return false;

  for (const [staffID, improvability] of prospects[0].values) {
    const stats = db.exec(
      `SELECT StatID, Val FROM Staff_PerformanceStats
       WHERE StaffID = ${staffID} AND StatID BETWEEN 2 AND 10
       ORDER BY StatID`
    );
    if (!stats.length || stats[0].values.length !== 9) continue;

    const floor = computeStatFloor(improvability);
    const ceiling = computeStatCeiling(improvability);

    for (const [statID, val] of stats[0].values) {
      let newVal = val;

      if (val < floor) {
        newVal = Math.min(val + BOOST_PER_SAVE, floor);
      }

      if (newVal > ceiling) {
        newVal = ceiling;
      }

      if (newVal !== val) {
        db.run(
          `UPDATE Staff_PerformanceStats
           SET Val = ${newVal}
           WHERE StaffID = ${staffID} AND StatID = ${statID}`
        );
        changed = true;
      }
    }
  }

  return changed;
}
