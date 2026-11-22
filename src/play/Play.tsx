import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { room, supabase } from '../lib/supabase';
import { fmtNum, LETTERS, type PubState } from '../lib/types';
import { ordinal, playerId, store, useNow } from '../lib/util';
import Choices from '../Choices';
import { applyTheme } from '../lib/themes';

const SESSION_KEY = 'trivia-session';
type Session = { pin: string; name: string };

export default function Play() {
  const [session, setSession] = useState<Session | null>(() => store.get<Session>(SESSION_KEY));
  const [error, setError] = useState('');

  const leave = (msg = '') => {
    store.del(SESSION_KEY);
    setError(msg);
    setSession(null);
  };

  if (session) return <Live session={session} onLeave={leave} />;
  return (
    <Join
      error={error}
      onJoin={(s) => {
        store.set(SESSION_KEY, s);
        setError('');
        setSession(s);
      }}
    />
  );
}

function Join({ error, onJoin }: { error: string; onJoin: (s: Session) => void }) {
  const [pin, setPin] = useState(() => new URLSearchParams(location.search).get('pin')?.replace(/\D/g, '') ?? '');
  const [name, setName] = useState(() => store.get<string>('trivia-name') ?? '');
  const valid = /^\d{6}$/.test(pin) && name.trim().length > 0;

  return (
    <main className="page join-page">
      <h1 className="brand">Trivia Party</h1>
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          store.set('trivia-name', name.trim());
          onJoin({ pin, name: name.trim() });
        }}
      >
        <input
          inputMode="numeric"
          autoComplete="off"
          placeholder="Game PIN"
          value={pin}
          maxLength={6}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        />
        <input
          placeholder="Your nickname"
          value={name}
          maxLength={20}
          autoComplete="nickname"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={!valid}>
          Join
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <a className="muted small host-link" href="/host">
        Hosting? Open the host screen
      </a>
    </main>
  );
}

function Live({ session, onLeave }: { session: Session; onLeave: (msg?: string) => void }) {
  const id = playerId();
  const [st, setSt] = useState<PubState | null>(null);
  const [deadline, setDeadline] = useState(0);
  const [picked, setPicked] = useState<{ q: number; c: number } | null>(null);
  const chan = useRef<RealtimeChannel | null>(null);
  const stRef = useRef<PubState | null>(null);
  const misses = useRef(0);
  const subscribed = useRef(false);
  const netErr = useRef('');
  const leaveRef = useRef(onLeave);
  leaveRef.current = onLeave;

  useEffect(() => {
    const ch = supabase!.channel(room(session.pin), { config: { broadcast: { self: false } } });
    const sendJoin = () => void ch.send({ type: 'broadcast', event: 'join', payload: { id, name: session.name } });

    ch.on('broadcast', { event: 'state' }, ({ payload }) => {
      const s = payload as PubState;
      stRef.current = s;
      if (s.players[id]) misses.current = 0;
      setSt(s);
      applyTheme(s.theme);
      store.set('trivia-theme', s.theme);
      setDeadline(s.phase === 'question' ? Date.now() + s.remaining : 0);
    }).subscribe((status, err) => {
      subscribed.current = status === 'SUBSCRIBED';
      if (subscribed.current) sendJoin();
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        netErr.current = err?.message || status;
        console.error('Realtime', status, err);
      }
    });
    chan.current = ch;

    // Retry join until the host lists us; give up if the PIN is wrong or we were removed.
    const t = setInterval(() => {
      const s = stRef.current;
      if (s?.players[id]) return;
      misses.current++;
      if (misses.current >= 8) {
        leaveRef.current(
          s
            ? 'You were removed from the game.'
            : !subscribed.current
              ? `Can't connect to the game server${netErr.current ? ` (${netErr.current})` : ''}.`
              : 'Game not found. Check the PIN and that the host screen is open.',
        );
        return;
      }
      sendJoin();
    }, 2000);

    return () => {
      clearInterval(t);
      supabase!.removeChannel(ch);
    };
  }, [id, session.pin, session.name]);

  const now = useNow(st?.phase === 'question');
  const me = st?.players[id];

  if (!st || !me) {
    return (
      <Shell name={session.name} onLeave={() => onLeave()}>
        <div className="spinner" />
        <p className="muted">Joining game {session.pin}…</p>
      </Shell>
    );
  }

  const pick = (c: number) => {
    setPicked({ q: st.q, c });
    void chan.current?.send({ type: 'broadcast', event: 'answer', payload: { id, q: st.q, choice: c } });
  };
  const myPick = picked?.q === st.q ? picked.c : null;
  const left = Math.max(0, Math.ceil((deadline - now) / 1000));

  return (
    <Shell name={me.name} score={me.score} onLeave={() => confirm('Leave the game?') && onLeave()}>
      {st.phase === 'lobby' && (
        <>
          <h2>You're in!</h2>
          <p className="muted">Look for your name on the big screen.</p>
        </>
      )}

      {st.phase === 'question' &&
        (me.voted || myPick !== null ? (
          <>
            <h2>Answer locked in</h2>
            <p className="muted">Waiting for the others…</p>
            {myPick !== null &&
              (st.kind === 'number' ? (
                <p className="big">{fmtNum(myPick, st.pre, st.suf)}</p>
              ) : (
                <Choices choices={st.choices} picked={myPick} />
              ))}
          </>
        ) : (
          <>
            <div className="bar">
              <span className="muted small">
                Q {st.q + 1}/{st.total}
              </span>
              <span className={`timer sm ${left <= 5 ? 'warn' : ''}`}>{left}</span>
            </div>
            {st.img && <img className="pimg" src={st.img} alt="" />}
            <p className="ptext">{st.text}</p>
            {st.kind === 'number' ? (
              <GuessForm key={st.q} pre={st.pre} suf={st.suf} onSubmit={pick} />
            ) : (
              <Choices choices={st.choices} onPick={pick} />
            )}
          </>
        ))}

      {(st.phase === 'reveal' || st.phase === 'board') && (
        <>
          <div className={`result ${me.ok ? 'good' : st.kind === 'number' && me.pts ? 'near' : 'bad'}`}>
            <h2>
              {st.kind === 'number'
                ? me.ok
                  ? 'Closest!'
                  : me.voted
                    ? `${ordinal(me.place)} closest`
                    : "Time's up"
                : me.ok
                  ? 'Correct!'
                  : me.voted
                    ? 'Not quite'
                    : "Time's up"}
            </h2>
            <p className="big">+{me.pts}</p>
            {st.answer !== null && (
              <p className="answer-line">
                {st.kind === 'number' ? (
                  <>
                    Actual <b>{fmtNum(st.answer, st.pre, st.suf)}</b>
                    {me.guess !== null && <> · you guessed {fmtNum(me.guess, st.pre, st.suf)}</>}
                  </>
                ) : (
                  <>
                    Answer:{' '}
                    <b>
                      {LETTERS[st.answer]} · {st.choices[st.answer]}
                    </b>
                  </>
                )}
              </p>
            )}
            <p>
              {ordinal(me.rank)} place · {me.score} pts
            </p>
          </div>
          {st.phase === 'board' && <p className="muted">Next question coming up…</p>}
        </>
      )}

      {st.phase === 'end' && (
        <>
          <h2>{me.rank <= 3 ? ['🥇', '🥈', '🥉'][me.rank - 1] : '🎉'}</h2>
          <h2>You finished {ordinal(me.rank)}</h2>
          <p className="big">{me.score}</p>
        </>
      )}
    </Shell>
  );
}

function GuessForm({ pre, suf, onSubmit }: { pre: string; suf: string; onSubmit: (n: number) => void }) {
  const [v, setV] = useState('');
  const n = Number(v.replace(/,/g, ''));
  const valid = v.trim() !== '' && Number.isFinite(n) && Math.abs(n) <= 1e12;
  return (
    <form
      className="guess"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(n);
      }}
    >
      <div className="guess-input">
        {pre && <span>{pre}</span>}
        <input
          autoFocus
          inputMode="decimal"
          placeholder="Your guess"
          value={v}
          onChange={(e) => setV(e.target.value.replace(/[^\d.,-]/g, ''))}
        />
        {suf && <span>{suf}</span>}
      </div>
      <button type="submit" disabled={!valid}>
        Lock in
      </button>
    </form>
  );
}

function Shell({
  name,
  score,
  onLeave,
  children,
}: {
  name: string;
  score?: number;
  onLeave: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="page player">
      <header className="top">
        <b>{name}</b>
        {score !== undefined && <span className="pill">{score}</span>}
        <button className="ghost sm" onClick={onLeave}>
          Leave
        </button>
      </header>
      <section className="pbody">{children}</section>
    </main>
  );
}
