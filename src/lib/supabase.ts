import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 30 } },
      })
    : null;

export const room = (pin: string) => `trivia-${pin}`;
