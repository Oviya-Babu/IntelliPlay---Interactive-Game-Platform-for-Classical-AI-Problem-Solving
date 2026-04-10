/* ============================================
   useNQueensEngine — Complete game state & logic
   ============================================ */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  CONFIG,
  type GameMode,
  type GameStep,
  type TutorMessage,
  type HintResult,
  type AlgoState,
  type CellState,
  type ConflictPair,
  type StepType,
  type CodeLineHighlight,
  generateSteps,
  computeHint,
  findConflicts,
  hasConflicts,
  getColLetter,
  isSafeSimple,
  TUTOR,
  FactEngine,
  getCodeHighlights,
} from '../utils/nqueensHelpers';

// ─── STATE INTERFACE ──────────────────────────────────────

interface EngineState {
  n: number;
  mode: GameMode;
  board: number[];
  steps: GameStep[];
  currentStepIdx: number;
  isPlaying: boolean;
  isPaused: boolean;
  isSolved: boolean;
  speed: number;
  queensPlaced: number;
  totalSteps: number;
  totalBacktracks: number;
  manualMoveCount: number;
  hintCell: HintResult | null;
  firstBacktrackSeen: boolean;
  firstConflictSeen: boolean;
  firstPlacementSeen: boolean;
  currentStepType: StepType | '';
  currentStepRow: number;
  currentStepCol: number;
}

// ─── EXPORTED INTERFACE ───────────────────────────────────

export interface NQueensEngine {
  // State
  n: number;
  mode: GameMode;
  board: number[];
  isPlaying: boolean;
  isPaused: boolean;
  isSolved: boolean;
  speed: number;
  queensPlaced: number;
  totalSteps: number;
  totalBacktracks: number;
  hintCell: HintResult | null;
  currentStepType: StepType | '';

  // Computed
  messages: TutorMessage[];
  algoState: AlgoState;
  cellStates: Map<string, CellState[]>;
  conflictPairs: ConflictPair[];
  codeHighlights: CodeLineHighlight[];
  currentFact: string;

  // Actions
  onCellClick: (row: number, col: number) => void;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onHint: () => void;
  onReset: () => void;
  onModeChange: (mode: GameMode) => void;
  onBoardSizeChange: (n: number) => void;
  onSpeedChange: (speed: number) => void;
}

// ─── INITIAL STATE ────────────────────────────────────────

function createInitialState(n: number, mode: GameMode, speed: number): EngineState {
  return {
    n,
    mode,
    board: new Array(n).fill(-1),
    steps: [],
    currentStepIdx: 0,
    isPlaying: false,
    isPaused: false,
    isSolved: false,
    speed,
    queensPlaced: 0,
    totalSteps: 0,
    totalBacktracks: 0,
    manualMoveCount: 0,
    hintCell: null,
    firstBacktrackSeen: false,
    firstConflictSeen: false,
    firstPlacementSeen: false,
    currentStepType: '',
    currentStepRow: -1,
    currentStepCol: -1,
  };
}

// ─── HOOK ─────────────────────────────────────────────────

export function useNQueensEngine(): NQueensEngine {
  const [state, setState] = useState<EngineState>(() =>
    createInitialState(CONFIG.DEFAULT_N, 'manual', CONFIG.DEFAULT_SPEED)
  );
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [currentFact, setCurrentFact] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const factEngineRef = useRef(new FactEngine());

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Init welcome + fact
  useEffect(() => {
    const welcomeMsgs = TUTOR.welcome(state.mode, state.n);
    setMessages(welcomeMsgs);
    setCurrentFact(factEngineRef.current.getNext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ─── HELPERS ──────────────────────────────────────────

  const addMessages = useCallback((msgs: TutorMessage[]) => {
    setMessages(prev => [...prev, ...msgs]);
  }, []);

  const showFact = useCallback(() => {
    setCurrentFact(factEngineRef.current.getNext());
  }, []);

  const stopAnimation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ─── COMPUTE CELL STATES ─────────────────────────────

  const cellStates = useMemo((): Map<string, CellState[]> => {
    const map = new Map<string, CellState[]>();
    const { board, n, mode, isSolved, hintCell, currentStepType, currentStepRow, currentStepCol } = state;

    const addState = (r: number, c: number, cs: CellState) => {
      const key = `${r}-${c}`;
      const existing = map.get(key) || [];
      if (!existing.includes(cs)) {
        map.set(key, [...existing, cs]);
      }
    };

    if (isSolved) {
      // Solution celebration
      for (let r = 0; r < n; r++) {
        if (board[r] !== -1) {
          addState(r, board[r], 'solution-cell');
          addState(r, board[r], 'valid');
        }
      }
    } else if (mode === 'manual') {
      // Manual mode: show valid/conflict states
      const conflicts = findConflicts(board, n);
      const conflictCells = new Set<string>();
      conflicts.forEach(c => {
        conflictCells.add(`${c.row1}-${c.col1}`);
        conflictCells.add(`${c.row2}-${c.col2}`);
      });
      conflictCells.forEach(key => {
        const [r, c] = key.split('-').map(Number);
        addState(r, c, 'conflict');
      });
      for (let r = 0; r < n; r++) {
        if (board[r] !== -1 && !conflictCells.has(`${r}-${board[r]}`)) {
          addState(r, board[r], 'valid');
        }
      }
    } else {
      // AI solve/learn mode: use step-based states
      // Mark valid existing queens
      for (let r = 0; r < n; r++) {
        if (board[r] !== -1) addState(r, board[r], 'valid');
      }

      switch (currentStepType) {
        case 'enter-row':
          if (currentStepRow >= 0) {
            for (let c = 0; c < n; c++) {
              addState(currentStepRow, c, 'current-row');
            }
          }
          break;

        case 'try':
          if (currentStepRow >= 0) {
            for (let c = 0; c < n; c++) {
              addState(currentStepRow, c, 'current-row');
            }
          }
          if (currentStepRow >= 0 && currentStepCol >= 0) {
            addState(currentStepRow, currentStepCol, 'scanning');
            // Threat lines
            for (let r = 0; r < currentStepRow; r++) {
              addState(r, currentStepCol, 'highlight-col');
              const d1 = currentStepCol - (currentStepRow - r);
              const d2 = currentStepCol + (currentStepRow - r);
              if (d1 >= 0 && d1 < n) addState(r, d1, 'highlight-diag');
              if (d2 >= 0 && d2 < n) addState(r, d2, 'highlight-diag');
            }
          }
          break;

        case 'place':
          if (currentStepRow >= 0 && currentStepCol >= 0) {
            addState(currentStepRow, currentStepCol, 'valid');
          }
          break;

        case 'reject':
          if (currentStepRow >= 0 && currentStepCol >= 0) {
            addState(currentStepRow, currentStepCol, 'conflict');
          }
          break;

        case 'backtrack':
          // Already handled by valid queens
          break;
      }
    }

    // Hint cell
    if (hintCell) {
      addState(hintCell.row, hintCell.col, 'hint-cell');
    }

    return map;
  }, [state]);

  // ─── COMPUTE CONFLICT PAIRS ──────────────────────────

  const conflictPairs = useMemo((): ConflictPair[] => {
    if (state.mode === 'manual') {
      return findConflicts(state.board, state.n);
    }
    // For AI mode, show conflict line for reject steps
    if (state.currentStepType === 'reject' && state.currentStepRow >= 0 && state.currentStepCol >= 0) {
      const step = state.steps[state.currentStepIdx - 1];
      if (step && step.conflictRow !== undefined && step.board[step.conflictRow] !== -1) {
        return [{
          row1: step.conflictRow,
          col1: step.board[step.conflictRow],
          row2: state.currentStepRow,
          col2: state.currentStepCol,
          reason: step.conflictReason || 'column',
        }];
      }
    }
    return [];
  }, [state]);

  // ─── COMPUTE ALGO STATE ──────────────────────────────

  const algoState = useMemo((): AlgoState => {
    const { currentStepType, currentStepRow, currentStepCol, queensPlaced, isSolved } = state;

    let action = 'Idle';
    switch (currentStepType) {
      case 'enter-row': action = 'Scanning row'; break;
      case 'try': action = 'Checking cell'; break;
      case 'place': action = '✓ Placed'; break;
      case 'reject': action = '✗ Rejected'; break;
      case 'backtrack': action = '↩ Backtrack'; break;
      case 'exhausted': action = '🚫 Exhausted'; break;
      case 'solution': action = '🎉 Solved!'; break;
    }

    return {
      row: currentStepRow >= 0 ? `Row ${currentStepRow + 1}` : '—',
      col: currentStepCol >= 0 ? `Col ${getColLetter(currentStepCol)}` : '—',
      action: isSolved ? '🎉 Solved!' : action,
      queens: queensPlaced,
    };
  }, [state]);

  // ─── COMPUTE CODE HIGHLIGHTS ─────────────────────────

  const codeHighlights = useMemo((): CodeLineHighlight[] => {
    return getCodeHighlights(state.currentStepType);
  }, [state.currentStepType]);

  // ─── EXECUTE SINGLE STEP ─────────────────────────────

  const executeStep = useCallback((step: GameStep) => {
    const { type, row, col, board } = step;
    const s = stateRef.current;

    const newQueensPlaced = board.filter(c => c !== -1).length;
    const newTotalSteps = s.totalSteps + 1;
    const newTotalBacktracks = type === 'backtrack' ? s.totalBacktracks + 1 : s.totalBacktracks;

    setState(prev => ({
      ...prev,
      board: [...board],
      currentStepIdx: prev.currentStepIdx + 1,
      queensPlaced: newQueensPlaced,
      totalSteps: newTotalSteps,
      totalBacktracks: newTotalBacktracks,
      isSolved: type === 'solution',
      isPlaying: type === 'solution' ? false : prev.isPlaying,
      currentStepType: type,
      currentStepRow: row,
      currentStepCol: col,
      hintCell: null,
    }));

    // Generate tutor messages
    const { msgs, updatedFlags } = TUTOR.stepMessage(step, s.mode, {
      firstPlacementSeen: s.firstPlacementSeen,
      firstConflictSeen: s.firstConflictSeen,
      firstBacktrackSeen: s.firstBacktrackSeen,
    });
    addMessages(msgs);

    if (Object.keys(updatedFlags).length > 0) {
      setState(prev => ({ ...prev, ...updatedFlags }));
    }

    // Facts
    if (type === 'place' && newTotalSteps % 15 === 0) showFact();
    if (type === 'solution') showFact();
  }, [addMessages, showFact]);

  // ─── ANIMATION LOOP ──────────────────────────────────

  const runAnimation = useCallback(() => {
    const loop = () => {
      const s = stateRef.current;
      if (!s.isPlaying || s.isSolved || s.currentStepIdx >= s.steps.length) {
        if (!s.isSolved) {
          setState(prev => ({ ...prev, isPlaying: false }));
        }
        return;
      }

      const step = s.steps[s.currentStepIdx];
      executeStep(step);

      // Compute delay
      let d = CONFIG.SPEED_DELAYS[s.speed] || 500;
      if (step.type === 'try') d = Math.max(d * 0.5, 20);
      if (step.type === 'enter-row') d = Math.max(d * 0.3, 10);
      if (step.type === 'reject') d = Math.max(d * 0.6, 30);
      if (s.mode === 'learn') d = Math.max(d * 1.5, 100);

      if (step.type !== 'solution') {
        timeoutRef.current = setTimeout(loop, d);
      }
    };

    loop();
  }, [executeStep]);

  // ─── ACTIONS ──────────────────────────────────────────

  const onCellClick = useCallback((row: number, col: number) => {
    const s = stateRef.current;
    if (s.mode !== 'manual' || s.isPlaying || s.isSolved) return;

    const newBoard = [...s.board];
    const msgs: TutorMessage[] = [];

    // Clear hint
    setState(prev => ({ ...prev, hintCell: null }));

    if (newBoard[row] === col) {
      // Remove
      newBoard[row] = -1;
      msgs.push(TUTOR.manualRemove(row, col));
    } else if (newBoard[row] !== -1) {
      // Replace
      const oldCol = newBoard[row];
      newBoard[row] = col;
      msgs.push(TUTOR.manualPlace(row, col, s.n, newBoard.filter(c => c !== -1).length));
    } else {
      // Place new
      newBoard[row] = col;
      msgs.push(TUTOR.manualPlace(row, col, s.n, newBoard.filter(c => c !== -1).length));
    }

    const newQueensPlaced = newBoard.filter(c => c !== -1).length;
    const newManualMoveCount = s.manualMoveCount + 1;

    // Check conflicts for the clicked position
    if (newBoard[row] !== -1) {
      const conflictsForCell: Array<{ row: number; col: number; reason: string }> = [];
      for (let r = 0; r < s.n; r++) {
        if (newBoard[r] === -1 || r === row) continue;
        if (newBoard[r] === col) {
          conflictsForCell.push({ row: r, col: newBoard[r], reason: 'column' });
        }
        if (Math.abs(newBoard[r] - col) === Math.abs(r - row)) {
          conflictsForCell.push({ row: r, col: newBoard[r], reason: 'diagonal' });
        }
      }
      if (conflictsForCell.length > 0) {
        msgs.push(TUTOR.manualConflict(row, col, conflictsForCell));
      }
    }

    // Check if solved
    const allConflicts = findConflicts(newBoard, s.n);
    const solved = newQueensPlaced === s.n && allConflicts.length === 0;

    if (solved) {
      msgs.push(TUTOR.manualSolved(s.n));
    }

    addMessages(msgs);

    // Show fact every 4 manual moves
    if (newManualMoveCount % 4 === 0) showFact();

    setState(prev => ({
      ...prev,
      board: newBoard,
      queensPlaced: newQueensPlaced,
      manualMoveCount: newManualMoveCount,
      isSolved: solved,
    }));
  }, [addMessages, showFact]);

  const onStart = useCallback(() => {
    const s = stateRef.current;
    if (s.mode === 'manual') return;

    if (s.isPaused) {
      // Synchronously update ref and state
      stateRef.current = { ...stateRef.current, isPaused: false, isPlaying: true };
      setState(prev => ({ ...prev, isPaused: false, isPlaying: true }));
      setTimeout(() => runAnimation(), 10);
      return;
    }

    if (s.isPlaying || s.isSolved) return;

    let steps = s.steps;
    if (steps.length === 0) {
      steps = generateSteps(s.n);
    }

    // Synchronously update ref so the animation loop sees the new state immediately
    const newState = {
      ...stateRef.current,
      steps,
      isPlaying: true,
      isPaused: false,
    };
    stateRef.current = newState;
    setState(newState);

    // Start animation after brief delay to allow render
    setTimeout(() => runAnimation(), 20);
  }, [runAnimation]);

  const onPause = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlaying) return;

    stopAnimation();
    setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    addMessages([{ type: 'system', text: '⏸ Paused. Click Resume or Step to continue.' }]);
  }, [stopAnimation, addMessages]);

  const onStep = useCallback(() => {
    const s = stateRef.current;
    if (s.mode === 'manual' || s.isPlaying) return;

    let steps = s.steps;
    if (steps.length === 0) {
      steps = generateSteps(s.n);
      // Synchronously update ref
      stateRef.current = { ...stateRef.current, steps };
      setState(prev => ({ ...prev, steps }));
    }

    if (s.currentStepIdx < steps.length && !s.isSolved) {
      const step = steps[s.currentStepIdx];
      executeStep(step);
    }
  }, [executeStep]);

  const onHint = useCallback(() => {
    const s = stateRef.current;
    if (s.mode !== 'manual' || s.isPlaying || s.isSolved) return;

    // Clear previous hint
    setState(prev => ({ ...prev, hintCell: null }));

    // Check conflicts first
    if (hasConflicts(s.board, s.n)) {
      addMessages([TUTOR.hintHasConflicts()]);
      return;
    }

    const hint = computeHint(s.board, s.n);
    if (hint) {
      setState(prev => ({ ...prev, hintCell: hint }));
      addMessages([TUTOR.hintMessage(hint.row, hint.col)]);
    } else {
      addMessages([TUTOR.hintUnavailable()]);
    }
  }, [addMessages]);

  const doReset = useCallback((n: number, mode: GameMode, speed: number) => {
    stopAnimation();
    const newState = createInitialState(n, mode, speed);
    setState(newState);
    const welcomeMsgs = TUTOR.welcome(mode, n);
    setMessages(welcomeMsgs);
    showFact();
  }, [stopAnimation, showFact]);

  const onReset = useCallback(() => {
    const s = stateRef.current;
    doReset(s.n, s.mode, s.speed);
  }, [doReset]);

  const onModeChange = useCallback((mode: GameMode) => {
    const s = stateRef.current;
    if (mode === s.mode) return;
    doReset(s.n, mode, s.speed);
  }, [doReset]);

  const onBoardSizeChange = useCallback((n: number) => {
    if (n < CONFIG.MIN_N || n > CONFIG.MAX_N) return;
    const s = stateRef.current;
    if (n === s.n) return;
    doReset(n, s.mode, s.speed);
  }, [doReset]);

  const onSpeedChange = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed }));
  }, []);

  // ─── RETURN ───────────────────────────────────────────

  return {
    n: state.n,
    mode: state.mode,
    board: state.board,
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    isSolved: state.isSolved,
    speed: state.speed,
    queensPlaced: state.queensPlaced,
    totalSteps: state.totalSteps,
    totalBacktracks: state.totalBacktracks,
    hintCell: state.hintCell,
    currentStepType: state.currentStepType,

    messages,
    algoState,
    cellStates,
    conflictPairs,
    codeHighlights,
    currentFact,

    onCellClick,
    onStart,
    onPause,
    onStep,
    onHint,
    onReset,
    onModeChange,
    onBoardSizeChange,
    onSpeedChange,
  };
}
