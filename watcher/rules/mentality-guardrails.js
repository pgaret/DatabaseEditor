const GLOBAL_FLOOR = 30;
const GLOBAL_CEILING = 85;

// Weights match calculateOverall in stats.js
const STAT_WEIGHTS = [1, 0.75, 0.75, 0.5, 0.25, 0.25, 0.25, 0.5, 0.75];
const WEIGHT_SUM = 5;

// Mentality score thresholds for each opinion level (must stay in sync with the game)
const OPINION_THRESHOLDS = [
  [96, 0],  // >= 96 → Optimistic
  [64, 1],  // >= 64 → Positive
  [40, 2],  // >= 40 → Neutral
  [25, 3],  // >= 25 → Negative
  [0,  4],  // < 25  → Pessimistic
];

function opinionFromScore(score) {
  for (const [threshold, opinion] of OPINION_THRESHOLDS) {
    if (score >= threshold) return opinion;
  }
  return 4;
}

function computeFloor(overallRating) {
  // Drivers rated 85+ get meaningful protection; lower-rated drivers get less
  // 90 OVR → floor 45, 85 OVR → floor 37, 80 OVR → floor 30, <77 → no extra protection
  const floor = Math.round((overallRating - 70) * 1.5);
  return Math.max(GLOBAL_FLOOR, Math.min(floor, 50));
}

function computeWeightedOverall(db, staffID) {
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

export function mentalityGuardrails(db) {
  let changed = false;

  const drivers = db.exec(`
    SELECT ss.StaffID, ss.Mentality, ss.MentalityOpinion
    FROM Staff_State ss
    JOIN Staff_DriverData dd ON ss.StaffID = dd.StaffID
  `);

  if (!drivers.length || !drivers[0].values.length) return false;

  for (const [staffID, mentality, currentOpinion] of drivers[0].values) {
    const overall = computeWeightedOverall(db, staffID);
    const floor = overall != null ? computeFloor(overall) : GLOBAL_FLOOR;
    const ceiling = GLOBAL_CEILING;

    const clamped = Math.max(floor, Math.min(ceiling, mentality));
    if (clamped === mentality) continue;

    const newOpinion = opinionFromScore(clamped);

    db.run(
      `UPDATE Staff_State
       SET Mentality = ${clamped}, MentalityOpinion = ${newOpinion}
       WHERE StaffID = ${staffID}`
    );

    // If we raised the mentality, also raise any area opinions that are worse
    // than what the new global score implies
    if (clamped > mentality) {
      const maxAreaOpinion = newOpinion;
      db.run(
        `UPDATE Staff_Mentality_AreaOpinions
         SET Opinion = ${maxAreaOpinion}
         WHERE StaffID = ${staffID} AND Opinion > ${maxAreaOpinion}`
      );
    }

    changed = true;
  }

  return changed;
}
