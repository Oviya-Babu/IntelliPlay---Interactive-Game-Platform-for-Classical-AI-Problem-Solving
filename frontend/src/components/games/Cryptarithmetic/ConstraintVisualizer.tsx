import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PuzzleConfig } from './types';

interface ConstraintVisualizerProps {
  puzzle: PuzzleConfig;
  assignment: Record<string, number>;
  domains: Record<string, number[]>;
  selectedLetter?: string | null;
  onSelectLetter?: (letter: string) => void;
}

export default function ConstraintVisualizer({
  puzzle,
  assignment,
  domains,
  selectedLetter,
  onSelectLetter,
}: ConstraintVisualizerProps) {
  const { word1, word2, result } = puzzle;
  const allLetters = useMemo(() => [...new Set((word1 + word2 + result).split(''))].sort(), [word1, word2, result]);
  const leadingLetters = useMemo(() => new Set([word1[0], word2[0], result[0]]), [word1, word2, result]);

  // Build constraint edges: two letters are connected if they appear in the same column
  const edges = useMemo(() => {
    const edgeSet = new Set<string>();
    const maxLen = Math.max(word1.length, word2.length, result.length);

    for (let col = 0; col < maxLen; col++) {
      const lettersInCol: string[] = [];
      const i1 = word1.length - 1 - col;
      const i2 = word2.length - 1 - col;
      const iR = result.length - 1 - col;
      if (i1 >= 0) lettersInCol.push(word1[i1]);
      if (i2 >= 0) lettersInCol.push(word2[i2]);
      if (iR >= 0) lettersInCol.push(result[iR]);

      // Connect all pairs in column
      for (let a = 0; a < lettersInCol.length; a++) {
        for (let b = a + 1; b < lettersInCol.length; b++) {
          if (lettersInCol[a] !== lettersInCol[b]) {
            const key = [lettersInCol[a], lettersInCol[b]].sort().join('-');
            edgeSet.add(key);
          }
        }
      }
    }

    // Also add all-different constraint edges
    for (let a = 0; a < allLetters.length; a++) {
      for (let b = a + 1; b < allLetters.length; b++) {
        const key = [allLetters[a], allLetters[b]].sort().join('-');
        edgeSet.add(key);
      }
    }

    return [...edgeSet].map(e => e.split('-') as [string, string]);
  }, [word1, word2, result, allLetters]);

  // Circular layout
  const cx = 180;
  const cy = 160;
  const radius = 110;
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    allLetters.forEach((letter, i) => {
      const angle = (2 * Math.PI * i) / allLetters.length - Math.PI / 2;
      pos[letter] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    return pos;
  }, [allLetters]);

  const isConnected = (letter: string) => {
    if (!selectedLetter) return false;
    return edges.some(([a, b]) =>
      (a === letter && b === selectedLetter) || (b === letter && a === selectedLetter)
    );
  };

  return (
    <div style={{
      background: 'var(--bg-surface, #151521)',
      borderRadius: 14,
      border: '1px solid var(--border-default, #2a2a35)',
      padding: 16,
    }}>
      {/* Title */}
      <div style={{
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: 'var(--text-muted, #71717a)',
        marginBottom: 12,
        textAlign: 'center',
      }}>
        Constraint Network
      </div>

      <svg width={360} height={320} viewBox="0 0 360 320" style={{ display: 'block', margin: '0 auto' }}>
        {/* Edges */}
        {edges.map(([a, b], i) => {
          const pa = positions[a];
          const pb = positions[b];
          if (!pa || !pb) return null;
          const isActive = selectedLetter && (a === selectedLetter || b === selectedLetter);

          return (
            <motion.line
              key={`edge-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 0.5 : 0.08 }}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={isActive ? '#818cf8' : '#555'}
              strokeWidth={isActive ? 1.5 : 0.5}
            />
          );
        })}

        {/* Nodes */}
        {allLetters.map((letter, i) => {
          const pos = positions[letter];
          const isAssigned = assignment[letter] !== undefined;
          const isLeading = leadingLetters.has(letter);
          const isSelected = selectedLetter === letter;
          const connected = isConnected(letter);
          const dom = domains[letter] || [];

          return (
            <motion.g
              key={letter}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectLetter?.(letter)}
            >
              {/* Glow for selected */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={26}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth={2}
                  opacity={0.4}
                >
                  <animate attributeName="r" values="24;28;24" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill={isAssigned ? '#1e1b4b' : connected ? '#1a1a28' : '#111118'}
                stroke={isAssigned ? '#10b981'
                  : isSelected ? '#818cf8'
                  : connected ? '#818cf880'
                  : isLeading ? '#f59e0b60' : '#2a2a35'}
                strokeWidth={isSelected || connected ? 2 : 1}
              />

              {/* Letter */}
              <text
                x={pos.x}
                y={isAssigned ? pos.y - 2 : pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isAssigned ? '#10b981' : isLeading ? '#f59e0b' : '#fff'}
                fontSize={isAssigned ? 10 : 14}
                fontWeight={700}
              >
                {letter}
              </text>

              {/* Digit (if assigned) */}
              {isAssigned && (
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  textAnchor="middle"
                  fill="#818cf8"
                  fontSize={14}
                  fontWeight={800}
                  fontFamily="monospace"
                >
                  {assignment[letter]}
                </text>
              )}

              {/* Domain count */}
              <text
                x={pos.x}
                y={pos.y + 34}
                textAnchor="middle"
                fill="#71717a"
                fontSize={9}
                fontWeight={600}
              >
                {isAssigned ? '✓' : `{${dom.length}}`}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Domain detail for selected letter */}
      {selectedLetter && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'var(--bg-surface-2, #1a1a28)',
            borderRadius: 8,
            border: '1px solid var(--border-default, #2a2a35)',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8' }}>
            {selectedLetter}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #a1a1aa)', margin: '0 8px' }}>
            domain:
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>
            {'{'}
            {(domains[selectedLetter] || []).map((d, i) => (
              <span key={d} style={{
                color: assignment[selectedLetter] === d ? '#10b981' : '#818cf8',
                fontWeight: assignment[selectedLetter] === d ? 800 : 600,
              }}>
                {i > 0 ? ', ' : ''}{d}
              </span>
            ))}
            {'}'}
          </span>
          {leadingLetters.has(selectedLetter) && (
            <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 8 }}>
              (leading: ≠0)
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
