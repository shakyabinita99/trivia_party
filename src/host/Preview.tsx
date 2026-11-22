import { useEffect, useRef, useState } from 'react';
import Choices from '../Choices';
import Framed from '../Framed';
import { uploadImage } from '../lib/images';
import { fmtNum, type ImgPos, type Question } from '../lib/types';

type Props = {
  qs: Question[];
  onImage: (i: number, img: string | null, pos?: ImgPos) => void;
  onClose: () => void;
};

/** Walk through the quiz as the TV and phones will show it. Arrows: navigate, Space: answer, Esc: close. */
export default function Preview({ qs, onImage, onClose }: Props) {
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
          {q.img && <img className="pimg" src={q.img} alt="" />}
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
      setMsg(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  };

  const useLink = () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) return setMsg('Paste a full link starting with https://');
    onChange(u, pos);
    setUrl('');
    setMsg('');
  };

  return (
    <div className="card img-bar">
      <b className="small">Picture for question {n}</b>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      <button className="ghost sm" disabled={busy} onClick={() => file.current?.click()}>
        {q.img ? 'Replace picture' : 'Upload picture'}
      </button>
      <input
        className="img-url"
        placeholder="…or paste an image link"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && useLink()}
      />
      {url && (
        <button className="ghost sm" onClick={useLink}>
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
    </div>
  );
}
