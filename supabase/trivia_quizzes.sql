-- Saved question sets for Trivia Party. Run once in the Supabase SQL Editor.
create table if not exists public.trivia_quizzes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  questions text not null check (char_length(questions) <= 50000),
  theme text not null default 'party' check (theme in ('party','neutral','ocean','pink','festive')),
  time int not null default 20 check (time between 5 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trivia_quizzes enable row level security;

-- No login: anyone with the app can list, save and update quizzes. No deletes.
create policy "trivia_quizzes read" on public.trivia_quizzes for select to anon, authenticated using (true);
create policy "trivia_quizzes insert" on public.trivia_quizzes for insert to anon, authenticated with check (true);
create policy "trivia_quizzes update" on public.trivia_quizzes for update to anon, authenticated using (true) with check (true);

create or replace function public.trivia_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trivia_quizzes_touch on public.trivia_quizzes;
create trigger trivia_quizzes_touch before update on public.trivia_quizzes
for each row execute function public.trivia_touch();
