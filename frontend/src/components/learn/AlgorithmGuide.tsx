import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '@/components/ui/Modal'

interface AlgorithmGuideProps {
  open: boolean
  onClose: () => void
  defaultTab?: 'minimax' | 'alphabeta' | 'astar' | 'bfs' | 'csp'
}

type TabKey = 'minimax' | 'alphabeta' | 'astar' | 'bfs' | 'csp'

const TABS: { id: TabKey; label: string }[] = [
  { id: 'minimax', label: 'Minimax' },
  { id: 'alphabeta', label: 'Alpha-Beta' },
  { id: 'astar', label: 'A*' },
  { id: 'bfs', label: 'BFS' },
  { id: 'csp', label: 'CSP' },
]

const CONTENT: Record<TabKey, any> = {
  minimax: {
    plain: "Minimax looks ahead at every possible future move in a game, assuming both players play perfectly. It assigns a score to each outcome and picks the move that maximizes the AI score while minimizing the opponent score.\n\nThe AI builds a complete game tree and evaluates every leaf node. By working backwards it finds the guaranteed best move regardless of what the opponent does.",
    insight: "Minimax never loses because it assumes the opponent always makes the best possible response to every move.",
    pseudocode: `function minimax(state, depth, isMaximizing):
  if isTerminal(state) or depth == 0:
    return evaluate(state)

  if isMaximizing:
    best = -infinity
    for move in legalMoves(state):
      score = minimax(move, depth-1, false)
      best = max(best, score)
    return best
  else:
    best = +infinity
    for move in legalMoves(state):
      score = minimax(move, depth-1, true)
      best = min(best, score)
    return best`,
    time: "O(b^m)",
    space: "O(m)",
    best: "O(b^m)",
    worst: "O(b^m)",
    uses: ["Chess engines", "Two-player board games", "Game theory"],
  },
  alphabeta: {
    plain: "Alpha-Beta pruning is an optimized version of Minimax. It maintains two values, alpha and beta, which represent the minimum score the maximizing player is assured of, and the maximum score the minimizing player is assured of.\n\nIt evaluates the game tree but stops exploring a branch (prunes it) as soon as it finds a move that is worse than a previously examined move.",
    insight: "Alpha-beta skips entire branches that cannot possibly change the final decision — it often cuts the search tree in half.",
    pseudocode: `function alphaBeta(state, depth, alpha, beta, isMax):
  if isTerminal(state) or depth == 0:
    return evaluate(state)

  if isMax:
    best = -infinity
    for move in legalMoves(state):
      score = alphaBeta(move, depth-1, alpha, beta, False)
      best = max(best, score)
      alpha = max(alpha, best)
      if best >= beta:
        break // pruning
    return best
  else:
    best = +infinity
    for move in legalMoves(state):
      score = alphaBeta(move, depth-1, alpha, beta, True)
      best = min(best, score)
      beta = min(beta, best)
      if best <= alpha:
        break // pruning
    return best`,
    time: "O(b^(m/2)) best",
    space: "O(m)",
    best: "O(b^(m/2))",
    worst: "O(b^m)",
    uses: ["Stockfish chess engine", "Checkers AI", "Connect Four"],
  },
  astar: {
    plain: "A* (A-star) is a pathfinding algorithm that finds the shortest path between nodes. It uses a heuristic to guide its search, combining the actual distance traveled so far (g) with an estimated distance to the goal (h).\n\nBy always expanding the node with the lowest (g + h) total, A* focuses its search directly toward the goal instead of searching equally in all directions.",
    insight: "A* always expands the node with lowest f = g + h, where h is an educated guess of remaining cost. This makes it faster than BFS while still guaranteeing the optimal path.",
    pseudocode: `function AStar(start, goal):
  openSet = PriorityQueue()
  openSet.add(start, f=0)
  gScore[start] = 0

  while not openSet.isEmpty():
    current = openSet.popLowestF()
    if current == goal:
      return reconstructPath(current)

    for neighbor in getNeighbors(current):
      tentative_g = gScore[current] + cost(current, neighbor)
      if tentative_g < gScore[neighbor]:
        gScore[neighbor] = tentative_g
        f = tentative_g + heuristic(neighbor, goal)
        openSet.add(neighbor, f)
  return failure`,
    time: "O(b^d)",
    space: "O(b^d)",
    best: "O(d)",
    worst: "O(b^d)",
    uses: ["Google Maps routing", "Game pathfinding", "Mars rovers"],
  },
  bfs: {
    plain: "Breadth-First Search (BFS) is an algorithm for traversing or searching tree or graph data structures. It starts at the tree root and explores all nodes at the present depth prior to moving on to the nodes at the next depth level.\n\nWithout a heuristic to guide it, BFS spreads out evenly like a ripple in water until it finds the goal.",
    insight: "BFS guarantees the shortest path because it fully explores distance 1 before distance 2, and so on — the first time it reaches the goal is always via the shortest route.",
    pseudocode: `function BFS(start, goal):
  queue = Queue()
  queue.enqueue(start)
  visited = Set([start])

  while not queue.isEmpty():
    current = queue.dequeue()
    if current == goal:
      return reconstructPath(current)

    for neighbor in getNeighbors(current):
      if neighbor not in visited:
        visited.add(neighbor)
        parent[neighbor] = current
        queue.enqueue(neighbor)
  return failure`,
    time: "O(b^d)",
    space: "O(b^d)",
    best: "O(1)",
    worst: "O(b^d)",
    uses: ["Social network connections", "GPS navigation", "Web crawlers"],
  },
  csp: {
    plain: "Constraint Satisfaction Problems (CSP) are defined by a set of variables, a domain of values for each variable, and constraints specifying allowed combinations. The algorithm assigns values to variables in sequence.\n\nIf it encounters a variable where no value works, it backtracks to undo previous assignments. Forward checking helps by removing impossible values from unassigned variables early.",
    insight: "Forward checking eliminates impossible values from future variables as soon as an assignment is made — catching dead ends early without ever trying those combinations.",
    pseudocode: `function backtrackCSP(assignment, csp):
  if isComplete(assignment):
    return assignment

  var = selectUnassignedVar(assignment, csp)
  for value in orderDomainValues(var, assignment, csp):
    if isConsistent(value, var, assignment, csp):
      add {var = value} to assignment
      inferences = forwardCheck(csp, var, value)
      if inferences != failure:
        add inferences to assignment
        result = backtrackCSP(assignment, csp)
        if result != failure:
          return result
      remove inferences from assignment
    remove {var = value} from assignment
  return failure`,
    time: "O(d^n) worst",
    space: "O(n)",
    best: "O(n)",
    worst: "O(d^n)",
    uses: ["Sudoku solvers", "Airline crew scheduling", "Circuit design"],
  }
}

const SyntaxHighlighter = ({ code }: { code: string }) => {
  const highlight = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Very basic regex highlighter
      let rendered = line
      // Keywords
      rendered = rendered.replace(/\b(function|return|if|else|for|while|in|not|and|or|break)\b/g, '<span style="color: #a855f7">$1</span>')
      // Booleans/Constants
      rendered = rendered.replace(/\b(True|False|infinity|failure)\b/g, '<span style="color: #f59e0b">$1</span>')
      // Comments
      rendered = rendered.replace(/(\/\/.*)/g, '<span style="color: #71717a">$1</span>')
      return <div key={i} dangerouslySetInnerHTML={{ __html: rendered }} />
    })
  }

  return (
    <pre className="text-sm font-mono p-4 rounded-xl bg-[#0d0d14] border border-subtle overflow-x-auto text-primary leading-relaxed">
      {highlight(code)}
    </pre>
  )
}

export default function AlgorithmGuide({ open, onClose, defaultTab = 'minimax' }: AlgorithmGuideProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)

  // Reset tab when reopened
  useEffect(() => {
    if (open) setActiveTab(defaultTab)
  }, [open, defaultTab])

  if (!open) return null
  const data = CONTENT[activeTab]

  return (
    <Modal isOpen={open} onClose={onClose} size="xl">
      <div className="w-[800px] max-w-[95vw] bg-surface rounded-2xl border border-strong overflow-hidden flex flex-col shadow-lg" style={{ maxHeight: '90vh' }}>
        
        {/* Header Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-subtle bg-surface-2 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
              style={{
                background: activeTab === t.id ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === t.id ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={onClose} className="p-2 text-muted hover:text-primary transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              {/* Plain English */}
              <div className="flex flex-col gap-4">
                {data.plain.split('\n\n').map((para: string, i: number) => (
                  <p key={i} className="text-secondary text-base leading-relaxed max-w-[600px]">{para}</p>
                ))}
              </div>

              {/* Insight */}
              <div className="p-4 bg-accent-glow/20 border-l-4 border-accent rounded-r-lg">
                <p className="text-primary font-bold text-lg leading-snug">{data.insight}</p>
              </div>

              {/* Pseudocode & Complexity Grid */}
              <div className="grid md:grid-cols-[1fr_250px] gap-6 items-start">
                <div className="flex flex-col gap-2 min-w-0">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Pseudocode</h4>
                  <SyntaxHighlighter code={data.pseudocode} />
                </div>
                
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Complexity</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col gap-1 p-3 bg-surface-2 rounded-lg border border-subtle">
                        <span className="text-xs text-muted">Time</span>
                        <span className="font-mono font-bold text-accent-light">{data.time}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 bg-surface-2 rounded-lg border border-subtle">
                        <span className="text-xs text-muted">Space</span>
                        <span className="font-mono font-bold text-accent-light">{data.space}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Real-World Uses</h4>
                    <ul className="flex flex-col gap-2">
                      {data.uses.map((u: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-secondary">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  )
}
