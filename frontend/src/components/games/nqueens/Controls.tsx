/* ============================================
   Controls.tsx — Playback controls bar
   ============================================ */

import { memo } from 'react';
import type { GameMode } from './utils/nqueensHelpers';

interface ControlsProps {
  mode: GameMode;
  isPlaying: boolean;
  isPaused: boolean;
  isSolved: boolean;
  speed: number;
  hasSteps: boolean;
  stepsExhausted: boolean;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onHint: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

function ControlsComponent({
  mode,
  isPlaying,
  isPaused,
  isSolved,
  speed,
  hasSteps,
  stepsExhausted,
  onStart,
  onPause,
  onStep,
  onHint,
  onReset,
  onSpeedChange,
}: ControlsProps) {
  const isManual = mode === 'manual';
  const isDone = isSolved || stepsExhausted;

  // Start button label
  let startLabel = 'Start';
  let startIcon = '▶';
  if (isPlaying) {
    startLabel = 'Running';
    startIcon = '⏵';
  } else if (isPaused) {
    startLabel = 'Resume';
    startIcon = '▶';
  } else if (isDone) {
    startLabel = 'Done';
    startIcon = '✓';
  }

  return (
    <div className="nq-controls">
      <div className="nq-controls-left">
        {/* Start / Resume */}
        <button
          className="nq-ctrl-btn primary"
          onClick={onStart}
          disabled={isManual || isPlaying || isDone}
          title={isManual ? 'Switch to AI Solve or Learn mode' : 'Start solving'}
        >
          <span className="nq-ctrl-icon">{startIcon}</span>
          <span className="nq-ctrl-text">{startLabel}</span>
        </button>

        {/* Pause */}
        <button
          className="nq-ctrl-btn"
          onClick={onPause}
          disabled={isManual || !isPlaying}
          title="Pause"
        >
          <span className="nq-ctrl-icon">⏸</span>
          <span className="nq-ctrl-text">{isPaused ? 'Paused' : 'Pause'}</span>
        </button>

        {/* Step Forward */}
        <button
          className="nq-ctrl-btn"
          onClick={onStep}
          disabled={isManual || isPlaying || isDone}
          title="Step forward"
        >
          <span className="nq-ctrl-icon">⏭</span>
          <span className="nq-ctrl-text">Step</span>
        </button>

        {/* Hint */}
        <button
          className="nq-ctrl-btn hint"
          onClick={onHint}
          disabled={!isManual || isPlaying || isSolved}
          title="Get a hint"
        >
          <span className="nq-ctrl-icon">💡</span>
          <span className="nq-ctrl-text">Hint</span>
        </button>

        {/* Reset */}
        <button
          className="nq-ctrl-btn danger"
          onClick={onReset}
          title="Reset board"
        >
          <span className="nq-ctrl-icon">↺</span>
          <span className="nq-ctrl-text">Reset</span>
        </button>
      </div>

      <div className="nq-controls-right">
        <div className="nq-speed-control">
          <label htmlFor="nq-speed">Speed</label>
          <input
            id="nq-speed"
            type="range"
            min={1}
            max={10}
            value={speed}
            step={1}
            onChange={e => onSpeedChange(parseInt(e.target.value))}
          />
          <span className="nq-speed-value">{speed}x</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ControlsComponent);
