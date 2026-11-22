import { PROOF_ITEMS } from './constants';

export function ProofStrip() {
  return (
    <div className="lp-proof">
      <div className="lp-wrap lp-proof-grid">
        {PROOF_ITEMS.map((item) => (
          <div key={item.bold}>
            <strong>{item.bold}</strong>
            {item.rest}
          </div>
        ))}
      </div>
    </div>
  );
}
