import { useState } from 'react';
import { ScanSearch, AlertTriangle } from 'lucide-react';
import { useOpenRouter } from '../hooks/useOpenRouter';
import { CORE_DIRECTIVES, KNOWLEDGE_CITE, DECONSTRUCTOR_PROMPT } from '../config/systemPrompts.js';
import Markdown from './Markdown.jsx';

/**
 * MESSAGE DECONSTRUCTOR — communication forensics.
 * Input raw message → RAW FACTS / HIDDEN SUBTEXT / COUNTER-SCRIPTS.
 */
export default function MessageDeconstructor({ apiKey, model }) {
  const { stream, streaming, abort } = useOpenRouter();
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  async function deconstruct() {
    const t = text.trim();
    if (!t || streaming) return;
    setError(null);
    setOutput('');

    const system = [
      DECONSTRUCTOR_PROMPT,
      CORE_DIRECTIVES,
      '## KNOWLEDGE CORE LIBRARY (cite from these sources)',
      KNOWLEDGE_CITE,
    ].join('\n\n');

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
            RAW MESSAGE INPUT
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Paste the message / chat / email / screenshot text here…

Example:
"Hey, I know you're busy but everyone else managed to send it yesterday. I guess some people just care more about the team than others. Anyway, no pressure :) — just flagging it."`}
          className="min-h-[220px] flex-1 resize-none bg-transparent p-3 font-mono text-[12px] leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
        />
        <div className="flex items-center gap-2 border-t border-zinc-800 p-3">
          <button
            onClick={deconstruct}
            disabled={streaming || !text.trim()}
            className="border border-amber-800 bg-ink-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500 transition-colors hover:bg-amber-900/20 disabled:opacity-30"
          >
            {streaming ? 'DECONSTRUCTING…' : '▶ DECONSTRUCT'}
          </button>
          <button
            onClick={abort}
            disabled={!streaming}
            className="border border-zinc-700 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-red-800 hover:text-red-400 disabled:opacity-30"
          >
            ABORT
          </button>
          <div className="flex-1" />
          <span className="font-mono text-[9px] text-zinc-600">{text.length} chars</span>
        </div>
      </div>

      {/* Output column */}
      <div className="flex min-w-0 flex-1 flex-col border border-zinc-800 bg-ink-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            FORENSIC OUTPUT
          </span>
          <div className="flex-1" />
          <span className="font-mono text-[9px] text-zinc-600">
            FACTS → SUBTEXT → SCRIPTS
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!output && !error && (
            <div className="flex h-full items-center justify-center border border-dashed border-zinc-800 p-6 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                Awaiting message input…
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
