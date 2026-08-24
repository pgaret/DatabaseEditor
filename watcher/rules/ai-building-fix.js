const CONDITION_THRESHOLD = 0.25;

export function aiBuildingFix(db) {
  let changed = false;

  const playerResult = db.exec("SELECT TeamID FROM Player");
  if (!playerResult.length || !playerResult[0].values.length) return false;
  const playerTeamID = playerResult[0].values[0][0];
  if (playerTeamID == null) return false;

  const degraded = db.exec(`
    SELECT bh.TeamID, bh.BuildingID, bh.BuildingType, b.RefurbishCost
    FROM Buildings_HQ bh
    JOIN Buildings b ON b.BuildingID = bh.BuildingID
    WHERE bh.DegradationValue < ${CONDITION_THRESHOLD}
      AND bh.TeamID != ${playerTeamID}
    ORDER BY bh.TeamID, bh.DegradationValue ASC
  `);

  if (!degraded.length || !degraded[0].values.length) return false;

  const balances = {};
  const balResult = db.exec("SELECT TeamID, Balance FROM Finance_TeamBalance");
  if (balResult.length) {
    for (const row of balResult[0].values) {
      balances[row[0]] = row[1];
    }
  }

  for (const row of degraded[0].values) {
    const [teamID, buildingID, buildingType, refurbishCost] = row;
    const currentLevel = buildingID % 10;
    const balance = balances[teamID] ?? 0;

    if (currentLevel < 5) {
      const nextID = buildingID + 1;
      const upResult = db.exec(
        `SELECT ConstructionCost FROM Buildings WHERE BuildingID = ${nextID}`
      );
      if (upResult.length && upResult[0].values.length) {
        const upgradeCost = upResult[0].values[0][0];
        if (balance >= upgradeCost) {
          db.run(
            `UPDATE Buildings_HQ SET BuildingID = ${nextID}, DegradationValue = 1
             WHERE TeamID = ${teamID} AND BuildingType = ${buildingType}`
          );
          db.run(
            `UPDATE Finance_TeamBalance SET Balance = Balance - ${upgradeCost}
             WHERE TeamID = ${teamID}`
          );
          balances[teamID] = balance - upgradeCost;
          changed = true;
          continue;
        }
      }
    }

    if (refurbishCost > 0 && balance >= refurbishCost) {
      db.run(
        `UPDATE Buildings_HQ SET DegradationValue = 1
         WHERE TeamID = ${teamID} AND BuildingType = ${buildingType}`
      );
      db.run(
        `UPDATE Finance_TeamBalance SET Balance = Balance - ${refurbishCost}
         WHERE TeamID = ${teamID}`
      );
      balances[teamID] = balance - refurbishCost;
      changed = true;
    }
  }

  return changed;
}
