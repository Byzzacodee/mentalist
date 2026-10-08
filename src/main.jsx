import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ---- Telegram Mini App bootstrap (dynamic import: can never kill the bundle) ----
(async () => {
  try {
    const sdk = await import('@twa-dev/sdk');
    if (typeof sdk.init === 'function') sdk.init();
  } catch {
    /* not in Telegram or SDK unavailable */
  }
  try {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  } catch {
    /* not in Telegram */
  }
})();

// ---- Visible fatal-error surface: never a silent black screen ----
function showFatalError(title, err) {
  const root = document.getElementById('root');
  if (root && !root.dataset.ok) {
    const msg = String((err && err.stack) || err || 'unknown');
    root.innerHTML =
      `<div style="min-height:100vh;background:#0b0c0e;color:#f87171;font-family:'JetBrains Mono',monospace;font-size:12px;padding:24px;white-space:pre-wrap;line-height:1.6">` +
      `<div style="color:#fafafa;font-size:15px;font-weight:700;letter-spacing:.1em;margin-bottom:12px">MENTALIST // FATAL ERROR</div>` +
      `<div style="color:#d97706;margin-bottom:8px">${title}</div>` +
      `<div style="color:#a1a1aa;max-width:900px">${msg.replace(/</g, '&lt;')}</div>` +
      `</div>`;
  }
}

window.addEventListener('error', (e) => showFatalError('RUNTIME ERROR', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => showFatalError('UNHANDLED PROMISE', e.reason));

class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err) {
    showFatalError('REACT RENDER ERROR', err);
  }
  render() {
    if (this.state.err) {
      const msg = String(this.state.err && this.state.err.stack ? this.state.err.stack : this.state.err);
      return (
        <div style={{ minHeight: '100vh', background: '#0b0c0e', color: '#f87171', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, padding: 24, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          <div style={{ color: '#fafafa', fontSize: 15, fontWeight: 700, letterSpacing: '.1em', marginBottom: 12 }}>
            MENTALIST // FATAL ERROR
          </div>
          <div style={{ color: '#d97706', marginBottom: 8 }}>REACT RENDER ERROR</div>
          <div style={{ color: '#a1a1aa', maxWidth: 900 }}>{msg}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Mark successful mount (first paint done)
requestAnimationFrame(() => {
  if (rootEl) rootEl.dataset.ok = '1';
});
