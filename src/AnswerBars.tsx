import { LETTERS } from './lib/types';

type Props = { choices: string[]; counts: number[]; answer: number; picked?: number | null };

/** How many players picked each choice, as horizontal bars; the correct one is marked. */
export default function AnswerBars({ choices, counts, answer, picked = null }: Props) {
  const max = Math.max(1, ...counts);
  return (
    <div className="abars">
      {choices.map((c, i) => (
        <div key={i} className={`abar ${i === answer ? 'right' : ''}`}>
          <div className="abar-head">
            <span className={`tag c${i}`}>{LETTERS[i]}</span>
            <span className="abar-label">
              {c}
              {i === picked && <span className="you"> · you</span>}
            </span>
            {i === answer && <span className="check">✓</span>}
            <b className="abar-n">{counts[i] ?? 0}</b>
          </div>
          <div className="abar-track">
            <i className={`c${i}`} style={{ width: `${((counts[i] ?? 0) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
