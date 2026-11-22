# Handoff — Trivia Party

Live multiplayer trivia for a ~22-person baby shower. Host runs the game on a TV/laptop; guests play in their phone browser (no install). Repo: `shakyabinita99/trivia_party` (branch `main`, auto-deploys to Vercel).

## Status

Deployed on Vercel and connected to Supabase project `wnivkmcwgryjbzneucaa`. Saving quizzes confirmed working by the user. All features below pass local end-to-end tests (Playwright + a local WebSocket relay standing in for Supabase Realtime); the cloud sandbox cannot reach Supabase, so live realtime was verified only by the user.

## Completed

- **Game flow** (`/host` + `/`): PIN + QR join, lobby (click name to kick), timed questions, auto-reveal when all answer, leaderboard between questions, final results, Play again.
- **Question types** (text format, see README):
  - Multiple choice: `-` wrong, `*` correct, 2–4 choices. Score 500–1000 by speed.
  - Closest guess / price: single `= $499` line (prefix/suffix units). Closest (ties) = 1000, others ≤500 by accuracy; scored at reveal.
  - Optional `@image <url> side|top` line per question.
- **Phones after each question** (reveal + leaderboard phases): right/wrong, `+points`, correct answer, rank and total.
- **Leaderboard**: top-3 bar chart with medals + scrollable list of all players. Auto between questions/end; header **Leaderboard** button opens it any time (overlay).
- **Themes**: Party, Neutral, Blue (`ocean`), Pink, Festive. Host picks on setup or mid-game; phones follow via broadcast state.
- **Preview** (setup → Preview): big-screen + phone mock per question, Show answer, ←/→/Space/Esc. Picture editor: **Find picture** (Google Images search: product name for price Qs, answer + "funny baby" for trivia), **Paste link** (clipboard, Google `imgres` links unwrapped, link verified to load), Upload (Supabase Storage), Side/Top, Remove.
- **Saved quizzes** in Supabase table `trivia_quizzes` (upsert by name) + **Templates** in code: "Baby Shower: Price Is Right" (31 Qs) and "Baby Shower Trivia" (25 Qs).
- Robustness: host state persisted in localStorage (refresh resumes); phone refresh rejoins with score; duplicate names get suffixes; 3s state heartbeat; connection errors shown on both screens.

## Pending / next steps

1. **Run `supabase/trivia_images.sql`** in project `wnivkmcwgryjbzneucaa` if picture *uploads* are wanted (pasted links work without it). Not confirmed run.
2. **Add pictures** to the two templates (user, via Preview → Find picture → Paste link), then **Save** each.
3. **Live dry run** before the party: host on the short production domain + 2–3 phones; play one price and one trivia question.
4. Optional ideas not built: sound effects, hiding question text on phones, per-question time override in text format, deleting saved quizzes from the UI.

## Architecture

- **Frontend**: Vite + React 18 + TypeScript, no router (path check in `src/main.tsx`). Deps: `@supabase/supabase-js`, `qrcode`.
- **Realtime**: one Supabase broadcast channel per game, `trivia-<pin>`. No DB for game state.
  - phone → host: `join {id,name}`, `answer {id,q,choice}` (choice = index, or the guess number for price Qs)
  - host → phones: `state` (`PubState`) on every change + every 3s
- **Host is authoritative**: all state and scoring live in the host browser (`src/host/game.ts`, pure reducer-style functions).
- **Data flow**: phone event → `setGame(g => join/answer(g, msg))` → effect persists to localStorage + broadcasts `publicState(g)` → phones render from `PubState`.
- **DB** (Supabase): `trivia_quizzes` (name unique, questions text, theme, time; RLS: anon select/insert/update, no delete). Storage bucket `trivia-images` (public read, anon insert).

## Key files

| File | Purpose |
| --- | --- |
| `src/host/game.ts` | Game state, join/answer/reveal/advance, scoring, `publicState` |
| `src/host/Host.tsx` | Setup screen (themes, quiz load/save, templates) + live host Room |
| `src/host/Preview.tsx` | Preview + picture editor (`ImageBar`) |
| `src/host/Leaderboard.tsx` | Top-3 chart + full list |
| `src/play/Play.tsx` | Phone join + live player screens, `GuessForm` |
| `src/lib/questions.ts` | Text-format parser, `setImage`, sample quiz |
| `src/lib/presets.ts` | Baby shower templates |
| `src/lib/types.ts` | `Question`, `PubState`, message types, `fmtNum` |
| `src/lib/themes.ts`, `src/styles.css` | Themes (CSS variables on `html[data-theme]`) and all styles |
| `src/lib/images.ts`, `src/Framed.tsx` | Upload/compress to Storage; picture layout (side/top) |
| `supabase/*.sql` | Table + storage setup to paste into SQL Editor |

## Constraints & decisions

- Website, not an app (no installs for guests).
- Original look: lettered A–D answers and own palettes (no Kahoot shapes/colors).
- Commits authored as `shakyabinita99`, **no AI attribution** in commits.
- Env vars (Vercel + local `.env.local`, gitignored): `VITE_SUPABASE_URL=https://wnivkmcwgryjbzneucaa.supabase.co`, `VITE_SUPABASE_ANON_KEY=<publishable key>`.
- Do **not** use the "StockNews" Supabase project (`vcbsretmdttpwyjgdcya`); a stray table created there was removed.
- The Claude Supabase connector only sees StockNews; the trivia project must be changed by the user via SQL Editor (or connect that account).

## Known issues / gotchas

- **Vercel login on QR scan**: host must open the short production domain (Settings → Domains), not a per-deployment URL; or disable Vercel Authentication under Deployment Protection.
- Pasted image links can break if the source site removes/blocks them; uploads (after `trivia_images.sql`) are the durable option.
- Free Supabase projects pause after inactivity → "Failed to fetch". Restore in dashboard.
- Realtime requires Supabase Realtime "Allow public access" (public channels).
- If the host closes the tab, phones stall until it reopens (state resumes from localStorage).

## Testing

`npm ci && npm run build` (type-check + build). There is no committed test suite; E2E checks were run ad hoc with Playwright against a build where `src/lib/supabase.ts` is aliased to a local WebSocket relay mock (broadcast by room) with stubbed `from()`/`storage`.
