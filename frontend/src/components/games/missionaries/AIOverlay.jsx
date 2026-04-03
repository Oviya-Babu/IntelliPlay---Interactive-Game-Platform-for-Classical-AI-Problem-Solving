import { useState, useRef, useEffect } from 'react';

export default function AIPanel({ messages, learningMode, moveLog }) {
  const [showAlgo, setShowAlgo] = useState(false);
  const logRef = useRef(null);

  const latestMessage = messages[messages.length - 1];

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [moveLog]);

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <span className="ai-panel-icon">🧠</span>
        <span className="ai-panel-title">AI Tutor</span>
        <span className="ai-panel-badge">{learningMode ? '📚 Learn' : '🎮 Play'}</span>
      </div>

      {/* Current Suggestion */}
      {latestMessage && (
        <div className={`ai-suggestion ai-${latestMessage.type}`}>
          {latestMessage.text.split('\n').map((line, i) => (
            <div key={i} className="ai-line">{line}</div>
          ))}
        </div>
      )}

      {/* Move History */}
      {moveLog && moveLog.length > 0 && (
        <div className="ai-log" ref={logRef}>
          <div className="ai-log-title">📋 Move History</div>
          {moveLog.map((entry, i) => (
            <div key={i} className="ai-log-entry">
              <span className="ai-log-num">#{i + 1}</span>
              <span className="ai-log-text">{entry.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* BFS Algorithm Explainer */}
      <button className="ai-algo-btn" onClick={() => setShowAlgo(s => !s)}>
        {showAlgo ? '▲ Hide Algorithm' : '🧩 How does BFS work?'}
      </button>

      {showAlgo && (
        <div className="ai-algo">
          <div className="ai-algo-step">
            <strong>🔍 Explore:</strong> I check all possible moves from the current state, one level at a time.
          </div>
          <div className="ai-algo-step">
            <strong>🔄 No Repeats:</strong> I track every state I've seen. If I encounter it again, I skip it.
          </div>
          <div className="ai-algo-step">
            <strong>🎯 Shortest Path:</strong> Because I go level-by-level, the first solution I find is guaranteed optimal.
          </div>
          <div className="ai-algo-step">
            <strong>📦 Precomputed:</strong> I solved the entire puzzle once at startup. Now I just look up where you are on the path!
          </div>
          <div className="ai-algo-note">
            This puzzle has exactly 11 optimal moves. BFS found them all instantly.
          </div>
        </div>
      )}
    </div>
  );
}
