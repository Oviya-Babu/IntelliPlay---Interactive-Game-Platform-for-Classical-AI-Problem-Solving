import { motion } from 'framer-motion';
import type { CryptoLevel } from './types';

interface LevelSelectorProps {
  levels: CryptoLevel[];
  currentLevelId: number;
  onSelectLevel: (id: number) => void;
}

const LEVEL_ICONS = ['📖', '✏️', '🔢', '🔗', '🌳', '✂️', '🧠', '🏁', '💎', '👑'];

export default function LevelSelector({ levels, currentLevelId, onSelectLevel }: LevelSelectorProps) {
  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="flex gap-3 min-w-max px-2">
        {levels.map((lvl) => (
          <motion.button
            key={lvl.id}
            whileHover={lvl.unlocked ? { y: -4 } : {}}
            whileTap={lvl.unlocked ? { scale: 0.95 } : {}}
            onClick={() => lvl.unlocked && onSelectLevel(lvl.id)}
            className="relative flex flex-col items-center rounded-xl border transition-all duration-300"
            style={{
              width: 100,
              padding: '10px 6px',
              cursor: lvl.unlocked ? 'pointer' : 'default',
              background: lvl.id === currentLevelId
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                : lvl.unlocked
                  ? 'var(--bg-surface-2, #1a1a28)'
                  : 'var(--bg-surface-3, #111118)',
              borderColor: lvl.id === currentLevelId
                ? '#818cf8'
                : 'var(--border-default, #2a2a35)',
              color: lvl.id === currentLevelId ? '#fff' : 'var(--text-primary)',
              boxShadow: lvl.id === currentLevelId
                ? '0 0 20px rgba(99,102,241,0.3)'
                : 'none',
              opacity: lvl.unlocked ? 1 : 0.5,
              filter: lvl.unlocked ? 'none' : 'grayscale(0.5)',
            }}
          >
            <span style={{ fontSize: 20, marginBottom: 2 }}>
              {LEVEL_ICONS[lvl.id - 1]}
            </span>
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              opacity: 0.7,
              marginBottom: 2,
            }}>
              Level {lvl.id}
            </div>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              textAlign: 'center',
              lineHeight: 1.2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
            }}>
              {lvl.title}
            </div>

            {!lvl.unlocked && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 12,
                backdropFilter: 'blur(2px)',
              }}>
                <span style={{ fontSize: 18 }}>🔒</span>
              </div>
            )}

            {lvl.id === currentLevelId && (
              <motion.div
                layoutId="crypto-active-lvl"
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 3,
                  background: '#fff',
                  borderRadius: 4,
                  boxShadow: '0 0 8px #fff',
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
