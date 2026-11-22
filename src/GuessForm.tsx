import { useState } from 'react';

/** Number input + Lock in button for closest-guess questions. */
export default function GuessForm({
  pre,
  suf,
  onSubmit,
  autoFocus = true,
}: {
  pre: string;
  suf: string;
  onSubmit: (n: number) => void;
  autoFocus?: boolean;
}) {
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
          autoFocus={autoFocus}
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
