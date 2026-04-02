import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { BotMetrics, ChatMessage, SolverStep } from './types';
import { getLevelExplanation } from './utils';

interface TutorPanelProps {
  level: number;
  currentStep: SolverStep | null;
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

  const explanation = getLevelExplanation(level, currentStep);

  // Typewriter effect
  useEffect(() => {
    if (!explanation) return;
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
  }, [explanation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [displayedText]);

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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-surface, #151521)',
      borderLeft: '1px solid var(--border-default, #2a2a35)',
      overflow: 'hidden',
    }}>
      {/* Bot Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-default, #2a2a35)',
        background: 'var(--bg-surface-2, #1a1a28)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          boxShadow: '0 0 12px rgba(99,102,241,0.4)',
        }}>
          🧩
        </div>
        <div>
          <h3 style={{ fontWeight: 800, color: '#818cf8', fontSize: 15, margin: 0 }}>
            CipherX
          </h3>
          <p style={{
            fontSize: 10,
            color: 'var(--text-muted, #71717a)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            margin: 0,
          }}>
            CSP Solver Bot · Level {level}
          </p>
        </div>
      </div>

      {/* Explanation Bubble */}
      <div
        ref={scrollRef}
        style={{ flex: 1, padding: 16, overflowY: 'auto', minHeight: 0 }}
        onClick={skipTypewriter}
      >
        <div style={{
          position: 'relative',
          padding: 16,
          background: 'var(--bg-surface-2, #1a1a28)',
          borderRadius: 16,
          border: '1px solid var(--border-default, #2a2a35)',
          cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute',
            top: -8,
            left: 20,
            width: 16,
            height: 16,
            background: 'var(--bg-surface-2, #1a1a28)',
            borderLeft: '1px solid var(--border-default, #2a2a35)',
            borderTop: '1px solid var(--border-default, #2a2a35)',
            transform: 'rotate(45deg)',
          }} />
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: 'var(--text-primary, #f1f0fe)' }}>
            {displayedText}
            {isTyping && (
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 16,
                marginLeft: 4,
                background: '#818cf8',
                verticalAlign: 'middle',
                animation: 'pulse 0.8s ease-in-out infinite',
              }} />
            )}
          </p>

          {/* Current step details */}
          {!isTyping && currentStep && (
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border-default, #2a2a35)',
            }}>
              <p style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#818cf8',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                Step {currentStep.step_id}
              </p>
              <p style={{
                fontSize: 11,
                color: 'var(--text-secondary, #a1a1aa)',
                fontStyle: 'italic',
                margin: 0,
              }}>
                {currentStep.type === 'assign' && `Assigned ${currentStep.letter} = ${currentStep.digit}`}
                {currentStep.type === 'prune' && `Pruned ${currentStep.letter} = ${currentStep.digit}`}
                {currentStep.type === 'backtrack' && `Backtracked from ${currentStep.letter} = ${currentStep.digit}`}
                {currentStep.type === 'solution' && '🎉 Solution found!'}
              </p>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        {chatMessages.length > 0 && (
          <div ref={chatScrollRef} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  lineHeight: 1.5,
                  maxWidth: '90%',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                    : 'var(--bg-surface-2, #1a1a28)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary, #f1f0fe)',
                  border: msg.role === 'bot' ? '1px solid var(--border-default, #2a2a35)' : 'none',
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-surface-2, #1a1a28)',
        borderTop: '1px solid var(--border-default, #2a2a35)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        <MetricBadge label="DEPTH" value={metrics?.depth ?? 0} icon="🧠" color="#818cf8" />
        <MetricBadge label="BACKTRACKS" value={metrics?.backtracks ?? 0} icon="⚡" color="#f43f5e" />
        <MetricBadge label="PRUNED" value={metrics?.pruned ?? 0} icon="✂️" color="#f59e0b" />
        <MetricBadge label="TIME" value={`${(metrics?.timeMs ?? 0).toFixed(1)}ms`} icon="⏱" color="#10b981" />
      </div>

      {/* Step Controls */}
      {showStepControls && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-surface, #151521)',
          borderTop: '1px solid var(--border-default, #2a2a35)',
          display: 'flex',
          gap: 8,
        }}>
          <button
            onClick={onPrevStep}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'var(--bg-surface-2, #1a1a28)',
              border: '1px solid var(--border-default, #2a2a35)',
              borderRadius: 10,
              color: 'var(--text-primary, #f1f0fe)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            ⏮ Prev
          </button>
          <button
            onClick={onNextStep}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(99,102,241,0.3)',
              transition: 'all 0.15s',
            }}
          >
            Next ⏭
          </button>
          <button
            onClick={onAutoPlay}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: isAutoPlaying ? 'rgba(244,63,94,0.1)' : 'var(--bg-surface-2, #1a1a28)',
              border: isAutoPlaying ? '1px solid #f43f5e' : '1px solid var(--border-default, #2a2a35)',
              color: isAutoPlaying ? '#f43f5e' : 'var(--text-primary, #f1f0fe)',
            }}
          >
            {isAutoPlaying ? '⏹ Stop' : '▶ Auto'}
          </button>
        </div>
      )}

      {/* Chat Input */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-surface-2, #1a1a28)',
        borderTop: '1px solid var(--border-default, #2a2a35)',
      }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Ask: Why did you assign that?"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChatSend()}
            style={{
              width: '100%',
              padding: '8px 40px 8px 12px',
              background: 'var(--bg-surface, #151521)',
              border: '1px solid var(--border-default, #2a2a35)',
              borderRadius: 10,
              color: 'var(--text-primary, #f1f0fe)',
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleChatSend}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#818cf8',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            🚀
          </button>
        </div>
      </div>
    </div>
  );
}


function MetricBadge({ label, value, icon, color }: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div style={{
      padding: '6px 10px',
      background: 'var(--bg-surface, #151521)',
      borderRadius: 8,
      border: '1px solid var(--border-default, #2a2a35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted, #71717a)' }}>
        {icon} {label}
      </span>
      <span style={{
        fontSize: 12,
        fontWeight: 800,
        fontFamily: 'monospace',
        color,
      }}>
        {value}
      </span>
    </div>
  );
}
