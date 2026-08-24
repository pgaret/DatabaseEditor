// Weights match calculateOverall in stats.js
const STAT_WEIGHTS = [1, 0.75, 0.75, 0.5, 0.25, 0.25, 0.25, 0.5, 0.75];
const WEIGHT_SUM = 5;

export function computeWeightedOverall(db, staffID) {
  const result = db.exec(
    `SELECT StatID, Val FROM Staff_PerformanceStats
     WHERE StaffID = ${staffID} AND StatID BETWEEN 2 AND 10
     ORDER BY StatID`
  );
  if (!result.length || result[0].values.length !== 9) return null;

  let weighted = 0;
  for (let i = 0; i < 9; i++) {
    weighted += result[0].values[i][1] * STAT_WEIGHTS[i];
  }
  return Math.round(weighted / WEIGHT_SUM);
}
