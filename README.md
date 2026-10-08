# MENTALIST // Tactical Command

Client-side Telegram Mini App — operational command hub combining **Mental Strategy (CBT)**,
**Counter-Manipulation**, **Long-Term Campaign Strategy**, and **Cyber/OPSEC** modules,
powered by OpenRouter.

## Stack

- Vite + React 18 + Tailwind CSS 3 + Lucide Icons
- `@twa-dev/sdk` — Telegram Mini App bootstrap (graceful fallback in browser)
- `dexie` — IndexedDB local storage (chats, messages, SOS presets, profiles)
- `crypto-js` — AES passphrase encryption for cloud sync
- `marked` + `dompurify` — sanitized markdown rendering
- OpenRouter `/chat/completions` — SSE streaming

## Modules

| Module | Purpose |
|---|---|
| Operator Chat | Mode-primed streaming chat, persisted per-mode in Dexie |
| Message Deconstructor | Raw facts / hidden subtext / counter-scripts |
| Conflict Simulator | Roleplay arena vs persona + collapsible live feedback |
| Anxiety Dissector | 5-step CBT questionnaire → structured restructuring |
| SOS Control | Full CRUD of emergency preset triggers |

## Operational modes

`PSYCH` (psychology/CBT) · `COUNTER` (manipulation defense) · `CAMPAIGN` (long-term strategy/OODA) · `OPSEC` (cyber/STRIDE/PSYOP defense)

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static dist/ — deploy to GitHub Pages / any static host
```

## Configuration

1. **Settings → API Connection** — paste your OpenRouter API key (stored in
   LocalStorage) and pick a model (Claude 3.5 Sonnet, GPT-4o, DeepSeek V3/R1,
   Nemotron 3 Ultra free tier…).
2. **Settings → Local Data** — export/import full Dexie dump as JSON.
3. **Settings → Encrypted Sync** — AES-encrypt the snapshot with a passphrase
   (never transmitted) and push/pull via JSONBin.io (master key + bin ID).

> ⚠️ Security note: this is a 100% client-side app. Any API key kept in the
> browser is readable by anyone with access to that browser/device. For shared
> or public deployments, proxy OpenRouter calls through your own backend.

## Telegram deployment

Build `dist/`, host statically, then register the URL in @BotFather
(`/newapp`). The app auto-detects `window.Telegram.WebApp`, calls
`ready()/expand()`, and follows `viewportChanged` events.

## GitHub Pages deployment

Repo uses `base: './'` — relative asset paths, works from any subpath
(`https://<user>.github.io/<repo>/`).

### Option A — GitHub Actions (recommended)

1. Push the repo to GitHub (public repo, free tier).
2. Repo → **Settings → Secrets and variables → Actions → New repository
   secret** → name `VITE_OPENROUTER_KEY`, value = your OpenRouter key.
3. Repo → **Settings → Pages** → Build and deployment → Source:
   **GitHub Actions**.
4. Push to `main` → the workflow builds and deploys automatically.
   ⚠️ The secret is baked into the public JS bundle at build time —
   anyone can read it from DevTools. Use a dedicated key with a strict
   spend limit, or a backend proxy.

### Option B — Manual

```bash
npm run build
# upload the contents of dist/ to Pages
```

Repo → Settings → Pages → Source: **Deploy from a branch** → branch
`gh-pages` / folder `/root` (or use any static-file hosting).

## Local dev

```bash
cp .env.example .env.local   # put key in .env.local (gitignored)
npm install
npm run dev
```
