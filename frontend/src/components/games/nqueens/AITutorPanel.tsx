/* ============================================
   AITutorPanel.tsx — Right panel (30%)
   ============================================ */

import { useRef, useEffect, memo } from 'react';
import {
  type TutorMessage,
  type AlgoState,
  type CodeLineHighlight,
  CODE_LINES,
  type GameMode,
} from './utils/nqueensHelpers';

interface AITutorPanelProps {
  mode: GameMode;
  isPlaying: boolean;
  isSolved: boolean;
  messages: TutorMessage[];
  algoState: AlgoState;
  codeHighlights: CodeLineHighlight[];
  currentFact: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function AITutorPanelComponent({
  mode,
  isPlaying,
  isSolved,
  messages,
  algoState,
  codeHighlights,
  currentFact,
}: AITutorPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const codeBlockRef = useRef<HTMLPreElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Auto-scroll code to active line
  useEffect(() => {
    const activeIdx = codeHighlights.findIndex(h => h !== null);
    if (activeIdx >= 0 && codeBlockRef.current) {
      const activeLine = codeBlockRef.current.querySelector(`[data-line="${activeIdx}"]`);
      if (activeLine) {
        activeLine.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [codeHighlights]);

  // Status text
  let statusText = 'Ready to help';
  if (isPlaying) statusText = 'Solving...';
  else if (isSolved) statusText = '🎉 Solution found!';
  else if (mode === 'learn') statusText = 'Teaching mode';

  return (
    <aside className="nq-tutor-panel">
      {/* ─── TUTOR HEADER ─── */}
      <div className="nq-tutor-header">
        <div className="nq-ai-avatar">
          <span className="nq-avatar-emoji">🧠</span>
          <span className="nq-avatar-pulse" />
        </div>
        <div className="nq-tutor-title">
          <h2>AI Tutor</h2>
          <span className="nq-tutor-status">{statusText}</span>
        </div>
      </div>

      {/* ─── HOW TO PLAY ─── */}
      <div className="nq-glass-card nq-howtoplay">
        <div className="nq-howtoplay-header">
          <span className="nq-howtoplay-icon">📋</span>
          <span>How to Play</span>
        </div>
        <ul className="nq-howtoplay-list">
          <li>Place one queen per row</li>
          <li>No two queens can be in the same column</li>
          <li>No two queens can be on the same diagonal</li>
          <li>Goal: Place N queens safely on the board</li>
        </ul>
      </div>

      {/* ─── MESSAGES ─── */}
      <div className="nq-messages-container">
        <div className="nq-tutor-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`nq-tutor-msg ${msg.type}`}
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── DID YOU KNOW ─── */}
      <div className="nq-glass-card nq-fact-card">
        <div className="nq-fact-header">
          <span className="nq-fact-icon">💡</span>
          <span>Did You Know?</span>
        </div>
        <p className="nq-fact-text">{currentFact}</p>
      </div>

      {/* ─── LIVE CODE ─── */}
      <div className="nq-glass-card nq-code-snapshot">
        <div className="nq-code-header">
          <span className="nq-code-icon">💻</span>
          <span>Live Code</span>
        </div>
        <pre className="nq-code-block" ref={codeBlockRef}>
          <code>
            {CODE_LINES.map((line, idx) => {
              const highlight = codeHighlights[idx];
              const cls = highlight ? `nq-code-line ${highlight}` : 'nq-code-line';
              return (
                <span key={idx} className={cls} data-line={idx}>
                  {escapeHtml(line)}
                  {'\n'}
                </span>
              );
            })}
          </code>
        </pre>
      </div>
    </aside>
  );
}

export default memo(AITutorPanelComponent);
