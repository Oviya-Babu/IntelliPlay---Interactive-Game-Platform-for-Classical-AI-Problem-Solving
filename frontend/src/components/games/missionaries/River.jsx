export default function River() {
  return (
    <div className="mc-river">
      <div className="wave-container">
        <svg className="wave-svg wave-1" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path d="M0 30 Q150 10 300 30 T600 30 T900 30 T1200 30 V60 H0 Z" fill="rgba(255,255,255,0.08)"/>
        </svg>
        <svg className="wave-svg wave-2" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path d="M0 35 Q150 15 300 35 T600 35 T900 35 T1200 35 V60 H0 Z" fill="rgba(255,255,255,0.05)"/>
        </svg>
        <svg className="wave-svg wave-3" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path d="M0 25 Q150 45 300 25 T600 25 T900 25 T1200 25 V60 H0 Z" fill="rgba(255,255,255,0.06)"/>
        </svg>
      </div>
      <div className="water-sparkle s1" />
      <div className="water-sparkle s2" />
      <div className="water-sparkle s3" />
      <div className="water-sparkle s4" />
      <div className="water-sparkle s5" />
    </div>
  );
}
