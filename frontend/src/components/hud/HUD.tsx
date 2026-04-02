import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import AlgorithmGuide from '@/components/learn/AlgorithmGuide'

export default function HUD({ title, levelNum, defaultTab }: { title: string; levelNum: number; defaultTab?: 'minimax' | 'alphabeta' | 'astar' | 'bfs' | 'csp' }) {
  const navigate = useNavigate()
  const { getElapsedMs, startTimeMs } = useGameStore()
  const [elapsed, setElapsed] = useState(0)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (!startTimeMs) {
      setElapsed(0)
      return
    }
    const interval = setInterval(() => {
      setElapsed(getElapsedMs())
    }, 1000)
    return () => clearInterval(interval)
  }, [startTimeMs, getElapsedMs])

  const mins = Math.floor(elapsed / 60000)
  const secs = Math.floor((elapsed % 60000) / 1000)
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'rgba(15,15,26,0.9)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border-subtle)',
      zIndex: 100,
    }}>
      <button 
        onClick={() => navigate('/levels')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
      >
        <span>← Back</span>
      </button>

      <div className="font-bold flex items-center gap-2">
        <span style={{ color: 'var(--text-muted)' }}>Level {levelNum}</span>
        <span style={{ color: 'var(--text-primary)' }}>{title}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-subtle bg-surface hover:bg-surface-2 transition-colors"
          style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}
        >
          ?
        </button>
        <div className="font-mono font-bold" style={{ color: 'var(--accent)' }}>
          {timeStr}
        </div>
      </div>

      <AlgorithmGuide
        open={showGuide}
        onClose={() => setShowGuide(false)}
        defaultTab={defaultTab}
      />
    </div>
  )
}
