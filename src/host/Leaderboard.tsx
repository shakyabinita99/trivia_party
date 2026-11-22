const MEDALS = ['🥇', '🥈', '🥉'];

type Row = { id: string; name: string; score: number };

/** Bar chart for the top 3 plus a scrollable list of every player. */
export default function Leaderboard({ list, last = {} }: { list: Row[]; last?: Record<string, number> }) {
  const rank = (p: Row) => 1 + list.filter((o) => o.score > p.score).length;
  const top = list.slice(0, 3);
  const max = Math.max(1, ...top.map((p) => p.score));

  if (!list.length) return <p className="muted center">No players yet.</p>;

  return (
    <div className="lb">
      <div className="bars">
        {[1, 0, 2].map((i) => {
          const p = top[i];
          if (!p) return null;
          return (
            <div key={p.id} className={`bar-col r${i + 1}`}>
              <span className="pname">{p.name}</span>
              <div className="lbar" style={{ height: `${Math.max(12, (p.score / max) * 100)}%` }}>
                <span className="medal">{MEDALS[rank(p) - 1] ?? rank(p)}</span>
                <b>{p.score}</b>
              </div>
            </div>
          );
        })}
      </div>

      <ol className="all">
        {list.map((p) => (
          <li key={p.id} className={rank(p) <= 3 ? 'top' : ''}>
            <span className="rk">{rank(p)}</span>
            <span className="nm">{p.name}</span>
            <span className="muted small">{last[p.id] ? `+${last[p.id]}` : ''}</span>
            <b>{p.score}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
