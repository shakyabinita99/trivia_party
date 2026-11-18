export type Question = { text: string; choices: string[]; answer: number; time: number };

export type Phase = 'lobby' | 'question' | 'reveal' | 'board' | 'end';

export type PubPlayer = {
  name: string;
  score: number;
  rank: number;
  pts: number;
  voted: boolean;
  ok: boolean | null;
};

/** State the host broadcasts to every phone. */
export type PubState = {
  phase: Phase;
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
