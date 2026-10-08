/**
 * Non-secret settings stored in LocalStorage.
 * NOTE: API keys in client-side storage are readable by anyone with access
 * to this device/browser. For production use, route requests through your
 * own backend proxy and never ship keys to the client.
 */
const K = {
  API_KEY: 'mentalist.api_key',
  MODEL: 'mentalist.model',
  BIN_ID: 'mentalist.jsonbin_id',
  MASTER_KEY: 'mentalist.jsonbin_master',
  LAST_SYNC: 'mentalist.last_sync',
};

export const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

export const MODEL_OPTIONS = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    vendor: 'Anthropic',
    note: 'balanced reasoning / deconstruction',
    tier: 'paid',
  },
  {
    id: 'openai/gpt-4o',
    label: 'GPT-4o',
    vendor: 'OpenAI',
    note: 'fast multi-context analysis',
    tier: 'paid',
  },
  {
    id: 'deepseek/deepseek-chat',
    label: 'DeepSeek V3',
    vendor: 'DeepSeek',
    note: 'low-cost strategic modeling',
    tier: 'paid',
  },
  {
    id: 'deepseek/deepseek-reasoner',
    label: 'DeepSeek R1',
    vendor: 'DeepSeek',
    note: 'deep chain-of-thought (slow)',
    tier: 'paid',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    label: 'Nemotron 3 Ultra 550B',
    vendor: 'NVIDIA',
    note: 'free tier',
    tier: 'free',
  },
];

export function getApiKey() {
  try {
    const stored = localStorage.getItem(K.API_KEY);
    if (stored) return stored;
  } catch {
    /* noop */
  }
  // Dev-only fallback from Vite env (VITE_OPENROUTER_KEY in .env.local).
  // WARNING: any key reachable from the client bundle is public — never
  // commit .env.local, and use a backend proxy for shared deployments.
  return import.meta.env?.VITE_OPENROUTER_KEY || '';
}

export function setApiKey(key) {
  localStorage.setItem(K.API_KEY, key);
}

export function getModel() {
  try {
    return localStorage.getItem(K.MODEL) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function setModel(id) {
  localStorage.setItem(K.MODEL, id);
}

export function getBinId() {
  try {
    return localStorage.getItem(K.BIN_ID) || '';
  } catch {
    return '';
  }
}

export function setBinId(id) {
  localStorage.setItem(K.BIN_ID, id);
}

export function getMasterKey() {
  try {
    return localStorage.getItem(K.MASTER_KEY) || '';
  } catch {
    return '';
  }
}

export function setMasterKey(k) {
  localStorage.setItem(K.MASTER_KEY, k);
}

export function getLastSync() {
  try {
    return localStorage.getItem(K.LAST_SYNC) || null;
  } catch {
    return null;
  }
}

export function setLastSync(t) {
  localStorage.setItem(K.LAST_SYNC, t);
}

export function testConnection(apiKey, model) {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'Mentalist Tactical Command',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 3,
    }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status} — check key / model / balance`);
    return true;
  });
}
