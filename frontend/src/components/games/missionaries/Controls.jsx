export default function Controls({ onReset, onHint, onAutoSolve, onToggleLearn, showHints, autoSolving, disabled, learningMode }) {
  return (
    <div className="mc-floating-controls">
      <button
        className={`btn btn-learn ${learningMode ? 'active' : ''}`}
        onClick={onToggleLearn}
      >
        <span className="btn-icon">{learningMode ? '📚' : '🎮'}</span>
        <span>{learningMode ? 'Learn' : 'Play'}</span>
      </button>

      <button
        className={`btn btn-hint ${showHints ? 'active' : ''}`}
        onClick={onHint}
        disabled={disabled}
      >
        <span className="btn-icon">💡</span>
        <span>{showHints ? 'Hide Hints' : 'Hint'}</span>
      </button>

      <button
        className={`btn btn-auto ${autoSolving ? 'active' : ''}`}
        onClick={onAutoSolve}
        disabled={disabled && !autoSolving}
      >
        <span className="btn-icon">{autoSolving ? '⏹️' : '🤖'}</span>
        <span>{autoSolving ? 'Stop' : 'Auto Solve'}</span>
      </button>

      <button
        className="btn btn-reset"
        onClick={onReset}
      >
        <span className="btn-icon">🔄</span>
        <span>Restart</span>
      </button>
    </div>
  );
}
