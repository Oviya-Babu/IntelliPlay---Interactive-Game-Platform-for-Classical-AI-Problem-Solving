/* ============================================
   N-QUEENS HELPERS — Pure algorithm functions
   Ported from NQueens_visualization/app.js
   ============================================ */

// ─── TYPES ────────────────────────────────────────────────

export interface SafetyCheck {
  safe: boolean;
  reason?: 'column' | 'diagonal';
  conflictRow?: number;
}

export interface GameStep {
  type: 'enter-row' | 'try' | 'place' | 'reject' | 'backtrack' | 'exhausted' | 'solution';
  row: number;
  col: number;
  board: number[];
  conflictRow?: number;
  conflictReason?: 'column' | 'diagonal';
}

export interface TutorMessage {
  type: 'info' | 'system' | 'teaching' | 'success' | 'danger' | 'warning' | 'hint';
  text: string;
}

export interface HintResult {
  row: number;
  col: number;
}

export interface AlgoState {
  row: string;
  col: string;
  action: string;
  queens: number;
}

export interface ConflictPair {
  row1: number;
  col1: number;
  row2: number;
  col2: number;
  reason: 'column' | 'diagonal';
}

export type CellState =
  | 'valid'
  | 'conflict'
  | 'scanning'
  | 'current-row'
  | 'hint-cell'
  | 'solution-cell'
  | 'highlight-col'
  | 'highlight-diag';

export type GameMode = 'manual' | 'solve' | 'learn';

export type StepType = GameStep['type'];

// ─── CONFIG ───────────────────────────────────────────────

export const CONFIG = {
  MIN_N: 4,
  MAX_N: 10,
  DEFAULT_N: 8,
  DEFAULT_SPEED: 5,
  SPEED_DELAYS: {
    1: 2000, 2: 1500, 3: 1000, 4: 700, 5: 500,
    6: 350, 7: 200, 8: 120, 9: 60, 10: 20,
  } as Record<number, number>,
};

// ─── QUEEN SVG ────────────────────────────────────────────

export const QUEEN_SVG = `<svg class="queen-svg" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="queenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#c4b5fd"/>
      <stop offset="50%" style="stop-color:#a78bfa"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <filter id="queenShadow">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <g filter="url(#queenShadow)">
    <path d="M 9 26 C 17.5 24.5 27.5 24.5 36 26 L 38.5 13.5 L 31 25 L 22.5 8.5 L 14 25 L 6.5 13.5 L 9 26 z"
          fill="url(#queenGrad)" stroke="#7c3aed" stroke-width="1" stroke-linejoin="round"/>
    <path d="M 9 26 C 9 28 10.5 30 15.5 31 C 20.5 31.5 24.5 31.5 29.5 31 C 34.5 30 36 28 36 26"
          fill="url(#queenGrad)" stroke="#7c3aed" stroke-width="1"/>
    <path d="M 11 33.5 C 16 35.5 29 35.5 34 33.5 C 34.5 32 33.5 30.5 29.5 30 C 24.5 29.5 20.5 29.5 15.5 30 C 11.5 30.5 10.5 32 11 33.5"
          fill="url(#queenGrad)" stroke="#7c3aed" stroke-width="1"/>
    <path d="M 11.5 37 C 16 38.5 29 38.5 33.5 37 C 34 35.5 33 34 29 33.5 C 24.5 33 20.5 33 16 33.5 C 12 34 11 35.5 11.5 37"
          fill="url(#queenGrad)" stroke="#7c3aed" stroke-width="1"/>
    <circle cx="6.5" cy="13.5" r="2" fill="#c4b5fd" stroke="#7c3aed" stroke-width="0.8"/>
    <circle cx="14" cy="8.5" r="2" fill="#c4b5fd" stroke="#7c3aed" stroke-width="0.8"/>
    <circle cx="22.5" cy="6.5" r="2" fill="#c4b5fd" stroke="#7c3aed" stroke-width="0.8"/>
    <circle cx="31" cy="8.5" r="2" fill="#c4b5fd" stroke="#7c3aed" stroke-width="0.8"/>
    <circle cx="38.5" cy="13.5" r="2" fill="#c4b5fd" stroke="#7c3aed" stroke-width="0.8"/>
  </g>
</svg>`;

// ─── ALGORITHM ENGINE ─────────────────────────────────────

export function isSafe(board: number[], row: number, col: number): SafetyCheck {
  for (let i = 0; i < row; i++) {
    if (board[i] === -1) continue;
    if (board[i] === col) return { safe: false, reason: 'column', conflictRow: i };
    if (Math.abs(board[i] - col) === Math.abs(i - row))
      return { safe: false, reason: 'diagonal', conflictRow: i };
  }
  return { safe: true };
}

export function isSafeSimple(board: number[], row: number, col: number, n: number): boolean {
  for (let i = 0; i < n; i++) {
    if (i === row || board[i] === -1) continue;
    if (board[i] === col) return false;
    if (Math.abs(board[i] - col) === Math.abs(i - row)) return false;
  }
  return true;
}

export function generateSteps(n: number): GameStep[] {
  const steps: GameStep[] = [];
  const board = new Array(n).fill(-1);

  function backtrack(row: number): boolean {
    if (row === n) {
      steps.push({ type: 'solution', row: -1, col: -1, board: [...board] });
      return true;
    }

    steps.push({ type: 'enter-row', row, col: -1, board: [...board] });

    for (let col = 0; col < n; col++) {
      steps.push({ type: 'try', row, col, board: [...board] });

      const check = isSafe(board, row, col);
      if (check.safe) {
        board[row] = col;
        steps.push({ type: 'place', row, col, board: [...board] });

        if (backtrack(row + 1)) return true;

        board[row] = -1;
        steps.push({ type: 'backtrack', row, col, board: [...board] });
      } else {
        steps.push({
          type: 'reject',
          row,
          col,
          board: [...board],
          conflictRow: check.conflictRow,
          conflictReason: check.reason,
        });
      }
    }

    steps.push({ type: 'exhausted', row, col: -1, board: [...board] });
    return false;
  }

  backtrack(0);
  return steps;
}

// ─── HINT SYSTEM (BACKTRACKING-BASED) ─────────────────────

export function computeHint(currentBoard: number[], n: number): HintResult | null {
  // Find first empty row
  let targetRow = -1;
  for (let r = 0; r < n; r++) {
    if (currentBoard[r] === -1) {
      targetRow = r;
      break;
    }
  }
  if (targetRow === -1) return null;

  function canSolve(board: number[], row: number): boolean {
    if (row === n) return true;
    if (board[row] !== -1) {
      for (let i = 0; i < n; i++) {
        if (i === row || board[i] === -1) continue;
        if (board[i] === board[row]) return false;
        if (Math.abs(board[i] - board[row]) === Math.abs(i - row)) return false;
      }
      return canSolve(board, row + 1);
    }
    for (let col = 0; col < n; col++) {
      if (isSafeSimple(board, row, col, n)) {
        board[row] = col;
        if (canSolve([...board], row + 1)) return true;
        board[row] = -1;
      }
    }
    return false;
  }

  for (let col = 0; col < n; col++) {
    const tryBoard = [...currentBoard];
    if (isSafeSimple(tryBoard, targetRow, col, n)) {
      tryBoard[targetRow] = col;
      if (canSolve([...tryBoard], targetRow + 1)) {
        return { row: targetRow, col };
      }
    }
  }

  return null;
}

// ─── CONFLICT DETECTION (MANUAL MODE) ─────────────────────

export function findConflicts(board: number[], n: number): ConflictPair[] {
  const conflicts: ConflictPair[] = [];
  for (let r1 = 0; r1 < n; r1++) {
    if (board[r1] === -1) continue;
    for (let r2 = r1 + 1; r2 < n; r2++) {
      if (board[r2] === -1) continue;
      if (board[r1] === board[r2]) {
        conflicts.push({ row1: r1, col1: board[r1], row2: r2, col2: board[r2], reason: 'column' });
      } else if (Math.abs(board[r1] - board[r2]) === Math.abs(r1 - r2)) {
        conflicts.push({ row1: r1, col1: board[r1], row2: r2, col2: board[r2], reason: 'diagonal' });
      }
    }
  }
  return conflicts;
}

export function hasConflicts(board: number[], n: number): boolean {
  for (let r1 = 0; r1 < n; r1++) {
    if (board[r1] === -1) continue;
    for (let r2 = r1 + 1; r2 < n; r2++) {
      if (board[r2] === -1) continue;
      if (board[r1] === board[r2]) return true;
      if (Math.abs(board[r1] - board[r2]) === Math.abs(r1 - r2)) return true;
    }
  }
  return false;
}

// ─── HELPER ───────────────────────────────────────────────

export function getColLetter(col: number): string {
  return String.fromCharCode(65 + col);
}

// ─── AI TUTOR MESSAGE GENERATOR ───────────────────────────

interface TeachingFlags {
  firstPlacementSeen: boolean;
  firstConflictSeen: boolean;
  firstBacktrackSeen: boolean;
}

export const TUTOR = {
  welcome(mode: GameMode, n: number): TutorMessage[] {
    const msgs: TutorMessage[] = [];
    if (mode === 'manual') {
      msgs.push({ type: 'info', text: `Welcome! 🎮 You're playing the <b>${n}-Queens Challenge</b>. Place ${n} queens so no two attack each other.` });
      msgs.push({ type: 'system', text: 'Click any cell to place or remove a queen. Use 💡 Hint if stuck!' });
    } else if (mode === 'solve') {
      msgs.push({ type: 'info', text: `🤖 <b>AI Solve Mode</b> — I'll solve the ${n}-Queens problem using <b>Backtracking</b>. Watch every step!` });
      msgs.push({ type: 'system', text: 'Use Start, Pause, or Step to control the algorithm.' });
    } else if (mode === 'learn') {
      msgs.push({ type: 'teaching', text: `📚 <b>Welcome to Learn Mode!</b> I'll teach you how <b>Backtracking</b> solves the ${n}-Queens problem.` });
      msgs.push({ type: 'teaching', text: `<b>The Goal:</b> Place ${n} queens on a ${n}×${n} board — no shared rows, columns, or diagonals.` });
      msgs.push({ type: 'teaching', text: `<b>The Strategy:</b> Place one queen per row, moving forward when safe. If we hit a dead end, we <em>backtrack</em> — undo and try another path.` });
      msgs.push({ type: 'system', text: "Press Start or Step to begin. I'll explain every decision!" });
    }
    return msgs;
  },

  stepMessage(step: GameStep, mode: GameMode, flags: TeachingFlags): { msgs: TutorMessage[]; updatedFlags: Partial<TeachingFlags> } {
    const { type, row, col, conflictRow, conflictReason, board } = step;
    const colL = col >= 0 ? getColLetter(col) : '?';
    const msgs: TutorMessage[] = [];
    const updatedFlags: Partial<TeachingFlags> = {};

    switch (type) {
      case 'enter-row':
        msgs.push({ type: 'info', text: `➡️ Moving to <b>Row ${row + 1}</b>. Scanning for a safe column...` });
        if (mode === 'learn' && row === 0) {
          msgs.push({ type: 'teaching', text: `🎓 We start at Row 1. The algorithm tries each column left to right, checking safety before placing.` });
        }
        break;

      case 'try':
        msgs.push({ type: 'warning', text: `🔍 Trying Row ${row + 1}, Column ${colL}...` });
        break;

      case 'place':
        if (mode === 'learn' && !flags.firstPlacementSeen) {
          updatedFlags.firstPlacementSeen = true;
          msgs.push({ type: 'success', text: `✅ <b>Valid — no conflicts!</b> Queen placed at Row ${row + 1}, Col ${colL}.` });
          msgs.push({ type: 'teaching', text: `🎓 <b>How do we check safety?</b><br>1️⃣ No queen in the same column<br>2️⃣ No queen on upper-left diagonal<br>3️⃣ No queen on upper-right diagonal<br>All clear → move forward!` });
        } else {
          msgs.push({ type: 'success', text: `✅ <b>Valid!</b> Queen placed at Row ${row + 1}, Col ${colL}.` });
        }
        break;

      case 'reject': {
        const conflictColL = conflictRow !== undefined && board[conflictRow] !== -1
          ? getColLetter(board[conflictRow]) : '?';
        if (conflictReason === 'column') {
          msgs.push({ type: 'danger', text: `❌ <b>Rejected</b> — column ${colL} blocked by queen at Row ${(conflictRow ?? 0) + 1}.` });
        } else {
          msgs.push({ type: 'danger', text: `❌ <b>Rejected</b> — diagonal conflict with queen at Row ${(conflictRow ?? 0) + 1}, Col ${conflictColL}.` });
        }
        if (mode === 'learn' && !flags.firstConflictSeen) {
          updatedFlags.firstConflictSeen = true;
          msgs.push({ type: 'teaching', text: `🎓 <b>Key insight:</b> <code>isSafe()</code> checks all queens above this row. If any shares a column or diagonal — we skip and try the next column.` });
        }
        break;
      }

      case 'backtrack':
        msgs.push({ type: 'danger', text: `↩️ <b>Backtracking!</b> Removing queen from Row ${row + 1}, Col ${colL}.` });
        if (mode === 'learn' && !flags.firstBacktrackSeen) {
          updatedFlags.firstBacktrackSeen = true;
          msgs.push({ type: 'teaching', text: `🎓 <b>This is BACKTRACKING!</b> The heart of the algorithm.<br><br>No safe column in the next row → we come back and try a different column. Like retracing steps in a maze.<br><br><em>Try → fail → undo → try again</em> — this systematic exploration is what makes backtracking powerful!` });
        }
        break;

      case 'exhausted':
        msgs.push({ type: 'warning', text: `🚫 Row ${row + 1} exhausted — all columns failed. Going back up...` });
        if (mode === 'learn') {
          msgs.push({ type: 'teaching', text: `🎓 Every column in this row failed. We return to the previous row — this is "recursive unwinding."` });
        }
        break;

      case 'solution': {
        const n = board.length;
        msgs.push({ type: 'success', text: `🔥 <b>SOLUTION FOUND!</b> All ${n} queens placed safely!<br><br>This is exactly how backtracking works — trying, validating, and correcting until a valid solution is found.` });
        if (mode === 'learn') {
          msgs.push({ type: 'teaching', text: `🎓 <b>Key Takeaways:</b><br>🔹 One queen per row<br>🔹 Try columns left to right<br>🔹 <code>isSafe()</code> prunes invalid branches<br>🔹 Dead ends trigger backtracking<br>🔹 The algorithm guarantees a solution if one exists!` });
        }
        break;
      }
    }

    return { msgs, updatedFlags };
  },

  manualPlace(row: number, col: number, n: number, queensPlaced: number): TutorMessage {
    return { type: 'success', text: `♛ Queen placed at Row ${row + 1}, Col ${getColLetter(col)}. <span style="opacity:0.6">(${queensPlaced}/${n})</span>` };
  },

  manualRemove(row: number, col: number): TutorMessage {
    return { type: 'system', text: `Removed queen from Row ${row + 1}, Col ${getColLetter(col)}.` };
  },

  manualConflict(row: number, col: number, conflicts: Array<{ row: number; col: number; reason: string }>): TutorMessage {
    const details = conflicts.map(c => {
      const cColL = getColLetter(c.col);
      return c.reason === 'column'
        ? `Row ${c.row + 1} (same column)`
        : `Row ${c.row + 1}, Col ${cColL} (diagonal)`;
    }).join('; ');
    return { type: 'danger', text: `⚠️ <b>Unsafe position!</b> Row ${row + 1}, Col ${getColLetter(col)} conflicts with: ${details}` };
  },

  manualSolved(n: number): TutorMessage {
    return { type: 'success', text: `🔥 <b>Perfect!</b> You solved the ${n}-Queens puzzle!<br>All queens placed safely — no row, column, or diagonal conflicts!` };
  },

  hintMessage(row: number, col: number): TutorMessage {
    return { type: 'hint', text: `💡 Try placing a queen at <b>Row ${row + 1}, Col ${getColLetter(col)}</b> — it keeps all constraints satisfied and leads to a valid solution.` };
  },

  hintUnavailable(): TutorMessage {
    return { type: 'warning', text: `💡 No valid hint available. The current board may have conflicts — try removing some queens and rearranging.` };
  },

  hintHasConflicts(): TutorMessage {
    return { type: 'warning', text: `⚠️ Your board has conflicts! Remove the conflicting queens first, then ask for a hint.` };
  },
};

// ─── FACT ENGINE ──────────────────────────────────────────

export const FACTS_POOL = [
  "👑 The 8-Queens puzzle was first proposed by chess composer Max Bezzel in 1848.",
  "🤯 There are 92 distinct solutions to the 8-Queens problem!",
  "⚡ Backtracking is used in Sudoku solvers, maze generators, and pathfinding algorithms.",
  "🧠 The N-Queens problem grows exponentially — that's why pruning is essential.",
  "💡 N=4 has only 2 distinct solutions — try finding both!",
  "🚀 Backtracking is a form of depth-first search (DFS) through a decision tree.",
  "📐 For N=1, there's exactly 1 solution. For N=2 and N=3, there are zero!",
  "🏆 In 1874, Günther proposed a determinant-based approach to N-Queens.",
  "🌀 The search space for 8-Queens is 16.7 million — backtracking prunes most of it.",
  "🔬 N-Queens is NP-hard when generalized, but efficient heuristics exist for large N.",
  "♟️ The problem is related to placing non-attacking rooks and bishops too!",
  "🎯 Constraint propagation can reduce the search space dramatically.",
  "📊 For N=10, there are 724 distinct solutions.",
  "💻 Backtracking was popularized by Derrick Lehmer in the 1950s.",
  "🌟 The first complete analysis of 8-Queens was by Franz Nauck in 1850.",
  "🔄 Every N-Queens solution has at most 8 variants through rotation and reflection.",
  "⏱️ A modern computer solves 8-Queens in microseconds using backtracking.",
  "🧩 N-Queens is a classic constraint satisfaction problem (CSP).",
  "🎲 Random placement solves N-Queens faster for very large N (like N=1000)!",
  "📈 The number of solutions grows roughly exponentially: S(N) ≈ 0.143 × N!",
];

export class FactEngine {
  private queue: number[] = [];
  private lastIndex = -1;

  constructor() {
    this.shuffle();
  }

  private shuffle(): void {
    this.queue = [...Array(FACTS_POOL.length).keys()];
    // Fisher-Yates
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    if (this.queue[0] === this.lastIndex && this.queue.length > 1) {
      [this.queue[0], this.queue[1]] = [this.queue[1], this.queue[0]];
    }
  }

  getNext(): string {
    if (this.queue.length === 0) this.shuffle();
    const idx = this.queue.shift()!;
    this.lastIndex = idx;
    return FACTS_POOL[idx];
  }
}

// ─── CODE DISPLAY ─────────────────────────────────────────

export const CODE_LINES = [
  'function solveNQueens(row) {',
  '  if (row === N) return true;',
  '',
  '  for (col = 0; col < N; col++) {',
  '    if (isSafe(board, row, col)) {',
  '      board[row] = col;',
  '      if (solveNQueens(row + 1))',
  '        return true;',
  '      board[row] = -1;',
  '    }',
  '  }',
  '  return false;',
  '}',
];

export type CodeLineHighlight = 'active' | 'success-line' | 'danger-line' | null;

export function getCodeHighlights(stepType: StepType | ''): CodeLineHighlight[] {
  const highlights: CodeLineHighlight[] = new Array(CODE_LINES.length).fill(null);

  switch (stepType) {
    case 'enter-row':
      highlights[0] = 'active';
      break;
    case 'solution':
      highlights[1] = 'success-line';
      break;
    case 'try':
      highlights[3] = 'active';
      break;
    case 'place':
      highlights[4] = 'success-line';
      highlights[5] = 'success-line';
      break;
    case 'reject':
      highlights[4] = 'danger-line';
      break;
    case 'backtrack':
      highlights[8] = 'danger-line';
      break;
    case 'exhausted':
      highlights[11] = 'danger-line';
      break;
  }

  return highlights;
}
