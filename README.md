# Trivia Party

Live multiplayer trivia for parties. The host runs the game on a TV/laptop; players join from their phone browser with a PIN or QR code. No app install.

## How it works

- **Host** (`/host`): writes questions, shows the PIN + QR, runs the game, and owns all game state and scoring.
- **Players** (`/`): enter PIN + nickname, answer on their phone.
- **Realtime**: Supabase Realtime broadcast channel per game (`trivia-<pin>`). No database tables.
  - phone → host: `join`, `answer`
  - host → phones: `state` (on every change + 3s heartbeat)
- Scoring: correct answers earn 500–1000 points depending on speed.
- Host refresh resumes the game (saved in localStorage). Phone refresh rejoins with score kept.

## Question format

```
What is the largest planet?
- Saturn
* Jupiter
- Neptune
- Earth

A tomato is a fruit.
* True
- False
```

Blank line between questions, 2–4 choices, `*` marks the correct one.

**Closest-guess (price) rounds:** give a single `=` line instead of choices. Players type a number; the closest guess gets 1000 points, everyone else up to 500 based on how close they were.

```
What was the launch price of the original 4GB iPhone?
= $499

How tall is the Eiffel Tower?
= 330 m
```

## Pictures

In **Preview**, upload a picture (or paste an image link) for any question and choose **Side** (right, ~55% of the screen) or **Top** (centered above, ~half the screen height). Phones show a smaller copy. In the question text it is stored as `@image <url> side|top`.

Uploads need the storage bucket: run `supabase/trivia_images.sql` once in the SQL Editor. Pasted links work without it.

## Leaderboard

Shown between questions and at the end: bar chart for the top 3, plus a scrollable list of every player. The host can also open it any time from the **Leaderboard** button in the top bar.

## Themes

Party, Neutral, Blue, Pink, Festive. Pick on the setup screen or switch mid-game from the header; phones follow the host.

## Saved quizzes (optional)

Run `supabase/trivia_quizzes.sql` in your project's SQL Editor to enable Save / Load saved quiz.

## Setup

1. Create a free project at [supabase.com](https://supabase.com) (Realtime is on by default).
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable (anon) key from **Project Settings → API**.
3. Run:

```bash
npm install
npm run dev
```

## Deploy (Vercel)

1. Import the repo in Vercel (framework: Vite).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
3. Deploy. Open `https://<your-app>/host` on the TV; players scan the QR.

`vercel.json` (and `public/_redirects` for Netlify) handle the `/host` route.
