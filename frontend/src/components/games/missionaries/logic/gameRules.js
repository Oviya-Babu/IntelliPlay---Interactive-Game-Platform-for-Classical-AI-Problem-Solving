export const TOTAL_M = 3;
export const TOTAL_C = 3;
export const BOAT_CAPACITY = 2;

export function isValidState(leftM, leftC) {
  const rightM = TOTAL_M - leftM;
  const rightC = TOTAL_C - leftC;
  if (leftM < 0 || leftC < 0 || rightM < 0 || rightC < 0) return false;
  if (leftM > TOTAL_M || leftC > TOTAL_C) return false;
  if (leftM > 0 && leftC > leftM) return false;
  if (rightM > 0 && rightC > rightM) return false;
  return true;
}

export function getStateFromCharacters(characters, boatSide) {
  const leftM = characters.filter(c => c.type === 'missionary' && c.side === 'left').length;
  const leftC = characters.filter(c => c.type === 'cannibal' && c.side === 'left').length;
  return {
    left: { M: leftM, C: leftC },
    right: { M: TOTAL_M - leftM, C: TOTAL_C - leftC },
    boat: boatSide
  };
}

export function validateMove(characters, selectedIds, boatSide) {
  if (selectedIds.length === 0) return { valid: false, reason: 'You must select at least 1 person to move.' };
  if (selectedIds.length > BOAT_CAPACITY) return { valid: false, reason: `The boat can carry at most ${BOAT_CAPACITY} people.` };

  const selectedChars = characters.filter(c => selectedIds.includes(c.id));
  const wrongSide = selectedChars.find(c => c.side !== boatSide);
  if (wrongSide) return { valid: false, reason: `${wrongSide.label} is not on the ${boatSide} bank where the boat is.` };

  const newSide = boatSide === 'left' ? 'right' : 'left';
  const movingM = selectedChars.filter(c => c.type === 'missionary').length;
  const movingC = selectedChars.filter(c => c.type === 'cannibal').length;

  const curLeftM = characters.filter(c => c.type === 'missionary' && c.side === 'left').length;
  const curLeftC = characters.filter(c => c.type === 'cannibal' && c.side === 'left').length;

  let newLeftM, newLeftC;
  if (boatSide === 'left') {
    newLeftM = curLeftM - movingM;
    newLeftC = curLeftC - movingC;
  } else {
    newLeftM = curLeftM + movingM;
    newLeftC = curLeftC + movingC;
  }

  const newRightM = TOTAL_M - newLeftM;
  const newRightC = TOTAL_C - newLeftC;

  return { valid: true, newLeftM, newLeftC, newRightM, newRightC };
}

export function checkGameOver(state) {
  if (state.left.M > 0 && state.left.C > state.left.M) return 'left';
  if (state.right.M > 0 && state.right.C > state.right.M) return 'right';
  return false;
}

export function checkWin(characters) {
  return characters.every(c => c.side === 'right');
}
