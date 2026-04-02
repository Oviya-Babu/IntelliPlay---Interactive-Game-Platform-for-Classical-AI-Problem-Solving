export function calcStars(params: {
  movesUsed: number
  optimalMoves: number
  timeMs: number
  hintsUsed: number
  livesLost: number
}): 1 | 2 | 3 {
  const moveRatio = params.movesUsed / Math.max(params.optimalMoves, 1)
  const timePenalty = Math.floor(params.timeMs / 30_000)
  const raw = 3
    - Math.floor((moveRatio - 1) * 2)
    - timePenalty
    - params.hintsUsed
    - params.livesLost
  return Math.max(1, Math.min(3, raw)) as 1 | 2 | 3
}

export function calcScore(params: {
  movesUsed: number
  optimalMoves: number
  hintsUsed: number
  livesLost: number
  difficulty: number
}): number {
  const efficiency = Math.min(1, params.optimalMoves / Math.max(params.movesUsed, 1))
  const diffMultiplier = 0.8 + params.difficulty * 0.2
  const score = Math.round(
    1000 * efficiency * diffMultiplier
    * (1 - params.hintsUsed * 0.1)
    * (1 - params.livesLost * 0.15)
  )
  return Math.max(100, score)
}
