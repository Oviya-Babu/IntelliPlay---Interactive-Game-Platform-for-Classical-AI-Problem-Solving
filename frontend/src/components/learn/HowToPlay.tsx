import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HowToPlayProps {
  gameId: string
}

const GAME_CONTENT: Record<string, { title: string; rules: string[]; tip: string; visual?: React.ReactNode }> = {
  tictactoe: {
    title: 'How to play Tic-Tac-Toe',
    rules: [
      'Click any empty cell to place your X',
      'Get 3 in a row — horizontal, vertical, or diagonal — to win',
      'The AI plays as O using Minimax and never makes a mistake',
      'Try to create a fork — two winning threats at once'
    ],
    tip: 'Playing center (position 4) first gives you the best chances',
  },
  eightpuzzle: {
    title: 'How to play 8-Puzzle',
    rules: [
      'Click any numbered tile directly next to the blank space',
      'The tile slides into the blank — only adjacent tiles move',
      'Arrange tiles 1 through 8 in order, blank at bottom-right',
      'Target moves shown in badge — fewer moves = more stars'
    ],
    tip: 'Solve the top row first, then middle, then bottom',
    visual: (
      <div className="flex items-center gap-4 mt-2">
        <span className="text-sm font-bold text-muted">Goal:</span>
        <div className="grid grid-cols-3 gap-1 w-[60px] h-[60px] p-1 bg-surface-2 rounded-md border border-subtle">
          {[1, 2, 3, 4, 5, 6, 7, 8, null].map((v, i) => (
            <div key={i} className={`flex items-center justify-center text-[10px] font-bold rounded-sm ${v ? 'bg-surface border border-subtle text-accent' : 'border-dashed border border-subtle'}`}>
              {v || '_'}
            </div>
          ))}
        </div>
      </div>
    )
  },
  missionaries: {
    title: 'How to play Missionaries & Cannibals',
    rules: [
      'Select how many missionaries and cannibals board the boat',
      'Boat holds maximum 2 people and needs at least 1 to cross',
      'Cannibals must NEVER outnumber missionaries on either bank',
      'If they do, the move is rejected — try a different combination'
    ],
    tip: 'The optimal solution takes exactly 11 crossings',
    visual: (
      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-200">
        Rule: cannibals ≤ missionaries on each bank (unless 0 missionaries)
      </div>
    )
  },
  nqueens: {
    title: 'How to play N-Queens',
    rules: [
      'Click any cell on the chessboard to place a queen',
      'Queens attack in all 8 directions — row, column, both diagonals',
      'Red highlighted cells show conflicts — no two queens can attack',
      'Place all queens with zero conflicts to solve the puzzle'
    ],
    tip: 'For 8 queens there are 92 valid solutions — keep trying!',
  },
  cryptarith: {
    title: 'How to play Cryptarithmetic',
    rules: [
      'Each letter stands for a unique digit from 0 to 9',
      'Click a letter box to select it, then click a digit to assign',
      'Leading letters (S, M in SEND+MORE) cannot be zero',
      'The full arithmetic equation must be correct when solved'
    ],
    tip: 'In SEND+MORE=MONEY, M must equal 1 (it is the carry digit)',
    visual: (
      <div className="mt-2 p-3 bg-surface-2 border border-subtle rounded-md text-center max-w-[200px] mx-auto">
        <div className="text-xs text-muted font-mono mb-1">S=9 E=5 N=6 D=7</div>
        <div className="text-sm font-mono text-primary font-bold">
          <div className="text-right">9567</div>
          <div className="text-right border-b border-subtle pb-1">+ 1085</div>
          <div className="text-right pt-1 text-success">10652</div>
        </div>
      </div>
    )
  }
}

export default function HowToPlay({ gameId }: HowToPlayProps) {
  const [expanded, setExpanded] = useState(true)
  const storageKey = `intelliplay_seen_${gameId}`

  useEffect(() => {
    const seen = localStorage.getItem(storageKey)
    if (seen) {
      setExpanded(false)
    } else {
      localStorage.setItem(storageKey, 'true')
    }
  }, [storageKey])

  const content = GAME_CONTENT[gameId] || GAME_CONTENT['tictactoe']

  return (
    <div className="w-full max-w-[600px] mb-6 overflow-hidden rounded-xl bg-surface border border-subtle">
      <div 
        className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-bold text-sm text-primary">How to play</span>
        <motion.svg 
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
          animate={{ rotate: expanded ? 180 : 0 }} 
          className="text-muted"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </motion.svg>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-subtle"
          >
            <div className="p-4 pt-4 pb-5 flex flex-col gap-4">
              <h3 className="text-lg font-bold text-primary">{content.title}</h3>
              
              <ul className="flex flex-col gap-2 pl-5 list-disc text-sm text-secondary">
                {content.rules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>

              {content.visual}

              <div className="mt-2 p-3 bg-accent/10 border border-accent/20 rounded-md flex items-start gap-2">
                <span className="text-accent font-bold px-1 rounded bg-accent/20 text-xs uppercase tracking-wider mt-0.5">Tip</span>
                <span className="text-sm font-medium text-primary text-opacity-90">{content.tip}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
