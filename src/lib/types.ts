/** kind 'number': closest guess wins; `answer` is the value, `pre`/`suf` are display units (e.g. "$", "kg"). */
export type Question = {
  text: string;
  choices: string[];
  answer: number;
  time: number;
  kind?: 'choice' | 'number';
  pre?: string;
  suf?: string;
};

export const fmtNum = (n: number, pre = '', suf = '') =>
  `${pre}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suf ? ` ${suf}` : ''}`;

export type Phase = 'lobby' | 'question' | 'reveal' | 'board' | 'end';

export type PubPlayer = {
  name: string;
  score: number;
  rank: number;
  pts: number;
  voted: boolean;
  ok: boolean | null;
  guess: number | null;
  place: number;
};

/** State the host broadcasts to every phone. */
export type PubState = {
  phase: Phase;
  theme: string;
  kind: 'choice' | 'number';
  pre: string;
  suf: string;
  q: number;
  total: number;
  text: string;
  choices: string[];
  remaining: number;
  answer: number | null;
  players: Record<string, PubPlayer>;
};

export type JoinMsg = { id: string; name: string };
export type AnswerMsg = { id: string; q: number; choice: number };

export const LETTERS = ['A', 'B', 'C', 'D'];
