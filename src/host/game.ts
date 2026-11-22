import type { ThemeId } from '../lib/themes';
import type { AnswerMsg, JoinMsg, Phase, PubPlayer, PubState, Question } from '../lib/types';

export type Game = {
  pin: string;
  questions: Question[];
  theme: ThemeId;
  phase: Phase;
  q: number;
  startAt: number;
  players: Record<string, { name: string; score: number }>;
  answers: Record<string, { choice: number; pts: number }>;
  last: Record<string, number>;
  banned: string[];
  /** Leaderboard overlay open on the host (mirrored on phones). */
  showBoard?: boolean;
};

const MAX_PLAYERS = 60;

export const newGame = (questions: Question[], theme: ThemeId = 'party'): Game => ({
  pin: String(Math.floor(100000 + Math.random() * 900000)),
  questions,
  theme,
  phase: 'lobby',
  q: 0,
  startAt: 0,
  players: {},
  answers: {},
  last: {},
  banned: [],
});

export const ranked = (g: Game) =>
  Object.entries(g.players)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

export function join(g: Game, m: JoinMsg): Game {
  const id = String(m?.id ?? '').slice(0, 64);
  const raw = String(m?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 20);
  const prev = g.players[id];
  // Always return a new object so the host re-broadcasts state to the (re)joining phone.
  if (!id || !raw || g.banned.includes(id)) return { ...g };
  if (!prev && Object.keys(g.players).length >= MAX_PLAYERS) return { ...g };
  if (prev) return { ...g, players: { ...g.players } };

  const taken = new Set(Object.values(g.players).map((p) => p.name.toLowerCase()));
  let name = raw;
  for (let k = 2; taken.has(name.toLowerCase()); k++) name = `${raw} ${k}`;
  return { ...g, players: { ...g.players, [id]: { name, score: 0 } } };
}

export function kick(g: Game, id: string): Game {
  const { [id]: _gone, ...players } = g.players;
  const next = { ...g, players, banned: [...g.banned, id] };
  // If the removed player was the last one we were waiting on, reveal now.
  return next.phase === 'question' && allAnswered(next) ? reveal(next) : next;
}

const allAnswered = (g: Game) => {
  const ids = Object.keys(g.players);
  return ids.length > 0 && ids.every((id) => g.answers[id]);
};

export function answer(g: Game, m: AnswerMsg): Game {
  const q = g.questions[g.q];
  if (g.phase !== 'question' || m?.q !== g.q || !g.players[m.id] || g.answers[m.id]) return g;
  const c = Number(m.choice);
  const isNum = q.kind === 'number';
  if (isNum ? !Number.isFinite(c) || Math.abs(c) > 1e12 : !Number.isInteger(c) || c < 0 || c >= q.choices.length)
    return g;

  const limit = q.time * 1000;
  const elapsed = Date.now() - g.startAt;
  if (elapsed > limit + 1000) return g; // grace period for network lag
  const t = Math.min(Math.max(elapsed, 0), limit);
  // Number questions are scored at reveal, relative to everyone's guesses.
  const pts = isNum ? 0 : c === q.answer ? Math.round(1000 * (1 - t / limit / 2)) : 0;

  const next = { ...g, answers: { ...g.answers, [m.id]: { choice: c, pts } } };
  return allAnswered(next) ? reveal(next) : next;
}

/** Current players' guesses for a number question, closest first. */
export function guesses(g: Game) {
  const q = g.questions[g.q];
  return Object.entries(g.answers)
    .filter(([id]) => g.players[id])
    .map(([id, a]) => ({ id, name: g.players[id].name, guess: a.choice, err: Math.abs(a.choice - q.answer) }))
    .sort((a, b) => a.err - b.err);
}

/** Closest guess (ties included) gets 1000; others up to 500 by accuracy. */
function closenessPts(g: Game): Record<string, number> {
  const q = g.questions[g.q];
  const list = guesses(g);
  const best = list[0]?.err ?? 0;
  const scale = Math.max(Math.abs(q.answer), 1);
  return Object.fromEntries(
    list.map((x) => [x.id, x.err === best ? 1000 : Math.round(500 * Math.max(0, 1 - x.err / scale))]),
  );
}

export function reveal(g: Game): Game {
  if (g.phase !== 'question') return g;
  const num = g.questions[g.q].kind === 'number' ? closenessPts(g) : null;
  const players = { ...g.players };
  const last: Record<string, number> = {};
  for (const id in players) {
    const pts = num ? (num[id] ?? 0) : (g.answers[id]?.pts ?? 0);
    last[id] = pts;
    players[id] = { ...players[id], score: players[id].score + pts };
  }
  return { ...g, phase: 'reveal', players, last };
}

const start = (g: Game, q: number): Game => ({
  ...g,
  phase: 'question',
  q,
  startAt: Date.now(),
  answers: {},
  last: {},
});

export function advance(g: Game): Game {
  switch (g.phase) {
    case 'lobby':
      return start(g, 0);
    case 'question':
      return reveal(g);
    case 'reveal':
      return { ...g, phase: g.q + 1 < g.questions.length ? 'board' : 'end' };
    case 'board':
      return start(g, g.q + 1);
    default:
      return g;
  }
}

/** Back to lobby with the same PIN, players and questions; scores reset. */
export function replay(g: Game): Game {
  const players = Object.fromEntries(Object.entries(g.players).map(([id, p]) => [id, { ...p, score: 0 }]));
  return { ...newGame(g.questions, g.theme), pin: g.pin, players, banned: g.banned };
}

export const counts = (g: Game) =>
  g.questions[g.q].choices.map(
    (_, i) => Object.entries(g.answers).filter(([id, a]) => g.players[id] && a.choice === i).length,
  );

export function publicState(g: Game): PubState {
  const q = g.questions[g.q];
  const shown = g.phase === 'reveal' || g.phase === 'board' || g.phase === 'end';
  const isNum = q.kind === 'number';
  const list = ranked(g);
  const near = isNum && shown ? guesses(g) : [];
  const players: Record<string, PubPlayer> = {};
  for (const p of list) {
    const a = g.answers[p.id];
    const mine = near.find((x) => x.id === p.id);
    players[p.id] = {
      name: p.name,
      score: p.score,
      rank: 1 + list.filter((o) => o.score > p.score).length,
      pts: g.last[p.id] ?? 0,
      voted: Boolean(a),
      ok: !shown ? null : isNum ? !!mine && mine.err === near[0].err : a?.choice === q.answer,
      guess: shown && a ? a.choice : null,
      place: mine ? 1 + near.filter((x) => x.err < mine.err).length : 0,
    };
  }
  return {
    phase: g.phase,
    theme: g.theme ?? 'party',
    kind: isNum ? 'number' : 'choice',
    pre: q.pre ?? '',
    img: g.phase === 'question' || g.phase === 'reveal' ? (q.img ?? '') : '',
    suf: q.suf ?? '',
    q: g.q,
    total: g.questions.length,
    text: g.phase === 'lobby' ? '' : q.text,
    choices: g.phase === 'lobby' ? [] : q.choices,
    remaining: g.phase === 'question' ? Math.max(0, g.startAt + q.time * 1000 - Date.now()) : 0,
    answer: shown ? q.answer : null,
    board: Boolean(g.showBoard),
    counts: shown && !isNum ? counts(g) : null,
    players,
  };
}
