import { useEffect, useRef, useState } from 'react';
import {
  X, KeyRound, Database, CloudUpload, CloudDownload, Trash2, Cpu,
  Check, AlertTriangle, FileDown, FileUp, Globe,
} from 'lucide-react';
import {
  getApiKey, setApiKey, getModel, setModel, MODEL_OPTIONS, testConnection,
  getBinId, setBinId, getMasterKey, setMasterKey,
} from '../lib/settings.js';
import { snapshotDatabase, restoreDatabase, downloadJson, encryptPayload, decryptPayload } from '../lib/crypto.js';
import { pushToCloud, pullFromCloud, markSynced } from '../lib/sync.js';
import db from '../db/dexie.js';
import { t } from '../lib/i18n.js';

/**
 * SETTINGS — API key, model selector, local backup/restore, encrypted cloud sync.
 */
export default function SettingsModal({ onClose, onToast, onDataChanged, lang }) {
  const [apiKey, setApiKeyLocal] = useState(getApiKey());
  const [model, setModelLocal] = useState(getModel());
  const [tab, setTab] = useState('api');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [busy, setBusy] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [masterKey, setMasterKeyLocal] = useState(getMasterKey());
  const [binId, setBinIdLocal] = useState(getBinId());
  const fileRef = useRef(null);

  useEffect(() => {
    setApiKeyLocal(getApiKey());
    setModelLocal(getModel());
    setMasterKeyLocal(getMasterKey());
    setBinIdLocal(getBinId());
  }, []);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      await testConnection(apiKey, model);
      setTestResult({ ok: true, msg: t(lang, 'testOk') });
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    } finally {
      setTesting(false);
    }
  }

  function saveApi() {
    setApiKey(apiKey);
    setModel(model);
    onToast?.(t(lang, 'toastSavedApi'));
  }

  async function handleExport() {
    const snap = await snapshotDatabase(db);
    downloadJson(`mentalist-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`, snap);
    onToast?.(t(lang, 'toastExport'));
  }

  function handleImportFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        let obj = JSON.parse(reader.result);
        if (typeof obj === 'string') obj = JSON.parse(obj);
        const counts = await restoreDatabase(db, obj);
        onToast?.(t(lang, 'toastImportOk') + `${counts.messages} msgs, ${counts.chats} chats, ${counts.sos} SOS`);
        onDataChanged();
      } catch (err) {
        onToast?.(t(lang, 'toastImportFail') + err.message, 'error');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  }

  async function handleWipe() {
    if (!window.confirm(t(lang, 'wipeConfirm'))) return;
    await Promise.all([db.chats.clear(), db.messages.clear(), db.sos.clear(), db.profiles.clear()]);
    onToast?.(t(lang, 'toastWipe'));
    onDataChanged();
  }

  async function handlePush() {
    setBusy('push');
    try {
      if (masterKey) setMasterKey(masterKey);
      const snap = await snapshotDatabase(db);
      const enc = encryptPayload(snap, passphrase);
      const res = await pushToCloud(enc, masterKey);
      markSynced();
      if (res.binId) setBinIdLocal(res.binId);
      onToast?.(t(lang, 'toastPushOk') + `${res.action} → JSONBin ${res.binId}`);
    } catch (e) {
      onToast?.(t(lang, 'toastPushFail') + e.message, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function handlePull() {
    setBusy('pull');
    try {
      const payload = await pullFromCloud(binId || undefined);
      const snap = decryptPayload(payload, passphrase);
      const counts = await restoreDatabase(db, snap);
      markSynced();
      onToast?.(t(lang, 'toastPullOk') + `${counts.messages} msgs, ${counts.chats} chats, ${counts.sos} SOS`);
      onDataChanged();
    } catch (e) {
      onToast?.(t(lang, 'toastPullFail') + e.message, 'error');
    } finally {
      setBusy(null);
    }
  }

  const tabs = [
    { id: 'api', label: t(lang, 'apiConnection'), icon: KeyRound },
    { id: 'data', label: t(lang, 'localData'), icon: Database },
    { id: 'cloud', label: t(lang, 'encryptedSync'), icon: CloudUpload },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col border border-zinc-700 bg-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-100">
            SYSTEM CONFIGURATION
          </span>
          <div className="flex-1" />
          <button onClick={onClose} className="border border-zinc-700 bg-ink-800 p-1 text-zinc-400 hover:text-zinc-100">
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  tab === t.id
                    ? 'border-amber-600 bg-ink-800 text-amber-500'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {tab === 'api' && (
            <>
              <div>
                <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                  {t(lang, 'apiKeyLabel')}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKeyLocal(e.target.value)}
                  placeholder="sk-or-v1-…"
                  className="w-full border border-zinc-700 bg-ink-850 px-3 py-2 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
                />
                <p className="mt-1 font-mono text-[9px] leading-relaxed text-zinc-600">
                  {t(lang, 'apiKeyNote')}
                </p>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                  {t(lang, 'modelLabel')}
                </label>
                <div className="space-y-1.5">
                  {MODEL_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModelLocal(m.id)}
                      className={`flex w-full items-center gap-3 border px-3 py-2 text-left transition-colors ${
                        model === m.id ? 'border-amber-700 bg-ink-800' : 'border-zinc-800 bg-ink-850 hover:border-zinc-600'
                      }`}
                    >
                      <Cpu size={12} className={model === m.id ? 'text-amber-500' : 'text-zinc-600'} />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10.5px] font-bold text-zinc-200">
                          {m.label}{' '}
                          <span className={m.tier === 'free' ? 'text-emerald-500' : 'text-zinc-600'}>
                            [{m.tier.toUpperCase()}]
                          </span>
                        </div>
                        <div className="truncate font-mono text-[9px] text-zinc-600">
                          {m.id} — {m.note}
                        </div>
                      </div>
                      {model === m.id && <Check size={13} className="text-amber-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveApi}
                  className="border border-amber-800 bg-ink-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:bg-amber-900/20"
                >
                  {t(lang, 'save')}
                </button>
                <button
                  onClick={handleTest}
                  disabled={testing || !apiKey}
                  className="border border-emerald-800 bg-ink-800 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-emerald-500 hover:bg-emerald-900/20 disabled:opacity-30"
                >
                  {testing ? t(lang, 'testing') : t(lang, 'test')}
                </button>
                {testResult && (
                  <span
                    className={`flex items-center gap-1 font-mono text-[10px] ${
                      testResult.ok ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {testResult.ok ? <Check size={11} /> : <AlertTriangle size={11} />}
                    {testResult.msg}
                  </span>
                )}
              </div>
            </>
          )}

          {tab === 'data' && (
            <>
              <div className="border border-zinc-800 bg-ink-850 p-3">
                <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                  {t(lang, 'backupNote')}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 border border-zinc-600 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:text-zinc-100"
                  >
                    <FileDown size={12} /> {t(lang, 'exportJson')}
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 border border-zinc-600 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:text-zinc-100"
                  >
                    <FileUp size={12} /> {t(lang, 'importJson')}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                  <button
                    onClick={handleWipe}
                    className="flex items-center gap-1.5 border border-red-800 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 size={12} /> {t(lang, 'wipeDb')}
                  </button>
                </div>
              </div>

              <div className="border border-zinc-800 bg-ink-850 p-3">
                <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                  {t(lang, 'storageEngine')}
                </div>
                <p className="font-mono text-[10px] leading-relaxed text-zinc-500">
                  Dexie.js → IndexedDB. {t(lang, 'storageNote')}
                </p>
              </div>
            </>
          )}

          {tab === 'cloud' && (
            <>
              <div className="border border-zinc-800 bg-ink-850 p-3">
                <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                  <CloudUpload size={11} /> {t(lang, 'aesTitle')}
                </div>
                <p className="mb-3 font-mono text-[10px] leading-relaxed text-zinc-500">
                  {t(lang, 'aesNote')}
                </p>

                <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                  {t(lang, 'syncPassphrase')}
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="••••••••"
                  className="mb-3 w-full border border-zinc-700 bg-ink-900 px-3 py-2 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
                />

                <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                  {t(lang, 'masterKeyLabel')}
                </label>
                <input
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKeyLocal(e.target.value)}
                  placeholder="jsonbin master key"
                  className="mb-3 w-full border border-zinc-700 bg-ink-900 px-3 py-2 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
                />

                <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                  {t(lang, 'binIdLabel')}
                </label>
                <input
                  value={binId}
                  onChange={(e) => {
                    setBinIdLocal(e.target.value);
                    setBinId(e.target.value);
                  }}
                  placeholder="66xxxx…"
                  className="mb-4 w-full border border-zinc-700 bg-ink-900 px-3 py-2 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handlePush}
                    disabled={busy || !passphrase || !masterKey}
                    className="flex items-center gap-1.5 border border-amber-800 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-amber-500 hover:bg-amber-900/20 disabled:opacity-30"
                  >
                    <CloudUpload size={12} /> {busy === 'push' ? '…' : t(lang, 'pushEnc')}
                  </button>
                  <button
                    onClick={handlePull}
                    disabled={busy || !passphrase || !masterKey || !binId}
                    className="flex items-center gap-1.5 border border-cyan-800 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-400 hover:bg-cyan-900/20 disabled:opacity-30"
                  >
                    <CloudDownload size={12} /> {busy === 'pull' ? '…' : t(lang, 'pullDec')}
                  </button>
                  {binId && (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-600">
                      <Globe size={10} /> {t(lang, 'binPrefix')} {binId.slice(0, 8)}…
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
