import React from 'react';
import ReactDOM from 'react-dom/client';
import { init as tgInit } from '@twa-dev/sdk';
import App from './App.jsx';
import './index.css';

// Telegram Mini App bootstrap (no-op outside Telegram clients)
try {
  tgInit();
} catch {
  /* not in Telegram */
}
try {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
} catch {
  /* not in Telegram */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
