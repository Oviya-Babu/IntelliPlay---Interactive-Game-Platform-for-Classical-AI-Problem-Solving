import { create } from 'zustand'

interface GameState {
  activeGameId: string | null
  mode: "pvai" | "aivai"
  difficulty: number
  startTimeMs: number | null
  hintsUsed: number
  livesLost: number
  setMode: (mode: "pvai" | "aivai") => void
  setDifficulty: (d: number) => void
  startGame: (gameId: string) => void
  useHint: () => void
  loseLife: () => void
  getElapsedMs: () => number
}

export const useGameStore = create<GameState>((set, get) => ({
  activeGameId: null,
  mode: "pvai",
  difficulty: 3,
  startTimeMs: null,
  hintsUsed: 0,
  livesLost: 0,

  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
  startGame: (gameId) => set({
    activeGameId: gameId,
    startTimeMs: Date.now(),
    hintsUsed: 0,
    livesLost: 0,
  }),
  useHint: () => set((state) => ({ hintsUsed: state.hintsUsed + 1 })),
  loseLife: () => set((state) => ({ livesLost: state.livesLost + 1 })),
  getElapsedMs: () => {
    const start = get().startTimeMs
    return start ? Date.now() - start : 0
  }
}))
