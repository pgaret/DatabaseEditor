const STAFF_ID = 18;
const TEAM_ID = 10;
const END_SEASON = 2027;
const RETIREMENT_AGE = 29;

export function strollLoyalty(db) {
  let changed = false;

  const contract = db.exec(`
    SELECT EndSeason, BreakoutClause FROM Staff_Contracts
    WHERE StaffID = ${STAFF_ID} AND TeamID = ${TEAM_ID} AND ContractType = 0
  `);

  if (contract.length && contract[0].values.length) {
    const [endSeason, breakout] = contract[0].values[0];
    if (endSeason < END_SEASON || breakout > 0) {
      db.run(`
        UPDATE Staff_Contracts
        SET EndSeason = ${END_SEASON}, BreakoutClause = 0
        WHERE StaffID = ${STAFF_ID} AND TeamID = ${TEAM_ID} AND ContractType = 0
      `);
      changed = true;
    }
  }

  const gameData = db.exec(`
    SELECT RetirementAge FROM Staff_GameData WHERE StaffID = ${STAFF_ID}
  `);

  if (gameData.length && gameData[0].values.length) {
    const [retAge] = gameData[0].values[0];
    if (retAge !== RETIREMENT_AGE) {
      db.run(`
        UPDATE Staff_GameData SET RetirementAge = ${RETIREMENT_AGE}
        WHERE StaffID = ${STAFF_ID}
      `);
      changed = true;
    }
  }

  return changed;
}
