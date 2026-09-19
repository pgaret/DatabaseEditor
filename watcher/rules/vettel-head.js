// Un-retired Vettel has no bespoke 3D model, and as a real (non-generated)
// driver with no FaceType/FaceIndex he gets no generic head either. Give him
// the same setup the game uses for its other legends (Schumacher, Barrichello):
// flagged generated, with a generic head from the pool - here Schumacher's.
const STAFF_ID = 9;
const HEAD = { IsGeneratedStaff: 1, FaceType: 0, FaceIndex: 13, AgeType: 1 };

export function vettelHead(db) {
  const result = db.exec(`
    SELECT IsGeneratedStaff, FaceType, FaceIndex, AgeType FROM Staff_BasicData
    WHERE StaffID = ${STAFF_ID}
  `);
  if (!result.length || !result[0].values.length) return false;

  const [generated, faceType, faceIndex, ageType] = result[0].values[0];
  if (generated === HEAD.IsGeneratedStaff && faceType === HEAD.FaceType
    && faceIndex === HEAD.FaceIndex && ageType === HEAD.AgeType) {
    return false;
  }

  db.run(`
    UPDATE Staff_BasicData
    SET IsGeneratedStaff = ${HEAD.IsGeneratedStaff}, FaceType = ${HEAD.FaceType},
        FaceIndex = ${HEAD.FaceIndex}, AgeType = ${HEAD.AgeType}
    WHERE StaffID = ${STAFF_ID}
  `);
  return true;
}
