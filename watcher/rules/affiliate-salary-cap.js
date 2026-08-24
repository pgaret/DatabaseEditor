const SALARY_PER_RATING = 26838;
const SALARY_INTERCEPT = -1180938;
const MIN_SALARY = 100000;
const MAX_SALARY = 1200000;
const BONUS_RATIO = 0.10;
const TOLERANCE = 1.15;

export function affiliateSalaryCap(db) {
  let changed = false;

  const playerResult = db.exec("SELECT TeamID FROM Player");
  if (!playerResult.length || !playerResult[0].values.length) return false;
  const playerTeamID = playerResult[0].values[0][0];
  if (playerTeamID == null) return false;

  const affiliates = db.exec(`
    SELECT sc.StaffID, sc.TeamID, sc.Salary, sc.StartingBonus,
           sc.ContractType, sc.PosInTeam
    FROM Staff_Contracts sc
    JOIN Staff_DriverData dd ON sc.StaffID = dd.StaffID
    WHERE sc.PosInTeam >= 3
      AND sc.TeamID BETWEEN 1 AND 10
      AND sc.TeamID != ${playerTeamID}
      AND sc.ContractType = 0
  `);

  if (!affiliates.length || !affiliates[0].values.length) return false;

  for (const row of affiliates[0].values) {
    const [staffID, teamID, currentSalary, currentBonus] = row;

    const stats = db.exec(
      `SELECT AVG(Val) FROM Staff_PerformanceStats WHERE StaffID = ${staffID}`
    );
    if (!stats.length || !stats[0].values.length || stats[0].values[0][0] == null) continue;

    const avgRating = stats[0].values[0][0];
    let idealSalary = Math.round(SALARY_PER_RATING * avgRating + SALARY_INTERCEPT);
    idealSalary = Math.max(MIN_SALARY, Math.min(MAX_SALARY, idealSalary));
    const idealBonus = Math.round(idealSalary * BONUS_RATIO);

    if (currentSalary > idealSalary * TOLERANCE) {
      db.run(
        `UPDATE Staff_Contracts SET Salary = ${idealSalary}, StartingBonus = ${idealBonus}
         WHERE StaffID = ${staffID} AND TeamID = ${teamID} AND ContractType = 0 AND PosInTeam >= 3`
      );
      changed = true;
    }
  }

  return changed;
}
