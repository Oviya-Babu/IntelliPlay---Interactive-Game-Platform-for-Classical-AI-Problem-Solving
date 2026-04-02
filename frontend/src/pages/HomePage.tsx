import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

/* ─── Game catalogue ─── */
const GAMES = [
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    algorithm: 'Minimax + Alpha-Beta',
    concept: 'Adversarial Search',
    desc: 'Play against an optimal AI that explores every possible future move to find the best strategy.',
    icon: '⊞',
    gradient: 'from-purple-600/80 to-violet-600/80',
    border: 'border-purple-500/20',
    glow: 'hover:shadow-purple-500/10',
  },
  {
    id: 'eightpuzzle',
    title: '8-Puzzle',
    algorithm: 'A* Search',
    concept: 'Informed Search',
    desc: 'Slide tiles to reach the goal state. Watch A* use heuristics to find the shortest path.',
    icon: '⊡',
    gradient: 'from-blue-600/80 to-cyan-600/80',
    border: 'border-blue-500/20',
    glow: 'hover:shadow-blue-500/10',
  },
  {
    id: 'missionaries',
    title: 'Missionaries & Cannibals',
    algorithm: 'BFS',
    concept: 'State-Space Search',
    desc: 'Cross the river safely. BFS explores every valid state to guarantee the shortest solution.',
    icon: '⛵',
    gradient: 'from-emerald-600/80 to-teal-600/80',
    border: 'border-emerald-500/20',
    glow: 'hover:shadow-emerald-500/10',
  },
  {
    id: 'nqueens',
    title: 'N-Queens',
    algorithm: 'Backtracking',
    concept: 'CSP',
    desc: 'Place queens so none attack each other. Backtracking prunes the search tree efficiently.',
    icon: '♛',
    gradient: 'from-amber-600/80 to-orange-600/80',
    border: 'border-amber-500/20',
    glow: 'hover:shadow-amber-500/10',
  },
  {
    id: 'cryptarith',
    title: 'Cryptarithmetic',
    algorithm: 'CSP + Propagation',
    concept: 'Constraint Satisfaction',
    desc: 'Assign digits to letters so the equation holds. Constraint propagation narrows the search space.',
    icon: '∑',
    gradient: 'from-rose-600/80 to-pink-600/80',
    border: 'border-rose-500/20',
    glow: 'hover:shadow-rose-500/10',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.1 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#08080f] overflow-x-hidden">

      {/* ════════════ HERO ════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center pt-20 pb-16 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-purple-600/[0.06] blur-[120px]" />
          <div className="absolute top-2/3 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-600/[0.04] blur-[100px]" />
        </div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/[0.06] text-xs font-semibold tracking-wider text-purple-300 uppercase"
        >
          Interactive AI Lab
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight max-w-2xl"
        >
          Learn AI by{' '}
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            Playing
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-5 text-lg text-gray-400 max-w-xl leading-relaxed"
        >
          Understand how algorithms think — interactively. Each game teaches a core AI concept through hands-on exploration.
        </motion.p>

        {/* CTA */}
        <motion.a
          href="#games"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm tracking-wide
                     hover:from-purple-500 hover:to-violet-500 transition-all duration-300 shadow-lg shadow-purple-500/20 active:scale-95"
        >
          Explore Games ↓
        </motion.a>
      </section>

      {/* ════════════ GAME GRID ════════════ */}
      <section id="games" className="max-w-6xl mx-auto px-6 pb-24">
        {/* Section header */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">Algorithm Lab</h2>
          <p className="mt-2 text-sm text-gray-500">Choose a game to explore its underlying AI algorithm.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={cardVariants}
              className={`group relative rounded-2xl border ${game.border} bg-[#0f0f1a] overflow-hidden
                         hover:border-white/[0.12] transition-all duration-300 shadow-lg ${game.glow} hover:shadow-2xl`}
            >
              {/* Card gradient bar */}
              <div className={`h-1 bg-gradient-to-r ${game.gradient}`} />

              <div className="p-6 flex flex-col h-full">
                {/* Icon + Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-xl text-white shadow-lg flex-shrink-0`}>
                    {game.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{game.title}</h3>
                    <span className="text-[11px] font-mono text-purple-400 tracking-wide">{game.algorithm}</span>
                  </div>
                </div>

                {/* Concept tag */}
                <div className="mb-3">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    {game.concept}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed flex-1">
                  {game.desc}
                </p>

                {/* Action buttons */}
                <div className="flex gap-2.5 mt-5">
                  <button
                    type="button"
                    onClick={() => navigate(`/game/${game.id}`)}
                    className={`flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r ${game.gradient} text-xs font-bold text-white tracking-wide
                               hover:opacity-90 transition-all duration-200 active:scale-95 shadow-lg`}
                  >
                    ▶ Play
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/game/${game.id}?mode=learn`)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-bold text-gray-300 tracking-wide
                               hover:bg-white/[0.08] hover:text-white transition-all duration-200 active:scale-95"
                  >
                    📖 Learn
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════ BOTTOM STRIP ════════════ */}
      <div className="border-t border-white/[0.04] py-8 text-center">
        <p className="text-[11px] text-gray-600 tracking-widest uppercase font-mono">
          IntelliPlay · Interactive AI Learning Platform
        </p>
      </div>
    </div>
  )
}
