/** kind 'number': closest guess wins; `answer` is the value, `pre`/`suf` are display units (e.g. "$", "kg"). */
export type Question = {
  text: string;
  choices: string[];
  answer: number;
  time: number;
  kind?: 'choice' | 'number';
  pre?: string;
  suf?: string;
  img?: string;
  pos?: ImgPos;
};

export type ImgPos = 'side' | 'top';

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
  /** The player's answer once revealed: the guess (number questions) or choice index. */
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
  img: string;
  q: number;
  total: number;
  text: string;
  choices: string[];
  remaining: number;
  answer: number | null;
  /** Host has the leaderboard overlay open. */
  board: boolean;
  /** How many players picked each choice (choice questions, once revealed). */
  counts: number[] | null;
  players: Record<string, PubPlayer>;
};

export type JoinMsg = { id: string; name: string };
export type AnswerMsg = { id: string; q: number; choice: number };

export const LETTERS = ['A', 'B', 'C', 'D'];
