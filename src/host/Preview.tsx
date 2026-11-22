import { useEffect, useState } from 'react';
import Choices from '../Choices';
import { fmtNum, type Question } from '../lib/types';

/** Walk through the quiz as the TV and phones will show it. Arrows: navigate, Space: answer, Esc: close. */
export default function Preview({ qs, onClose }: { qs: Question[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const q = qs[Math.min(i, qs.length - 1)];
  const isNum = q.kind === 'number';

  const go = (d: number) => {
    setI((n) => Math.min(Math.max(n + d, 0), qs.length - 1));
    setShown(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
      else if (e.key === ' ') {
        e.preventDefault();
        setShown((s) => !s);
      } else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="page preview">
      <header className="top">
        <span className="brand sm">Preview</span>
        <span className="gap">
          <button className="ghost sm" disabled={i === 0} onClick={() => go(-1)}>
            ← Prev
          </button>
          <span className="muted">
            {i + 1} / {qs.length}
          </span>
          <button className="ghost sm" disabled={i === qs.length - 1} onClick={() => go(1)}>
            Next →
          </button>
        </span>
        <span className="gap">
          <button className="sm" onClick={() => setShown((s) => !s)}>
            {shown ? 'Hide answer' : 'Show answer'}
          </button>
          <button className="ghost sm" onClick={onClose}>
            Close
          </button>
        </span>
      </header>

      <div className="preview-grid">
        <section className="tv">
          <p className="frame-label muted small">Big screen</p>
          <div className="bar">
            <span className="muted small">
              Question {i + 1} / {qs.length}
            </span>
            <span className="timer">{q.time}</span>
            <span className="muted small">{isNum ? 'Closest guess' : 'Multiple choice'}</span>
          </div>
          <h1 className="qtext">{q.text}</h1>
          {isNum ? (
            shown ? (
              <div className="actual">
                <span className="muted">Actual</span>
                <b>{fmtNum(q.answer, q.pre, q.suf)}</b>
              </div>
            ) : (
              <p className="guess-hint">Type your closest guess on your phone!</p>
            )
          ) : (
            <Choices choices={q.choices} answer={shown ? q.answer : null} />
          )}
        </section>

        <section className="phone">
          <p className="frame-label muted small">Player's phone</p>
          <div className="bar">
            <span className="muted small">
              Q {i + 1}/{qs.length}
            </span>
            <span className="timer sm">{q.time}</span>
          </div>
          <p className="ptext">{q.text}</p>
          {isNum ? (
            <div className="guess">
              <div className="guess-input">
                {q.pre && <span>{q.pre}</span>}
                <input placeholder="Your guess" readOnly tabIndex={-1} />
                {q.suf && <span>{q.suf}</span>}
              </div>
              <button disabled>Lock in</button>
            </div>
          ) : (
            <Choices choices={q.choices} picked={shown ? q.answer : null} />
          )}
        </section>
      </div>
      <p className="muted small center">← → to move · Space to show the answer · Esc to close</p>
    </main>
  );
}
