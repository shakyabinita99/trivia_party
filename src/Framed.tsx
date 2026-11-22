import type { ReactNode } from 'react';
import type { Question } from './lib/types';

/** Lays out a question's content next to (side) or below (top) its picture, if it has one. */
export default function Framed({ q, children }: { q: Question; children: ReactNode }) {
  if (!q.img) return <>{children}</>;
  return (
    <div className={`framed ${q.pos ?? 'side'}`}>
      <img className="qimg" src={q.img} alt="" />
      <div className="framed-body">{children}</div>
    </div>
  );
}
