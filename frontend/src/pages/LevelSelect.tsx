import { useNavigate } from 'react-router-dom'
import { useProgressStore } from '@/store/progressStore'
import { useSettingsStore } from '@/store/settingsStore'
import { motion } from 'framer-motion'

const CARDS = [
  {
    id: 'tictactoe',
    title: 'TicTacToe',
    algo: 'Minimax + Alpha-Beta',
    difficulty: 1,
    desc: 'Click any cell to place your X. Beat the AI or force a draw — the AI plays perfectly using Minimax search.',
  },
  {
    id: 'eightpuzzle',
    title: '8-Puzzle',
    algo: 'A* Search',
    difficulty: 2,
    desc: 'Click any tile next to the blank space to slide it. Arrange tiles 1-8 in order with blank at bottom-right.',
  },
  {
    id: 'missionaries',
    title: 'Missionaries & Cannibals',
    algo: 'BFS',
    difficulty: 3,
    desc: 'Move missionaries and cannibals across the river. Cannibals must never outnumber missionaries on either bank.',
  },
  {
    id: 'nqueens',
    title: 'N-Queens',
    algo: 'CSP Backtracking',
    difficulty: 4,
    desc: 'Place 8 queens on a chessboard so no queen attacks another. No two queens share a row, column or diagonal.',
  },
  {
    id: 'cryptarith',
    title: 'Cryptarithmetic',
    algo: 'CSP + Constraint Propagation',
    difficulty: 5,
    desc: 'Assign digits 0-9 to letters so the arithmetic equation holds true. Each letter maps to a unique digit.',
  }
]

export default function LevelSelect() {
  const { getLevel, isUnlocked } = useProgressStore()
  const { playerName, setPlayerName } = useSettingsStore()
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-5xl mx-auto" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Levels</h1>
      
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Your name for the leaderboard</p>
        <input
          type="text"
          placeholder="Enter your name..."
          value={playerName}
          onChange={e => setPlayerName(e.target.value.slice(0, 20))}
          maxLength={20}
          style={{
            background: 'var(--bg-surface, #151521)',
            border: '1px solid var(--border-default, #2a2a35)',
            borderRadius: 8, padding: '10px 16px',
            color: 'var(--text-primary, #f1f0fe)', fontSize: 16,
            textAlign: 'center', width: 240,
            outline: 'none',
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CARDS.map((card, idx) => {
          const unlocked = isUnlocked(card.id)
          const prog = getLevel(card.id)
          
          return (
            <motion.div
              key={card.id}
              whileHover={unlocked ? { y: -4, borderColor: 'var(--accent, #a855f7)', boxShadow: '0 4px 20px rgba(168,85,247,0.1)' } : {}}
              onClick={() => unlocked && navigate(`/game/${card.id}`)}
              className="p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-colors"
              style={{
                cursor: unlocked ? 'pointer' : 'default',
                background: 'var(--bg-surface, #151521)',
                border: '1px solid var(--border-default, #2a2a35)',
                filter: unlocked ? 'none' : 'grayscale(1)',
                opacity: unlocked ? 1 : 0.5,
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'var(--accent, #a855f7)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.title}</h2>
                    <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{card.algo}</span>
                  </div>
                </div>
              </div>

              {/* Difficulty & Stars */}
              <div className="flex justify-between items-center">
                <div className="flex gap-1" title={`Difficulty: ${card.difficulty}`}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i < Math.ceil(card.difficulty / 2) ? '#ef4444' : 'var(--border-default)'
                    }} />
                  ))}
                </div>
                
                {unlocked && (
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill={i < prog.stars ? "var(--gold, #f59e0b)" : "none"} stroke={i < prog.stars ? "var(--gold)" : "var(--border-default)"} strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>

              {/* Desc */}
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                {card.desc}
              </p>

              {unlocked && prog.attempts > 0 && (
                <div className="text-xs font-bold mt-auto pt-4" style={{ color: 'var(--success, #10b981)' }}>
                  Best Score: {prog.bestScore}
                </div>
              )}

              {!unlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(21,21,33,0.8)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span className="font-bold text-sm text-white">Complete Level {idx} to unlock</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
