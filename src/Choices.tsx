import { LETTERS } from './lib/types';

type Props = {
  choices: string[];
  answer?: number | null;
  counts?: number[] | null;
  picked?: number | null;
  onPick?: (i: number) => void;
};

export default function Choices({ choices, answer = null, counts = null, picked = null, onPick }: Props) {
  return (
    <div className={`choices n${choices.length}`}>
      {choices.map((c, i) => {
        const cls = [
          'choice',
          `c${i}`,
          answer !== null && i !== answer ? 'dim' : '',
          picked !== null && i !== picked ? 'dim' : '',
        ].join(' ');
        const body = (
          <>
            <span className="tag">{LETTERS[i]}</span>
            <span className="label">{c}</span>
            {counts && <span className="count">{counts[i]}</span>}
            {answer === i && <span className="check">✓</span>}
          </>
        );
        return onPick ? (
          <button key={i} className={cls} onClick={() => onPick(i)} disabled={picked !== null}>
            {body}
          </button>
        ) : (
          <div key={i} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
