/* ═══════════════════════════════════════════════════════════
   ComplexityInsights — Reusable Complexity Learning Component
   Embeds inside each game's AI Tutor panel.
   ═══════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useComplexityStore } from '@/store/complexityStore';
import {
  COMPLEXITY_DATA,
  COMPLEXITY_DEFINITION,
  BIG_O_TOOLTIPS,
  type GameId,
  type ComplexityInfo,
} from './complexityData';
import './ComplexityInsights.css';

interface ComplexityInsightsProps {
  gameId: GameId;
  variant?: 'glass-card' | 'inline-styled' | 'tailwind';
  compact?: boolean;
}

/* ─── Tooltip wrapper ─────────────────────────────────────── */

function Tooltip({ text, tooltip }: { text: string; tooltip: string }) {
  return (
    <span className="ci-tooltip-wrapper">
      <span className="ci-complexity-value">{text}</span>
      <span className="ci-tooltip">{tooltip}</span>
    </span>
  );
}

function SpaceTooltip({ text, tooltip }: { text: string; tooltip: string }) {
  return (
    <span className="ci-tooltip-wrapper">
      <span className="ci-complexity-value space">{text}</span>
      <span className="ci-tooltip">{tooltip}</span>
    </span>
  );
}

/* ─── Metric Badge (live value) ───────────────────────────── */

function MetricBadge({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: string;
  label: string;
  value: number | string;
  colorClass: string;
}) {
  const prevValueRef = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 350);
      prevValueRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="ci-metric">
      <span className="ci-metric-label">
        <span className="ci-metric-icon">{icon}</span>
        {label}
      </span>
      <span className={`ci-metric-value ${colorClass} ${pulse ? 'pulse' : ''}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

function ComplexityInsightsComponent({ gameId, compact = false }: ComplexityInsightsProps) {
  const gameData = COMPLEXITY_DATA[gameId];
  if (!gameData) return null;

  const [mode, setMode] = useState<'theoretical' | 'live'>('theoretical');
  const [showDefinition, setShowDefinition] = useState(false);
  const [showWhyTime, setShowWhyTime] = useState(false);
  const [showWhyLive, setShowWhyLive] = useState(false);
  const [activeAlgo, setActiveAlgo] = useState<'primary' | 'secondary'>('primary');

  const metrics = useComplexityStore();

  const currentAlgo: ComplexityInfo =
    activeAlgo === 'secondary' && gameData.secondary
      ? gameData.secondary
      : gameData.primary;

  const getTooltipForNotation = useCallback(
    (notation: string): string => {
      return BIG_O_TOOLTIPS[notation] || currentAlgo.tooltipTime;
    },
    [currentAlgo]
  );

  // Wrap card in game-appropriate container class
  const cardClass = 'ci-card';

  return (
    <div className="ci-container">
      {/* ─── Section Header ─── */}
      <div className="ci-section-header">
        <span className="ci-section-icon">📊</span>
        <span className="ci-section-title">Complexity Insights</span>
      </div>

      {/* ─── What is Complexity? toggle ─── */}
      <button
        className="ci-definition-toggle"
        onClick={() => setShowDefinition((s) => !s)}
        type="button"
      >
        <span>💡 What is Complexity?</span>
        <span className={`ci-definition-chevron ${showDefinition ? 'open' : ''}`}>▼</span>
      </button>
      <div className={`ci-definition-body ${showDefinition ? 'open' : ''}`}>
        <div className="ci-definition-text">{COMPLEXITY_DEFINITION.description}</div>
      </div>

      {/* ─── Main Card ─── */}
      <div className={cardClass}>
        {/* Algorithm Tabs (if dual-algorithm) */}
        {gameData.secondary && (
          <div className="ci-algo-tabs">
            <button
              className={`ci-algo-tab ${activeAlgo === 'primary' ? 'active' : ''}`}
              onClick={() => setActiveAlgo('primary')}
              type="button"
            >
              {gameData.primary.algorithm}
            </button>
            <button
              className={`ci-algo-tab ${activeAlgo === 'secondary' ? 'active' : ''}`}
              onClick={() => setActiveAlgo('secondary')}
              type="button"
            >
              {gameData.secondary.algorithm}
            </button>
          </div>
        )}

        {/* Algorithm Label */}
        <div className="ci-algo-label">
          ⚡ {currentAlgo.algorithmFull}
        </div>

        {/* Mode Toggle */}
        <div className="ci-mode-toggle">
          <button
            className={`ci-mode-btn ${mode === 'theoretical' ? 'active' : ''}`}
            onClick={() => setMode('theoretical')}
            type="button"
          >
            📐 Theoretical
          </button>
          <button
            className={`ci-mode-btn ${mode === 'live' ? 'active' : ''}`}
            onClick={() => setMode('live')}
            type="button"
          >
            📈 Live Execution
          </button>
        </div>

        {/* ─── THEORETICAL MODE ─── */}
        {mode === 'theoretical' && (
          <>
            {/* Time Complexity */}
            <div className="ci-complexity-row">
              <span className="ci-complexity-label">Time</span>
              <Tooltip
                text={currentAlgo.timeComplexity}
                tooltip={currentAlgo.tooltipTime}
              />
              <span className="ci-complexity-badge">{currentAlgo.timeLabel}</span>
            </div>

            {/* Space Complexity */}
            <div className="ci-complexity-row">
              <span className="ci-complexity-label">Space</span>
              <SpaceTooltip
                text={currentAlgo.spaceComplexity}
                tooltip={currentAlgo.tooltipSpace}
              />
              <span className="ci-complexity-badge space">{currentAlgo.spaceLabel}</span>
            </div>

            {/* Why this complexity? */}
            <button
              className="ci-explainer-toggle"
              onClick={() => setShowWhyTime((s) => !s)}
              type="button"
            >
              <span>🔍 Why this complexity?</span>
              <span className={`ci-definition-chevron ${showWhyTime ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`ci-explainer-body ${showWhyTime ? 'open' : ''}`}>
              <div className="ci-explainer-text">
                {currentAlgo.whyExplanation}
                <div className="ci-variable-list">
                  {Object.entries(currentAlgo.variables).map(([key, desc]) => (
                    <div className="ci-variable-item" key={key}>
                      <span className="ci-variable-key">{key}</span>
                      <span className="ci-variable-desc">= {desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── LIVE EXECUTION MODE ─── */}
        {mode === 'live' && (
          <>
            <div className="ci-metrics-grid">
              <MetricBadge
                icon="🔍"
                label="Nodes"
                value={metrics.nodesExplored}
                colorClass="nodes"
              />
              <MetricBadge
                icon="📋"
                label="States"
                value={metrics.statesChecked}
                colorClass="states"
              />
              <MetricBadge
                icon="↩️"
                label="Backtracks"
                value={metrics.backtracks}
                colorClass="backtr"
              />
              <MetricBadge
                icon="📏"
                label="Depth"
                value={metrics.depthReached}
                colorClass="depth"
              />
              {metrics.branchesPruned > 0 && (
                <MetricBadge
                  icon="✂️"
                  label="Pruned"
                  value={metrics.branchesPruned}
                  colorClass="pruned"
                />
              )}
              {metrics.timeElapsedMs > 0 && (
                <MetricBadge
                  icon="⏱"
                  label="Time"
                  value={`${metrics.timeElapsedMs.toFixed(0)}ms`}
                  colorClass="time"
                />
              )}
            </div>

            {/* Real-time explanation */}
            <button
              className="ci-explainer-toggle"
              onClick={() => setShowWhyLive((s) => !s)}
              type="button"
            >
              <span>📊 What do these metrics mean?</span>
              <span className={`ci-definition-chevron ${showWhyLive ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`ci-explainer-body ${showWhyLive ? 'open' : ''}`}>
              <div className="ci-explainer-text">
                <strong>Nodes explored:</strong> Total game states evaluated by the algorithm.
                <br />
                <strong>States checked:</strong> Positions validated against constraints.
                <br />
                <strong>Backtracks:</strong> Times the algorithm undid a decision to try alternatives.
                <br />
                <strong>Depth:</strong> Current level in the search tree.
                <br />
                {metrics.branchesPruned > 0 && (
                  <>
                    <strong>Pruned:</strong> Branches skipped — saving computation.
                    <br />
                  </>
                )}
                These numbers show the <em>real cost</em> of solving this problem — compare with the theoretical complexity above!
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(ComplexityInsightsComponent);
