/* ============================================
   Board.tsx — Chess board with queens & canvas
   ============================================ */

import { useRef, useEffect, useCallback, memo } from 'react';
import { QUEEN_SVG, getColLetter, type CellState, type ConflictPair } from './utils/nqueensHelpers';

interface BoardProps {
  n: number;
  board: number[];
  cellStates: Map<string, CellState[]>;
  conflictPairs: ConflictPair[];
  isSolved: boolean;
  isManual: boolean;
  hintCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
}

function BoardComponent({
  n,
  board,
  cellStates,
  conflictPairs,
  isSolved,
  isManual,
  hintCell,
  onCellClick,
}: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // ─── CONFLICT LINE DRAWING ─────────────────────────────

  const drawConflictLines = useCallback(() => {
    const canvas = canvasRef.current;
    const boardEl = boardRef.current;
    if (!canvas || !boardEl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to match board
    const rect = boardEl.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (conflictPairs.length === 0) return;

    const cellSize = rect.width / n;

    conflictPairs.forEach(({ row1, col1, row2, col2 }) => {
      const x1 = col1 * cellSize + cellSize / 2;
      const y1 = row1 * cellSize + cellSize / 2;
      const x2 = col2 * cellSize + cellSize / 2;
      const y2 = row2 * cellSize + cellSize / 2;

      // Glow layer
      ctx.save();
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.15)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();

      // Main dashed line
      ctx.save();
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Endpoints
      [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(p => {
        ctx.save();
        ctx.fillStyle = 'rgba(248, 113, 113, 0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });
  }, [conflictPairs, n]);

  useEffect(() => {
    drawConflictLines();
  }, [drawConflictLines]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => drawConflictLines();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawConflictLines]);

  // ─── CELL CLASS BUILDER ─────────────────────────────────

  const getCellClasses = (row: number, col: number): string => {
    const classes = ['nq-cell'];
    classes.push((row + col) % 2 === 0 ? 'light' : 'dark');

    const hasQueen = board[row] === col;
    if (hasQueen) classes.push('has-queen');
    if (isManual) classes.push('manual-hoverable');

    const states = cellStates.get(`${row}-${col}`) || [];
    states.forEach(s => classes.push(s));

    return classes.join(' ');
  };

  // ─── RENDER ─────────────────────────────────────────────

  return (
    <div className="nq-board-wrapper">
      <div className="nq-board-container">
        <div className="nq-board-with-rows">
          {/* Row labels - spacer at top */}
          <div className="nq-row-labels">
            <div className="nq-row-label" style={{ height: '18px', flex: 'none' }} />
            {Array.from({ length: n }).map((_, r) => (
              <div key={r} className="nq-row-label">
                {r + 1}
              </div>
            ))}
          </div>

          <div className="nq-board-col">
            {/* Column labels */}
            <div
              className="nq-col-labels"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)` }}
            >
              {Array.from({ length: n }).map((_, c) => (
                <div key={c} className="nq-col-label">
                  {getColLetter(c)}
                </div>
              ))}
            </div>

            {/* Board grid */}
            <div
              ref={boardRef}
              className={`nq-board ${isSolved ? 'board-solved' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${n}, 1fr)`,
                gridTemplateRows: `repeat(${n}, 1fr)`,
              }}
            >
              {Array.from({ length: n }).map((_, row) =>
                Array.from({ length: n }).map((_, col) => {
                  const hasQueen = board[row] === col;
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={getCellClasses(row, col)}
                      onClick={() => onCellClick(row, col)}
                      title={`Row ${row + 1}, Col ${getColLetter(col)}`}
                    >
                      {hasQueen && (
                        <div
                          className={`nq-queen ${isSolved ? 'solved-queen' : ''}`}
                          dangerouslySetInnerHTML={{ __html: QUEEN_SVG }}
                        />
                      )}
                      {hintCell && hintCell.row === row && hintCell.col === col && !hasQueen && (
                        <div className="nq-hint-ghost">♛</div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Conflict canvas overlay */}
              <canvas
                ref={canvasRef}
                className="nq-conflict-canvas"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(BoardComponent);
