import { getBinId, setBinId, getMasterKey, setMasterKey, getLastSync, setLastSync } from './settings.js';

const BIN_API = 'https://jsonbin.io/v3/b';

/**
 * Push encrypted payload to JSONBin (private bin).
 * Requires a JSONBin.io master key (free tier). Bin ID is persisted locally.
 */
export async function pushToCloud(encryptedPayload, masterKey) {
  const key = masterKey || getMasterKey();
  if (!key) throw new Error('JSONBin master key required');
  const existing = getBinId();

  const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': key,
    'X-Private': 'true',
  };

  if (existing) {
    const res = await fetch(`${BIN_API}/${existing}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ payload: encryptedPayload }),
    });
    if (!res.ok) throw new Error(`JSONBin PUT failed: HTTP ${res.status}`);
    return { binId: existing, action: 'updated' };
  }

  const res = await fetch(BIN_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ payload: encryptedPayload }),
  });
  if (!res.ok) throw new Error(`JSONBin POST failed: HTTP ${res.status}`);
  const json = await res.json();
  const binId = json?.metadata?.id;
  if (!binId) throw new Error('JSONBin did not return a bin ID');
  setBinId(binId);
  setMasterKey(key);
  return { binId, action: 'created' };
}

/**
 * Pull encrypted payload from JSONBin by stored (or provided) bin ID.
 */
export async function pullFromCloud(binIdOverride) {
  const binId = binIdOverride || getBinId();
  const key = getMasterKey();
  if (!binId) throw new Error('No bin ID — push first or enter bin ID');
  if (!key) throw new Error('JSONBin master key required');
  const res = await fetch(`${BIN_API}/${binId}/latest`, {
    headers: { 'X-Master-Key': key },
  });
  if (!res.ok) throw new Error(`JSONBin GET failed: HTTP ${res.status}`);
  const json = await res.json();
  const payload = json?.record?.payload;
  if (!payload) throw new Error('Empty or malformed bin payload');
  return payload;
}

export function markSynced() {
  setLastSync(new Date().toISOString());
}

export function lastSync() {
  return getLastSync();
}
