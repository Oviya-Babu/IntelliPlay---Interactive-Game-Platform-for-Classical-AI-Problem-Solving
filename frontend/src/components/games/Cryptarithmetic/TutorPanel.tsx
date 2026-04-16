import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BotMetrics, ChatMessage, SolverStep } from './types';
import { getLevelExplanation } from './utils';
import ComplexityInsights from '@/components/learn/ComplexityInsights';
import './TutorPanel.css';

interface TutorPanelProps {
  level: number;
  currentStep: SolverStep | null;
  steps: SolverStep[];
  currentStepIndex: number;
  metrics: BotMetrics | null;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onAutoPlay?: () => void;
  isAutoPlaying?: boolean;
  showStepControls?: boolean;
  chatMessages: ChatMessage[];
  onSendChat?: (msg: string) => void;
}

export default function TutorPanel({
  level,
  currentStep,
  steps,
  currentStepIndex,
  metrics,
  onNextStep,
  onPrevStep,
  onAutoPlay,
  isAutoPlaying,
  showStepControls = true,
  chatMessages,
  onSendChat,
}: TutorPanelProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const stepLogRef = useRef<HTMLDivElement>(null);

  const explanation = getLevelExplanation(level, currentStep);

  // Debug: log step count
  useEffect(() => {
    if (steps.length > 0) {
      console.log("CRYPT STEPS:", steps.length, "Current:", currentStepIndex);
    }
  }, [steps.length, currentStepIndex]);

  // Typewriter effect — only for intro messages (no currentStep)
  useEffect(() => {
    if (!explanation) return;
    if (currentStep) {
      // Skip typewriter when stepping through — show immediately
      setDisplayedText(explanation);
      setIsTyping(false);
      return;
    }
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(explanation.slice(0, i + 1));
      i++;
      if (i >= explanation.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [explanation, currentStep]);

  // Auto-scroll step log to current step
  useEffect(() => {
    if (stepLogRef.current && currentStepIndex >= 0) {
      const activeEl = stepLogRef.current.querySelector('.cx-log-active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStepIndex]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages.length]);

  const skipTypewriter = () => {
    if (isTyping) {
      setDisplayedText(explanation);
      setIsTyping(false);
    }
  };

  const handleChatSend = useCallback(() => {
    if (!chatInput.trim()) return;
    onSendChat?.(chatInput.trim());
    setChatInput('');
  }, [chatInput, onSendChat]);

  // Step type styling
  const getStepStyle = (type: string) => {
    switch (type) {
      case 'assign': return { color: '#818cf8', bg: 'rgba(129,140,248,0.08)', icon: '📝', label: 'ASSIGN' };
      case 'prune': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '✂️', label: 'PRUNED' };
      case 'backtrack': return { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', icon: '↩️', label: 'BACKTRACK' };
      case 'solution': return { color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: '🎉', label: 'SOLUTION' };
      case 'no_solution': return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: '❌', label: 'NO SOLUTION' };
      default: return { color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)', icon: 'ℹ️', label: 'INFO' };
    }
  };

  const hasSteps = steps.length > 0;
  const totalSteps = steps.length;

  return (
    <div className="cx-tutor-panel">
      {/* ── Sticky Header ── */}
      <div className="cx-tutor-header">
        <div className="cx-tutor-header-row">
          <div className="cx-tutor-avatar">🧩</div>
          <div>
            <h3 className="cx-tutor-name">CipherX</h3>
            <p className="cx-tutor-subtitle">CSP Solver Bot · Level {level}</p>
          </div>
          {hasSteps && (
            <div className="cx-step-counter">
              {currentStepIndex >= 0
                ? `Step ${currentStepIndex + 1} / ${totalSteps}`
                : `${totalSteps} steps ready`}
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="cx-tutor-scroll">

        {/* ═══════════════════════════════════════
            SECTION 1: 🧠 AI REASONING — HERO
            ═══════════════════════════════════════ */}
        <div className="cx-section-card cx-hero-card">
          <div className="cx-section-header cx-hero-header">
            <span className="cx-section-icon">🧠</span>
            AI Reasoning
            <span className="cx-badge-primary">Primary</span>
          </div>
          <div className="cx-explanation-body" ref={scrollRef} onClick={skipTypewriter}>
            {/* Explanation text */}
            <div className="cx-explanation-bubble">
              <p className="cx-explanation-text">
                {displayedText}
                {isTyping && <span className="cx-cursor" />}
              </p>
            </div>

            {/* ── STRUCTURED STEP DETAILS ── */}
            {currentStep && (
              <div className="cx-step-details">
                {/* Step type badge */}
                {(() => {
                  const style = getStepStyle(currentStep.type);
                  return (
                    <div className="cx-step-badge" style={{
                      background: style.bg,
                      color: style.color,
                      borderColor: `${style.color}40`,
                    }}>
                      {style.icon} {style.label} — Step {currentStep.step_id}
                    </div>
                  );
                })()}

                {/* Assignment attempt */}
                {currentStep.type === 'assign' && (
                  <div className="cx-step-block">
                    <div className="cx-step-block-label">Current Assignment</div>
                    <div className="cx-step-block-content">
                      Trying <strong>{currentStep.letter} = {currentStep.digit}</strong>
                    </div>
                  </div>
                )}

                {/* Constraint check */}
                {currentStep.type === 'assign' && (
                  <div className="cx-step-block">
                    <div className="cx-step-block-label">Constraint Check</div>
                    <div className="cx-step-block-content cx-step-valid">
                      ✓ Valid — no digit conflict, partial sum = {currentStep.partial_sum}
                    </div>
                  </div>
                )}

                {/* Pruning detail */}
                {currentStep.type === 'prune' && (
                  <div className="cx-step-block">
                    <div className="cx-step-block-label">Domain Pruning</div>
                    <div className="cx-step-block-content cx-step-pruned">
                      ✂️ {currentStep.msg}
                    </div>
                  </div>
                )}

                {/* Backtrack detail */}
                {currentStep.type === 'backtrack' && (
                  <div className="cx-step-block">
                    <div className="cx-step-block-label">Backtracking</div>
                    <div className="cx-step-block-content cx-step-backtrack">
                      ↩️ {currentStep.msg}
                    </div>
                  </div>
                )}

                {/* Solution */}
                {currentStep.type === 'solution' && (
                  <div className="cx-step-block cx-step-solution-block">
                    <div className="cx-step-block-label">Result</div>
                    <div className="cx-step-block-content cx-step-solution">
                      🎉 Solution found! All constraints satisfied.
                    </div>
                  </div>
                )}

                {/* No solution */}
                {currentStep.type === 'no_solution' && (
                  <div className="cx-step-block cx-step-solution-block" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
                    <div className="cx-step-block-label">Result</div>
                    <div className="cx-step-block-content" style={{ color: '#ef4444' }}>
                      ❌ {currentStep.msg}
                    </div>
                  </div>
                )}

                {/* Decision block */}
                <div className="cx-step-block">
                  <div className="cx-step-block-label">Decision</div>
                  <div className="cx-step-block-content">
                    {currentStep.type === 'assign' && 'Proceeding with this assignment'}
                    {currentStep.type === 'prune' && 'Eliminating — range cannot reach zero'}
                    {currentStep.type === 'backtrack' && 'Reverting to previous state, trying next value'}
                    {currentStep.type === 'solution' && 'Puzzle solved — all letters assigned uniquely'}
                    {currentStep.type === 'no_solution' && 'All possibilities exhausted — no solution exists'}
                    {currentStep.type === 'info' && currentStep.msg}
                  </div>
                </div>

                {/* Current assignments snapshot */}
                {currentStep.assignment && Object.keys(currentStep.assignment).length > 0 && (
                  <div className="cx-step-block">
                    <div className="cx-step-block-label">
                      Current Assignments ({Object.keys(currentStep.assignment).length} assigned)
                    </div>
                    <div className="cx-assignments-grid">
                      {Object.entries(currentStep.assignment).map(([letter, digit]) => (
                        <div key={letter} className="cx-assignment-chip">
                          <span className="cx-assignment-letter">{letter}</span>
                          <span className="cx-assignment-digit">{digit as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remaining domains */}
                {currentStep.domains && Object.keys(currentStep.domains).length > 0 && (
                  <div className="cx-step-block">
                    <div className="cx-step-block-label">Remaining Domains</div>
                    <div className="cx-domains-grid">
                      {Object.entries(currentStep.domains).map(([letter, vals]) => {
                        const domainVals = vals as number[];
                        if (domainVals.length === 1) return null; // Already assigned
                        return (
                          <div key={letter} className="cx-domain-chip">
                            <span className="cx-domain-letter">{letter}</span>
                            <span className="cx-domain-vals">{domainVals.join(', ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP LOG ── */}
            {hasSteps && (
              <div className="cx-step-log-wrap">
                <div className="cx-step-log-title">
                  📜 Step History ({totalSteps} steps)
                </div>
                <div className="cx-step-log" ref={stepLogRef}>
                  {steps.map((step, i) => {
                    const style = getStepStyle(step.type);
                    const isActive = i === currentStepIndex;
                    const isPast = i < currentStepIndex;
                    return (
                      <div
                        key={step.step_id}
                        className={`cx-log-entry ${isActive ? 'cx-log-active' : ''} ${isPast ? 'cx-log-past' : ''}`}
                      >
                        <span className="cx-log-icon" style={{ color: style.color }}>
                          {style.icon}
                        </span>
                        <span className="cx-log-text">
                          <span className="cx-log-id">#{step.step_id}</span>
                          {step.type === 'assign' && ` ${step.letter} = ${step.digit}`}
                          {step.type === 'prune' && ` Pruned ${step.letter}=${step.digit}`}
                          {step.type === 'backtrack' && ` Backtrack ${step.letter}=${step.digit}`}
                          {step.type === 'solution' && ' Solution ✓'}
                          {step.type === 'no_solution' && ' No solution'}
                          {step.type === 'info' && ' Info'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <div className="cx-chat-messages" ref={chatScrollRef}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`cx-chat-bubble ${msg.role === 'user' ? 'cx-chat-user' : 'cx-chat-bot'}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SECTION 2: 📊 COMPLEXITY INSIGHTS
            ═══════════════════════════════════════ */}
        <div className="cx-section-card">
          <div className="cx-section-header">
            <span className="cx-section-icon">📊</span>
            Complexity Insights
          </div>
          <div className="cx-complexity-body">
            <ComplexityInsights gameId="cryptarith" variant="inline-styled" />
            <div className="cx-complexity-summary">
              <div className="cx-complexity-row">
                <span className="cx-complexity-label">Time Complexity</span>
                <span className="cx-complexity-value">O(d<sup>n</sup>)</span>
              </div>
              <div className="cx-complexity-row">
                <span className="cx-complexity-label">Space Complexity</span>
                <span className="cx-complexity-value">O(n)</span>
              </div>
              <p className="cx-complexity-explain">
                CSP explores digit combinations with backtracking and constraint propagation, pruning invalid branches early to reduce the search space.
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SECTION 3: 📈 METRICS
            ═══════════════════════════════════════ */}
        <div className="cx-section-card">
          <div className="cx-section-header">
            <span className="cx-section-icon">📈</span>
            Solver Metrics
          </div>
          <div className="cx-metrics-grid">
            <div className="cx-metric-item">
              <span className="cx-metric-icon">🧠</span>
              <span className="cx-metric-label">Depth</span>
              <span className="cx-metric-value" style={{ color: '#818cf8' }}>{metrics?.depth ?? 0}</span>
            </div>
            <div className="cx-metric-item">
              <span className="cx-metric-icon">⚡</span>
              <span className="cx-metric-label">Backtracks</span>
              <span className="cx-metric-value" style={{ color: '#f43f5e' }}>{metrics?.backtracks ?? 0}</span>
            </div>
            <div className="cx-metric-item">
              <span className="cx-metric-icon">✂️</span>
              <span className="cx-metric-label">Pruned</span>
              <span className="cx-metric-value" style={{ color: '#f59e0b' }}>{metrics?.pruned ?? 0}</span>
            </div>
            <div className="cx-metric-item">
              <span className="cx-metric-icon">⏱</span>
              <span className="cx-metric-label">Time</span>
              <span className="cx-metric-value" style={{ color: '#10b981' }}>{(metrics?.timeMs ?? 0).toFixed(1)}ms</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SECTION 4: STEP CONTROLS
            ═══════════════════════════════════════ */}
        {showStepControls && (
          <div className="cx-section-card">
            <div className="cx-section-header">
              <span className="cx-section-icon">🎮</span>
              Step Controls
            </div>
            <div className="cx-controls-body">
              <button
                className="cx-ctrl-btn cx-ctrl-prev"
                onClick={onPrevStep}
                disabled={currentStepIndex <= 0}
              >
                ⏮ Prev
              </button>
              <button
                className="cx-ctrl-btn cx-ctrl-next"
                onClick={onNextStep}
                disabled={currentStepIndex >= steps.length - 1}
              >
                Next ⏭
              </button>
              <button
                className={`cx-ctrl-btn cx-ctrl-auto ${isAutoPlaying ? 'active' : ''}`}
                onClick={onAutoPlay}
              >
                {isAutoPlaying ? '⏹ Stop' : '▶ Auto'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Chat Input (sticky bottom) ── */}
      <div className="cx-chat-input-wrap">
        <div className="cx-chat-input-inner">
          <input
            type="text"
            placeholder="Ask: Why did you assign that?"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChatSend()}
            className="cx-chat-input"
          />
          <button onClick={handleChatSend} className="cx-chat-send">🚀</button>
        </div>
      </div>
    </div>
  );
}
