export default function Character({ char, position, isSelected, isHinted, onClick, disabled, isEaten, isAttacking, isFearful }) {
  const isHuman = char.type === 'missionary';

  return (
    <div
      className={`mc-character ${char.type} ${isSelected ? 'selected' : ''} ${isHinted ? 'hinted' : ''} ${disabled ? 'disabled' : ''} ${isEaten ? 'eaten' : ''} ${isAttacking ? 'attacking' : ''} ${isFearful ? 'fearful' : ''}`}
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
      onClick={disabled ? undefined : onClick}
      title={`${char.label} (${isHuman ? 'Human' : 'Monster'})`}
    >
      <div className="char-icon">
        {isHuman ? (
          /* ===== HUMAN CHARACTER ===== */
          <svg viewBox="0 0 60 90" width="50" height="68">
            <defs>
              <radialGradient id="skinGrad" cx="50%" cy="40%">
                <stop offset="0%" stopColor="#ffe4c4" />
                <stop offset="100%" stopColor="#f5c6a0" />
              </radialGradient>
              <linearGradient id="robeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#42a5f5" />
                <stop offset="100%" stopColor="#1565c0" />
              </linearGradient>
            </defs>
            {/* Hair */}
            <ellipse cx="30" cy="14" rx="12" ry="10" fill="#5d4037" />
            <ellipse cx="30" cy="10" rx="10" ry="6" fill="#6d4c41" />
            {/* Head */}
            <circle cx="30" cy="18" r="11" fill="url(#skinGrad)" stroke="#d7a86e" strokeWidth="1" />
            {/* Eyes – expressive */}
            {isFearful ? (
              <>
                <ellipse cx="25" cy="17" rx="2.5" ry="3" fill="#fff" />
                <circle cx="25" cy="17" r="1.5" fill="#2c1810" />
                <ellipse cx="35" cy="17" rx="2.5" ry="3" fill="#fff" />
                <circle cx="35" cy="17" r="1.5" fill="#2c1810" />
                {/* Fearful eyebrows */}
                <line x1="22" y1="13" x2="27" y2="12" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="38" y1="13" x2="33" y2="12" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" />
                {/* Open mouth (scared) */}
                <ellipse cx="30" cy="24" rx="3" ry="2.5" fill="#4a2020" />      
              </>
            ) : (
              <>
                <ellipse cx="25" cy="17" rx="2" ry="2.5" fill="#fff" />
                <circle cx="25.5" cy="17" r="1.2" fill="#2c1810" />
                <ellipse cx="35" cy="17" rx="2" ry="2.5" fill="#fff" />
                <circle cx="34.5" cy="17" r="1.2" fill="#2c1810" />
                {/* Eyebrows */}
                <line x1="22" y1="13.5" x2="27" y2="13" stroke="#5d4037" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="38" y1="13.5" x2="33" y2="13" stroke="#5d4037" strokeWidth="1.2" strokeLinecap="round" />
                {/* Gentle smile */}
                <path d="M26 23 Q30 27 34 23" fill="none" stroke="#6d4037" strokeWidth="1" strokeLinecap="round" />
              </>
            )}
            {/* Blush */}
            <circle cx="21" cy="20" r="2.5" fill="rgba(255,138,128,0.25)" />    
            <circle cx="39" cy="20" r="2.5" fill="rgba(255,138,128,0.25)" />    
            {/* Body / Robe */}
            <path d="M16 30 L30 32 L44 30 L42 72 Q30 78 18 72 Z" fill="url(#robeGrad)" stroke="#0d47a1" strokeWidth="1" />
            {/* Belt */}
            <rect x="20" y="44" width="20" height="3" rx="1.5" fill="#ffd54f" opacity="0.8" />
            {/* Cross symbol */}
            <rect x="28" y="50" width="4" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="24" y="54" width="12" height="3" rx="1" fill="rgba(255,255,255,0.3)" />
            {/* Arms */}
            <path d="M16 34 Q10 46 14 50" fill="none" stroke="url(#robeGrad)" strokeWidth="5" strokeLinecap="round" />
            <path d="M44 34 Q50 46 46 50" fill="none" stroke="url(#robeGrad)" strokeWidth="5" strokeLinecap="round" />
            {/* Hands */}
            <circle cx="14" cy="50" r="3.5" fill="url(#skinGrad)" />
            <circle cx="46" cy="50" r="3.5" fill="url(#skinGrad)" />
          </svg>
        ) : (
          /* ===== MONSTER / ZOMBIE CHARACTER ===== */
          <svg viewBox="0 0 60 90" width="50" height="68">
            <defs>
              <radialGradient id="monsterSkin" cx="50%" cy="40%">
                <stop offset="0%" stopColor="#7cb342" />
                <stop offset="100%" stopColor="#4a7c20" />
              </radialGradient>
              <linearGradient id="monsterBody" x1="0" y1="0" x2="0" y2="1">     
                <stop offset="0%" stopColor="#3e2723" />
                <stop offset="100%" stopColor="#1b0f0a" />
              </linearGradient>
              {/* Glowing eye gradient */}
              <radialGradient id="eyeGlow">
                <stop offset="0%" stopColor="#ff1744" />
                <stop offset="70%" stopColor="#d50000" />
                <stop offset="100%" stopColor="#b71c1c" />
              </radialGradient>
            </defs>
            {/* Horns */}
            <polygon points="18,12 22,2 24,14" fill="#5d4037" stroke="#4e342e" strokeWidth="0.5" />
            <polygon points="42,12 38,2 36,14" fill="#5d4037" stroke="#4e342e" strokeWidth="0.5" />
            {/* Head */}
            <circle cx="30" cy="20" r="12" fill="url(#monsterSkin)" stroke="#33691e" strokeWidth="1.5" />
            {/* Wrinkle lines */}
            <path d="M22 15 Q24 13 26 15" fill="none" stroke="#33691e" strokeWidth="0.7" opacity="0.5" />
            <path d="M34 15 Q36 13 38 15" fill="none" stroke="#33691e" strokeWidth="0.7" opacity="0.5" />
            {/* Glowing eyes */}
            <circle cx="24" cy="19" r="4" fill="#1a1a1a" />
            <circle cx="24" cy="19" r="2.5" fill="url(#eyeGlow)">
              <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="24" cy="18.5" r="0.8" fill="#fff" opacity="0.7" />      
            <circle cx="36" cy="19" r="4" fill="#1a1a1a" />
            <circle cx="36" cy="19" r="2.5" fill="url(#eyeGlow)">
              <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx="36" cy="18.5" r="0.8" fill="#fff" opacity="0.7" />      
            {/* Nose */}
            <path d="M28 22 L30 25 L32 22" fill="none" stroke="#33691e" strokeWidth="1" />
            {/* Teeth / Mouth */}
            {isAttacking ? (
              <>
                <path d="M22 28 Q30 36 38 28" fill="#4a0000" stroke="#33691e" strokeWidth="1" />
                <polygon points="24,28 26,33 28,28" fill="#f5f5f5" />
                <polygon points="30,28 32,34 34,28" fill="#f5f5f5" />
                <polygon points="35,28 36,32 38,28" fill="#f5f5f5" />
              </>
            ) : (
              <>
                <path d="M24 28 Q30 32 36 28" fill="#2e0000" stroke="#33691e" strokeWidth="1" />
                <polygon points="26,28 27,31 29,28" fill="#e0e0e0" />
                <polygon points="31,28 32,31 34,28" fill="#e0e0e0" />
              </>
            )}
            {/* Warts */}
            <circle cx="19" cy="18" r="1.5" fill="#558b2f" />
            <circle cx="38" cy="14" r="1" fill="#558b2f" />
            {/* Body / tattered outfit */}
            <path d="M16 32 L30 34 L44 32 L42 72 Q30 78 18 72 Z" fill="url(#monsterBody)" stroke="#1a1a1a" strokeWidth="1" />
            {/* Tattered edges */}
            <path d="M18 72 L20 76 L24 72 L28 77 L32 72 L36 76 L40 72 L42 75" fill="none" stroke="#3e2723" strokeWidth="1.5" />
            {/* Rib-like markings */}
            <line x1="24" y1="42" x2="36" y2="42" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <line x1="23" y1="48" x2="37" y2="48" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
            <line x1="24" y1="54" x2="36" y2="54" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
            {/* Claw arms */}
            <path d="M16 36 Q8 48 12 54" fill="none" stroke="#3e2723" strokeWidth="5" strokeLinecap="round" />
            <path d="M44 36 Q52 48 48 54" fill="none" stroke="#3e2723" strokeWidth="5" strokeLinecap="round" />
            {/* Claws */}
            <path d="M10 54 L7 58 M12 54 L10 59 M14 53 L13 58" fill="none" stroke="#7cb342" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 54 L53 58 M48 54 L50 59 M46 53 L47 58" fill="none" stroke="#7cb342" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span className="char-label">{isHuman ? char.label.replace('M', 'H') : char.label.replace('C', 'Z')}</span>
    </div>
  );
}