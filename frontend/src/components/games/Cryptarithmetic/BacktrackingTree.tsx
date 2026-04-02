import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TreeNode } from './types';

interface BacktrackingTreeProps {
  root: TreeNode;
  currentStepId?: string;
  maxWidth?: number;
  maxHeight?: number;
}

const NODE_RADIUS = 18;
const H_SPACING = 50;
const V_SPACING = 70;

const TYPE_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  assign:    { fill: '#1e1b4b', stroke: '#818cf8', glow: 'rgba(129,140,248,0.3)' },
  solution:  { fill: '#052e16', stroke: '#10b981', glow: 'rgba(16,185,129,0.4)' },
  backtrack: { fill: '#2d0a0a', stroke: '#f43f5e', glow: 'rgba(244,63,94,0.3)' },
  prune:     { fill: '#2d1a00', stroke: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
};

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

function layoutTree(node: TreeNode, depth: number = 0, xOffset: number = 0): { layout: LayoutNode; width: number } {
  if (node.children.length === 0) {
    return {
      layout: { node, x: xOffset, y: depth * V_SPACING, children: [] },
      width: H_SPACING,
    };
  }

  let currentX = xOffset;
  const childLayouts: LayoutNode[] = [];
  let totalWidth = 0;

  for (const child of node.children) {
    const result = layoutTree(child, depth + 1, currentX);
    childLayouts.push(result.layout);
    currentX += result.width;
    totalWidth += result.width;
  }

  // Center parent over children
  const leftX = childLayouts[0].x;
  const rightX = childLayouts[childLayouts.length - 1].x;
  const centerX = (leftX + rightX) / 2;

  return {
    layout: {
      node,
      x: centerX,
      y: depth * V_SPACING,
      children: childLayouts,
    },
    width: Math.max(totalWidth, H_SPACING),
  };
}

function getTreeBounds(layout: LayoutNode): { minX: number; maxX: number; maxY: number } {
  let minX = layout.x;
  let maxX = layout.x;
  let maxY = layout.y;

  for (const child of layout.children) {
    const bounds = getTreeBounds(child);
    minX = Math.min(minX, bounds.minX);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  return { minX, maxX, maxY };
}

export default function BacktrackingTree({ root, currentStepId, maxWidth = 600, maxHeight = 400 }: BacktrackingTreeProps) {
  const { treeLayout, viewBox } = useMemo(() => {
    if (root.children.length === 0) {
      return { treeLayout: null, viewBox: '0 0 100 100' };
    }

    const { layout } = layoutTree(root, 0, 0);
    const bounds = getTreeBounds(layout);
    const padding = 40;
    const w = bounds.maxX - bounds.minX + padding * 2;
    const h = bounds.maxY + padding * 2;
    const offsetX = -bounds.minX + padding;
    const offsetY = padding;

    return {
      treeLayout: layout,
      viewBox: `0 0 ${w} ${h}`,
      offsetX,
      offsetY,
    };
  }, [root]);

  if (!treeLayout) {
    return (
      <div style={{
        height: maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted, #71717a)',
        fontSize: 13,
      }}>
        Tree will appear as solving progresses...
      </div>
    );
  }

  const bounds = getTreeBounds(treeLayout);
  const padding = 40;
  const vw = bounds.maxX - bounds.minX + padding * 2;
  const vh = bounds.maxY + padding * 2;
  const offsetX = -bounds.minX + padding;
  const offsetY = padding;

  const edges: JSX.Element[] = [];
  const nodes: JSX.Element[] = [];

  function renderNode(layout: LayoutNode, index: number) {
    const { node, x, y, children } = layout;
    const px = x + offsetX;
    const py = y + offsetY;
    const colors = TYPE_COLORS[node.type] || TYPE_COLORS.assign;
    const isCurrent = node.id === currentStepId;

    // Draw edges to children
    for (const child of children) {
      const cx = child.x + offsetX;
      const cy = child.y + offsetY;
      const childColors = TYPE_COLORS[child.node.type] || TYPE_COLORS.assign;

      edges.push(
        <motion.line
          key={`edge-${node.id}-${child.node.id}`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 0.3, delay: index * 0.03 }}
          x1={px}
          y1={py + NODE_RADIUS}
          x2={cx}
          y2={cy - NODE_RADIUS}
          stroke={childColors.stroke}
          strokeWidth={1.5}
          strokeOpacity={0.4}
        />
      );
    }

    // Node circle
    nodes.push(
      <motion.g
        key={`node-${node.id}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, delay: index * 0.03, type: 'spring', stiffness: 300 }}
      >
        {/* Glow */}
        {isCurrent && (
          <circle
            cx={px}
            cy={py}
            r={NODE_RADIUS + 6}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={2}
            opacity={0.4}
          >
            <animate attributeName="r" values={`${NODE_RADIUS + 4};${NODE_RADIUS + 8};${NODE_RADIUS + 4}`} dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <circle
          cx={px}
          cy={py}
          r={NODE_RADIUS}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={isCurrent ? 2.5 : 1.5}
        />
        {node.letter && (
          <>
            <text
              x={px}
              y={py - 3}
              textAnchor="middle"
              fill={colors.stroke}
              fontSize={8}
              fontWeight={600}
            >
              {node.letter}
            </text>
            <text
              x={px}
              y={py + 9}
              textAnchor="middle"
              fill="#fff"
              fontSize={11}
              fontWeight={800}
              fontFamily="monospace"
            >
              {node.digit}
            </text>
          </>
        )}
      </motion.g>
    );

    // Recurse
    children.forEach((child, ci) => renderNode(child, index + ci + 1));
  }

  renderNode(treeLayout, 0);

  return (
    <div style={{
      width: '100%',
      maxHeight,
      overflow: 'auto',
      background: 'var(--bg-surface, #151521)',
      borderRadius: 12,
      border: '1px solid var(--border-default, #2a2a35)',
    }}>
      <svg
        width={Math.max(vw, maxWidth)}
        height={Math.max(vh, 200)}
        viewBox={`0 0 ${Math.max(vw, maxWidth)} ${Math.max(vh, 200)}`}
        style={{ display: 'block' }}
      >
        {edges}
        {nodes}
      </svg>
    </div>
  );
}
