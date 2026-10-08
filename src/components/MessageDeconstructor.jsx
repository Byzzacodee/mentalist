import { useState } from 'react';
import { ScanSearch, AlertTriangle } from 'lucide-react';
import { useOpenRouter } from '../hooks/useOpenRouter';
import { buildDeconSystem } from '../config/systemPrompts.js';
import Markdown from './Markdown.jsx';
import { t } from '../lib/i18n.js';

/**
 * MESSAGE DECONSTRUCTOR — communication forensics.
 * Input raw message → RAW FACTS / HIDDEN SUBTEXT / COUNTER-SCRIPTS.
 */
export default function MessageDeconstructor({ apiKey, model, lang }) {
  const { stream, streaming, abort } = useOpenRouter();
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  async function deconstruct() {
    const t = text.trim();
    if (!t || streaming) return;
    setError(null);
    setOutput('');

    const system = buildDeconSystem(lang);

    let full = '';
    await stream({
      apiKey,
      model,
      system,
      messages: [],
      userContent: `RAW MESSAGE TO DECONSTRUCT:\n"""\n${t}\n"""`,
      temperature: 0.25,
      onDelta: (d) => {
        full += d;
        setOutput(full);
      },
      onDone: () => {},
      onError: (e) => setError(e.message || String(e)),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4 lg:flex-row lg:overflow-hidden">
      {/* Input column */}
      <div className="flex min-w-0 flex-1 flex-col border border-zinc-800 bg-ink-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <ScanSearch size={13} className="text-amber-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            {t(lang, 'rawInput')}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(lang, 'pasteHint')}
          className="min-h-[220px] flex-1 resize-none bg-transparent p-3 font-mono text-[12px] leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
        />
        <div className="flex items-center gap-2 border-t border-zinc-800 p-3">
          <button
            onClick={deconstruct}
            disabled={streaming || !text.trim()}
            className="border border-amber-800 bg-ink-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500 transition-colors hover:bg-amber-900/20 disabled:opacity-30"
          >
            {streaming ? t(lang, 'deconstructing') : t(lang, 'deconstruct')}
          </button>
          <button
            onClick={abort}
            disabled={!streaming}
            className="border border-zinc-700 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-red-800 hover:text-red-400 disabled:opacity-30"
          >
            {t(lang, 'abort')}
          </button>
          <div className="flex-1" />
          <span className="font-mono text-[9px] text-zinc-600">{text.length} {t(lang, 'chars')}</span>
        </div>
      </div>

      {/* Output column */}
      <div className="flex min-w-0 flex-1 flex-col border border-zinc-800 bg-ink-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            {t(lang, 'forensicOutput')}
          </span>
          <div className="flex-1" />
          <span className="font-mono text-[9px] text-zinc-600">
            {t(lang, 'flowLabel')}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!output && !error && (
            <div className="flex h-full items-center justify-center border border-dashed border-zinc-800 p-6 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                {t(lang, 'awaiting')}
              </p>
            </div>
          )}
          {error && (
            <div className="border border-red-900 bg-red-950/20 p-3 font-mono text-[10px] text-red-400">
              ERROR: {error}
            </div>
          )}
          {output && <Markdown content={output} className={streaming ? 'caret' : ''} />}
        </div>
      </div>
    </div>
  );
}
