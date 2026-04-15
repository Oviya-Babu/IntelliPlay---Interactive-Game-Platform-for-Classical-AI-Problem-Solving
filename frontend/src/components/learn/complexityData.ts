/* ═══════════════════════════════════════════════════════════
   Complexity Data — Static definitions for all 5 games
   ═══════════════════════════════════════════════════════════ */

export type GameId = 'tictactoe' | 'nqueens' | 'eightpuzzle' | 'missionaries' | 'cryptarith';

export interface ComplexityInfo {
  algorithm: string;
  algorithmFull: string;
  timeComplexity: string;
  spaceComplexity: string;
  timeLabel: string;
  spaceLabel: string;
  variables: Record<string, string>;
  whyExplanation: string;
  tooltipTime: string;
  tooltipSpace: string;
  aiMessages: {
    depthIncrease: string;
    pruning: string;
    backtrack: string;
    heuristic: string;
    exploration: string;
  };
}

export interface GameComplexityData {
  primary: ComplexityInfo;
  secondary?: ComplexityInfo;   // e.g., Alpha-Beta variant for TicTacToe
}

export const COMPLEXITY_DEFINITION = {
  title: 'What is Complexity?',
  description:
    'Time Complexity represents how the number of operations grows with input size. Space Complexity represents how much memory is used during execution.',
  note: 'Lower complexity = more efficient algorithm. Understanding complexity helps you choose the right approach for any problem.',
};

export const COMPLEXITY_DATA: Record<GameId, GameComplexityData> = {
  /* ── TIC-TAC-TOE ────────────────────── */
  tictactoe: {
    primary: {
      algorithm: 'Minimax',
      algorithmFull: 'Minimax Algorithm',
      timeComplexity: 'O(bᵈ)',
      spaceComplexity: 'O(d)',
      timeLabel: 'Exponential',
      spaceLabel: 'Linear',
      variables: {
        b: 'Branching factor — average number of possible moves per state (~4 for Tic-Tac-Toe)',
        d: 'Depth — maximum number of moves until game ends (up to 9)',
      },
      whyExplanation:
        'Minimax explores every possible future game state by assuming both players play optimally. At each level, it branches into all available moves (b), and it goes as deep as the game can last (d). This creates bᵈ total states to evaluate — about 255,168 for a full Tic-Tac-Toe tree.',
      tooltipTime: 'Exponential growth — doubles with each additional level of depth',
      tooltipSpace: 'Linear — only stores the current path from root to leaf',
      aiMessages: {
        depthIncrease: 'Going deeper into the game tree — evaluating future consequences.',
        pruning: 'Alpha-Beta pruning skipped branches that can\'t beat the current best.',
        backtrack: 'Explored all branches at this depth — returning the best score.',
        heuristic: 'Minimax assigns +10 for wins, -10 for losses, 0 for draws.',
        exploration: 'Evaluating all possible moves from this position.',
      },
    },
    secondary: {
      algorithm: 'Alpha-Beta',
      algorithmFull: 'Alpha-Beta Pruning',
      timeComplexity: 'Best O(b^(d/2)), Worst O(bᵈ)',
      spaceComplexity: 'O(d)',
      timeLabel: 'Optimized Exponential',
      spaceLabel: 'Linear',
      variables: {
        b: 'Branching factor — possible moves per state',
        d: 'Depth — moves until game ends',
        'α': 'Alpha — best score found for maximizer so far',
        'β': 'Beta — best score found for minimizer so far',
      },
      whyExplanation:
        'Alpha-Beta improves Minimax by tracking the best guaranteed scores (α for MAX, β for MIN). When α ≥ β, it "prunes" — skips entire sub-trees that mathematically cannot change the final decision. In the best case, this cuts the search from bᵈ to b^(d/2), examining the square root of total nodes.',
      tooltipTime: 'Best case examines √(total nodes) — massive speedup with good move ordering',
      tooltipSpace: 'Linear — same as Minimax, only stores the active path',
      aiMessages: {
        depthIncrease: 'Searching deeper — α-β bounds narrow with each level.',
        pruning: 'Pruned! This branch can\'t affect the outcome — α ≥ β.',
        backtrack: 'All promising branches explored — propagating best score up.',
        heuristic: 'Using α-β window to eliminate unpromising moves instantly.',
        exploration: 'Checking if this move improves the α-β bounds.',
      },
    },
  },

  /* ── N-QUEENS ───────────────────────── */
  nqueens: {
    primary: {
      algorithm: 'Backtracking',
      algorithmFull: 'Backtracking with Constraint Checking',
      timeComplexity: 'O(N!)',
      spaceComplexity: 'O(N)',
      timeLabel: 'Factorial',
      spaceLabel: 'Linear',
      variables: {
        N: 'Board size — number of queens to place (also the board dimension N×N)',
      },
      whyExplanation:
        'Backtracking explores all possible queen placements row by row. In the first row, there are N choices; in the second row, at most N-1 due to column constraints; in the third, N-2, and so on. This gives N × (N-1) × (N-2) × ... = N! combinations in the worst case. Forward checking reduces this significantly by eliminating invalid positions early.',
      tooltipTime: 'Factorial growth — increases extremely fast as N grows (8! = 40,320)',
      tooltipSpace: 'Linear — only stores one queen position per row',
      aiMessages: {
        depthIncrease: 'Moving to the next row — search depth increases.',
        pruning: 'Forward checking eliminated invalid column/diagonal positions.',
        backtrack: 'Dead end! Backtracking reduces unnecessary exploration.',
        heuristic: 'Constraint checking: verifying no column or diagonal conflicts.',
        exploration: 'Scanning available positions in the current row.',
      },
    },
  },

  /* ── 8-PUZZLE ───────────────────────── */
  eightpuzzle: {
    primary: {
      algorithm: 'A*',
      algorithmFull: 'A* Search with Manhattan Distance',
      timeComplexity: 'O(bᵈ)',
      spaceComplexity: 'O(bᵈ)',
      timeLabel: 'Exponential',
      spaceLabel: 'Exponential',
      variables: {
        b: 'Branching factor — average number of valid tile moves (~2-3 for 8-puzzle)',
        d: 'Depth — the optimal number of moves to reach the goal state',
      },
      whyExplanation:
        'A* explores states by choosing the one with the lowest f(n) = g(n) + h(n), where g is the actual cost and h is the estimated remaining cost (Manhattan distance). In the worst case, it still explores bᵈ states, but the heuristic dramatically reduces this in practice. Both time and space are exponential because A* must store all explored states to guarantee optimality.',
      tooltipTime: 'Exponential in worst case, but heuristic makes it much faster in practice',
      tooltipSpace: 'Exponential — must keep all explored states in memory for optimality',
      aiMessages: {
        depthIncrease: 'This step increases search depth — moving further from start.',
        pruning: 'Manhattan distance heuristic guides search toward the goal.',
        backtrack: 'A* revisited a lower-cost path — ensuring optimality.',
        heuristic: 'A* prioritizes promising states using f(n) = g(n) + h(n).',
        exploration: 'Expanding the state with the lowest estimated total cost.',
      },
    },
  },

  /* ── MISSIONARIES & CANNIBALS ───────── */
  missionaries: {
    primary: {
      algorithm: 'BFS',
      algorithmFull: 'Breadth-First Search',
      timeComplexity: 'O(bᵈ)',
      spaceComplexity: 'O(bᵈ)',
      timeLabel: 'Exponential',
      spaceLabel: 'Exponential',
      variables: {
        b: 'Branching factor — number of valid moves per state (up to 5 crossing combinations)',
        d: 'Depth — minimum number of crossings to reach the goal (11 for this puzzle)',
      },
      whyExplanation:
        'BFS explores all states level by level using a queue (FIFO). It checks every state at depth d before going to depth d+1. This guarantees the shortest path but requires storing all states at the current level. For this puzzle, the state space is small (≈16 valid states), so BFS is very efficient despite its theoretical exponential bound.',
      tooltipTime: 'Exponential — explores all states level-by-level before finding the goal',
      tooltipSpace: 'Exponential — must store all frontier states in the queue',
      aiMessages: {
        depthIncrease: 'Moving to the next level of BFS — one more crossing.',
        pruning: 'Constraint check: missionaries must never be outnumbered by cannibals.',
        backtrack: 'BFS doesn\'t backtrack — it explores all options at each level.',
        heuristic: 'BFS is uninformed — it doesn\'t use heuristics, just systematic exploration.',
        exploration: 'Exploring all valid moves from the current state.',
      },
    },
  },

  /* ── CRYPTARITHMETIC ────────────────── */
  cryptarith: {
    primary: {
      algorithm: 'CSP',
      algorithmFull: 'Constraint Satisfaction Problem Solver',
      timeComplexity: 'O(dⁿ)',
      spaceComplexity: 'O(n)',
      timeLabel: 'Exponential',
      spaceLabel: 'Linear',
      variables: {
        d: 'Domain size — number of possible digits each letter can take (0-9, so d=10)',
        n: 'Number of variables — unique letters in the puzzle (e.g., 8 for SEND+MORE=MONEY)',
      },
      whyExplanation:
        'Each unique letter (variable) can map to any of d digits (domain). Without pruning, we\'d try all dⁿ combinations (10⁸ = 100 million for 8 letters). CSP techniques (forward checking, constraint propagation, MRV) dramatically reduce this — often solving in under 1,000 assignments by eliminating impossible values early.',
      tooltipTime: 'Exponential in variables — but pruning eliminates 99%+ of the search space',
      tooltipSpace: 'Linear — only stores current assignment and domain arrays',
      aiMessages: {
        depthIncrease: 'Assigning the next letter — search tree grows deeper.',
        pruning: 'Constraint propagation eliminated impossible digit assignments.',
        backtrack: 'Backtracking — this partial assignment violates a constraint.',
        heuristic: 'MRV selects the letter with fewest remaining valid digits.',
        exploration: 'Trying the next valid digit for the current letter.',
      },
    },
  },
};

/** Tooltip data for Big-O notation hover explanations */
export const BIG_O_TOOLTIPS: Record<string, string> = {
  'O(1)': 'Constant — always the same speed regardless of input',
  'O(log n)': 'Logarithmic — halves the problem with each step',
  'O(n)': 'Linear — grows directly with input size',
  'O(n log n)': 'Linearithmic — slightly faster than quadratic',
  'O(n²)': 'Quadratic — doubles input = 4x the work',
  'O(bᵈ)': 'Exponential — grows like a tree with branching factor b and depth d',
  'O(b^(d/2))': 'Square root of exponential — Alpha-Beta best-case optimization',
  'O(N!)': 'Factorial — increases extremely fast as N grows (8! = 40,320)',
  'O(d)': 'Linear in depth — memory scales with tree depth, not branching',
  'O(N)': 'Linear in N — stores one value per row/variable',
  'O(dⁿ)': 'Exponential in variables — d choices for each of n variables',
};
