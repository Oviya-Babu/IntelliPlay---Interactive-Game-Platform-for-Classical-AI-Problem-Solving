import { useState, useCallback, useEffect, useRef } from 'react';
import { checkWin, getStateFromCharacters, checkGameOver } from './logic/gameRules';
import { solve, computeOptimalPath, getNextFromPath, getHintFromPath, explainMove, explainWhySafe, generateAITeaching, generateDetailedExplanation } from './logic/bfsSolver';
import { useComplexityStore } from '@/store/complexityStore';
import River from './River';
import Boat from './Boat';
import Character from './Character';
import Bank from './Bank';
import Controls from './Controls';
import AIPanel from './AIOverlay';
import './MissionariesGame.css';

const INITIAL_CHARACTERS = [
  { id: 'M1', type: 'missionary', side: 'left', label: 'M1' },
  { id: 'M2', type: 'missionary', side: 'left', label: 'M2' },
  { id: 'M3', type: 'missionary', side: 'left', label: 'M3' },
  { id: 'C1', type: 'cannibal', side: 'left', label: 'C1' },
  { id: 'C2', type: 'cannibal', side: 'left', label: 'C2' },
  { id: 'C3', type: 'cannibal', side: 'left', label: 'C3' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default function MissionariesGame() {
  const [characters, setCharacters] = useState(INITIAL_CHARACTERS);
  const [boatSide, setBoatSide] = useState('left');
  const [passengers, setPassengers] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameStatus, setGameStatus] = useState('playing');
  const [moveCount, setMoveCount] = useState(0);
  const [learningMode, setLearningMode] = useState(true);
  const [messages, setMessages] = useState([
    { text: '🧠 Welcome! Move all 3 humans safely across the river.\n🎯 Rule: Monsters must never outnumber humans on either bank.\n👆 Click characters to board, then press GO!', type: 'info' },
  ]);
  const [showHints, setShowHints] = useState(false);
  const [hintChars, setHintChars] = useState(null);
  const [shakeScene, setShakeScene] = useState(false);
  const [unsafeSide, setUnsafeSide] = useState(null);
  const [autoSolving, setAutoSolving] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const autoSolveRef = useRef(false);

  // AI explanation state — structured sections for tutor panel
  const [aiExplanation, setAiExplanation] = useState(null);
  // Structured hint data for display
  const [hintData, setHintData] = useState(null);

  // PRECOMPUTED BFS PATH — computed once on mount
  const optimalPathRef = useRef(null);
  useEffect(() => {
    optimalPathRef.current = computeOptimalPath();
  }, []);

  // Refs for fresh async values
  const charsRef = useRef(characters);
  const boatRef = useRef(boatSide);
  const moveCountRef = useRef(moveCount);
  const learningRef = useRef(learningMode);
  useEffect(() => { charsRef.current = characters; }, [characters]);
  useEffect(() => { boatRef.current = boatSide; }, [boatSide]);
  useEffect(() => { moveCountRef.current = moveCount; }, [moveCount]);
  useEffect(() => { learningRef.current = learningMode; }, [learningMode]);

  // Compute fear state
  const getFearSide = useCallback(() => {
    const state = getStateFromCharacters(characters, boatSide);
    const leftDanger = state.left.M > 0 && state.left.C >= state.left.M && state.left.C > 0;
    const rightDanger = state.right.M > 0 && state.right.C >= state.right.M && state.right.C > 0;
    if (leftDanger && rightDanger) return 'both';
    if (leftDanger) return 'left';
    if (rightDanger) return 'right';
    return null;
  }, [characters, boatSide]);

  const fearSide = getFearSide();

  // Compute current state for AI panel
  const currentState = getStateFromCharacters(characters, boatSide);

  // Compute hints using precomputed path (only when not animating to avoid intermediate states)
  useEffect(() => {
    if (showHints && gameStatus === 'playing' && !isAnimating) {
      const state = getStateFromCharacters(characters, boatSide);
      const hint = getHintFromPath(optimalPathRef.current, state);
      // Ensure hint never exceeds boat capacity (max 2 total)
      if (hint && (hint.missionaries + hint.cannibals) > 2) {
        // Cap to 2 max, prioritizing missionaries
        const excess = (hint.missionaries + hint.cannibals) - 2;
        hint.cannibals = Math.max(0, hint.cannibals - excess);
      }
      setHintChars(hint);
      setHintData(hint);
    } else if (!showHints) {
      setHintChars(null);
      setHintData(null);
    }
  }, [showHints, boatSide, gameStatus, isAnimating]);

  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev.slice(-19), { text, type, id: Date.now() }]);
  }, []);

  // ---------- BOARDING ----------
  const handleSelect = useCallback((charId) => {
    if (isAnimating || gameStatus !== 'playing') return;
    if (passengers.includes(charId)) {
      setPassengers(prev => prev.filter(id => id !== charId));
      return;
    }
    const char = characters.find(c => c.id === charId);
    if (!char || char.side !== boatSide) return;
    if (passengers.length >= 2) return;
    setPassengers(prev => [...prev, charId]);
  }, [isAnimating, gameStatus, characters, boatSide, passengers]);

  // ---------- EXECUTE MOVE ----------
  const executeMove = useCallback(async (passengerIds) => {
    if (passengerIds.length === 0 || passengerIds.length > 2) return false;

    const curChars = charsRef.current;
    const curBoatSide = boatRef.current;
    const curMoveCount = moveCountRef.current;
    const isLearning = learningRef.current;

    setIsAnimating(true);

    const movingChars = curChars.filter(c => passengerIds.includes(c.id));
    const moveLabel = movingChars.map(c => c.label).join(' & ');
    const currentState = getStateFromCharacters(curChars, curBoatSide);
    const newSide = curBoatSide === 'left' ? 'right' : 'left';

    const updatedChars = curChars.map(c =>
      passengerIds.includes(c.id) ? { ...c, side: newSide } : c
    );
    const newState = getStateFromCharacters(updatedChars, newSide);

    // ANIMATE
    setBoatSide(newSide);
    await sleep(1300);
    setCharacters(updatedChars);
    setPassengers([]);
    await sleep(300);

    // CHECK game over
    const gameOverSide = checkGameOver(newState);
    if (gameOverSide) {
      setGameStatus('gameover');
      setUnsafeSide(gameOverSide);
      setShakeScene(true);
      addMessage('💀 The monsters overpowered the humans!', 'error');
      if (isLearning) {
        const side = gameOverSide === 'left' ? 'Left' : 'Right';
        const sM = gameOverSide === 'left' ? newState.left.M : newState.right.M;
        const sC = gameOverSide === 'left' ? newState.left.C : newState.right.C;
        addMessage(`🧠 ${side} bank: ${sM}H vs ${sC}Z — monsters attacked!`, 'info');
      }
      setAiExplanation({
        sections: [
          { title: '💀 GAME OVER', content: 'The monsters overpowered the humans!' },
          { title: '🧠 WHAT WENT WRONG', content: `The move resulted in humans being outnumbered on the ${gameOverSide} bank. Always verify both banks remain safe before moving.` },
        ],
        type: 'error',
      });
      setIsAnimating(false);
      return false;
    }

    // UPDATE
    const newMoveCount = curMoveCount + 1;
    setMoveCount(newMoveCount);

    // Update complexity metrics
    const cs = useComplexityStore.getState();
    cs.incrementNodes();
    cs.incrementStates();
    cs.setDepth(newMoveCount);
    cs.updateElapsedTime();

    const moveDesc = `${moveLabel} → ${newSide}`;
    setMoveHistory(prev => [...prev, { desc: moveDesc, state: newState }]);
    addMessage(`✅ Move ${newMoveCount}: ${moveDesc}`, 'success');

    if (isLearning) {
      const explanation = explainMove(currentState, newState, {
        m: movingChars.filter(c => c.type === 'missionary').length,
        c: movingChars.filter(c => c.type === 'cannibal').length,
        label: moveLabel,
      });
      addMessage(`📝 ${explanation}`, 'info');
    }

    // CHECK win
    if (checkWin(updatedChars)) {
      setGameStatus('won');
      addMessage(`🎉 YOU WIN in ${newMoveCount} moves!`, 'success');
      addMessage(newMoveCount <= 11 ? '🏆 Optimal!' : `🏆 Optimal is 11 moves.`, newMoveCount <= 11 ? 'success' : 'info');
      setAiExplanation({
        sections: [
          { title: '🎉 PUZZLE SOLVED', content: `All characters crossed safely in ${newMoveCount} moves!` },
          { title: '📊 RESULT', content: newMoveCount <= 11 ? 'That\'s the optimal solution! BFS found this exact 11-move path.' : `Optimal is 11 moves. You used ${newMoveCount}. Try again to match BFS!` },
        ],
        type: 'success',
      });
    } else {
      // Generate detailed AI explanation from PRECOMPUTED path
      const detailed = generateDetailedExplanation(optimalPathRef.current, newState, newMoveCount, isLearning);
      setAiExplanation(detailed);

      // Also add legacy message
      const aiMsg = generateAITeaching(optimalPathRef.current, newState, newMoveCount, isLearning);
      addMessage(aiMsg.text, aiMsg.type);
    }

    setIsAnimating(false);
    return true;
  }, [addMessage]);

  // ---------- GO ----------
  const handleGo = useCallback(() => {
    if (isAnimating || gameStatus !== 'playing') return;
    if (passengers.length === 0) {
      addMessage('⚠️ Board characters first!', 'warning');
      return;
    }
    executeMove([...passengers]);
  }, [isAnimating, gameStatus, passengers, executeMove, addMessage]);

  // ---------- RESET ----------
  const handleReset = useCallback(() => {
    autoSolveRef.current = false;
    setAutoSolving(false);
    setCharacters(INITIAL_CHARACTERS);
    setBoatSide('left');
    setPassengers([]);
    setIsAnimating(false);
    setGameStatus('playing');
    setMoveCount(0);
    setMoveHistory([]);
    setShakeScene(false);
    setUnsafeSide(null);
    setAiExplanation(null);
    setHintData(null);
    // Recompute path on reset
    optimalPathRef.current = computeOptimalPath();
    // Reset complexity metrics
    useComplexityStore.getState().startTracking('missionaries');
    setMessages([{
      text: '🔄 Game reset!\n👆 Click characters to board, then press GO.\n🎯 Keep humans safe!',
      type: 'info'
    }]);
  }, []);

  // ---------- AUTO SOLVE ----------
  const handleAutoSolve = useCallback(async () => {
    const state = getStateFromCharacters(charsRef.current, boatRef.current);
    const solution = solve(state);
    if (!solution || solution.length === 0) {
      addMessage('😰 No solution. Reset!', 'error');
      return;
    }
    setAutoSolving(true);
    autoSolveRef.current = true;
    addMessage('🤖 Auto-solving with BFS...', 'info');
    // Start complexity tracking for auto-solve
    useComplexityStore.getState().startTracking('missionaries');

    let localChars = [...charsRef.current.map(c => ({ ...c }))];
    let localBoat = boatRef.current;

    for (let i = 0; i < solution.length; i++) {
      if (!autoSolveRef.current) break;
      await sleep(800);
      if (!autoSolveRef.current) break;

      const step = solution[i];
      const mOnSide = localChars.filter(c => c.type === 'missionary' && c.side === localBoat);
      const cOnSide = localChars.filter(c => c.type === 'cannibal' && c.side === localBoat);
      const toBoard = [
        ...mOnSide.slice(0, step.move.m),
        ...cOnSide.slice(0, step.move.c),
      ].map(c => c.id);

      setPassengers(toBoard);
      await sleep(600);
      if (!autoSolveRef.current) break;

      const success = await executeMove(toBoard);
      if (!success) break;

      const newSide = localBoat === 'left' ? 'right' : 'left';
      localChars = localChars.map(c => toBoard.includes(c.id) ? { ...c, side: newSide } : c);
      localBoat = newSide;
    }
    autoSolveRef.current = false;
    setAutoSolving(false);
  }, [executeMove, addMessage]);

  const handleStopSolve = useCallback(() => {
    autoSolveRef.current = false;
    setAutoSolving(false);
    addMessage('⏹️ Stopped.', 'info');
  }, [addMessage]);

  // ---------- POSITIONING ----------
  const getCharPosition = useCallback((char) => {
    const isPassenger = passengers.includes(char.id);
    if (isPassenger) {
      const idx = passengers.indexOf(char.id);
      const bx = boatSide === 'left' ? 33 : 59;
      return { left: bx + idx * 8, top: 52 };
    }
    const sameType = characters.filter(
      c => c.type === char.type && c.side === char.side && !passengers.includes(c.id)
    );
    const typeIdx = sameType.findIndex(c => c.id === char.id);
    const isMissionary = char.type === 'missionary';
    const baseX = char.side === 'left' ? 3 : 76;
    const yRow = isMissionary ? 38 : 54;
    return { left: baseX + typeIdx * 7, top: yRow };
  }, [characters, passengers, boatSide]);

  const isHinted = useCallback((char) => {
    if (!showHints || !hintChars || gameStatus !== 'playing' || isAnimating) return false;
    if (char.side !== boatSide) return false;
    
    const isMissionary = char.type === 'missionary';
    const needed = isMissionary ? hintChars.missionaries : hintChars.cannibals;
    
    // Ensure we never highlight more than needed
    if (needed === 0) return false;
    
    // Get only characters of this type on the current boat side (not already boarded)
    const sameTypeOnSide = characters.filter(
      c => c.type === char.type && c.side === boatSide && !passengers.includes(c.id)
    );
    
    const idx = sameTypeOnSide.findIndex(c => c.id === char.id);
    
    // Strictly limit: only highlight exactly what's needed (max 1 of each type per move)
    return idx >= 0 && idx < needed && needed <= 2;
  }, [showHints, hintChars, gameStatus, boatSide, characters, passengers, isAnimating]);

  const boatX = boatSide === 'left' ? 30 : 58;

  // ===== 2-COLUMN LAYOUT =====
  return (
    <div className="mc-app fullscreen-mode">
      {/* LEFT: Game Area */}
      <div className={`mc-scene ${shakeScene ? 'shake' : ''}`}>
        <div className="scene-sky">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
          <div className="sun" />
        </div>

        {/* GO BUTTON */}
        {gameStatus === 'playing' && (
          <button
            className={`go-button ${passengers.length > 0 ? 'ready' : ''}`}
            onClick={handleGo}
            disabled={isAnimating || passengers.length === 0}
          >
            {passengers.length > 0 ? `GO ⛵ (${passengers.length})` : 'Select passengers'}
          </button>
        )}

        <div className="move-counter">⛵ Moves: {moveCount}</div>

        <Bank side="left" unsafe={unsafeSide === 'left'} />
        <River />
        <Bank side="right" unsafe={unsafeSide === 'right'} />
        <Boat side={boatSide} x={boatX} passengerCount={passengers.length} onClick={handleGo} />

        {characters.map(char => {
          const pos = getCharPosition(char);
          const charFearful = char.type === 'missionary' && (fearSide === char.side || fearSide === 'both');
          return (
            <Character
              key={char.id}
              char={char}
              position={pos}
              isSelected={passengers.includes(char.id)}
              isHinted={isHinted(char)}
              onClick={() => handleSelect(char.id)}
              disabled={isAnimating || gameStatus !== 'playing'}
              isEaten={gameStatus === 'gameover' && char.side === unsafeSide && char.type === 'missionary'}
              isAttacking={gameStatus === 'gameover' && char.side === unsafeSide && char.type === 'cannibal'}
              isFearful={charFearful}
            />
          );
        })}

        {gameStatus === 'won' && (
          <div className="win-overlay">
            <div className="win-content">
              <h2>🎉 Victory!</h2>
              <p>All crossed safely in <strong>{moveCount}</strong> moves!</p>
              <button onClick={handleReset} className="btn btn-primary">Play Again</button>
            </div>
          </div>
        )}

        {gameStatus === 'gameover' && (
          <div className="win-overlay gameover-overlay">
            <div className="win-content gameover-content">
              <h2>💀 Game Over</h2>
              <p>The monsters devoured the humans!</p>
              <button onClick={handleReset} className="btn btn-primary btn-gameover">Try Again</button>
            </div>
          </div>
        )}

        <Controls
          onReset={handleReset}
          onHint={() => setShowHints(p => !p)}
          onAutoSolve={autoSolving ? handleStopSolve : handleAutoSolve}
          onToggleLearn={() => setLearningMode(p => !p)}
          showHints={showHints}
          autoSolving={autoSolving}
          learningMode={learningMode}
          disabled={isAnimating || gameStatus !== 'playing'}
        />
      </div>

      {/* RIGHT: AI Panel */}
      <AIPanel
        messages={messages}
        learningMode={learningMode}
        moveLog={moveHistory}
        currentState={currentState}
        hintData={hintData}
        moveCount={moveCount}
        aiExplanation={aiExplanation}
      />
    </div>
  );
}
