export default function Boat({ side, x, passengerCount, onClick }) {
  return (
    <div
      className={`mc-boat ${side} ${passengerCount > 0 ? 'loaded' : ''}`}
      style={{ left: `${x}%` }}
      onClick={onClick}
    >
      <svg viewBox="0 0 120 55" width="120" height="55" className="boat-svg">
        {/* Boat hull */}
        <path
          d="M10 20 L20 45 L100 45 L110 20 Z"
          fill="url(#boatGrad)"
          stroke="#3e2723"
          strokeWidth="2"
        />
        {/* Wood planks */}
        <line x1="25" y1="25" x2="25" y2="43" stroke="#4e342e" strokeWidth="0.8" opacity="0.4" />
        <line x1="45" y1="23" x2="43" y2="44" stroke="#4e342e" strokeWidth="0.8" opacity="0.4" />
        <line x1="65" y1="22" x2="67" y2="44" stroke="#4e342e" strokeWidth="0.8" opacity="0.4" />
        <line x1="85" y1="23" x2="87" y2="44" stroke="#4e342e" strokeWidth="0.8" opacity="0.4" />
        {/* Boat rim */}
        <path
          d="M8 20 L112 20"
          fill="none"
          stroke="#5d4037"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Mast */}
        <line x1="60" y1="5" x2="60" y2="20" stroke="#6d4c41" strokeWidth="2.5" />
        {/* Flag */}
        <polygon points="62,5 80,10 62,15" fill="#e53935" opacity="0.85" />
        <defs>
          <linearGradient id="boatGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8d6e63" />
            <stop offset="100%" stopColor="#5d4037" />
          </linearGradient>
        </defs>
      </svg>
      {passengerCount === 0 && (
        <div className="boat-empty-label">Empty</div>
      )}
    </div>
  );
}
