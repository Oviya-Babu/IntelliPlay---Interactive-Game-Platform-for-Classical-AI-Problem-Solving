// ═══════════════════════════════════════════════════════
// Cryptarithmetic — Utilities
// ═══════════════════════════════════════════════════════

import type { PuzzleConfig, SolverStep, TreeNode, CryptoLevel } from './types';

// ── Puzzle helpers ──────────────────────────────────────

export function parsePuzzle(equation: string): PuzzleConfig {
  const parts = equation.replace('=', '+').split('+').map(p => p.trim().toUpperCase());
  return { word1: parts[0] || '', word2: parts[1] || '', result: parts[2] || '', name: equation };
}

export function wordToNumber(word: string, assignment: Record<string, number>): number | null {
  const digits = word.split('').map(ch => assignment[ch]);
  if (digits.some(d => d === undefined)) return null;
  return parseInt(digits.join(''), 10);
}

export function getUniqueLetters(puzzle: PuzzleConfig): string[] {
  const all = (puzzle.word1 + puzzle.word2 + puzzle.result).split('');
  return [...new Set(all)].sort();
}

export function getLeadingLetters(puzzle: PuzzleConfig): string[] {
  return [...new Set([puzzle.word1[0], puzzle.word2[0], puzzle.result[0]])];
}

export function validateEquation(input: string): string | null {
  const parts = input.replace('=', '+').split('+').map(p => p.trim());
  if (parts.length !== 3) return 'Equation must be: WORD1 + WORD2 = RESULT';
  for (const p of parts) {
    if (!p) return 'All three words are required';
    if (!/^[A-Za-z]+$/.test(p)) return 'Only letters allowed in words';
  }
  const allLetters = new Set((parts[0] + parts[1] + parts[2]).toUpperCase().split(''));
  if (allLetters.size > 10) return `Too many unique letters (${allLetters.size}). Max is 10.`;
  return null;
}

// ── Level-aware explanations ────────────────────────────

export function getLevelExplanation(level: number, step: SolverStep | null): string {
  if (!step) {
    const intros: Record<number, string> = {
      1: "Welcome! A cryptarithmetic puzzle replaces digits with letters. Each letter represents a unique digit (0-9). Leading letters can't be zero. Let's explore!",
      2: "Try assigning digits yourself! Click a letter, then pick a digit. I'll tell you if you're on the right track.",
      3: "Watch me try EVERY possible combination! This is called brute force — it works, but it's incredibly slow. Pay attention to the counter...",
      4: "Before solving, let's understand the constraints. Each letter is a variable. Each constraint limits which digits are valid. This is Constraint Satisfaction!",
      5: "Now watch backtracking in action! I'll assign digits one by one. When I hit a dead end, I backtrack. Use the step controls to go at your pace.",
      6: "Let's compare! Without forward checking, I explore blindly. WITH forward checking, I peek ahead and prune impossible branches early.",
      7: "MRV (Minimum Remaining Values) is a smart heuristic. I pick the variable with fewest valid digits first — this finds contradictions faster!",
      8: "Race time! You solve manually while I use my CSP solver. Let's see who finishes first! 🏁",
      9: "Time for complex puzzles with 10+ unique letters. Watch the full power of CSP with forward checking and MRV combined.",
      10: "Master mode! Create your own puzzles. I'll validate them and explain every step of my solution. Ask me anything!",
    };
    return intros[level] || "Let's solve some cryptarithmetic!";
  }

  switch (step.type) {
    case 'assign':
      if (level <= 3) return `Trying ${step.letter} = ${step.digit}. Let's see if this works...`;
      if (level <= 5) return step.msg;
      return `Assigned ${step.letter} = ${step.digit}. Coefficient contribution: partial sum is now ${step.partial_sum}. ${Object.keys(step.assignment).length} of ${Object.keys(step.domains).length + Object.keys(step.assignment).length} variables assigned.`;
    case 'prune':
      if (level <= 4) return `Skipped ${step.letter} = ${step.digit} — it can't work!`;
      return step.msg;
    case 'backtrack':
      if (level <= 4) return `Dead end! Undoing ${step.letter} = ${step.digit} and trying something else.`;
      return step.msg;
    case 'solution':
      return step.msg;
    case 'no_solution':
      return step.msg;
    default:
      return step.msg;
  }
}

// ── Tree building ───────────────────────────────────────

export function buildTreeFromSteps(steps: SolverStep[], maxNodes: number = 80): TreeNode {
  const root: TreeNode = {
    id: 'root',
    letter: '',
    digit: -1,
    type: 'assign',
    depth: -1,
    children: [],
    assignment: {},
  };

  const stack: TreeNode[] = [root];
  let nodeCount = 0;

  for (const step of steps) {
    if (nodeCount >= maxNodes) break;

    if (step.type === 'assign' || step.type === 'solution') {
      const node: TreeNode = {
        id: `${step.letter}-${step.digit}-${step.step_id}`,
        letter: step.letter,
        digit: step.digit,
        type: step.type === 'solution' ? 'solution' : 'assign',
        depth: step.depth,
        children: [],
        assignment: { ...step.assignment },
      };

      // Find parent at correct depth
      while (stack.length > 1 && stack[stack.length - 1].depth >= step.depth) {
        stack.pop();
      }
      stack[stack.length - 1].children.push(node);
      stack.push(node);
      nodeCount++;
    } else if (step.type === 'prune') {
      const node: TreeNode = {
        id: `prune-${step.letter}-${step.digit}-${step.step_id}`,
        letter: step.letter,
        digit: step.digit,
        type: 'prune',
        depth: step.depth,
        children: [],
        assignment: { ...step.assignment },
      };
      while (stack.length > 1 && stack[stack.length - 1].depth >= step.depth) {
        stack.pop();
      }
      stack[stack.length - 1].children.push(node);
      nodeCount++;
    } else if (step.type === 'backtrack') {
      // Mark the current top as backtracked
      if (stack.length > 1) {
        stack[stack.length - 1].type = 'backtrack';
        stack.pop();
      }
    }
  }

  return root;
}

// ── Preset puzzles per level ────────────────────────────

export const LEVEL_PUZZLES: Record<number, PuzzleConfig[]> = {
  1: [{ word1: 'SEND', word2: 'MORE', result: 'MONEY', name: 'SEND + MORE = MONEY' }],
  2: [
    { word1: 'AB', word2: 'CD', result: 'EF', name: 'AB + CD = EF' },
    { word1: 'SUN', word2: 'FUN', result: 'SWIM', name: 'SUN + FUN = SWIM' },
  ],
  3: [{ word1: 'TWO', word2: 'TWO', result: 'FOUR', name: 'TWO + TWO = FOUR' }],
  4: [{ word1: 'SEND', word2: 'MORE', result: 'MONEY', name: 'SEND + MORE = MONEY' }],
  5: [
    { word1: 'BASE', word2: 'BALL', result: 'GAMES', name: 'BASE + BALL = GAMES' },
    { word1: 'EAT', word2: 'THAT', result: 'APPLE', name: 'EAT + THAT = APPLE' },
  ],
  6: [{ word1: 'SEND', word2: 'MORE', result: 'MONEY', name: 'SEND + MORE = MONEY' }],
  7: [{ word1: 'SEND', word2: 'MORE', result: 'MONEY', name: 'SEND + MORE = MONEY' }],
  8: [
    { word1: 'ODD', word2: 'ODD', result: 'EVEN', name: 'ODD + ODD = EVEN' },
    { word1: 'SUN', word2: 'MOON', result: 'STARS', name: 'SUN + MOON = STARS' },
  ],
  9: [
    { word1: 'CROSS', word2: 'ROADS', result: 'DANGER', name: 'CROSS + ROADS = DANGER' },
    { word1: 'GREEN', word2: 'GREEN', result: 'YELLOW', name: 'GREEN + GREEN = YELLOW' },
  ],
  10: [
    { word1: 'SEND', word2: 'MORE', result: 'MONEY', name: 'SEND + MORE = MONEY' },
  ],
};

// ── Level definitions ───────────────────────────────────

export const CRYPTO_LEVELS: CryptoLevel[] = [
  {
    id: 1, title: 'Introduction', description: 'What is Cryptarithmetic?',
    mode: 'tutorial', aiSays: "Welcome! Let me show you the magic of cryptarithmetic.",
    instructions: ['Watch the animated puzzle', 'Understand the rules'],
    unlocked: true, puzzle: LEVEL_PUZZLES[1][0], solverMode: 'full_csp', useMrv: true,
  },
  {
    id: 2, title: 'Manual Solving', description: 'Assign digits yourself',
    mode: 'manual', aiSays: "Your turn! Try assigning digits to letters.",
    instructions: ['Click a letter', 'Pick a digit', 'Watch the constraints'],
    unlocked: true, puzzle: LEVEL_PUZZLES[2][0], solverMode: 'full_csp', useMrv: true,
  },
  {
    id: 3, title: 'Brute Force', description: 'See why brute force is slow',
    mode: 'brute_force_demo', aiSays: "Watch me try EVERY combination!",
    instructions: ['Observe the counter', 'Notice how slow this is'],
    unlocked: true, puzzle: LEVEL_PUZZLES[3][0], solverMode: 'brute_force', useMrv: false,
  },
  {
    id: 4, title: 'CSP Introduction', description: 'Variables, domains & constraints',
    mode: 'constraint_viz', aiSays: "Let me show you the constraint network.",
    instructions: ['Click nodes to explore', 'Watch domains shrink'],
    unlocked: true, puzzle: LEVEL_PUZZLES[4][0], solverMode: 'full_csp', useMrv: true,
  },
  {
    id: 5, title: 'Backtracking', description: 'Step-by-step solving',
    mode: 'step_by_step', aiSays: "Control the solver step by step!",
    instructions: ['Use Next/Prev buttons', 'Watch the tree grow', 'See backtracking in red'],
    unlocked: true, puzzle: LEVEL_PUZZLES[5][0], solverMode: 'forward_checking', useMrv: false,
  },
  {
    id: 6, title: 'Forward Checking', description: 'Pruning impossible branches',
    mode: 'comparison', aiSays: "Forward checking is a game changer!",
    instructions: ['Compare metrics', 'See pruned branches'],
    unlocked: true, puzzle: LEVEL_PUZZLES[6][0], solverMode: 'forward_checking', useMrv: false,
  },
  {
    id: 7, title: 'MRV Heuristic', description: 'Smart variable ordering',
    mode: 'mrv_demo', aiSays: "MRV: pick the most constrained first!",
    instructions: ['See domain sizes', 'Watch smart ordering'],
    unlocked: true, puzzle: LEVEL_PUZZLES[7][0], solverMode: 'full_csp', useMrv: true,
  },
  {
    id: 8, title: 'Challenge', description: 'Race the AI!',
    mode: 'race', aiSays: "Think you can beat a CSP solver? Let's race! 🏁",
    instructions: ['Solve manually', 'AI races alongside you'],
    unlocked: true, puzzle: LEVEL_PUZZLES[8][0], solverMode: 'full_csp', useMrv: true,
  },
  {
    id: 9, title: 'Complex Puzzles', description: '10+ letter challenges',
    mode: 'advanced', aiSays: "Time for the hard stuff. 10 unique letters!",
    instructions: ['Full visualization', 'All optimizations enabled'],
    unlocked: true, puzzle: LEVEL_PUZZLES[9][0], solverMode: 'full_csp', useMrv: true,
  },
  {
    id: 10, title: 'Master Mode', description: 'Create & explore',
    mode: 'master', aiSays: "You're the master now. Create your own puzzles!",
    instructions: ['Enter custom words', 'I validate & solve', 'Ask me anything'],
    unlocked: true, puzzle: LEVEL_PUZZLES[10][0], solverMode: 'full_csp', useMrv: true,
  },
];
