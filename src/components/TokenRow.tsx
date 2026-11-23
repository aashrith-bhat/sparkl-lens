import type { ScoredToken } from "../lib/scoring";

export function TokenRow({ tokens }: { tokens: ScoredToken[] }) {
  return (
    <div className="token-row" aria-label="Word comparison">
      {tokens.map((token, index) => (
        <span key={`${token.text}-${index}`} className={`token token--${token.status}`}>
          {token.text}
        </span>
      ))}
    </div>
  );
}
