import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/services/api'
import { motion } from 'framer-motion'

const GAMES = [
  { id: 'tictactoe', label: 'TicTacToe' },
  { id: 'eightpuzzle', label: '8-Puzzle' },
  { id: 'missionaries', label: 'Missionaries' },
  { id: 'nqueens', label: 'N-Queens' },
  { id: 'cryptarith', label: 'Cryptarith' }
]

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState(GAMES[0].id)

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['scores', activeTab],
    queryFn: async () => {
      try {
        const res = await get<any[]>(`/scores?game_id=${activeTab}`)
        return res || []
      } catch (err) {
        // Fallback mock data if API is not yet implemented
        return []
      }
    },
    refetchInterval: 30000, // auto refresh every 30s
  })

  return (
    <div className="p-8 max-w-4xl mx-auto" style={{ minHeight: 'calc(100vh - 60px)', color: 'var(--text-primary)' }}>
      <h1 className="text-3xl font-bold mb-8 text-center">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveTab(game.id)}
            style={{
              padding: '8px 16px', borderRadius: 20,
              background: activeTab === game.id ? 'var(--accent, #a855f7)' : 'var(--bg-surface, #151521)',
              color: activeTab === game.id ? '#fff' : 'var(--text-secondary, #a1a1aa)',
              fontWeight: activeTab === game.id ? 'bold' : 'normal',
              border: 'none', cursor: 'pointer', outline: 'none', transition: 'all 0.2s'
            }}
          >
            {game.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface, #151521)', borderRadius: 16, border: '1px solid var(--border-default, #2a2a35)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 100px 100px 100px', padding: '16px 24px', background: 'rgba(255,255,255,0.03)', fontWeight: 'bold', color: 'var(--text-muted)' }}>
          <div>Rank</div>
          <div>Player Name</div>
          <div style={{ textAlign: 'right' }}>Score</div>
          <div style={{ textAlign: 'center' }}>Stars</div>
          <div style={{ textAlign: 'right' }}>Moves</div>
          <div style={{ textAlign: 'right' }}>Time</div>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading top scores...</div>
        ) : scores.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            <p className="mb-2">No scores yet for this game.</p>
            <p style={{ color: 'var(--accent, #a855f7)', fontWeight: 'bold' }}>Be the first!</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {scores.slice(0, 10).map((score: any, idx: number) => (
              <motion.div 
                key={score.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 100px 100px 100px', padding: '16px 24px', borderTop: '1px solid var(--border-default, #2a2a35)', alignItems: 'center' }}
              >
                <div style={{ 
                  color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)',
                  fontWeight: idx < 3 ? 'bold' : 'normal', fontSize: idx < 3 ? 18 : 16
                }}>
                  #{idx + 1}
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{score.player_name || 'Anonymous'}</div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent, #a855f7)' }}>{score.score}</div>
                <div style={{ textAlign: 'center', color: 'var(--gold, #f59e0b)' }}>{'★'.repeat(score.stars)}{'☆'.repeat(3 - score.stars)}</div>
                <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{score.moves_used || score.moves}</div>
                <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{Math.floor(score.time_ms / 1000)}s</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
