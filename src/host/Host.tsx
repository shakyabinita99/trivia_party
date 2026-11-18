import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import QRCode from 'qrcode';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { room, supabase } from '../lib/supabase';
import { parse, QUESTIONS_KEY, SAMPLE } from '../lib/questions';
import type { AnswerMsg, JoinMsg } from '../lib/types';
import { store, useNow } from '../lib/util';
import Choices from '../Choices';
import { advance, answer, counts, join, kick, newGame, publicState, ranked, replay, reveal, type Game } from './game';

const GAME_KEY = 'trivia-host-game';
type SetGame = Dispatch<SetStateAction<Game | null>>;

export default function Host() {
  const [game, setGame] = useState<Game | null>(() => store.get<Game>(GAME_KEY));

  const exit = () => {
    if (!confirm('End this game for everyone?')) return;
    store.del(GAME_KEY);
    setGame(null);
  };

  return game ? <Room game={game} setGame={setGame} onExit={exit} /> : <Setup onCreate={(qs) => setGame(newGame(qs))} />;
}

function Setup({ onCreate }: { onCreate: (qs: Game['questions']) => void }) {
  const [src, setSrc] = useState(() => store.get<string>(QUESTIONS_KEY) ?? SAMPLE);
  const [time, setTime] = useState(20);
  const { qs, err } = useMemo(() => parse(src, time), [src, time]);

  useEffect(() => store.set(QUESTIONS_KEY, src), [src]);

  return (
    <main className="page setup">
      <h1 className="brand">Trivia Party</h1>
      <div className="card">
        <div className="row">
          <h2>Questions</h2>
          <label className="muted">
            Time per question{' '}
            <select value={time} onChange={(e) => setTime(Number(e.target.value))}>
              {[10, 15, 20, 30, 45, 60].map((s) => (
                <option key={s} value={s}>
                  {s}s
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted small">
          One question per block, blank line between questions. Start choices with <code>-</code>, mark the correct
          one with <code>*</code>. 2–4 choices each.
        </p>
        <textarea value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} rows={18} />
        <div className="row">
          <span className={err ? 'error' : 'ok'}>{err ?? `${qs.length} questions ready`}</span>
          <span className="gap">
            <button className="ghost" onClick={() => confirm('Replace with sample questions?') && setSrc(SAMPLE)}>
              Load sample
            </button>
            <button disabled={!!err} onClick={() => onCreate(qs)}>
              Create game
            </button>
          </span>
        </div>
      </div>
    </main>
  );
}

function Room({ game, setGame, onExit }: { game: Game; setGame: SetGame; onExit: () => void }) {
  const chan = useRef<RealtimeChannel | null>(null);
  const ref = useRef(game);
  ref.current = game;
  const [live, setLive] = useState(false);
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
      .subscribe((s) => setLive(s === 'SUBSCRIBED'));
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
  const go = () => setGame((g) => g && advance(g));
  const pinText = `${game.pin.slice(0, 3)} ${game.pin.slice(3)}`;

  return (
    <main className="page host">
      <header className="top">
        <span className="brand sm">Trivia Party</span>
        <span className="muted">
          PIN <b>{pinText}</b> · {list.length} players {!live && <span className="error">· connecting…</span>}
        </span>
        <button className="ghost sm" onClick={onExit}>
          End game
        </button>
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
          <Choices
            choices={q.choices}
            answer={game.phase === 'reveal' ? q.answer : null}
            counts={game.phase === 'reveal' ? counts(game) : null}
          />
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
