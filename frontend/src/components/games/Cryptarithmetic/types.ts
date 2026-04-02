// ═══════════════════════════════════════════════════════
// Cryptarithmetic — Type Definitions
// ═══════════════════════════════════════════════════════

export type SolverMode = 'brute_force' | 'backtrack' | 'forward_checking' | 'full_csp';

export type LevelMode =
  | 'tutorial'
  | 'manual'
  | 'brute_force_demo'
  | 'constraint_viz'
  | 'step_by_step'
  | 'comparison'
  | 'mrv_demo'
  | 'race'
  | 'advanced'
  | 'master';

export interface CryptoLevel {
  id: number;
  title: string;
  description: string;
  mode: LevelMode;
  aiSays: string;
  instructions: string[];
  unlocked: boolean;
  puzzle: PuzzleConfig;
  solverMode: SolverMode;
  useMrv: boolean;
}

export interface PuzzleConfig {
  word1: string;
  word2: string;
  result: string;
  name: string;
}

export interface SolverStep {
  step_id: number;
  type: 'assign' | 'prune' | 'backtrack' | 'solution' | 'no_solution' | 'info';
  letter: string;
  digit: number;
  assignment: Record<string, number>;
  partial_sum: number;
  domains: Record<string, number[]>;
  msg: string;
  depth: number;
}

export interface SolverMetrics {
  nodes_explored: number;
  backtracks: number;
  nodes_pruned: number;
  max_depth: number;
  time_ms: number;
  mode: string;
}

export interface SolveResponse {
  solution: Record<string, number> | null;
  steps: SolverStep[];
  metrics: SolverMetrics;
  is_solvable: boolean;
  error: string | null;
}

export interface TreeNode {
  id: string;
  letter: string;
  digit: number;
  type: 'assign' | 'prune' | 'backtrack' | 'solution';
  depth: number;
  children: TreeNode[];
  assignment: Record<string, number>;
}

export interface BotMetrics {
  depth: number;
  nodes: number;
  pruned: number;
  backtracks: number;
  timeMs: number;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}
