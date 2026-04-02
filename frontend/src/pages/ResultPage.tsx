import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import StarRating from '@/components/hud/StarRating'
import { useProgressStore } from '@/store/progressStore'
import { useSettingsStore } from '@/store/settingsStore'
import { post } from '@/services/api'

const ORDER = ["tictactoe", "eightpuzzle", "missionaries", "nqueens", "cryptarith"]

export default function ResultPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { isUnlocked } = useProgressStore()
  const { playerName, setPlayerName } = useSettingsStore()
  
  const [displayScore, setDisplayScore] = useState(0)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // { gameId, stars, score, movesUsed, optimalMoves, timeMs, sessionId }
  const data = state as any

  useEffect(() => {
    if (!data) return navigate('/levels')
    
    // Animate score counter
    let startTimestamp: number
    const duration = 1500
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const current = Math.floor(progress * data.score)
      setDisplayScore(current)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayScore(data.score)
      }
    }
    window.requestAnimationFrame(step)
  }, [data, navigate])

  useEffect(() => {
    if (data && displayScore === data.score && !scoreSaved && !isSaving) {
      setIsSaving(true)
      post('/scores', {
        game_id: data.gameId,
        session_id: data.sessionId || 'local',
        stars: data.stars,
        score: data.score,
        time_ms: data.timeMs,
        moves_used: data.movesUsed,
        player_name: playerName
      }).then(() => {
        setScoreSaved(true)
        setIsSaving(false)
      }).catch((err) => {
        console.error("Failed to save score:", err)
        setIsSaving(false)
      })
    }
  }, [displayScore, data, scoreSaved, isSaving, playerName])

  if (!data) return null

  const idx = ORDER.indexOf(data.gameId)
  const nextGameId = idx !== -1 && idx + 1 < ORDER.length ? ORDER[idx + 1] : null
  const nextUnlocked = nextGameId ? isUnlocked(nextGameId) : false

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-base)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-2xl flex flex-col items-center gap-8 text-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Level Complete!</h1>
          <h2 className="text-lg" style={{ color: 'var(--text-secondary)' }}>{data.gameId.toUpperCase()}</h2>
        </div>

        <StarRating stars={data.stars} animated={true} />

        <div className="flex flex-col items-center">
          <span className="text-sm uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Final Score</span>
          <span className="text-5xl font-bold" style={{ color: 'var(--accent)' }}>{displayScore}</span>
        </div>

        <div className="flex w-full justify-between px-6 py-4 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
          <div className="flex flex-col">
            <span className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>Moves</span>
            <span className="font-bold">{data.movesUsed}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>Time</span>
            <span className="font-bold">{Math.floor(data.timeMs / 1000)}s</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>Efficiency</span>
            <span className="font-bold">{Math.round((data.optimalMoves / Math.max(data.movesUsed, 1)) * 100)}%</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 mt-2">
          {playerName === 'Player' ? (
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-secondary)' }}>Playing as:</span>
              <input 
                type="text" 
                value={playerName} 
                onChange={e => setPlayerName(e.target.value.slice(0, 20))}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                  borderRadius: 4, padding: '4px 8px', color: 'var(--text-primary)',
                  width: 140, outline: 'none', textAlign: 'center'
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>— save your score</span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>Playing as: <strong style={{ color: 'var(--text-primary)' }}>{playerName}</strong></span>
          )}
          {scoreSaved && (
            <motion.span 
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} 
              style={{ color: 'var(--success, #10b981)', fontSize: 13, fontWeight: 'bold' }}
            >
              Score saved to leaderboard! ✓
            </motion.span>
          )}
        </div>

        <div className="flex flex-col w-full gap-3 mt-4">
          <Button onClick={() => navigate(`/game/${data.gameId}`)} style={{ background: 'transparent', border: '1px solid var(--border-default)' }}>
            Play Again
          </Button>
          
          {nextGameId && (
            <Button 
              onClick={() => nextUnlocked && navigate(`/game/${nextGameId}`)}
              disabled={!nextUnlocked}
              style={{ opacity: nextUnlocked ? 1 : 0.5 }}
            >
              {nextUnlocked ? 'Next Level' : 'Complete this level to unlock next'}
            </Button>
          )}

          <Button onClick={() => navigate('/levels')} style={{ background: 'transparent' }}>
            Back to Levels
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
