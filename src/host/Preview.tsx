import { useEffect, useRef, useState } from 'react';
import Choices from '../Choices';
import Framed from '../Framed';
import GuessForm from '../GuessForm';
import { uploadImage } from '../lib/images';
import { fmtNum, LETTERS, type ImgPos, type Question } from '../lib/types';

type Props = {
  qs: Question[];
  onImage: (i: number, img: string | null, pos?: ImgPos) => void;
  onClose: () => void;
};

/** Walk through the quiz as the TV and phones will show it. Arrows: navigate, Space: answer, Esc: close. */
export default function Preview({ qs, onImage, onClose }: Props) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const q = qs[Math.min(i, qs.length - 1)];
  const isNum = q.kind === 'number';
  const revealed = shown || pick !== null;

  const go = (d: number) => {
    setI((n) => Math.min(Math.max(n + d, 0), qs.length - 1));
    setShown(false);
    setPick(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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

      <ImageBar key={i} q={q} n={i + 1} onChange={(img, pos) => onImage(i, img, pos)} />

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
          <Framed q={q}>
            <h1 className="qtext">{q.text}</h1>
            {isNum ? (
              revealed ? (
                <div className="actual">
                  <span className="muted">Actual</span>
                  <b>{fmtNum(q.answer, q.pre, q.suf)}</b>
                </div>
              ) : (
                <p className="guess-hint">Type your closest guess on your phone!</p>
              )
            ) : (
              <Choices choices={q.choices} answer={revealed ? q.answer : null} />
            )}
          </Framed>
        </section>

        <section className="phone">
          <p className="frame-label muted small">Player's phone</p>
          <div className="bar">
            <span className="muted small">
              Q {i + 1}/{qs.length}
            </span>
            <span className="timer sm">{q.time}</span>
          </div>
          {pick !== null ? (
            <PhoneResult q={q} pick={pick} onRetry={() => setPick(null)} />
          ) : (
            <>
              {q.img && <img className="pimg" src={q.img} alt="" />}
              <p className="ptext">{q.text}</p>
              {isNum ? (
                <GuessForm key={i} pre={q.pre ?? ''} suf={q.suf ?? ''} onSubmit={setPick} autoFocus={false} />
              ) : shown ? (
                <Choices choices={q.choices} picked={q.answer} />
              ) : (
                <Choices choices={q.choices} onPick={setPick} />
              )}
            </>
          )}
        </section>
      </div>
      <p className="muted small center">Answer on the phone to see what players see · ← → to move · Space to show the answer · Esc to close</p>
    </main>
  );
}

/** The result screen a player sees after the reveal, for a single test answer. */
function PhoneResult({ q, pick, onRetry }: { q: Question; pick: number; onRetry: () => void }) {
  let cls: string, title: string, pts: string, line;
  if (q.kind === 'number') {
    const err = Math.abs(pick - q.answer);
    const near = Math.round(500 * Math.max(0, 1 - err / Math.max(Math.abs(q.answer), 1)));
    cls = err === 0 ? 'good' : near ? 'near' : 'bad';
    title = err === 0 ? 'Spot on!' : `Off by ${fmtNum(err, q.pre, q.suf)}`;
    pts = err === 0 ? '+1000' : `+${near}`;
    line = (
      <>
        Actual <b>{fmtNum(q.answer, q.pre, q.suf)}</b> · you guessed {fmtNum(pick, q.pre, q.suf)}
      </>
    );
  } else {
    const ok = pick === q.answer;
    cls = ok ? 'good' : 'bad';
    title = ok ? 'Correct!' : 'Not quite';
    pts = ok ? '+1000' : '+0';
    line = (
      <>
        Answer:{' '}
        <b>
          {LETTERS[q.answer]} · {q.choices[q.answer]}
        </b>
        {!ok && <> · you picked {LETTERS[pick]}</>}
      </>
    );
  }
  return (
    <>
      <div className={`result ${cls}`}>
        <h2>{title}</h2>
        <p className="big">{pts}</p>
        <p className="answer-line">{line}</p>
      </div>
      <p className="muted small">
        {q.kind === 'number'
          ? 'In the game the closest guess in the room gets 1000 instead; everyone else gets up to 500 by how close they were.'
          : 'In the game a correct answer scores 500–1000; the faster, the more.'}
      </p>
      <button className="ghost sm" onClick={onRetry}>
        Try again
      </button>
    </>
  );
}

/** Accepts a direct image link, or a Google Images result link (extracts its `imgurl`). */
function imageLink(raw: string): string | null {
  const t = raw.trim();
  try {
    const u = new URL(t);
    const inner = u.searchParams.get('imgurl') ?? u.searchParams.get('mediaurl');
    const link = inner ? new URL(inner).href : u.href;
    return /^https?:$/.test(new URL(link).protocol) ? link : null;
  } catch {
    return null;
  }
}

/** Resolves if the URL loads as an image in the browser. */
const loads = (src: string) =>
  new Promise<boolean>((ok) => {
    const img = new Image();
    const t = setTimeout(() => ok(false), 10000);
    img.onload = () => (clearTimeout(t), ok(true));
    img.onerror = () => (clearTimeout(t), ok(false));
    img.src = src;
  });

/**
 * Search terms: the product name for price questions; otherwise the correct answer (or a short
 * version of the question when the answer is just a number) plus "funny baby".
 */
function searchTerms(q: Question): string {
  const product = /^what is the price of (?:an? )?(.+?)\??$/i.exec(q.text)?.[1];
  if (product) return product;
  if (q.kind === 'number') return q.text.replace(/\?$/, '');
  const ans = q.choices[q.answer] ?? '';
  const topic =
    /[a-z]{3,}/i.test(ans) && !/\d/.test(ans) && ans.length <= 30
      ? ans
      : q.text
          .replace(/[?"“”]/g, '')
          .split(/\s+/)
          .slice(0, 8)
          .join(' ');
  return `${topic} funny baby`;
}

function ImageBar({
  q,
  n,
  onChange,
}: {
  q: Question;
  n: number;
  onChange: (img: string | null, pos?: ImgPos) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const pos = q.pos ?? 'side';

  const upload = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setMsg('Uploading…');
    try {
      onChange(await uploadImage(f), pos);
      setMsg('');
    } catch (e) {
      const why = (e instanceof Error ? e.message : 'Upload failed').replace(/\.?$/, '.');
      setMsg(
        f.name === 'pasted'
          ? `${why} Or click the picture on Google first, then right-click the big one → "Copy image address".`
          : why,
      );
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  };

  const useLink = async (raw: string) => {
    const link = imageLink(raw);
    if (!link) return setMsg('That is not a link. Right-click a picture and choose "Copy image address".');
    setBusy(true);
    setMsg('Checking picture…');
    const ok = await loads(link);
    setBusy(false);
    if (!ok)
      return setMsg('That link is not a picture (or the site blocks it). Try "Copy image address" on another one.');
    onChange(link, pos);
    setUrl('');
    setMsg('');
  };

  /** A copied picture (or a data: link, which Google Images gives for thumbnails) is uploaded. */
  const useImage = async (blob: Blob) => {
    await upload(new File([blob], 'pasted', { type: blob.type || 'image/png' }));
  };

  const useText = async (raw: string) => {
    const t = raw.trim();
    if (/^data:image\//i.test(t)) return useImage(await (await fetch(t)).blob());
    return useLink(t);
  };

  const paste = async () => {
    try {
      if (navigator.clipboard.read) {
        for (const item of await navigator.clipboard.read()) {
          const type = item.types.find((t) => t.startsWith('image/'));
          if (type) return await useImage(await item.getType(type));
          if (item.types.includes('text/plain'))
            return await useText(await (await item.getType('text/plain')).text());
        }
        return setMsg('The clipboard is empty. Right-click a picture and choose "Copy image address" first.');
      }
      await useText(await navigator.clipboard.readText());
    } catch {
      setMsg('Could not read the clipboard. Click the box below and press Ctrl/Cmd+V instead.');
    }
  };

  /** Ctrl/Cmd+V anywhere on the preview (or in the link box) uses whatever was copied. */
  const onPaste = (e: ClipboardEvent | React.ClipboardEvent) => {
    const d = e.clipboardData;
    if (!d) return;
    const f = [...d.files].find((x) => x.type.startsWith('image/'));
    const text = d.getData('text/plain');
    if (!f && !text.trim()) return;
    e.preventDefault();
    if (f) void upload(f);
    else void useText(text);
  };
  const pasteRef = useRef(onPaste);
  pasteRef.current = onPaste;
  useEffect(() => {
    const h = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      pasteRef.current(e);
    };
    window.addEventListener('paste', h);
    return () => window.removeEventListener('paste', h);
  }, []);

  const find = () =>
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchTerms(q))}`, '_blank', 'noopener');

  return (
    <div className="card img-bar">
      <b className="small">Picture for question {n}</b>
      <button className="ghost sm" onClick={find} title={`Search images for "${searchTerms(q)}"`}>
        Find picture ↗
      </button>
      <button className="ghost sm" disabled={busy} onClick={() => void paste()}>
        Paste link
      </button>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      <button className="ghost sm" disabled={busy} onClick={() => file.current?.click()}>
        Upload
      </button>
      <input
        className="img-url"
        placeholder="…or paste an image link here"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => e.key === 'Enter' && void useText(url)}
      />
      {url && (
        <button className="ghost sm" disabled={busy} onClick={() => void useText(url)}>
          Use link
        </button>
      )}
      {q.img && (
        <>
          <span className="seg">
            {(['side', 'top'] as const).map((p) => (
              <button key={p} className={`sm ${pos === p ? '' : 'ghost'}`} onClick={() => onChange(q.img!, p)}>
                {p === 'side' ? 'Side' : 'Top'}
              </button>
            ))}
          </span>
          <button className="ghost sm" onClick={() => onChange(null)}>
            Remove
          </button>
        </>
      )}
      {msg && <span className={busy ? 'muted small' : 'error small'}>{msg}</span>}
      <span className="muted small hint">
        Tip: Find picture → right-click an image → "Copy image address" → Paste link.
      </span>
    </div>
  );
}
