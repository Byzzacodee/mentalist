import { useEffect, useState } from 'react';
import { LifeBuoy, Plus, Pencil, Trash2, Save, X, Zap } from 'lucide-react';
import db from '../db/dexie.js';

const ACCENTS = ['#f43f5e', '#d97706', '#10b981', '#06b6d4', '#a78bfa'];

/**
 * SOS CONTROL — full CRUD over emergency preset buttons (Dexie.js).
 */
export default function SOSPanel({ sosButtons, onRefresh, onTrigger, onToast }) {
  const [editing, setEditing] = useState(null); // null | 'new' | sos object
  const [label, setLabel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);

  function openNew() {
    setEditing('new');
    setLabel('');
    setPrompt('');
    setAccent(ACCENTS[0]);
  }

  function openEdit(s) {
    setEditing(s);
    setLabel(s.label);
    setPrompt(s.prompt);
    setAccent(s.accent || ACCENTS[0]);
  }

  async function save(e) {
    e.preventDefault();
    if (!label.trim() || !prompt.trim()) return;
    if (editing === 'new') {
      await db.sos.add({ label: label.trim(), prompt: prompt.trim(), accent, createdAt: Date.now() });
      onToast?.(`Preset "${label.trim()}" created`);
    } else {
      await db.sos.update(editing.id, { label: label.trim(), prompt: prompt.trim(), accent });
      onToast?.(`Preset "${label.trim()}" updated`);
    }
    setEditing(null);
    onRefresh();
  }

  async function remove(s) {
    if (!window.confirm(`Delete SOS preset "${s.label}"?`)) return;
    await db.sos.delete(s.id);
    onToast?.('Preset deleted');
    onRefresh();
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <div className="mb-3 flex items-center gap-2">
        <LifeBuoy size={14} className="text-rose-400" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
          SOS PRESET REGISTRY
        </span>
        <div className="flex-1" />
        <button
          onClick={openNew}
          className="flex items-center gap-1 border border-rose-800 bg-ink-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-rose-400 hover:bg-rose-900/20"
        >
          <Plus size={12} /> Add preset
        </button>
      </div>

      {/* Edit / create form */}
      {editing && (
        <form onSubmit={save} className="mb-4 border border-rose-900/60 bg-ink-900 p-4">
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-rose-400">
            <Pencil size={11} />
            {editing === 'new' ? 'NEW PRESET' : `EDIT // ${editing.label}`}
          </div>
          <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
            Button label
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="PANIC // 5-4-3-2-1 GROUNDING"
            className="mb-3 w-full border border-zinc-700 bg-ink-850 px-3 py-2 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-rose-700 focus:outline-none"
          />
          <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
            Trigger prompt (sent to AI when pressed)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            placeholder="SOS PROTOCOL: …run strict numbered commands, zero fluff…"
            className="mb-3 w-full resize-none border border-zinc-700 bg-ink-850 p-3 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-rose-700 focus:outline-none"
          />
          <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
            Accent color
          </label>
          <div className="mb-4 flex gap-2">
            {ACCENTS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setAccent(c)}
                className={`h-5 w-5 border ${accent === c ? 'border-white' : 'border-transparent'}`}
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!label.trim() || !prompt.trim()}
              className="flex items-center gap-1 border border-rose-800 bg-ink-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-rose-400 hover:bg-rose-900/20 disabled:opacity-30"
            >
              <Save size={11} /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="flex items-center gap-1 border border-zinc-700 bg-ink-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200"
            >
              <X size={11} /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* Preset list */}
      <div className="grid gap-2 lg:grid-cols-2">
        {sosButtons.map((s) => (
          <div key={s.id} className="border border-zinc-800 bg-ink-900" style={{ borderLeftWidth: 2, borderLeftColor: s.accent }}>
            <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
              <span className="h-2 w-2" style={{ background: s.accent }} />
              <span className="flex-1 truncate font-mono text-[10px] font-bold tracking-wider text-zinc-200">
                {s.label}
              </span>
              <button
                onClick={() => onTrigger(s)}
                className="flex items-center gap-1 border border-emerald-800 bg-ink-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400 hover:bg-emerald-900/20"
                title="Fire this preset in Operator Chat"
              >
                <Zap size={10} /> Fire
              </button>
              <button
                onClick={() => openEdit(s)}
                className="border border-zinc-700 bg-ink-800 p-1 text-zinc-400 hover:text-zinc-200"
                title="Edit"
              >
                <Pencil size={10} />
              </button>
              <button
                onClick={() => remove(s)}
                className="border border-zinc-700 bg-ink-800 p-1 text-zinc-400 hover:border-red-800 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={10} />
              </button>
            </div>
            <pre className="whitespace-pre-wrap p-3 font-mono text-[10px] leading-relaxed text-zinc-500">
              {s.prompt}
            </pre>
          </div>
        ))}
        {sosButtons.length === 0 && (
          <div className="border border-dashed border-zinc-800 p-6 text-center font-mono text-[10px] text-zinc-600">
            NO PRESETS — add one
          </div>
        )}
      </div>
    </div>
  );
}
