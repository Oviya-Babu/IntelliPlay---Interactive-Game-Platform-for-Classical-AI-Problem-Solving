import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LevelProgress {
  stars: 0 | 1 | 2 | 3
  bestScore: number
  attempts: number
  bestTimeMs: number
}

interface ProgressState {
  levels: Record<string, LevelProgress>
  totalStars: number
  completeLevel: (gameId: string, stars: 1 | 2 | 3, score: number, timeMs: number) => void
  getLevel: (gameId: string) => LevelProgress
  resetProgress: () => void
}

const INITIAL_LEVELS: Record<string, LevelProgress> = {
  tictactoe:    { stars: 0, bestScore: 0, attempts: 0, bestTimeMs: 0 },
  eightpuzzle:  { stars: 0, bestScore: 0, attempts: 0, bestTimeMs: 0 },
  missionaries: { stars: 0, bestScore: 0, attempts: 0, bestTimeMs: 0 },
  nqueens:      { stars: 0, bestScore: 0, attempts: 0, bestTimeMs: 0 },
  cryptarith:   { stars: 0, bestScore: 0, attempts: 0, bestTimeMs: 0 },
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      levels: INITIAL_LEVELS,
      totalStars: 0,

      completeLevel: (gameId, stars, score, timeMs) => set((state) => {
        const nextLevels = { ...state.levels }
        const prev = nextLevels[gameId] || { stars: 0, bestScore: 0, attempts: 0, bestTimeMs: 0 }

        let newTotalStars = state.totalStars
        if (stars > prev.stars) {
          newTotalStars += (stars - prev.stars)
        }

        nextLevels[gameId] = {
          stars: Math.max(prev.stars, stars) as 0 | 1 | 2 | 3,
          bestScore: Math.max(prev.bestScore, score),
          attempts: prev.attempts + 1,
          bestTimeMs: prev.bestTimeMs === 0 ? timeMs : Math.min(prev.bestTimeMs, timeMs)
        }

        return { levels: nextLevels, totalStars: newTotalStars }
      }),

      getLevel: (gameId) => {
        return get().levels[gameId] || { stars: 0, bestScore: 0, attempts: 0, bestTimeMs: 0 }
      },

      resetProgress: () => set({ levels: INITIAL_LEVELS, totalStars: 0 })
    }),
    {
      name: 'intelliplay_progress',
    }
  )
)
