import { useRef, useEffect } from 'react';
import ComplexityInsights from '@/components/learn/ComplexityInsights';
import { getBfsStats } from './logic/bfsSolver';

/* ═══════════════════════════════════════════════════════════
   AI Tutor Panel — Missionaries & Cannibals
   Clean vertical card layout — fully readable, fully scrollable
   ═══════════════════════════════════════════════════════════ */

export default function AIPanel({ messages, learningMode, moveLog, currentState, hintData, moveCount, aiExplanation }) {
  const logRef = useRef(null);
  const explanationRef = useRef(null);

  // BFS stats for teaching section
  const bfsStats = getBfsStats();

  // Auto-scroll move log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [moveLog]);

  // Auto-scroll explanation to top on new content
  useEffect(() => {
    if (explanationRef.current) {
      explanationRef.current.scrollTop = 0;
    }
  }, [aiExplanation]);

  // Render structured AI explanation sections
  const renderExplanation = () => {
    if (aiExplanation && aiExplanation.sections) {
      return (
        <div className="mc-explanation-structured">
          {aiExplanation.sections.map((section, i) => {
            const titleLower = section.title.toLowerCase();
            const labelClass = titleLower.includes('state') || titleLower.includes('evaluat') ? 'thinking' :
              titleLower.includes('analysis') || titleLower.includes('valid') || titleLower.includes('moves') ? 'analysis' :
              titleLower.includes('bfs') || titleLower.includes('reason') ? 'logic' :
              titleLower.includes('recommend') || titleLower.includes('decision') || titleLower.includes('safety') || titleLower.includes('check') ? 'result' :
              titleLower.includes('solved') || titleLower.includes('result') ? 'success' :
              titleLower.includes('dead') || titleLower.includes('error') ? 'error' :
              'result';

            return (
              <div key={i} className="mc-explanation-block">
                <div className={`mc-explanation-label ${labelClass}`}>{section.title}</div>
                <div className="mc-explanation-content">
                  {section.content.split('\n').map((line, j) => (
                    <div key={j} className="mc-explanation-line">{line}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback: render latest message
    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      return (
        <div className={`mc-suggestion mc-${latestMessage.type}`}>
          {latestMessage.text.split('\n').map((line, i) => (
            <div key={i} className="mc-explanation-line">{line}</div>
          ))}
        </div>
      );
    }

    return (
      <div className="mc-suggestion mc-info">
        <div className="mc-explanation-line">🧠 Welcome! Click characters to board the boat, then press GO.</div>
        <div className="mc-explanation-line">I'll analyze each move using BFS and explain my reasoning.</div>
      </div>
    );
  };

  // Render hint banner
  const renderHintBanner = () => {
    if (!hintData || !hintData.hintText) return null;
    return (
      <div className="mc-hint-banner">
        <div className="mc-hint-title">💡 BFS Hint</div>
        <div className="mc-hint-move">{hintData.hintText}</div>
        {hintData.safetyText && <div className="mc-hint-safety">{hintData.safetyText}</div>}
        {hintData.pathNote && <div className="mc-hint-path-note">{hintData.pathNote}</div>}
        {hintData.remaining > 0 && (
          <div className="mc-hint-remaining">{hintData.remaining} move{hintData.remaining !== 1 ? 's' : ''} to goal</div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-panel">
      {/* ── Sticky Header ── */}
      <div className="mc-tutor-header">
        <div className="mc-tutor-header-row">
          <div className="mc-tutor-avatar">🧠</div>
          <div>
            <h2 className="mc-tutor-name">BFS Tutor</h2>
            <p className="mc-tutor-subtitle">Breadth-First Search AI</p>
          </div>
        </div>
        <div className="mc-tutor-mode-badge">
          {learningMode ? '📚 Learn Mode' : '🎮 Play Mode'}
        </div>
      </div>

      {/* ── Scrollable Content — ENTIRE PANEL SCROLLS ── */}
      <div className="mc-tutor-scroll">

        {/* ═══════════════════════════════════════
            SECTION 1: 📘 HOW TO PLAY — ALWAYS OPEN, BIG
            ═══════════════════════════════════════ */}
        <div className="mc-section-card mc-howtoplay-card">
          <div className="mc-section-header">
            <span className="mc-section-header-icon">📘</span>
            How to Play
          </div>
          <div className="mc-how-content">
            <div className="mc-how-rule">
              <span className="mc-how-rule-icon">🚣</span>
              <div>
                <strong>Boat Capacity</strong>
                <p>The boat carries a maximum of 2 characters per trip.</p>
              </div>
            </div>
            <div className="mc-how-rule">
              <span className="mc-how-rule-icon">⚠️</span>
              <div>
                <strong>Safety Constraint</strong>
                <p>Humans must never be outnumbered by monsters on either bank. If they are, the monsters attack!</p>
              </div>
            </div>
            <div className="mc-how-rule">
              <span className="mc-how-rule-icon">🎯</span>
              <div>
                <strong>Goal</strong>
                <p>Move all 3 humans and 3 monsters safely from the left bank to the right bank.</p>
              </div>
            </div>
            <div className="mc-how-rule">
              <span className="mc-how-rule-icon">🏆</span>
              <div>
                <strong>Optimal Solution</strong>
                <p>The shortest solution requires exactly 11 moves. Can you match it?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hint Banner */}
        {renderHintBanner()}

        {/* ═══════════════════════════════════════
            SECTION 2: 🧠 AI REASONING — HERO (LARGEST)
            ═══════════════════════════════════════ */}
        <div className="mc-section-card mc-hero-card">
          <div className="mc-section-header mc-hero-header">
            <span className="mc-section-header-icon">🧠</span>
            AI Reasoning
            <span className="mc-section-badge mc-badge-primary">Primary</span>
          </div>
          <div className="mc-explanation-body" ref={explanationRef}>
            {renderExplanation()}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SECTION 3: 📊 COMPLEXITY INSIGHTS
            ═══════════════════════════════════════ */}
        <div className="mc-section-card">
          <div className="mc-section-header">
            <span className="mc-section-header-icon">📊</span>
            Complexity Insights
          </div>
          <div className="mc-complexity-body">
            <ComplexityInsights gameId="missionaries" variant="inline-styled" />
            <div className="mc-complexity-summary">
              <div className="mc-complexity-row">
                <span className="mc-complexity-label">Time Complexity</span>
                <span className="mc-complexity-value">O(b<sup>d</sup>)</span>
              </div>
              <div className="mc-complexity-row">
                <span className="mc-complexity-label">Space Complexity</span>
                <span className="mc-complexity-value">O(b<sup>d</sup>)</span>
              </div>
              <p className="mc-complexity-explain">
                BFS explores all states level-by-level, guaranteeing the shortest path but using memory proportional to the branching factor raised to the depth.
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SECTION 4: 🧩 HOW BFS WORKS
            ═══════════════════════════════════════ */}
        <div className="mc-section-card">
          <div className="mc-section-header">
            <span className="mc-section-header-icon">🧩</span>
            How BFS Works
          </div>
          <div className="mc-bfs-content">
            <div className="mc-bfs-step">
              <span className="mc-bfs-step-num">1</span>
              <div>
                <strong>Start at Initial State</strong>
                <p>Begin with all characters on the left bank. This is the root of our search tree.</p>
              </div>
            </div>
            <div className="mc-bfs-step">
              <span className="mc-bfs-step-num">2</span>
              <div>
                <strong>Explore All Possible Moves</strong>
                <p>BFS generates every valid boat configuration from the current state — then evaluates each one for safety.</p>
              </div>
            </div>
            <div className="mc-bfs-step">
              <span className="mc-bfs-step-num">3</span>
              <div>
                <strong>Expand Level by Level</strong>
                <p>All states at depth 1 are explored before depth 2, then depth 3. This "breadth-first" approach ensures completeness.</p>
              </div>
            </div>
            <div className="mc-bfs-step">
              <span className="mc-bfs-step-num">4</span>
              <div>
                <strong>Stop at First Solution</strong>
                <p>Because BFS explores level-by-level, the first solution found is always the shortest possible path — guaranteed optimal.</p>
              </div>
            </div>

            {/* Live BFS Stats */}
            <div className="mc-bfs-stats">
              <div className="mc-bfs-stat">
                <span className="mc-bfs-stat-label">States Explored</span>
                <span className="mc-bfs-stat-value">{bfsStats.totalStatesVisited}</span>
              </div>
              <div className="mc-bfs-stat">
                <span className="mc-bfs-stat-label">Solution Depth</span>
                <span className="mc-bfs-stat-value">{bfsStats.depthLevel}</span>
              </div>
              <div className="mc-bfs-stat">
                <span className="mc-bfs-stat-label">Current Move</span>
                <span className="mc-bfs-stat-value">{moveCount || 0}</span>
              </div>
              <div className="mc-bfs-stat">
                <span className="mc-bfs-stat-label">Optimal Moves</span>
                <span className="mc-bfs-stat-value">11</span>
              </div>
            </div>

            <div className="mc-bfs-note">
              BFS solved this puzzle by exploring {bfsStats.totalStatesVisited} unique states across {bfsStats.depthLevel} depth levels — finding the optimal 11-move solution instantly.
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SECTION 5: 📋 MOVE HISTORY
            ═══════════════════════════════════════ */}
        {moveLog && moveLog.length > 0 && (
          <div className="mc-section-card">
            <div className="mc-section-header">
              <span className="mc-section-header-icon">📋</span>
              Move History
              <span className="mc-section-badge">{moveLog.length} moves</span>
            </div>
            <div className="mc-move-log" ref={logRef}>
              {moveLog.map((entry, i) => (
                <div key={i} className="mc-log-entry">
                  <span className="mc-log-num">#{i + 1}</span>
                  <span className="mc-log-text">{entry.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
