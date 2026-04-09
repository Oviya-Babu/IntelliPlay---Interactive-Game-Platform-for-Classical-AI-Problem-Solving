const MOVES = [
  { m: 0, c: 2, label: '2 monsters' },
  { m: 0, c: 1, label: '1 monster' },
  { m: 1, c: 1, label: '1 human and 1 monster' },
  { m: 2, c: 0, label: '2 humans' },
  { m: 1, c: 0, label: '1 human' },
];

function stateKey(s) {
  return `${s.left.M},${s.left.C},${s.boat}`;
}

function isValid(s) {
  const leftM = s.left.M;
  const leftC = s.left.C;
  const rightM = s.right.M;
  const rightC = s.right.C;
  if (leftM < 0 || leftC < 0 || rightM < 0 || rightC < 0) return false;
  if (leftM > 3 || leftC > 3) return false;
  if (leftM > 0 && leftC > leftM) return false;
  if (rightM > 0 && rightC > rightM) return false;
  return true;
}

function getSuccessors(state) {
  const results = [];
  const dir = state.boat === 'left' ? -1 : 1;
  for (const move of MOVES) {
    const leftM = state.left.M + dir * move.m;
    const leftC = state.left.C + dir * move.c;
    const ns = {
      left: { M: leftM, C: leftC },
      right: { M: 3 - leftM, C: 3 - leftC },
      boat: state.boat === 'left' ? 'right' : 'left',
    };
    if (isValid(ns)) {
      results.push({ state: ns, move });
    }
  }
  return results;
}

export function solve(initialState) {
  if (!initialState) initialState = { left: { M: 3, C: 3 }, right: { M: 0, C: 0 }, boat: 'left' };
  const goal = s => s.left.M === 0 && s.left.C === 0 && s.boat === 'right';
  if (goal(initialState)) return [];

  const queue = [{ state: initialState, path: [] }];
  const visited = new Set();
  visited.add(stateKey(initialState));

  while (queue.length > 0) {
    const { state, path } = queue.shift();
    for (const { state: ns, move } of getSuccessors(state)) {
      const key = stateKey(ns);
      if (visited.has(key)) continue;
      visited.add(key);
      const newPath = [...path, {
        state: ns,
        move,
        explanation: explainMove(state, ns, move)
      }];
      if (goal(ns)) return newPath;
      queue.push({ state: ns, path: newPath });
    }
  }
  return null;
}

export function computeOptimalPath() {
  const initial = { left: { M: 3, C: 3 }, right: { M: 0, C: 0 }, boat: 'left' };
  const solution = solve(initial);
  if (!solution) return null;

  const fullPath = [{ state: initial, move: null }];
  for (const step of solution) {
    fullPath.push({ state: step.state, move: step.move });
  }
  return fullPath;
}

export function findStateInPath(path, currentState) {
  if (!path) return -1;
  const key = stateKey(currentState);
  return path.findIndex(entry => stateKey(entry.state) === key);
}

export function getNextFromPath(path, currentState) {
  const idx = findStateInPath(path, currentState);

  if (idx >= 0 && idx < path.length - 1) {
    const nextEntry = path[idx + 1];
    const remaining = path.length - 1 - idx;
    return {
      move: nextEntry.move,
      nextState: nextEntry.state,
      remaining,
      onPath: true,
    };
  }

  const solution = solve(currentState);
  if (!solution || solution.length === 0) return null;

  return {
    move: solution[0].move,
    nextState: solution[0].state,
    remaining: solution.length,
    onPath: false,
  };
}

export function getHintFromPath(path, currentState) {
  const result = getNextFromPath(path, currentState);
  if (!result || !result.move) return { missionaries: 0, cannibals: 0 };
  
  // Validate move capacity (max 2 total)
  const totalPeople = result.move.m + result.move.c;
  if (totalPeople < 1 || totalPeople > 2) {
    return { missionaries: 0, cannibals: 0 }; // Invalid move, fallback
  }
  
  return {
    missionaries: result.move.m,
    cannibals: result.move.c,
    move: result.move,
  };
}

export function getNextBestMove(currentState) {
  const solution = solve(currentState);
  if (solution && solution.length > 0) return solution[0];
  return null;
}

export function getHintCharacters(currentState) {
  const next = getNextBestMove(currentState);
  if (!next) return { missionaries: 0, cannibals: 0 };
  return { missionaries: next.move.m, cannibals: next.move.c, move: next.move };
}

export function explainMove(fromState, toState, move) {
  const dir = fromState.boat === 'left' ? 'Left → Right' : 'Right → Left';
  const lM = toState.left.M, lC = toState.left.C;
  const rM = toState.right.M, rC = toState.right.C;
  let msg = `Moved ${move.label} (${dir}).`;
  msg += ` Now: Left(${lM}H, ${lC}Z) | Right(${rM}H, ${rC}Z).`;
  if ((lM === 0 || lM >= lC) && (rM === 0 || rM >= rC)) {
    msg += ' ✅ Safe!';
  }
  return msg;
}

export function explainWhySafe(fromState, toState, move) {
  const lM = toState.left.M, lC = toState.left.C;
  const rM = toState.right.M, rC = toState.right.C;
  const reasons = [];
  if (lM === 0) reasons.push('Left bank has no humans to protect.');
  else if (lM >= lC) reasons.push(`Left bank: ${lM}H ≥ ${lC}Z — safe.`);
  if (rM === 0) reasons.push('Right bank has no humans to protect.');
  else if (rM >= rC) reasons.push(`Right bank: ${rM}H ≥ ${rC}Z — safe.`);
  return reasons.join(' ');
}

export function explainWhyNotOthers(currentState) {
  const warnings = [];
  const dir = currentState.boat === 'left' ? -1 : 1;
  for (const move of MOVES) {
    const nLM = currentState.left.M + dir * move.m;
    const nLC = currentState.left.C + dir * move.c;
    const nRM = 3 - nLM;
    const nRC = 3 - nLC;
    if (nLM < 0 || nLC < 0 || nRM < 0 || nRC < 0) continue;
    const unsafe = (nLM > 0 && nLC > nLM) || (nRM > 0 && nRC > nRM);
    if (unsafe) {
      let why = `Moving ${move.label} → `;
      if (nLM > 0 && nLC > nLM) why += `Left: ${nLM}H vs ${nLC}Z — outnumbered!`;
      else if (nRM > 0 && nRC > nRM) why += `Right: ${nRM}H vs ${nRC}Z — outnumbered!`;
      warnings.push(why);
    }
  }
  return warnings;
}

export function generateAITeaching(path, currentState, moveNum, learningMode) {
  const result = getNextFromPath(path, currentState);

  if (!result) {
    if (currentState.left.M === 0 && currentState.left.C === 0) {
      return { text: '🎉 Perfect! Everyone crossed safely!', type: 'success' };
    }
    return { text: '😰 Dead end — no safe moves. Restart!', type: 'error' };
  }

  const m = result.move.m;
  const c = result.move.c;
  const parts = [];
  if (m > 0) parts.push(`${m} Human${m > 1 ? 's' : ''}`);
  if (c > 0) parts.push(`${c} Monster${c > 1 ? 's' : ''}`);
  const direction = currentState.boat === 'left' ? 'Right' : 'Left';
  const pathNote = result.onPath ? '' : '\n🔀 You left the optimal path — recalculated!';

  if (!learningMode) {
    return {
      text: `💡 Move ${parts.join(' & ')} → ${direction} (${result.remaining} left)${pathNote}`,
      type: 'hint'
    };
  }

  const whySafe = explainWhySafe(currentState, result.nextState, result.move);
  const badMoves = explainWhyNotOthers(currentState);
  const badLine = badMoves.length > 0 ? `\n⚠️ ${badMoves[0]}` : '';

  return {
    text: `💡 Best: Move ${parts.join(' & ')} → ${direction}\n✅ ${whySafe}${badLine}\n📊 ${result.remaining} moves to goal.${pathNote}`,
    type: 'hint'
  };
}

export { MOVES };
