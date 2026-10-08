import { useEffect, useRef, useState } from 'react';
import { Flame, ChevronDown, ChevronUp, Gauge, Send } from 'lucide-react';
import { useOpenRouter } from '../hooks/useOpenRouter';
import {
  CORE_DIRECTIVES,
  KNOWLEDGE_CITE,
  simulatorPersonaPrompt,
  SIMULATOR_FEEDBACK_PROMPT,
  buildSimSystem,
  buildFeedbackSystem,
} from '../config/systemPrompts.js';
import Markdown from './Markdown.jsx';
import { t } from '../lib/i18n.js';

const PRESETS = [
  { name: 'NARCISSISTIC MANAGER', role: 'covert-aggressive supervisor (Simon / Hotchkiss archetype)', stance: 'credit-grabbing, scope creep, guilt-tripping, silent punishments', aggression: 6 },
  { name: 'GASLIGHTER PARTNER', role: 'intimate partner using denial + contradiction (Stern cycle)', stance: 'rewrite history, trivialise, doubt your perception, occasional charm', aggression: 5 },
  { name: 'HARDLINE NEGOTIATOR', role: 'adversarial counterpart (Camp / Voss playbook)', stance: 'anchoring high, deadline pressure, "that\'s my final offer", false scarcity', aggression: 7 },
  { name: 'TOXIC INFLUENCER', role: 'Cialdini-style compliance engineer', stance: 'reciprocity traps, social proof fabrication, authority claims, foot-in-the-door', aggression: 4 },
];

/**
 * CONFLICT SIMULATOR — roleplay arena + collapsible live feedback.
 */
export default function ConflictSimulator({ apiKey, model, lang }) {
  const { stream, complete, streaming, abort } = useOpenRouter();
  const [presetIdx, setPresetIdx] = useState(0);
  const [persona, setPersona] = useState(PRESETS[0]);
  const [custom, setCustom] = useState('');
  const [aggression, setAggression] = useState(6);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  function selectPreset(i) {
    setPresetIdx(i);
    setPersona(PRESETS[i]);
    setAggression(PRESETS[i].aggression);
  }

  function start() {
    const p = custom.trim()
      ? {
          name: custom.trim().slice(0, 40),
          role: 'custom adversary',
          stance: custom.trim(),
          aggression,
        }
      : { ...persona, aggression };
    setPersona(p);
    setMessages([
      {
        role: 'assistant',
        content: t(lang, 'simStart').replace('{name}', p.name).replace('{a}', p.aggression),
      },
    ]);
    setStarted(true);
    setError(null);
  }

  function stop() {
    setMessages((m) => [...m, { role: 'assistant', content: t(lang, 'simEnded') }]);
    setStarted(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setError(null);

    if (text === '/STOP') return stop();

    setMessages((m) => [...m, { role: 'user', content: text }]);

    const system = buildSimSystem(persona, lang);

    const apiHistory = messages.map((m) => ({ role: m.role, content: m.content }));

    let full = '';
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);

    await stream({
      apiKey,
      model,
      system,
      messages: apiHistory,
      userContent: text,
      temperature: 0.7,
      onDelta: (d) => {
        full += d;
        setMessages((m) => [...m.slice(0, -1), { role: 'assistant', content: full }]);
      },
      onDone: async () => {
        // Live feedback pass (second model call)
        if (feedbackEnabled && apiKey && model) {
          try {
            const fb = await complete({
              apiKey,
              model,
              system: buildFeedbackSystem(lang),
              messages: [
                ...apiHistory,
                { role: 'user', content: text },
                { role: 'assistant', content: full },
              ],
              userContent: 'Analyse the last exchange.',
            });
            setFeedback(fb);
          } catch (e) {
            setFeedback(t(lang, 'feedbackUnavailable') + e.message);
          }
        }
      },
      onError: (e) => {
        setError(e.message || String(e));
        setMessages((m) => m.slice(0, -1));
      },
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4 lg:flex-row lg:overflow-hidden">
      {/* Arena */}
      <div className="flex min-w-0 flex-1 flex-col border border-zinc-800 bg-ink-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <Flame size={13} className="text-amber-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            {t(lang, 'conflictArena')}
          </span>
          <div className="flex-1" />
          {started && (
            <span className="flex items-center gap-1 font-mono text-[9px] text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse bg-red-500" /> {t(lang, 'live')}
            </span>
          )}
        </div>

        {/* Persona config */}
        {!started ? (
          <div className="space-y-4 overflow-y-auto p-4">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => selectPreset(i)}
                  className={`border p-2.5 text-left transition-colors ${
                    presetIdx === i
                      ? 'border-amber-700 bg-ink-800'
                      : 'border-zinc-800 bg-ink-850 hover:border-zinc-600'
                  }`}
                >
                  <div className="font-mono text-[10px] font-bold tracking-wider text-zinc-200">
                    {p.name}
                  </div>
                  <div className="mt-1 text-[10.5px] leading-snug text-zinc-500">{p.role}</div>
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                {t(lang, 'customPersona')}
              </label>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder='e.g. "passive-aggressive landlord, denies maintenance requests"'
                className="w-full border border-zinc-700 bg-ink-850 px-3 py-2 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                {t(lang, 'aggression')} <span className="text-amber-500">{aggression}/10</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={aggression}
                onChange={(e) => setAggression(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={start}
              disabled={!apiKey}
              className="border border-amber-800 bg-ink-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500 transition-colors hover:bg-amber-900/20 disabled:opacity-30"
            >
              ▶ ENGAGE
            </button>
            {!apiKey && (
              <p className="flex items-center gap-1 font-mono text-[9px] text-red-400">
                <Gauge size={10} /> {t(lang, 'apiKeyRequired')}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] border px-3 py-2 ${
                      m.role === 'user' ? 'border-zinc-700 bg-ink-800' : 'border-red-900/50 bg-red-950/15'
                    }`}
                  >
                    <div
                      className={`mb-1 font-mono text-[9px] uppercase tracking-widest ${
                        m.role === 'user' ? 'text-amber-600' : 'text-red-400'
                      }`}
                    >
                      {m.role === 'user' ? `▸ ${t(lang, 'you')}` : `▸ ${persona.name}`}
                    </div>
                    <Markdown content={m.content} />
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-zinc-800 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Your counter-move… (/STOP to end)"
                  rows={1}
                  className="min-h-[38px] max-h-32 flex-1 resize-none border border-zinc-700 bg-ink-850 px-3 py-2 font-mono text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={streaming || !input.trim()}
                  className="flex h-[38px] w-[42px] items-center justify-center border border-amber-800 bg-ink-800 text-amber-500 hover:bg-amber-900/20 disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
              {error && (
                <div className="mt-2 font-mono text-[10px] text-red-400">ERROR: {error}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Live feedback box */}
      <div className="flex w-full flex-col border border-zinc-800 bg-ink-900 lg:w-80 lg:min-w-0">
        <button
          onClick={() => setFeedbackOpen((o) => !o)}
          className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2 text-left"
        >
          <Gauge size={13} className="text-emerald-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            {t(lang, 'liveFeedback')}
          </span>
          <div className="flex-1" />
          <label
            className="flex cursor-pointer items-center gap-1 font-mono text-[9px] text-zinc-500"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={feedbackEnabled}
              onChange={(e) => setFeedbackEnabled(e.target.checked)}
              className="accent-emerald-600"
            />
            {t(lang, 'feedbackOn')}
          </label>
          {feedbackOpen ? (
            <ChevronUp size={12} className="text-zinc-500" />
          ) : (
            <ChevronDown size={12} className="text-zinc-500" />
          )}
        </button>
        {feedbackOpen && (
          <div className="min-h-[160px] flex-1 overflow-y-auto p-3">
            {!feedback && (
              <p className="font-mono text-[10px] leading-relaxed text-zinc-600">
                {feedbackEnabled ? t(lang, 'feedbackHint') : t(lang, 'feedbackOff')}
              </p>
            )}
            {feedback && (
              <div className={streaming ? 'caret' : ''}>
                <Markdown content={feedback} />
              </div>
            )}
          </div>
        )}
        {feedbackOpen && (
          <div className="flex items-center gap-2 border-t border-zinc-800 px-3 py-1.5">
            <button
              onClick={abort}
              disabled={!streaming}
              className="border border-zinc-700 bg-ink-800 px-2 py-0.5 font-mono text-[9px] uppercase text-zinc-400 hover:border-red-800 hover:text-red-400 disabled:opacity-30"
            >
              ABORT
            </button>
            <div className="flex-1" />
            <span className="font-mono text-[9px] text-zinc-600">{t(lang, 'secondPass')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
