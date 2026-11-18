import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import Host from './host/Host';
import Play from './play/Play';
import { applyTheme } from './lib/themes';
import { store } from './lib/util';
import './styles.css';

applyTheme(store.get('trivia-theme'));

function App() {
  if (!supabase) {
    return (
      <main className="page join-page">
        <h1 className="brand">Trivia Party</h1>
        <div className="card">
          <p>
            Missing Supabase config. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </main>
    );
  }
  return location.pathname.startsWith('/host') ? <Host /> : <Play />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
