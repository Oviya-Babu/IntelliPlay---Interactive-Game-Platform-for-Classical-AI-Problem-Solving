// ═══════════════════════════════════════════════════════════════
// Cryptarithmetic — Main Orchestrator (10-Level Curriculum)
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import LevelSelector from './LevelSelector';
import PuzzleBoard from './PuzzleBoard';
import TutorPanel from './TutorPanel';
import SolutionSteps from './SolutionSteps';
import BacktrackingTree from './BacktrackingTree';
import ConstraintVisualizer from './ConstraintVisualizer';

import type {
  SolverStep, SolverMetrics, SolveResponse,
  BotMetrics, ChatMessage, PuzzleConfig, TreeNode,
} from './types';
import {
  CRYPTO_LEVELS, LEVEL_PUZZLES, buildTreeFromSteps,
  getUniqueLetters, getLeadingLetters, validateEquation,
  parsePuzzle, wordToNumber,
} from './utils';
import { useComplexityStore } from '@/store/complexityStore';

const API_BASE = '/api/games';

export default function Cryptarithmetic() {
  // ── Level state ──
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const currentLevel = CRYPTO_LEVELS.find(l => l.id === currentLevelId)!;

  // ── Puzzle state ──
  const [puzzle, setPuzzle] = useState<PuzzleConfig>(currentLevel.puzzle);
  const [assignment, setAssignment] = useState<Record<string, number>>({});
  const [isSolved, setIsSolved] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // ── Solver state ──
  const [steps, setSteps] = useState<SolverStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [metrics, setMetrics] = useState<SolverMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [domains, setDomains] = useState<Record<string, number[]>>({});

  // ── Race mode state ──
  const [raceTimer, setRaceTimer] = useState(0);
  const [raceAiTime, setRaceAiTime] = useState<number | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);
  const raceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Brute force demo state ──
  const [bruteForceCounter, setBruteForceCounter] = useState(0);
  const [bruteForceRunning, setBruteForceRunning] = useState(false);

  // ── Comparison mode state (Level 6) ──
  const [comparisonMetrics, setComparisonMetrics] = useState<{
    backtrack: SolverMetrics | null;
    forward: SolverMetrics | null;
  }>({ backtrack: null, forward: null });

  // ── MRV comparison (Level 7) ──
  const [mrvMetrics, setMrvMetrics] = useState<{
    withMrv: SolverMetrics | null;
    withoutMrv: SolverMetrics | null;
  }>({ withMrv: null, withoutMrv: null });

  // ── Auto play ──
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef(false);

  // ── Chat ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // ── Reset on level change ──
  useEffect(() => {
    const level = CRYPTO_LEVELS.find(l => l.id === currentLevelId)!;
    setPuzzle(level.puzzle);
    setAssignment({});
    setIsSolved(false);
    setSteps([]);
    setCurrentStepIndex(-1);
    setMetrics(null);
    setTree(null);
    setIsAutoPlaying(false);
    autoPlayRef.current = false;
    setChatMessages([]);
    setRaceTimer(0);
    setRaceAiTime(null);
    setRaceStarted(false);
    setBruteForceCounter(0);
    setBruteForceRunning(false);
    setComparisonMetrics({ backtrack: null, forward: null });
    setMrvMetrics({ withMrv: null, withoutMrv: null });
    setCustomInput('');

    // Initialize domains
    const letters = getUniqueLetters(level.puzzle);
    const leading = new Set(getLeadingLetters(level.puzzle));
    const initialDomains: Record<string, number[]> = {};
    letters.forEach(l => {
      initialDomains[l] = leading.has(l) ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    });
    setDomains(initialDomains);

    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
  }, [currentLevelId]);

  // ── API call to solve ──
  const solve = useCallback(async (
    p: PuzzleConfig,
    mode: string = 'full_csp',
    useMrv: boolean = true,
  ): Promise<SolveResponse | null> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cryptarith/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word1: p.word1,
          word2: p.word2,
          result: p.result,
          mode,
          use_mrv: useMrv,
        }),
      });
      const data: SolveResponse = await res.json();
      return data;
    } catch (err) {
      console.error('Solve failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Manual assign ──
  const handleAssign = useCallback((letter: string, digit: number) => {
    setAssignment(prev => {
      const next = { ...prev, [letter]: digit };
      // Check if solved
      const n1 = wordToNumber(puzzle.word1, next);
      const n2 = wordToNumber(puzzle.word2, next);
      const nR = wordToNumber(puzzle.result, next);
      if (n1 !== null && n2 !== null && nR !== null && n1 + n2 === nR) {
        const allLetters = getUniqueLetters(puzzle);
        if (Object.keys(next).length === allLetters.length) {
          setIsSolved(true);
        }
      }
      return next;
    });
  }, [puzzle]);

  const handleUnassign = useCallback((letter: string) => {
    setAssignment(prev => {
      const next = { ...prev };
      delete next[letter];
      return next;
    });
    setIsSolved(false);
  }, []);

  // ── Step-by-step controls ──
  const handleSolveStepByStep = useCallback(async () => {
    const data = await solve(puzzle, currentLevel.solverMode, currentLevel.useMrv);
    if (!data) return;
    setSteps(data.steps);
    setMetrics(data.metrics);
    setCurrentStepIndex(-1);
    setTree(buildTreeFromSteps(data.steps));
    // Update complexity metrics from solver response
    useComplexityStore.getState().startTracking('cryptarith');
    if (data.metrics) {
      useComplexityStore.getState().setMetricsBatch({
        nodesExplored: data.metrics.nodes_explored,
        backtracks: data.metrics.backtracks,
        branchesPruned: data.metrics.nodes_pruned,
        depthReached: data.metrics.max_depth,
        statesChecked: data.metrics.nodes_explored,
        timeElapsedMs: data.metrics.time_ms,
      });
    }
  }, [puzzle, currentLevel, solve]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) return;
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    const step = steps[nextIdx];
    if (step?.assignment) {
      setAssignment(step.assignment);
    }
    if (step?.domains) {
      setDomains(step.domains);
    }
    if (step?.type === 'solution') {
      setIsSolved(true);
    }
    // Update complexity metrics per step
    const cs = useComplexityStore.getState();
    cs.incrementNodes();
    cs.incrementStates();
    if (step?.depth !== undefined) cs.setDepth(step.depth);
    if (step?.type === 'backtrack') cs.incrementBacktracks();
    if (step?.type === 'prune') cs.incrementPruned();
    cs.updateElapsedTime();
  }, [currentStepIndex, steps]);

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex <= 0) {
      setCurrentStepIndex(-1);
      setAssignment({});
      return;
    }
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);
    const step = steps[prevIdx];
    if (step?.assignment) {
      setAssignment(step.assignment);
    }
    if (step?.domains) {
      setDomains(step.domains);
    }
    setIsSolved(false);
  }, [currentStepIndex, steps]);

  // ── Auto play ──
  const handleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = false;
      setIsAutoPlaying(false);
      return;
    }

    setIsAutoPlaying(true);
    autoPlayRef.current = true;

    const play = () => {
      if (!autoPlayRef.current) return;
      setCurrentStepIndex(prev => {
        const next = prev + 1;
        if (next >= steps.length) {
          autoPlayRef.current = false;
          setIsAutoPlaying(false);
          return prev;
        }
        const step = steps[next];
        if (step?.assignment) setAssignment(step.assignment);
        if (step?.domains) setDomains(step.domains);
        if (step?.type === 'solution') setIsSolved(true);
        return next;
      });
      if (autoPlayRef.current) {
        setTimeout(play, 400);
      }
    };
    play();
  }, [isAutoPlaying, steps]);

  // ── Brute force demo (Level 3) ──
  const handleBruteForce = useCallback(async () => {
    setBruteForceRunning(true);
    setBruteForceCounter(0);

    // Simulate counter animation
    let count = 0;
    const maxCount = 50000;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 500 + 100);
      if (count >= maxCount) {
        count = maxCount;
        clearInterval(interval);
      }
      setBruteForceCounter(count);
    }, 50);

    const data = await solve(puzzle, 'brute_force', false);
    clearInterval(interval);

    if (data) {
      setBruteForceCounter(data.metrics.nodes_explored);
      setSteps(data.steps);
      setMetrics(data.metrics);
      if (data.solution) {
        setAssignment(data.solution);
        setIsSolved(true);
      }
    }
    setBruteForceRunning(false);
  }, [puzzle, solve]);

  // ── Comparison mode (Level 6) ──
  const handleComparison = useCallback(async () => {
    const [btResult, fcResult] = await Promise.all([
      solve(puzzle, 'backtrack', false),
      solve(puzzle, 'forward_checking', false),
    ]);
    setComparisonMetrics({
      backtrack: btResult?.metrics ?? null,
      forward: fcResult?.metrics ?? null,
    });
    if (fcResult) {
      setSteps(fcResult.steps);
      setMetrics(fcResult.metrics);
      setTree(buildTreeFromSteps(fcResult.steps));
      if (fcResult.solution) {
        setAssignment(fcResult.solution);
        setIsSolved(true);
      }
    }
  }, [puzzle, solve]);

  // ── MRV comparison (Level 7) ──
  const handleMrvCompare = useCallback(async () => {
    const [noMrv, withMrv] = await Promise.all([
      solve(puzzle, 'full_csp', false),
      solve(puzzle, 'full_csp', true),
    ]);
    setMrvMetrics({
      withoutMrv: noMrv?.metrics ?? null,
      withMrv: withMrv?.metrics ?? null,
    });
    if (withMrv) {
      setSteps(withMrv.steps);
      setMetrics(withMrv.metrics);
      setTree(buildTreeFromSteps(withMrv.steps));
      if (withMrv.solution) {
        setAssignment(withMrv.solution);
        setIsSolved(true);
      }
    }
  }, [puzzle, solve]);

  // ── Race mode (Level 8) ──
  const handleStartRace = useCallback(async () => {
    setRaceStarted(true);
    setRaceTimer(0);
    setRaceAiTime(null);

    const startTime = Date.now();
    raceIntervalRef.current = setInterval(() => {
      setRaceTimer(Date.now() - startTime);
    }, 100);

    // AI solves in background
    const data = await solve(puzzle, 'full_csp', true);
    if (data?.metrics) {
      setRaceAiTime(data.metrics.time_ms);
    }
  }, [puzzle, solve]);

  // Stop race timer when user solves
  useEffect(() => {
    if (isSolved && raceStarted && raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
    }
  }, [isSolved, raceStarted]);

  // ── Instant solve ──
  const handleInstantSolve = useCallback(async () => {
    const data = await solve(puzzle, 'full_csp', true);
    if (data) {
      setSteps(data.steps);
      setMetrics(data.metrics);
      setTree(buildTreeFromSteps(data.steps));
      if (data.solution) {
        setAssignment(data.solution);
        setIsSolved(true);
        setCurrentStepIndex(data.steps.length - 1);
      }
    }
  }, [puzzle, solve]);

  // ── Custom puzzle (Level 10) ──
  const handleCustomPuzzle = useCallback(async () => {
    const err = validateEquation(customInput);
    if (err) {
      setChatMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${err}` }]);
      return;
    }
    const parsed = parsePuzzle(customInput);
    setPuzzle(parsed);
    setAssignment({});
    setIsSolved(false);
    setSteps([]);
    setCurrentStepIndex(-1);
    setTree(null);

    // Initialize domains
    const letters = getUniqueLetters(parsed);
    const leading = new Set(getLeadingLetters(parsed));
    const initialDomains: Record<string, number[]> = {};
    letters.forEach(l => {
      initialDomains[l] = leading.has(l) ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    });
    setDomains(initialDomains);

    // Validate solvability
    try {
      const res = await fetch(`${API_BASE}/cryptarith/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word1: parsed.word1, word2: parsed.word2, result: parsed.result }),
      });
      const data = await res.json();
      if (data.is_solvable) {
        setChatMessages(prev => [...prev, {
          role: 'bot',
          text: `✅ Great puzzle! It has ${data.unique_letters} unique letters and IS solvable. Click "Solve Step-by-Step" to see how!`,
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'bot',
          text: `❌ This puzzle has no valid solution. ${data.error || 'Try a different combination!'}`,
        }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'bot', text: 'Could not validate. Try solving directly!' }]);
    }
  }, [customInput]);

  // ── Chat handler ──
  const handleSendChat = useCallback(async (msg: string) => {
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: 'cryptarith',
          session_id: 'crypto-session',
          question: msg,
          current_explanation: steps[currentStepIndex]?.msg || '',
          board_state: JSON.stringify(assignment),
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'bot',
        text: "I'm having trouble connecting. Try again in a moment!",
      }]);
    }
  }, [steps, currentStepIndex, assignment]);

  // ── Puzzle selector for levels with multiple puzzles ──
  const availablePuzzles = LEVEL_PUZZLES[currentLevelId] || [];

  // ── Current step ──
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  // ── Bot metrics for tutor panel ──
  const botMetrics: BotMetrics | null = metrics ? {
    depth: metrics.max_depth,
    nodes: metrics.nodes_explored,
    pruned: metrics.nodes_pruned,
    backtracks: metrics.backtracks,
    timeMs: metrics.time_ms,
  } : null;

  // ── Show step controls for appropriate levels ──
  const showStepControls = [5, 6, 7, 9, 10].includes(currentLevelId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', width: '100%' }}>
      {/* Level Selector */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-surface-2, #1a1a28)',
        borderBottom: '1px solid var(--border-default, #2a2a35)',
      }}>
        <LevelSelector
          levels={CRYPTO_LEVELS}
          currentLevelId={currentLevelId}
          onSelectLevel={setCurrentLevelId}
        />
      </div>

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
        {/* Left: Game area */}
        <div style={{
          flex: 3,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          background: 'var(--bg-surface-3, #111118)',
        }}>
          {/* Level header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center' }}
          >
            <span style={{
              padding: '4px 12px',
              background: 'rgba(99,102,241,0.15)',
              color: '#818cf8',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Level {currentLevelId} — {currentLevel.title}
            </span>
            <h2 style={{
              fontSize: 20,
              fontWeight: 800,
              marginTop: 8,
              color: 'var(--text-primary, #f1f0fe)',
            }}>
              {currentLevel.description}
            </h2>
          </motion.div>

          {/* Puzzle selector (if multiple puzzles) */}
          {availablePuzzles.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {availablePuzzles.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPuzzle(p);
                    setAssignment({});
                    setIsSolved(false);
                    setSteps([]);
                    setCurrentStepIndex(-1);
                    setTree(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    border: puzzle.name === p.name ? '2px solid #818cf8' : '1px solid var(--border-default, #2a2a35)',
                    background: puzzle.name === p.name ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface, #151521)',
                    color: puzzle.name === p.name ? '#818cf8' : 'var(--text-secondary, #a1a1aa)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Custom input (Level 10) */}
          {currentLevel.mode === 'master' && (
            <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 500 }}>
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value.toUpperCase())}
                placeholder="e.g. SEND + MORE = MONEY"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-surface, #151521)',
                  border: '1px solid var(--border-default, #2a2a35)',
                  color: 'var(--text-primary, #f1f0fe)',
                  fontSize: 14,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCustomPuzzle}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(99,102,241,0.3)',
                }}
              >
                Load
              </button>
            </div>
          )}

          {/* Puzzle Board */}
          <div style={{ width: '100%', maxWidth: 500 }}>
            <PuzzleBoard
              puzzle={puzzle}
              assignment={assignment}
              currentStep={currentStep}
              isSolved={isSolved}
              isManualMode={currentLevel.mode === 'manual' || currentLevel.mode === 'master'}
              isRaceMode={currentLevel.mode === 'race'}
              disabled={isLoading || isAutoPlaying}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
            />
          </div>

          {/* Level-specific content */}
          <AnimatePresence mode="wait">
            {/* Level 1: Tutorial info */}
            {currentLevel.mode === 'tutorial' && (
              <motion.div
                key="tutorial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  width: '100%',
                  maxWidth: 500,
                  padding: 20,
                  background: 'var(--bg-surface, #151521)',
                  borderRadius: 14,
                  border: '1px solid var(--border-default, #2a2a35)',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#818cf8', marginBottom: 12 }}>
                  📖 Rules of Cryptarithmetic
                </h3>
                <ul style={{ fontSize: 13, color: 'var(--text-secondary, #a1a1aa)', lineHeight: 2, listStyle: 'none', padding: 0 }}>
                  <li>✦ Each letter represents a unique digit (0-9)</li>
                  <li>✦ Leading letters cannot be zero (S≠0, M≠0)</li>
                  <li>✦ The arithmetic equation must hold true</li>
                  <li>✦ All letter-to-digit mappings must be one-to-one</li>
                  <li>✦ Example: SEND + MORE = MONEY → 9567 + 1085 = 10652</li>
                </ul>
                <button
                  onClick={() => setCurrentLevelId(2)}
                  style={{
                    marginTop: 16,
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(99,102,241,0.3)',
                  }}
                >
                  Start Solving →
                </button>
              </motion.div>
            )}

            {/* Level 3: Brute Force demo */}
            {currentLevel.mode === 'brute_force_demo' && (
              <motion.div
                key="bruteforce"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}
              >
                <div style={{
                  padding: 24,
                  background: 'var(--bg-surface, #151521)',
                  borderRadius: 14,
                  border: '1px solid var(--border-default, #2a2a35)',
                }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary, #a1a1aa)', marginBottom: 12 }}>
                    Combinations tried:
                  </p>
                  <motion.div
                    key={bruteForceCounter}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    style={{
                      fontSize: 48,
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: bruteForceRunning ? '#f59e0b' : isSolved ? '#10b981' : '#818cf8',
                      transition: 'color 0.3s',
                    }}
                  >
                    {bruteForceCounter.toLocaleString()}
                  </motion.div>
                  {!bruteForceRunning && !isSolved && (
                    <button
                      onClick={handleBruteForce}
                      style={{
                        marginTop: 16,
                        padding: '10px 24px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      🔢 Start Brute Force
                    </button>
                  )}
                  {metrics && (
                    <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 12 }}>
                      Time: {metrics.time_ms.toFixed(1)}ms — That's {metrics.nodes_explored.toLocaleString()} combinations!
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Level 4: Constraint Visualizer */}
            {currentLevel.mode === 'constraint_viz' && (
              <motion.div
                key="constraintviz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ width: '100%', maxWidth: 500 }}
              >
                <ConstraintVisualizer
                  puzzle={puzzle}
                  assignment={assignment}
                  domains={domains}
                  onSelectLetter={(_l) => setAssignment(prev => prev)}
                />
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button
                    onClick={handleInstantSolve}
                    disabled={isLoading}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    {isLoading ? 'Solving...' : '⚡ Solve with Constraints'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Level 5: Step-by-step + tree */}
            {currentLevel.mode === 'step_by_step' && (
              <motion.div
                key="stepbystep"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ width: '100%', maxWidth: 700 }}
              >
                {steps.length === 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={handleSolveStepByStep}
                      disabled={isLoading}
                      style={{
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        boxShadow: '0 0 16px rgba(99,102,241,0.3)',
                        opacity: isLoading ? 0.5 : 1,
                      }}
                    >
                      {isLoading ? '🔄 Loading...' : '🌳 Start Step-by-Step'}
                    </button>
                  </div>
                ) : (
                  <>
                    {tree && (
                      <BacktrackingTree
                        root={tree}
                        currentStepId={currentStep?.step_id !== undefined
                          ? `${currentStep.letter}-${currentStep.digit}-${currentStep.step_id}`
                          : undefined}
                        maxHeight={300}
                      />
                    )}
                    <div style={{
                      marginTop: 12,
                      maxHeight: 250,
                      overflow: 'hidden',
                      borderRadius: 12,
                      border: '1px solid var(--border-default, #2a2a35)',
                    }}>
                      <SolutionSteps
                        steps={steps}
                        currentStepIndex={currentStepIndex}
                        onStepClick={(i) => {
                          setCurrentStepIndex(i);
                          const step = steps[i];
                          if (step?.assignment) setAssignment(step.assignment);
                          if (step?.domains) setDomains(step.domains);
                          if (step?.type === 'solution') setIsSolved(true);
                          else setIsSolved(false);
                        }}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Level 6: Comparison */}
            {currentLevel.mode === 'comparison' && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ width: '100%', maxWidth: 600 }}
              >
                {!comparisonMetrics.backtrack ? (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={handleComparison}
                      disabled={isLoading}
                      style={{
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                      }}
                    >
                      {isLoading ? '🔄 Running...' : '⚔️ Compare Methods'}
                    </button>
                  </div>
                ) : (
                  <ComparisonCard
                    leftTitle="Pure Backtracking"
                    rightTitle="Forward Checking"
                    leftMetrics={comparisonMetrics.backtrack}
                    rightMetrics={comparisonMetrics.forward}
                  />
                )}
              </motion.div>
            )}

            {/* Level 7: MRV */}
            {currentLevel.mode === 'mrv_demo' && (
              <motion.div
                key="mrv"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ width: '100%', maxWidth: 600 }}
              >
                {!mrvMetrics.withMrv ? (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={handleMrvCompare}
                      disabled={isLoading}
                      style={{
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #a855f7, #9333ea)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                      }}
                    >
                      {isLoading ? '🔄 Running...' : '🧠 Compare MRV vs Random'}
                    </button>
                  </div>
                ) : (
                  <ComparisonCard
                    leftTitle="Random Ordering"
                    rightTitle="MRV Heuristic"
                    leftMetrics={mrvMetrics.withoutMrv}
                    rightMetrics={mrvMetrics.withMrv}
                  />
                )}
              </motion.div>
            )}

            {/* Level 8: Race */}
            {currentLevel.mode === 'race' && (
              <motion.div
                key="race"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}
              >
                {!raceStarted ? (
                  <button
                    onClick={handleStartRace}
                    style={{
                      padding: '14px 32px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: 16,
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(16,185,129,0.3)',
                    }}
                  >
                    🏁 Start Race!
                  </button>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                  }}>
                    <div style={{
                      padding: 20,
                      background: 'var(--bg-surface, #151521)',
                      borderRadius: 14,
                      border: '1px solid var(--border-default, #2a2a35)',
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase' }}>You</p>
                      <p style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: isSolved ? '#10b981' : '#fff' }}>
                        {isSolved ? `${(raceTimer / 1000).toFixed(1)}s` : `${(raceTimer / 1000).toFixed(1)}s`}
                      </p>
                      {isSolved && <p style={{ fontSize: 11, color: '#10b981' }}>✓ Solved!</p>}
                    </div>
                    <div style={{
                      padding: 20,
                      background: 'var(--bg-surface, #151521)',
                      borderRadius: 14,
                      border: '1px solid var(--border-default, #2a2a35)',
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>AI (CSP)</p>
                      <p style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: '#10b981' }}>
                        {raceAiTime !== null ? `${raceAiTime.toFixed(1)}ms` : '...'}
                      </p>
                      {raceAiTime !== null && <p style={{ fontSize: 11, color: '#10b981' }}>✓ Solved!</p>}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Level 9 & 10: Advanced + Master — solve buttons */}
            {(currentLevel.mode === 'advanced' || currentLevel.mode === 'master') && (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ width: '100%', maxWidth: 700 }}
              >
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                  <button
                    onClick={handleSolveStepByStep}
                    disabled={isLoading}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    🌳 Step-by-Step
                  </button>
                  <button
                    onClick={handleInstantSolve}
                    disabled={isLoading}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    ⚡ Instant Solve
                  </button>
                </div>
                {steps.length > 0 && (
                  <>
                    {tree && <BacktrackingTree root={tree} maxHeight={250} />}
                    <div style={{
                      marginTop: 12,
                      maxHeight: 200,
                      overflow: 'hidden',
                      borderRadius: 12,
                      border: '1px solid var(--border-default, #2a2a35)',
                    }}>
                      <SolutionSteps
                        steps={steps}
                        currentStepIndex={currentStepIndex}
                        onStepClick={(i) => {
                          setCurrentStepIndex(i);
                          const step = steps[i];
                          if (step?.assignment) setAssignment(step.assignment);
                        }}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Universal action buttons for appropriate levels */}
          {currentLevel.mode === 'manual' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setAssignment({}); setIsSolved(false); }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-surface, #151521)',
                  border: '1px solid var(--border-default, #2a2a35)',
                  borderRadius: 8,
                  color: 'var(--text-secondary, #a1a1aa)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔄 Reset
              </button>
              <button
                onClick={handleInstantSolve}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                💡 Show Answer
              </button>
            </div>
          )}
        </div>

        {/* Right: Tutor Panel */}
        <div style={{ flex: 2, borderLeft: '1px solid var(--border-default, #2a2a35)', height: '100%' }}>
          <TutorPanel
            level={currentLevelId}
            currentStep={currentStep}
            metrics={botMetrics}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            onAutoPlay={handleAutoPlay}
            isAutoPlaying={isAutoPlaying}
            showStepControls={showStepControls && steps.length > 0}
            chatMessages={chatMessages}
            onSendChat={handleSendChat}
          />
        </div>
      </div>
    </div>
  );
}


// ── Comparison Card sub-component ──
function ComparisonCard({
  leftTitle,
  rightTitle,
  leftMetrics,
  rightMetrics,
}: {
  leftTitle: string;
  rightTitle: string;
  leftMetrics: SolverMetrics | null;
  rightMetrics: SolverMetrics | null;
}) {
  const speedup = leftMetrics && rightMetrics && leftMetrics.nodes_explored > 0
    ? ((leftMetrics.nodes_explored - rightMetrics.nodes_explored) / leftMetrics.nodes_explored * 100).toFixed(0)
    : '0';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
    }}>
      <ComparisonColumn title={leftTitle} metrics={leftMetrics} isWinner={false} />
      <ComparisonColumn title={rightTitle} metrics={rightMetrics} isWinner={true} />
      {leftMetrics && rightMetrics && (
        <div style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: 12,
          background: 'rgba(16,185,129,0.1)',
          borderRadius: 10,
          border: '1px solid rgba(16,185,129,0.3)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>
            🚀 {speedup}% fewer nodes explored with {rightTitle}!
          </span>
        </div>
      )}
    </div>
  );
}

function ComparisonColumn({ title, metrics, isWinner }: {
  title: string;
  metrics: SolverMetrics | null;
  isWinner: boolean;
}) {
  return (
    <div style={{
      padding: 16,
      background: 'var(--bg-surface, #151521)',
      borderRadius: 14,
      border: `1px solid ${isWinner ? 'rgba(16,185,129,0.3)' : 'var(--border-default, #2a2a35)'}`,
    }}>
      <p style={{
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        color: isWinner ? '#10b981' : '#f43f5e',
        marginBottom: 12,
      }}>
        {isWinner ? '✓ ' : ''}{title}
      </p>
      {metrics ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <MetricRow label="Nodes" value={metrics.nodes_explored.toLocaleString()} />
          <MetricRow label="Backtracks" value={metrics.backtracks.toLocaleString()} />
          <MetricRow label="Pruned" value={metrics.nodes_pruned.toLocaleString()} />
          <MetricRow label="Time" value={`${metrics.time_ms.toFixed(1)}ms`} />
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#71717a' }}>Loading...</p>
      )}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted, #71717a)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}
