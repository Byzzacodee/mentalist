import Dexie from 'dexie';

/**
 * Local operational database (IndexedDB via Dexie.js)
 * Stores: chats, messages, SOS presets, profiles
 */
const db = new Dexie('mentalist-db');

db.version(1).stores({
  chats: '++id, mode, createdAt, updatedAt',
  messages: '++id, chatId, createdAt',
  sos: '++id, label, accent, createdAt',
  profiles: '++id, name, createdAt',
});

export const DEFAULT_SOS = [
  {
    label: 'PANIC // 5-4-3-2-1 GROUNDING',
    accent: '#d97706',
    prompt:
      'SOS GROUNDING PROTOCOL: I am in acute panic right now. Run a strict 5-4-3-2-1 sensory grounding script, then a polyvagal down-regulation sequence (Porges/Dana): orient to environment, ventral vagal activation cues, paced breathing 4-6. No fluff, no questions about my feelings beyond what is needed. Give numbered commands I can execute in 60 seconds.',
  },
  {
    label: 'COUNTER // Gaslighting Response',
    accent: '#10b981',
    prompt:
      'SOS COUNTER-SCRIPT: I am being gaslit right now (Robin Stern / Patricia Evans framework). Output: 1) factual anchor statement, 2) 3 short assertive responses (Broken Record + Fogging, Manuel Smith), 3) exact exit line. Direct, zero platitudes.',
  },
  {
    label: 'OPSEC // Emergency Sweep',
    accent: '#06b6d4',
    prompt:
      'SOS OPSEC SWEEP: possible compromise / doxxing / harassment vector. Run 5-Step Military OPSEC + Bazzell Extreme Privacy triage: critical identifiers at risk, immediate containment actions (accounts, devices, addresses), what NOT to do, escalation triggers. Bullet checklist, no filler.',
  },
];

export async function seedDefaults() {
  const count = await db.sos.count();
  if (count === 0) {
    const now = Date.now();
    await db.sos.bulkAdd(
      DEFAULT_SOS.map((s, i) => ({ ...s, prompt: s.prompt, createdAt: now + i }))
    );
  }
}

export default db;
