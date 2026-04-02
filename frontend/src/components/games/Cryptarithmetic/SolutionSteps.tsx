import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { SolverStep } from './types';

interface SolutionStepsProps {
  steps: SolverStep[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  assign:     { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', label: 'ASSIGN' },
  prune:      { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'PRUNE' },
  backtrack:  { bg: 'rgba(244,63,94,0.12)',  text: '#f43f5e', label: 'BACK' },
  solution:   { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: 'SOLVED' },
  no_solution:{ bg: 'rgba(244,63,94,0.12)',  text: '#f43f5e', label: 'FAIL' },
  info:       { bg: 'rgba(113,113,122,0.12)', text: '#71717a', label: 'INFO' },
};

export default function SolutionSteps({ steps, currentStepIndex, onStepClick }: SolutionStepsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStepIndex]);

  if (steps.length === 0) {
    return (
      <div style={{
        padding: 24,
        textAlign: 'center',
        color: 'var(--text-muted, #71717a)',
        fontSize: 13,
      }}>
        No steps yet. Start solving to see the trace!
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-default, #2a2a35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--text-muted, #71717a)',
        }}>
          Solver Trace
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#f59e0b',
          fontFamily: 'monospace',
        }}>
          {steps.length} steps
        </span>
      </div>

      {/* Steps list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
        }}
      >
        {steps.map((step, i) => {
          const isCurrent = i === currentStepIndex;
          const style = TYPE_COLORS[step.type] || TYPE_COLORS.info;

          return (
            <motion.div
              key={step.step_id}
              ref={isCurrent ? activeRef : undefined}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              onClick={() => onStepClick?.(i)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '6px 8px',
                marginBottom: 4,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: isCurrent ? style.bg : 'transparent',
                border: isCurrent
                  ? `1px solid ${style.text}40`
                  : '1px solid transparent',
                boxShadow: isCurrent ? `0 0 8px ${style.text}20` : 'none',
              }}
            >
              {/* Step number */}
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--text-muted, #71717a)',
                minWidth: 24,
                textAlign: 'right',
                fontFamily: 'monospace',
                paddingTop: 2,
              }}>
                #{step.step_id}
              </span>

              {/* Type badge */}
              <span style={{
                fontSize: 8,
                fontWeight: 800,
                padding: '2px 5px',
                borderRadius: 4,
                background: style.bg,
                color: style.text,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minWidth: 38,
                textAlign: 'center',
                marginTop: 1,
              }}>
                {style.label}
              </span>

              {/* Step content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {step.letter && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: style.text,
                    marginRight: 4,
                    fontFamily: 'monospace',
                  }}>
                    {step.letter}={step.digit}
                  </span>
                )}
                <span style={{
                  fontSize: 10,
                  color: isCurrent ? 'var(--text-primary, #f1f0fe)' : 'var(--text-secondary, #a1a1aa)',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}>
                  {step.msg}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
