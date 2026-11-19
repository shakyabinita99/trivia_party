import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import QRCode from 'qrcode';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { room, supabase } from '../lib/supabase';
import { parse, QUESTIONS_KEY, SAMPLE } from '../lib/questions';
import { fmtNum, type AnswerMsg, type JoinMsg, type Question } from '../lib/types';
import { applyTheme, isTheme, THEMES, type ThemeId } from '../lib/themes';
import { store, useNow } from '../lib/util';
import Choices from '../Choices';
import {
  advance,
  answer,
  counts,
  guesses,
  join,
  kick,
  newGame,
  publicState,
  ranked,
  replay,
  reveal,
  type Game,
} from './game';

const GAME_KEY = 'trivia-host-game';
type SetGame = Dispatch<SetStateAction<Game | null>>;

export default function Host() {
  const [game, setGame] = useState<Game | null>(() => store.get<Game>(GAME_KEY));

  const exit = () => {
    if (!confirm('End this game for everyone?')) return;
    store.del(GAME_KEY);
    setGame(null);
  };

  return game ? (
    <Room game={game} setGame={setGame} onExit={exit} />
  ) : (
    <Setup onCreate={(qs, theme) => setGame(newGame(qs, theme))} />
  );
}

type Saved = { id: string; name: string; questions: string; theme: ThemeId; time: number };

function Setup({ onCreate }: { onCreate: (qs: Question[], theme: ThemeId) => void }) {
  const [src, setSrc] = useState(() => store.get<string>(QUESTIONS_KEY) ?? SAMPLE);
  const [name, setName] = useState(() => store.get<string>('trivia-quiz-name') ?? 'General Knowledge');
  const [theme, setTheme] = useState<ThemeId>(() => {
    const t = store.get<string>('trivia-theme');
    return isTheme(t) ? t : 'party';
  });
  const [time, setTime] = useState(20);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [msg, setMsg] = useState('');
  const { qs, err } = useMemo(() => parse(src, time), [src, time]);

  useEffect(() => store.set(QUESTIONS_KEY, src), [src]);
  useEffect(() => store.set('trivia-quiz-name', name), [name]);
  useEffect(() => {
    applyTheme(theme);
    store.set('trivia-theme', theme);
  }, [theme]);

  const refresh = async () => {
    const { data, error } = await supabase!
      .from('trivia_quizzes')
      .select('id,name,questions,theme,time')
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) setMsg(`Couldn't load saved quizzes: ${error.message}`);
    else setSaved((data ?? []) as Saved[]);
  };
  useEffect(() => void refresh(), []);

  const load = (id: string) => {
    const quiz = saved.find((x) => x.id === id);
    if (!quiz) return;
    setSrc(quiz.questions);
    setName(quiz.name);
    setTheme(isTheme(quiz.theme) ? quiz.theme : 'party');
    setTime(quiz.time);
    setMsg(`Loaded "${quiz.name}"`);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) return setMsg('Give your quiz a name first.');
    setMsg('Saving…');
    const { error } = await supabase!
      .from('trivia_quizzes')
      .upsert({ name: n, questions: src, theme, time }, { onConflict: 'name' });
    setMsg(error ? `Save failed: ${error.message}` : `Saved "${n}"`);
    if (!error) void refresh();
  };

  return (
    <main className="page setup">
      <h1 className="brand">Trivia Party</h1>

      <div className="card">
        <h2>Theme</h2>
        <div className="themes">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`swatch ${t.id === theme ? 'on' : ''}`}
              data-swatch={t.id}
              onClick={() => setTheme(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row">
          <h2>Questions</h2>
          <span className="gap">
            <select value="" onChange={(e) => load(e.target.value)} aria-label="Load saved quiz">
              <option value="">{saved.length ? 'Load saved quiz…' : 'No saved quizzes'}</option>
              {saved.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <select value={time} onChange={(e) => setTime(Number(e.target.value))} aria-label="Time per question">
              {[10, 15, 20, 30, 45, 60].map((s) => (
                <option key={s} value={s}>
                  {s}s each
                </option>
              ))}
            </select>
          </span>
        </div>
        <input value={name} maxLength={60} placeholder="Quiz name" onChange={(e) => setName(e.target.value)} />
        <p className="muted small">
          One question per block, blank line between questions. Start choices with <code>-</code>, mark the correct
          one with <code>*</code>. 2–4 choices each. For a closest-guess (price) round, use one line like{' '}
          <code>= $499</code> instead of choices.
        </p>
        <textarea value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} rows={16} />
        <div className="row">
          <span className={err ? 'error' : 'ok'}>{err ?? `${qs.length} questions ready`}</span>
          <span className="gap">
            <button className="ghost" onClick={() => confirm('Replace with sample questions?') && setSrc(SAMPLE)}>
              Sample
            </button>
            <button className="ghost" disabled={!!err} onClick={save}>
              Save
            </button>
            <button disabled={!!err} onClick={() => onCreate(qs, theme)}>
              Create game
            </button>
          </span>
        </div>
        {msg && <p className="muted small">{msg}</p>}
      </div>
    </main>
  );
}

function Room({ game, setGame, onExit }: { game: Game; setGame: SetGame; onExit: () => void }) {
  const chan = useRef<RealtimeChannel | null>(null);
  const ref = useRef(game);
  ref.current = game;
  const [live, setLive] = useState(false);
  const [netErr, setNetErr] = useState('');
  const [qr, setQr] = useState('');

  const joinUrl = `${location.origin}/?pin=${game.pin}`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 360 }).then(setQr, () => setQr(''));
  }, [joinUrl]);

  // Channel lifecycle
  useEffect(() => {
    const ch = supabase!.channel(room(game.pin), { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'join' }, ({ payload }) => setGame((g) => g && join(g, payload as JoinMsg)))
      .on('broadcast', { event: 'answer' }, ({ payload }) => setGame((g) => g && answer(g, payload as AnswerMsg)))
      .subscribe((s, err) => {
        setLive(s === 'SUBSCRIBED');
        if (s === 'SUBSCRIBED') setNetErr('');
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
          setNetErr(err?.message || s);
          console.error('Realtime', s, err);
        }
      });
    chan.current = ch;
    return () => {
      supabase!.removeChannel(ch);
    };
  }, [game.pin, setGame]);

  // Persist + broadcast on every change, plus a heartbeat so sleeping phones resync.
  useEffect(() => {
    store.set(GAME_KEY, game);
    if (live) void chan.current?.send({ type: 'broadcast', event: 'state', payload: publicState(game) });
  }, [game, live]);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(
      () => void chan.current?.send({ type: 'broadcast', event: 'state', payload: publicState(ref.current) }),
      3000,
    );
    return () => clearInterval(t);
  }, [live]);

  useEffect(() => {
    applyTheme(game.theme);
    store.set('trivia-theme', game.theme);
  }, [game.theme]);

  // Question timer
  const q = game.questions[game.q];
  useEffect(() => {
    if (game.phase !== 'question') return;
    const t = setTimeout(() => setGame((g) => g && reveal(g)), Math.max(0, game.startAt + q.time * 1000 - Date.now()));
    return () => clearTimeout(t);
  }, [game.phase, game.startAt, q.time, setGame]);

  const now = useNow(game.phase === 'question');
  const left = Math.max(0, Math.ceil((game.startAt + q.time * 1000 - now) / 1000));
  const list = ranked(game);
  const answered = Object.keys(game.answers).filter((id) => game.players[id]).length;
  const near = q.kind === 'number' && game.phase === 'reveal' ? guesses(game) : [];
  const go = () => setGame((g) => g && advance(g));
  const pinText = `${game.pin.slice(0, 3)} ${game.pin.slice(3)}`;

  return (
    <main className="page host">
      <header className="top">
        <span className="brand sm">Trivia Party</span>
        <span className="muted">
          PIN <b>{pinText}</b> · {list.length} players {!live && <span className="error">· {netErr ? `can't connect: ${netErr}` : 'connecting…'}</span>}
        </span>
        <span className="gap">
          <select
            value={game.theme ?? 'party'}
            aria-label="Theme"
            onChange={(e) => {
              const theme = e.target.value;
              if (isTheme(theme)) setGame((g) => g && { ...g, theme });
            }}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="ghost sm" onClick={onExit}>
            End game
          </button>
        </span>
      </header>

      {game.phase === 'lobby' && (
        <section className="lobby">
          <div className="card center">
            <p className="muted">
              Join at <b className="hl">{location.host}</b> with PIN
            </p>
            <div className="pin">{pinText}</div>
            {qr && <img className="qr" src={qr} alt="QR code to join the game" />}
          </div>
          <div className="card">
            <div className="row">
              <h2>{list.length} players</h2>
              <button disabled={!list.length || !live} onClick={go}>
                Start
              </button>
            </div>
            {list.length ? (
              <div className="chips">
                {list.map((p) => (
                  <button
                    key={p.id}
                    className="chip"
                    title="Click to remove"
                    onClick={() => confirm(`Remove ${p.name}?`) && setGame((g) => g && kick(g, p.id))}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">Waiting for players…</p>
            )}
          </div>
        </section>
      )}

      {(game.phase === 'question' || game.phase === 'reveal') && (
        <section className="stage">
          <div className="bar">
            <span className="muted">
              Question {game.q + 1} / {game.questions.length}
            </span>
            {game.phase === 'question' ? (
              <span className={`timer ${left <= 5 ? 'warn' : ''}`}>{left}</span>
            ) : (
              <span />
            )}
            <span className="muted">
              {answered} / {list.length} answered
            </span>
          </div>
          <h1 className="qtext">{q.text}</h1>
          {q.kind === 'number' ? (
            game.phase === 'question' ? (
              <p className="guess-hint">Type your closest guess on your phone!</p>
            ) : (
              <div className="guess-reveal">
                <div className="actual">
                  <span className="muted">Actual</span>
                  <b>{fmtNum(q.answer, q.pre, q.suf)}</b>
                </div>
                <ol className="board">
                  {near.slice(0, 8).map((x) => (
                      <li key={x.id} className={x.err === near[0].err ? 'win' : ''}>
                        <span>{x.name}</span>
                        <span className="muted small">
                          {x.err ? `off by ${fmtNum(x.err, q.pre, q.suf)}` : 'exact!'}
                        </span>
                        <b>{fmtNum(x.guess, q.pre, q.suf)}</b>
                      </li>
                    ))}
                </ol>
                {!answered && <p className="muted">Nobody guessed.</p>}
              </div>
            )
          ) : (
            <Choices
              choices={q.choices}
              answer={game.phase === 'reveal' ? q.answer : null}
              counts={game.phase === 'reveal' ? counts(game) : null}
            />
          )}
          <div className="actions">
            <button onClick={go}>{game.phase === 'question' ? 'Skip' : 'Next'}</button>
          </div>
        </section>
      )}

      {game.phase === 'board' && (
        <section className="stage">
          <h1 className="qtext">Leaderboard</h1>
          <ol className="board">
            {list.slice(0, 5).map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                <span className="muted small">{game.last[p.id] ? `+${game.last[p.id]}` : ''}</span>
                <b>{p.score}</b>
              </li>
            ))}
          </ol>
          <div className="actions">
            <button onClick={go}>Next question</button>
          </div>
        </section>
      )}

      {game.phase === 'end' && (
        <section className="stage">
          <h1 className="qtext">Final results</h1>
          <div className="podium">
            {[1, 0, 2].map((i) =>
              list[i] ? (
                <div key={i} className={`step p${i + 1}`}>
                  <span className="pname">{list[i].name}</span>
                  <span className="muted">{list[i].score}</span>
                  <div className="block">{i + 1}</div>
                </div>
              ) : null,
            )}
          </div>
          {list.length > 3 && (
            <ol className="board rest" start={4}>
              {list.slice(3).map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span />
                  <b>{p.score}</b>
                </li>
              ))}
            </ol>
          )}
          <div className="actions">
            <button className="ghost" onClick={() => setGame((g) => g && replay(g))}>
              Play again
            </button>
            <button onClick={onExit}>New game</button>
          </div>
        </section>
      )}
    </main>
  );
}
