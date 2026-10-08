import { Settings, Signal, Cpu, RefreshCw, AlertTriangle } from 'lucide-react';
import { getLastSync, MODEL_OPTIONS, getModel } from '../lib/settings.js';
import { LANGUAGES, t } from '../lib/i18n.js';

export default function TopBar({ mode, moduleId, streaming, onOpenSettings, lastSyncTs, lang, onLang }) {
  const model = MODEL_OPTIONS.find((m) => m.id === getModel()) || MODEL_OPTIONS[0];

  return (
    <header className="flex items-center gap-2 border-b border-zinc-800 bg-ink-900 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center border border-zinc-700 bg-ink-800">
          <Signal size={12} className="text-amber-600" />
        </span>
        <span className="font-mono text-[11px] font-bold tracking-widest text-zinc-100">
          MENTALIST<span className="text-amber-600">//</span>TC
        </span>
      </div>

      <div className="mx-1 hidden h-4 w-px bg-zinc-800 sm:block" />

      <div className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-500 sm:block">
        {t(lang, mode.labelKey)}
        {moduleId !== 'chat' && <span className="text-zinc-600"> / {moduleId.toUpperCase()}</span>}
      </div>

      <div className="flex-1" />

      {/* Language selector */}
      <div className="flex border border-zinc-700 bg-ink-800">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            onClick={() => onLang(l.id)}
            className={`px-1.5 py-0.5 font-mono text-[9px] tracking-wider transition-colors ${
              lang === l.id ? 'bg-amber-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={l.label}
          >
            {l.label}
          </button>
        ))}
      </div>

      {streaming && (
        <span className="flex items-center gap-1 font-mono text-[10px] text-cyan-400">
          <RefreshCw size={10} className="animate-spin" /> {t(lang, 'stream')}
        </span>
      )}

      {lastSyncTs ? (
        <span className="hidden items-center gap-1 font-mono text-[10px] text-emerald-500 md:flex">
          <span className="h-1.5 w-1.5 bg-emerald-500" /> {t(lang, 'synced')}
        </span>
      ) : (
        <span className="hidden items-center gap-1 font-mono text-[10px] text-zinc-600 md:flex">
          <AlertTriangle size={10} /> {t(lang, 'localOnly')}
        </span>
      )}

      <span className="hidden items-center gap-1 border border-zinc-800 bg-ink-850 px-2 py-0.5 font-mono text-[10px] text-zinc-400 md:flex">
        <Cpu size={10} className="text-amber-600" />
        {model.label}
        <span className={model.tier === 'free' ? 'text-emerald-500' : 'text-zinc-600'}>
          [{model.tier.toUpperCase()}]
        </span>
      </span>

      <button
        onClick={onOpenSettings}
        className="flex items-center gap-1.5 border border-zinc-700 bg-ink-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-300 transition-colors hover:border-amber-700 hover:text-amber-500"
        title={t(lang, 'settings')}
      >
        <Settings size={12} />
        <span className="hidden sm:inline">{t(lang, 'settings')}</span>
      </button>
    </header>
  );
}
