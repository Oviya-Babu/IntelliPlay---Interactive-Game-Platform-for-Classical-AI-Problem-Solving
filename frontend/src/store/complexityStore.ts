/* ═══════════════════════════════════════════════════════════
   Complexity Store — Zustand store for real-time metrics
   Tracks live execution data across all games
   ═══════════════════════════════════════════════════════════ */

import { create } from 'zustand';

export interface ComplexityMetrics {
  nodesExplored: number;
  statesChecked: number;
  backtracks: number;
  depthReached: number;
  branchesPruned: number;
  timeElapsedMs: number;
}

interface ComplexityState extends ComplexityMetrics {
  activeGameId: string | null;
  startTime: number | null;

  // Actions
  startTracking: (gameId: string) => void;
  resetMetrics: () => void;
  incrementNodes: (count?: number) => void;
  incrementStates: (count?: number) => void;
  incrementBacktracks: (count?: number) => void;
  incrementPruned: (count?: number) => void;
  setDepth: (depth: number) => void;
  setMetricsBatch: (metrics: Partial<ComplexityMetrics>) => void;
  updateElapsedTime: () => void;
}

const INITIAL_METRICS: ComplexityMetrics = {
  nodesExplored: 0,
  statesChecked: 0,
  backtracks: 0,
  depthReached: 0,
  branchesPruned: 0,
  timeElapsedMs: 0,
};

export const useComplexityStore = create<ComplexityState>((set, get) => ({
  ...INITIAL_METRICS,
  activeGameId: null,
  startTime: null,

  startTracking: (gameId: string) =>
    set({
      ...INITIAL_METRICS,
      activeGameId: gameId,
      startTime: Date.now(),
    }),

  resetMetrics: () =>
    set({
      ...INITIAL_METRICS,
      startTime: null,
    }),

  incrementNodes: (count = 1) =>
    set((s) => ({ nodesExplored: s.nodesExplored + count })),

  incrementStates: (count = 1) =>
    set((s) => ({ statesChecked: s.statesChecked + count })),

  incrementBacktracks: (count = 1) =>
    set((s) => ({ backtracks: s.backtracks + count })),

  incrementPruned: (count = 1) =>
    set((s) => ({ branchesPruned: s.branchesPruned + count })),

  setDepth: (depth: number) =>
    set({ depthReached: depth }),

  setMetricsBatch: (metrics: Partial<ComplexityMetrics>) =>
    set((s) => ({ ...s, ...metrics })),

  updateElapsedTime: () => {
    const start = get().startTime;
    if (start) {
      set({ timeElapsedMs: Date.now() - start });
    }
  },
}));
