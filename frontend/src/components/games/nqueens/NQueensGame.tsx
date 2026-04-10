/* ============================================
   NQueensGame.tsx — Main Orchestrator
   Premium N-Queens AI Learning Experience
   ============================================ */

import { useRef, useEffect, useCallback } from 'react';
import { useNQueensEngine } from './hooks/useNQueensEngine';
import Board from './Board';
import Controls from './Controls';
import AITutorPanel from './AITutorPanel';
import { CONFIG, type GameMode } from './utils/nqueensHelpers';
import './NQueensGame.css';

// ─── CONFETTI SYSTEM ──────────────────────────────────────

interface Particle {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; color: string;
  rotation: number; rotSpeed: number;
  gravity: number; opacity: number; decay: number;
}

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, []);

  const launch = useCallback((count = 150) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const colors = ['#7c3aed', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#c084fc', '#67e8f9'];
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 300,
        y: window.innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 18 - 5,
        w: Math.random() * 8 + 3,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.3 + Math.random() * 0.15,
        opacity: 1,
        decay: 0.003 + Math.random() * 0.004,
      });
    }

    const animate = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.01);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        p.opacity -= p.decay;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (particlesRef.current.length > 0) {
        animIdRef.current = requestAnimationFrame(animate);
      } else {
        animIdRef.current = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (!animIdRef.current) animate();
  }, []);

  return { canvasRef, launch };
}

// ─── MAIN COMPONENT ───────────────────────────────────────

export default function NQueensGame() {
  const engine = useNQueensEngine();
  const { canvasRef: confettiRef, launch: launchConfetti } = useConfetti();

  // Launch confetti when solved
  const prevSolvedRef = useRef(false);
  useEffect(() => {
    if (engine.isSolved && !prevSolvedRef.current) {
      setTimeout(() => launchConfetti(150), 200);
    }
    prevSolvedRef.current = engine.isSolved;
  }, [engine.isSolved, launchConfetti]);

  return (
    <div className="nq-game">
      {/* Animated background */}
      <div className="nq-bg-gradient" />
      <div className="nq-bg-grid" />

      {/* Confetti */}
      <canvas ref={confettiRef} className="nq-confetti-canvas" />

      {/* ─── HEADER ─── */}
      <header className="nq-header">
        <div className="nq-header-left">
          <div className="nq-logo">
            <span className="nq-logo-icon">♛</span>
            <div className="nq-logo-text">
              <h1>N-Queens</h1>
              <span className="nq-logo-subtitle">AI Learning System</span>
            </div>
          </div>
        </div>

        <div className="nq-header-center">
          <div className="nq-mode-selector">
            {([
              { mode: 'manual' as GameMode, icon: '🎮', label: 'Manual' },
              { mode: 'solve' as GameMode, icon: '🤖', label: 'AI Solve' },
              { mode: 'learn' as GameMode, icon: '📚', label: 'Learn' },
            ]).map(({ mode, icon, label }) => (
              <button
                key={mode}
                className={`nq-mode-btn ${engine.mode === mode ? 'active' : ''}`}
                onClick={() => engine.onModeChange(mode)}
                disabled={engine.isPlaying}
              >
                <span className="nq-mode-icon">{icon}</span>
                <span className="nq-mode-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="nq-header-right">
          <div className="nq-size-control">
            <label htmlFor="nq-board-size">Board</label>
            <select
              id="nq-board-size"
              className="nq-size-select"
              value={engine.n}
              onChange={e => engine.onBoardSizeChange(parseInt(e.target.value))}
              disabled={engine.isPlaying}
            >
              {Array.from({ length: CONFIG.MAX_N - CONFIG.MIN_N + 1 }, (_, i) => CONFIG.MIN_N + i).map(n => (
                <option key={n} value={n}>{n} × {n}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="nq-main">
        {/* LEFT: Board Section */}
        <section className="nq-board-section">
          {/* Stats */}
          <div className="nq-stats-bar">
            <div className="nq-stat-item">
              <span className="nq-stat-icon">♛</span>
              <span className="nq-stat-value">{engine.queensPlaced}</span>
              <span className="nq-stat-label">/ {engine.n} Queens</span>
            </div>
            <div className="nq-stat-item">
              <span className="nq-stat-icon">📍</span>
              <span className="nq-stat-value">{engine.totalSteps}</span>
              <span className="nq-stat-label">Steps</span>
            </div>
            <div className="nq-stat-item">
              <span className="nq-stat-icon">↩️</span>
              <span className="nq-stat-value">{engine.totalBacktracks}</span>
              <span className="nq-stat-label">Backtracks</span>
            </div>
            <div className="nq-stat-item">
              <span className="nq-stat-icon">{engine.isSolved ? '✅' : '⏳'}</span>
              <span className="nq-stat-value">{engine.isSolved ? 'Solved!' : engine.isPlaying ? 'Solving...' : 'Ready'}</span>
            </div>
          </div>

          {/* Board */}
          <Board
            n={engine.n}
            board={engine.board}
            cellStates={engine.cellStates}
            conflictPairs={engine.conflictPairs}
            isSolved={engine.isSolved}
            isManual={engine.mode === 'manual'}
            hintCell={engine.hintCell}
            onCellClick={engine.onCellClick}
          />

          {/* Controls */}
          <Controls
            mode={engine.mode}
            isPlaying={engine.isPlaying}
            isPaused={engine.isPaused}
            isSolved={engine.isSolved}
            speed={engine.speed}
            hasSteps={engine.totalSteps > 0}
            stepsExhausted={false}
            onStart={engine.onStart}
            onPause={engine.onPause}
            onStep={engine.onStep}
            onHint={engine.onHint}
            onReset={engine.onReset}
            onSpeedChange={engine.onSpeedChange}
          />
        </section>

        {/* RIGHT: AI Tutor */}
        <AITutorPanel
          mode={engine.mode}
          isPlaying={engine.isPlaying}
          isSolved={engine.isSolved}
          messages={engine.messages}
          algoState={engine.algoState}
          codeHighlights={engine.codeHighlights}
          currentFact={engine.currentFact}
        />
      </main>
    </div>
  );
}
