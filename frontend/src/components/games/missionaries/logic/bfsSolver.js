/* ═══════════════════════════════════════════════════════════
   BFS Solver — Missionaries & Cannibals
   Provides BFS-based solving, hint generation, and
   detailed AI teaching explanations.
   ═══════════════════════════════════════════════════════════ */

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

/**
 * BFS solver — returns shortest path from initialState to goal.
 * Also tracks stats (statesExplored, depthLevel) for teaching.
 */
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

/**
 * Compute BFS stats for teaching — runs full BFS and returns metrics.
 */
export function getBfsStats(initialState) {
  if (!initialState) initialState = { left: { M: 3, C: 3 }, right: { M: 0, C: 0 }, boat: 'left' };
  const goal = s => s.left.M === 0 && s.left.C === 0 && s.boat === 'right';

  let statesExplored = 0;
  let maxDepth = 0;

  const queue = [{ state: initialState, depth: 0 }];
  const visited = new Set();
  visited.add(stateKey(initialState));

  while (queue.length > 0) {
    const { state, depth } = queue.shift();
    statesExplored++;
    if (depth > maxDepth) maxDepth = depth;
    if (goal(state)) break;

    for (const { state: ns } of getSuccessors(state)) {
      const key = stateKey(ns);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ state: ns, depth: depth + 1 });
    }
  }

  return { statesExplored, depthLevel: maxDepth, totalStatesVisited: visited.size };
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

  // Player deviated — re-solve from current state via BFS
  const solution = solve(currentState);
  if (!solution || solution.length === 0) return null;

  return {
    move: solution[0].move,
    nextState: solution[0].state,
    remaining: solution.length,
    onPath: false,
  };
}

/**
 * Get hint from BFS path — ALWAYS correct, NEVER random or unsafe.
 * Returns structured hint object with move details and reasoning.
 */
export function getHintFromPath(path, currentState) {
  const result = getNextFromPath(path, currentState);
  if (!result || !result.move) return { missionaries: 0, cannibals: 0, hintText: '', safetyText: '' };

  const m = result.move.m;
  const c = result.move.c;

  // Validate move capacity (max 2 total)
  const totalPeople = m + c;
  if (totalPeople < 1 || totalPeople > 2) {
    return { missionaries: 0, cannibals: 0, hintText: '', safetyText: '' };
  }

  // Build hint text
  const parts = [];
  if (m > 0) parts.push(`${m} Human${m > 1 ? 's' : ''}`);
  if (c > 0) parts.push(`${c} Monster${c > 1 ? 's' : ''}`);
  const direction = currentState.boat === 'left' ? 'Right' : 'Left';
  const hintText = `Move ${parts.join(' & ')} → ${direction}`;

  // Build safety reasoning
  const safetyText = explainWhySafe(currentState, result.nextState, result.move);

  // Path status
  const pathNote = result.onPath ? '' : '(Recalculated — you left the optimal path)';

  return {
    missionaries: m,
    cannibals: c,
    move: result.move,
    hintText,
    safetyText,
    pathNote,
    remaining: result.remaining,
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

/**
 * Analyze all possible moves from current state.
 * Returns array of { move, isSafe, resultState, reason }.
 */
function analyzeAllMoves(currentState) {
  const dir = currentState.boat === 'left' ? -1 : 1;
  const available = currentState.boat === 'left'
    ? { m: currentState.left.M, c: currentState.left.C }
    : { m: currentState.right.M, c: currentState.right.C };

  const analyses = [];
  for (const move of MOVES) {
    // Check if enough people available
    if (move.m > available.m || move.c > available.c) continue;

    const nLM = currentState.left.M + dir * move.m;
    const nLC = currentState.left.C + dir * move.c;
    const nRM = 3 - nLM;
    const nRC = 3 - nLC;

    if (nLM < 0 || nLC < 0 || nRM < 0 || nRC < 0) continue;

    const nextState = {
      left: { M: nLM, C: nLC },
      right: { M: nRM, C: nRC },
      boat: currentState.boat === 'left' ? 'right' : 'left',
    };

    const leftUnsafe = nLM > 0 && nLC > nLM;
    const rightUnsafe = nRM > 0 && nRC > nRM;
    const isSafe = !leftUnsafe && !rightUnsafe;

    let reason;
    if (isSafe) {
      const parts = [];
      if (nLM === 0) parts.push('Left: no humans to protect');
      else parts.push(`Left: ${nLM}H ≥ ${nLC}Z`);
      if (nRM === 0) parts.push('Right: no humans to protect');
      else parts.push(`Right: ${nRM}H ≥ ${nRC}Z`);
      reason = parts.join(' | ');
    } else {
      if (leftUnsafe) reason = `Left: ${nLM}H < ${nLC}Z — outnumbered!`;
      else reason = `Right: ${nRM}H < ${nRC}Z — outnumbered!`;
    }

    analyses.push({ move, isSafe, resultState: nextState, reason });
  }

  return analyses;
}

/**
 * Generate detailed AI teaching explanation for the current state.
 * Produces structured multi-section content for the tutor panel.
 */
export function generateDetailedExplanation(path, currentState, moveNum, learningMode) {
  const result = getNextFromPath(path, currentState);

  // Win state
  if (currentState.left.M === 0 && currentState.left.C === 0 && currentState.boat === 'right') {
    return {
      sections: [
        { title: '🎉 PUZZLE SOLVED', content: 'All characters crossed safely! The BFS algorithm found the optimal 11-move solution.' },
        { title: '📊 FINAL RESULT', content: `Completed in ${moveNum} moves. ${moveNum <= 11 ? 'That\'s optimal — you matched the BFS shortest path!' : `Optimal is 11 moves. You used ${moveNum}. The BFS algorithm always finds the shortest path by exploring level-by-level.`}` },
        { title: '🧠 WHY BFS WORKS HERE', content: 'BFS guarantees the shortest solution because it explores ALL states at depth N before any state at depth N+1. This means the first complete path it finds must be the shortest possible.' },
      ],
      type: 'success',
    };
  }

  // Dead end
  if (!result) {
    const allMoves = analyzeAllMoves(currentState);
    const rejectedLines = allMoves.length > 0
      ? allMoves.map(a => {
          const mp = [];
          if (a.move.m > 0) mp.push(`${a.move.m}H`);
          if (a.move.c > 0) mp.push(`${a.move.c}Z`);
          return `❌ ${mp.join('+')} → ${a.reason}`;
        }).join('\n')
      : 'No moves possible from this state.';
    return {
      sections: [
        { title: '😰 DEAD END', content: 'No safe moves available from this state. You need to restart the puzzle.' },
        { title: '❌ ALL MOVES REJECTED', content: rejectedLines },
        { title: '🧠 WHAT WENT WRONG', content: 'Every possible move from here would result in humans being outnumbered on one bank. This state is unreachable via the optimal BFS path.' },
      ],
      type: 'error',
    };
  }

  const m = result.move.m;
  const c = result.move.c;
  const parts = [];
  if (m > 0) parts.push(`${m} Human${m > 1 ? 's' : ''}`);
  if (c > 0) parts.push(`${c} Monster${c > 1 ? 's' : ''}`);
  const direction = currentState.boat === 'left' ? 'Right' : 'Left';

  const sections = [];

  // ─── Section 1: Current State ───
  const lM = currentState.left.M, lC = currentState.left.C;
  const rM = currentState.right.M, rC = currentState.right.C;
  const boatLabel = currentState.boat === 'left' ? 'Left' : 'Right';
  const leftSafe = lM === 0 ? '(no humans)' : lM >= lC ? `(${lM}H ≥ ${lC}Z ✅)` : `(${lM}H < ${lC}Z ⚠️)`;
  const rightSafe = rM === 0 ? '(no humans)' : rM >= rC ? `(${rM}H ≥ ${rC}Z ✅)` : `(${rM}H < ${rC}Z ⚠️)`;
  sections.push({
    title: '📊 CURRENT STATE',
    content: `Left Bank: ${lM} Humans, ${lC} Monsters ${leftSafe}\nRight Bank: ${rM} Humans, ${rC} Monsters ${rightSafe}\nBoat: ${boatLabel} bank\nMove #${moveNum + 1} — analyzing options...`,
  });

  // ─── Section 2: ALL Possible Moves — ALWAYS shown ───
  const allMoves = analyzeAllMoves(currentState);
  const safeMoves = allMoves.filter(a => a.isSafe);
  const unsafeMoves = allMoves.filter(a => !a.isSafe);

  let movesContent = '';

  // Safe moves
  if (safeMoves.length > 0) {
    movesContent += `✅ SAFE MOVES (${safeMoves.length}):\n`;
    movesContent += safeMoves.map(a => {
      const mp = [];
      if (a.move.m > 0) mp.push(`${a.move.m} Human${a.move.m > 1 ? 's' : ''}`);
      if (a.move.c > 0) mp.push(`${a.move.c} Monster${a.move.c > 1 ? 's' : ''}`);
      return `  → ${mp.join(' & ')} → ${direction}: ${a.reason}`;
    }).join('\n');
  }

  // Rejected moves
  if (unsafeMoves.length > 0) {
    if (movesContent) movesContent += '\n\n';
    movesContent += `❌ REJECTED MOVES (${unsafeMoves.length}):\n`;
    movesContent += unsafeMoves.map(a => {
      const mp = [];
      if (a.move.m > 0) mp.push(`${a.move.m} Human${a.move.m > 1 ? 's' : ''}`);
      if (a.move.c > 0) mp.push(`${a.move.c} Monster${a.move.c > 1 ? 's' : ''}`);
      return `  ✗ ${mp.join(' & ')} → ${direction}: ${a.reason}`;
    }).join('\n');
  }

  if (!movesContent) movesContent = 'No moves available from this state.';

  sections.push({
    title: '🔍 ALL POSSIBLE MOVES',
    content: movesContent,
  });

  // ─── Section 3: BFS Thinking — ALWAYS shown ───
  const totalSafe = safeMoves.length;
  sections.push({
    title: '🧠 BFS THINKING',
    content: `Exploring state at depth ${moveNum} in the search tree.\n${totalSafe} safe move${totalSafe !== 1 ? 's' : ''} available, ${unsafeMoves.length} rejected.\nBFS explores ALL states at this depth before going deeper.\n${result.remaining} move${result.remaining !== 1 ? 's' : ''} remaining on the shortest path to goal.\nTotal states in BFS queue are evaluated level-by-level.`,
  });

  // ─── Section 4: Decision ───
  const pathNote = result.onPath
    ? 'This move is on the precomputed optimal BFS path.'
    : '🔀 You deviated from the optimal path — BFS recalculated from your current state!';
  sections.push({
    title: '✅ DECISION',
    content: `Move ${parts.join(' & ')} → ${direction}\n\nChosen because it leads to the shortest safe path.\n${pathNote}\nOut of ${totalSafe} safe options, BFS selects the one that minimizes total moves to goal.`,
  });

  // ─── Section 5: Safety Check ───
  const nLM = result.nextState.left.M, nLC = result.nextState.left.C;
  const nRM = result.nextState.right.M, nRC = result.nextState.right.C;
  const leftCheck = nLM === 0 ? 'Left: 0 humans — no risk ✅' : `Left: ${nLM}H ≥ ${nLC}Z — safe ✅`;
  const rightCheck = nRM === 0 ? 'Right: 0 humans — no risk ✅' : `Right: ${nRM}H ≥ ${nRC}Z — safe ✅`;
  sections.push({
    title: '🛡️ SAFETY VERIFICATION',
    content: `After this move:\n${leftCheck}\n${rightCheck}\n\nConstraint satisfied: Humans are never outnumbered.\nThis state is valid and safe to proceed.`,
  });

  // ─── Section 6: Next Step Preview ───
  if (result.remaining > 1) {
    const nextBoatSide = currentState.boat === 'left' ? 'right' : 'left';
    const nextNextState = { ...result.nextState, boat: nextBoatSide };
    const nextResult = getNextFromPath(path, nextNextState);
    if (nextResult && nextResult.move) {
      const nm = nextResult.move.m, nc = nextResult.move.c;
      const np = [];
      if (nm > 0) np.push(`${nm} Human${nm > 1 ? 's' : ''}`);
      if (nc > 0) np.push(`${nc} Monster${nc > 1 ? 's' : ''}`);
      const nextDir = nextBoatSide === 'left' ? 'Right' : 'Left';
      sections.push({
        title: '👀 NEXT STEP PREVIEW',
        content: `After this move, the next optimal step will be:\n→ Move ${np.join(' & ')} → ${nextDir}\n\nThe boat will return to the ${nextBoatSide === 'left' ? 'left' : 'right'} bank first.`,
      });
    }
  } else if (result.remaining === 1) {
    sections.push({
      title: '🏁 FINAL MOVE',
      content: 'This is the last move! After this, all characters will be safely on the right bank. 🎉',
    });
  }

  return { sections, type: 'hint' };
}

/**
 * Legacy-compatible AI teaching function.
 * Returns { text, type } for backward compatibility with message system.
 */
export function generateAITeaching(path, currentState, moveNum, learningMode) {
  const detailed = generateDetailedExplanation(path, currentState, moveNum, learningMode);

  if (detailed.type === 'success' || detailed.type === 'error') {
    return { text: detailed.sections.map(s => s.content).join('\n'), type: detailed.type };
  }

  // Flatten sections into text
  const text = detailed.sections.map(s => `${s.title}\n${s.content}`).join('\n\n');
  return { text, type: detailed.type };
}

export { MOVES };
