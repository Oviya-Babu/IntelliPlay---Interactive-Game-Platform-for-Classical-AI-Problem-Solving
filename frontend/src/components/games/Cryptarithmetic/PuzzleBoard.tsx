import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PuzzleConfig, SolverStep } from './types';

interface PuzzleBoardProps {
  puzzle: PuzzleConfig;
  assignment: Record<string, number>;
  currentStep: SolverStep | null;
  isSolved: boolean;
  isManualMode: boolean;
  isRaceMode?: boolean;
  disabled?: boolean;
  onAssign?: (letter: string, digit: number) => void;
  onUnassign?: (letter: string) => void;
}

export default function PuzzleBoard({
  puzzle,
  assignment,
  currentStep,
  isSolved,
  isManualMode,
  isRaceMode,
  disabled,
  onAssign,
  onUnassign,
}: PuzzleBoardProps) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [flashError, setFlashError] = useState<string | null>(null);

  const { word1, word2, result } = puzzle;
  const maxLen = Math.max(word1.length, word2.length, result.length);

  const allLetters = [...new Set((word1 + word2 + result).split(''))].sort();
  const leadingLetters = new Set([word1[0], word2[0], result[0]]);
  const assignedDigits = new Set(Object.values(assignment));

  const handleLetterClick = useCallback((letter: string) => {
    if (disabled || isSolved) return;
    if (!isManualMode && !isRaceMode) return;
    setSelectedLetter(prev => prev === letter ? null : letter);
  }, [disabled, isSolved, isManualMode, isRaceMode]);

  const handleDigitClick = useCallback((digit: number) => {
    if (!selectedLetter || disabled || isSolved) return;
    if (assignedDigits.has(digit) && assignment[selectedLetter] !== digit) {
      setFlashError(selectedLetter);
      setTimeout(() => setFlashError(null), 500);
      return;
    }
    if (leadingLetters.has(selectedLetter) && digit === 0) {
      setFlashError(selectedLetter);
      setTimeout(() => setFlashError(null), 500);
      return;
    }
    onAssign?.(selectedLetter, digit);
    setSelectedLetter(null);
  }, [selectedLetter, disabled, isSolved, assignedDigits, assignment, leadingLetters, onAssign]);

  const wordToNum = (word: string) => {
    const digits = word.split('').map(ch => assignment[ch]);
    if (digits.some(d => d === undefined)) return null;
    return parseInt(digits.join(''), 10);
  };

  const num1 = wordToNum(word1);
  const num2 = wordToNum(word2);
  const numR = wordToNum(result);
  const sumCorrect = num1 !== null && num2 !== null && numR !== null && num1 + num2 === numR;

  const renderLetterBox = (letter: string, idx: number, isResult: boolean) => {
    const digit = assignment[letter];
    const isSelected = selectedLetter === letter;
    const isError = flashError === letter;
    const isHighlighted = currentStep?.letter === letter;
    const isAssigned = digit !== undefined;
    const stepType = isHighlighted ? currentStep?.type : null;

    return (
      <motion.div
        key={`${letter}-${idx}`}
        whileHover={(!disabled && (isManualMode || isRaceMode)) ? { scale: 1.08 } : {}}
        whileTap={(!disabled && (isManualMode || isRaceMode)) ? { scale: 0.95 } : {}}
        onClick={() => handleLetterClick(letter)}
        style={{
          width: 56,
          height: 72,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: (isManualMode || isRaceMode) && !disabled ? 'pointer' : 'default',
          position: 'relative',
          transition: 'all 0.2s',
          border: isError ? '2px solid #f43f5e'
            : isSelected ? '2px solid #818cf8'
            : isHighlighted && stepType === 'assign' ? '2px solid #06b6d4'
            : isHighlighted && stepType === 'backtrack' ? '2px solid #f43f5e'
            : isHighlighted && stepType === 'prune' ? '2px solid #f59e0b'
            : isSolved ? '2px solid #10b981'
            : '1px solid var(--border-default, #2a2a35)',
          background: isError ? 'rgba(244,63,94,0.15)'
            : isSelected ? 'rgba(129,140,248,0.15)'
            : isHighlighted && stepType === 'backtrack' ? 'rgba(244,63,94,0.1)'
            : isHighlighted && stepType === 'prune' ? 'rgba(245,158,11,0.1)'
            : isHighlighted && stepType === 'assign' ? 'rgba(6,182,212,0.1)'
            : isSolved ? 'rgba(16,185,129,0.08)'
            : 'var(--bg-surface, #151521)',
          boxShadow: isSelected ? '0 0 12px rgba(129,140,248,0.3)'
            : isHighlighted ? '0 0 12px rgba(6,182,212,0.2)'
            : 'none',
          userSelect: 'none',
        }}
      >
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: isResult ? '#06b6d4' : 'var(--text-muted, #71717a)',
          lineHeight: 1,
        }}>
          {letter}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={digit ?? 'empty'}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            style={{
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1,
              marginTop: 2,
              fontFamily: 'monospace',
              color: isSolved ? '#10b981'
                : isAssigned ? '#818cf8'
                : 'var(--text-primary, #f1f0fe)',
            }}
          >
            {isAssigned ? digit : '?'}
          </motion.span>
        </AnimatePresence>
        {isManualMode && isAssigned && !isSolved && (
          <button
            onClick={(e) => { e.stopPropagation(); onUnassign?.(letter); }}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#f43f5e',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </motion.div>
    );
  };

  const renderWord = (word: string, isResult: boolean) => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
      {/* padding to right-align */}
      {Array.from({ length: maxLen - word.length }).map((_, i) => (
        <div key={`pad-${i}`} style={{ width: 56 }} />
      ))}
      {word.split('').map((letter, i) => renderLetterBox(letter, i, isResult))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Puzzle equation display */}
      <div style={{
        fontFamily: 'monospace',
        background: 'var(--bg-surface, #151521)',
        border: '1px solid var(--border-default, #2a2a35)',
        borderRadius: 16,
        padding: '28px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
      }}>
        {/* Word 1 */}
        {renderWord(word1, false)}

        {/* + Word 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#818cf8',
            width: 36,
            textAlign: 'center',
          }}>+</span>
          <div style={{ flex: 1 }}>
            {renderWord(word2, false)}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '3px solid var(--border-default, #2a2a35)',
          margin: '4px 0',
        }} />

        {/* Result */}
        {renderWord(result, true)}

        {/* Numeric preview */}
        {num1 !== null && num2 !== null && numR !== null && (
          <div style={{
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            color: sumCorrect ? '#10b981' : '#f43f5e',
            marginTop: 8,
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
          }}>
            {num1} + {num2} = {numR}
            {sumCorrect ? ' ✓' : ' ✗'}
          </div>
        )}
      </div>

      {/* Constraint badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[...leadingLetters].map(l => {
          const ok = assignment[l] === undefined || assignment[l] !== 0;
          return (
            <span key={`lead-${l}`} style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 6,
              background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              color: ok ? '#10b981' : '#f43f5e',
              border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              fontWeight: 600,
            }}>
              {l} ≠ 0 {ok ? '✓' : '✗'}
            </span>
          );
        })}
        <span style={{
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 6,
          background: assignedDigits.size === Object.keys(assignment).length
            ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
          color: assignedDigits.size === Object.keys(assignment).length ? '#10b981' : '#f43f5e',
          border: `1px solid ${assignedDigits.size === Object.keys(assignment).length
            ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
          fontWeight: 600,
        }}>
          All unique {assignedDigits.size === Object.keys(assignment).length ? '✓' : '✗'}
        </span>
      </div>

      {/* Digit palette (manual/race modes only) */}
      {(isManualMode || isRaceMode) && !isSolved && !disabled && (
        <div>
          <p style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-secondary, #a1a1aa)',
            marginBottom: 6,
          }}>
            {selectedLetter
              ? `Assign digit to "${selectedLetter}":`
              : 'Select a letter above, then pick a digit'}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
              const isUsed = assignedDigits.has(d) && assignment[selectedLetter ?? ''] !== d;
              return (
                <motion.button
                  key={d}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDigitClick(d)}
                  disabled={!selectedLetter || isUsed}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    border: '1px solid var(--border-default, #2a2a35)',
                    background: !selectedLetter ? 'var(--bg-surface, #151521)'
                      : isUsed ? 'var(--bg-surface-3, #111118)'
                      : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: isUsed ? '#555' : '#fff',
                    cursor: selectedLetter && !isUsed ? 'pointer' : 'not-allowed',
                    opacity: selectedLetter && !isUsed ? 1 : 0.35,
                    transition: 'all 0.15s',
                    textDecoration: isUsed ? 'line-through' : 'none',
                  }}
                >
                  {d}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Solved banner */}
      <AnimatePresence>
        {isSolved && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              padding: '16px 24px',
              borderRadius: 14,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 18,
              boxShadow: '0 0 30px rgba(16,185,129,0.3)',
            }}
          >
            🎉 Solved! {num1} + {num2} = {numR}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
