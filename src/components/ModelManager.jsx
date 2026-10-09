import { useState } from 'react';
import { KeyRound, Cpu, Plus, Trash2, Check, Zap } from 'lucide-react';
import {
  getApiKeys, addApiKey, deleteApiKey,
  getModels, addModel, deleteModel, updateModel,
  getMultiAgent, setMultiAgent, getMultiAgentCount, setMultiAgentCount,
  MODEL_OPTIONS, MODE_LIST, MODE_LABELS,
} from '../lib/settings.js';
import { t } from '../lib/i18n.js';

/**
 * MODEL MANAGER — multi-key, multi-model, domain assignment, multi-agent toggle.
 */
export default function ModelManager({ lang, onToast }) {
  const [keys, setKeys] = useState(getApiKeys());
  const [models, setModels] = useState(getModels());
  const [keyLabel, setKeyLabel] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [modelLabel, setModelLabel] = useState('');
  const [modelId, setModelId] = useState('');
  const [modelVendor, setModelVendor] = useState('');
  const [modelModes, setModelModes] = useState([]);
  const [multiAgent, setMultiAgentState] = useState(getMultiAgent());
  const [agentCount, setAgentCountState] = useState(getMultiAgentCount());

  function refreshKeys() {
    setKeys(getApiKeys());
  }
  function refreshModels() {
    setModels(getModels());
  }

  function handleAddKey() {
    if (!keyValue.trim()) return;
    addApiKey(keyLabel.trim(), keyValue.trim());
    setKeyLabel('');
    setKeyValue('');
    refreshKeys();
    onToast?.(t(lang, 'toastKeyAdded'));
  }

  function handleDeleteKey(id) {
    deleteApiKey(id);
    refreshKeys();
    onToast?.(t(lang, 'toastKeyDeleted'));
  }

  function handleAddModel() {
    if (!modelId.trim()) return;
    addModel(modelLabel.trim(), modelId.trim(), modelVendor.trim(), modelModes);
    setModelLabel('');
    setModelId('');
    setModelVendor('');
    setModelModes([]);
    refreshModels();
    onToast?.(t(lang, 'toastModelAdded'));
  }

  function handleDeleteModel(id) {
    deleteModel(id);
    refreshModels();
    onToast?.(t(lang, 'toastModelDeleted'));
  }

  function toggleModelMode(mode) {
    setModelModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));
  }

  function handleToggleMultiAgent() {
    const next = !multiAgent;
    setMultiAgent(next);
    setMultiAgentState(next);
  }

  function handleAgentCount(n) {
    setMultiAgentCount(n);
    setAgentCountState(n);
  }

  return (
    <div className="space-y-4 p-4">
      {/* API Keys */}
      <div className="border border-zinc-800 bg-ink-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <KeyRound size={13} className="text-amber-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            {t(lang, 'apiKeys')}
          </span>
        </div>
        <div className="p-3">
          {keys.length === 0 && (
            <p className="mb-2 font-mono text-[10px] text-zinc-600">{t(lang, 'noKeys')}</p>
          )}
          {keys.map((k) => (
            <div key={k.id} className="mb-1.5 flex items-center gap-2 border border-zinc-800 bg-ink-850 px-2.5 py-1.5">
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-zinc-300">{k.label}</span>
              <span className="font-mono text-[9px] text-zinc-600">{k.key.slice(0, 12)}…</span>
              <button onClick={() => handleDeleteKey(k.id)} className="text-zinc-600 hover:text-red-400">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <div className="mt-2 flex gap-1.5">
            <input
              value={keyLabel}
              onChange={(e) => setKeyLabel(e.target.value)}
              placeholder={t(lang, 'keyLabel')}
              className="min-w-0 flex-1 border border-zinc-700 bg-ink-850 px-2 py-1.5 font-mono text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
            />
            <input
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-or-v1-…"
              className="min-w-0 flex-1 border border-zinc-700 bg-ink-850 px-2 py-1.5 font-mono text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
            />
            <button
              onClick={handleAddKey}
              disabled={!keyValue.trim()}
              className="flex items-center gap-1 border border-amber-800 bg-ink-800 px-2.5 py-1.5 font-mono text-[10px] uppercase text-amber-500 hover:bg-amber-900/20 disabled:opacity-30"
            >
              <Plus size={11} /> {t(lang, 'add')}
            </button>
          </div>
        </div>
      </div>

      {/* Models */}
      <div className="border border-zinc-800 bg-ink-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <Cpu size={13} className="text-cyan-400" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            {t(lang, 'models')}
          </span>
        </div>
        <div className="p-3">
          {models.length === 0 && (
            <p className="mb-2 font-mono text-[10px] text-zinc-600">{t(lang, 'noModels')}</p>
          )}
          {models.map((m) => (
            <div key={m.id} className="mb-1.5 border border-zinc-800 bg-ink-850 px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-zinc-200">{m.label}</span>
                <span className="font-mono text-[9px] text-zinc-600">{m.modelId}</span>
                <button onClick={() => handleDeleteModel(m.id)} className="text-zinc-600 hover:text-red-400">
                  <Trash2 size={11} />
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {MODE_LIST.map((mode) => {
                  const active = m.modes && m.modes.includes(mode);
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        const next = active ? m.modes.filter((x) => x !== mode) : [...(m.modes || []), mode];
                        updateModel(m.id, { modes: next });
                        refreshModels();
                      }}
                      className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${
                        active
                          ? 'border-amber-700 bg-amber-900/20 text-amber-500'
                          : 'border-zinc-700 text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {MODE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-2 space-y-1.5">
            <input
              value={modelLabel}
              onChange={(e) => setModelLabel(e.target.value)}
              placeholder={t(lang, 'modelLabel')}
              className="w-full border border-zinc-700 bg-ink-850 px-2 py-1.5 font-mono text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
            />
            <input
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="model-id (e.g. anthropic/claude-3.5-sonnet)"
              className="w-full border border-zinc-700 bg-ink-850 px-2 py-1.5 font-mono text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
            />
            <input
              value={modelVendor}
              onChange={(e) => setModelVendor(e.target.value)}
              placeholder={t(lang, 'vendor')}
              className="w-full border border-zinc-700 bg-ink-850 px-2 py-1.5 font-mono text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1">
              {MODE_LIST.map((mode) => {
                const active = modelModes.includes(mode);
                return (
                  <button
                    key={mode}
                    onClick={() => toggleModelMode(mode)}
                    className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${
                      active
                        ? 'border-amber-700 bg-amber-900/20 text-amber-500'
                        : 'border-zinc-700 text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {MODE_LABELS[mode]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleAddModel}
              disabled={!modelId.trim()}
              className="flex items-center gap-1 border border-cyan-800 bg-ink-800 px-2.5 py-1.5 font-mono text-[10px] uppercase text-cyan-400 hover:bg-cyan-900/20 disabled:opacity-30"
            >
              <Plus size={11} /> {t(lang, 'addModel')}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-agent */}
      <div className="border border-zinc-800 bg-ink-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <Zap size={13} className="text-emerald-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            {t(lang, 'multiAgent')}
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-400">{t(lang, 'multiAgentDesc')}</span>
            <button
              onClick={handleToggleMultiAgent}
              className={`border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                multiAgent
                  ? 'border-emerald-700 bg-emerald-900/20 text-emerald-400'
                  : 'border-zinc-700 text-zinc-500'
              }`}
            >
              {multiAgent ? t(lang, 'on') : t(lang, 'off')}
            </button>
          </div>
          {multiAgent && (
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[9px] text-zinc-600">{t(lang, 'agentCount')}:</span>
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => handleAgentCount(n)}
                  className={`border px-2 py-0.5 font-mono text-[10px] ${
                    agentCount === n
                      ? 'border-emerald-700 bg-emerald-900/20 text-emerald-400'
                      : 'border-zinc-700 text-zinc-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
