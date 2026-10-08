import CryptoJS from 'crypto-js';

/**
 * AES passphrase encryption (CryptoJS).
 * Payload format: "MENTALIST1.<ciphertext>" — base64 AES (OpenSSL-compatible KDF).
 */
const PREFIX = 'MENTALIST1.';

export function encryptPayload(obj, passphrase) {
  if (!passphrase || passphrase.length < 8) {
    throw new Error('Passphrase must be >= 8 characters');
  }
  const json = JSON.stringify(obj);
  const cipher = CryptoJS.AES.encrypt(json, passphrase).toString();
  return PREFIX + cipher;
}

export function decryptPayload(payload, passphrase) {
  if (typeof payload !== 'string') throw new Error('Invalid payload');
  const cipher = payload.startsWith(PREFIX) ? payload.slice(PREFIX.length) : payload;
  const bytes = CryptoJS.AES.decrypt(cipher, passphrase);
  const text = bytes.toString(CryptoJS.enc.Utf8);
  if (!text) throw new Error('Decryption failed — wrong passphrase or corrupted data');
  return JSON.parse(text);
}

export function isEncryptedPayload(s) {
  return typeof s === 'string' && s.startsWith(PREFIX);
}

/**
 * Snapshot the full Dexie database into a plain object.
 */
export async function snapshotDatabase(db) {
  const [chats, messages, sos, profiles] = await Promise.all([
    db.chats.toArray(),
    db.messages.toArray(),
    db.sos.toArray(),
    db.profiles.toArray(),
  ]);
  return {
    app: 'mentalist-tactical-command',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { chats, messages, sos, profiles },
  };
}

/**
 * Restore a snapshot into Dexie. Replaces all records (clear + bulkAdd).
 */
export async function restoreDatabase(db, snapshot) {
  if (!snapshot || !snapshot.data) throw new Error('Malformed snapshot');
  const { chats = [], messages = [], sos = [], profiles = [] } = snapshot.data;
  await db.transaction('rw', [db.chats, db.messages, db.sos, db.profiles], async () => {
    await Promise.all([db.chats.clear(), db.messages.clear(), db.sos.clear(), db.profiles.clear()]);
    if (chats.length) await db.chats.bulkAdd(chats);
    if (messages.length) await db.messages.bulkAdd(messages);
    if (sos.length) await db.sos.bulkAdd(sos);
    if (profiles.length) await db.profiles.bulkAdd(profiles);
  });
  return { chats: chats.length, messages: messages.length, sos: sos.length, profiles: profiles.length };
}

export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
