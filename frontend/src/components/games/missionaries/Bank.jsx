export default function Bank({ side, unsafe }) {
  return (
    <div className={`mc-bank mc-bank-${side} ${unsafe ? 'unsafe' : ''}`}>
      <div className="bank-ground" />
      <div className="bank-grass">
        <div className="grass-blade g1" />
        <div className="grass-blade g2" />
        <div className="grass-blade g3" />
        <div className="grass-blade g4" />
        <div className="grass-blade g5" />
      </div>
      {side === 'left' && <div className="bank-tree tree-left" />}
      {side === 'right' && <div className="bank-tree tree-right" />}
    </div>
  );
}
