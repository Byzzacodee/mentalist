import { useState } from 'react';
import { Zap, Send, Loader2, Users } from 'lucide-react';
import { useOpenRouter } from '../hooks/useOpenRouter';
import { getApiKeys, getModelsForMode, getActiveApiKey } from '../lib/settings.js';
import { buildModeSystem } from '../config/systemPrompts.js';
import { t } from '../lib/i18n.js';
import Markdown from './Markdown.jsx';

/**
 * MULTI-AGENT PANEL — parallel responses from multiple models + synthesis.
 */
export default function MultiAgentPanel({ mode, lang }) {
  const { parallel, complete, streaming } = useOpenRouter();
  const [input, setInput] = useState('');
  const [agents, setAgents] = useState([]);
  const [synthesis, setSynthesis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setSynthesis('');
    setAgents([]);
    setLoading(true);

    const apiKeys = getApiKeys();
    const models = getModelsForMode(mode.id);
    if (models.length === 0) {
      setError(t(lang, 'noModelsForMode'));
      setLoading(false);
      return;
    }

    const system = buildModeSystem(mode.id, lang);
    const results = await parallel({
      apiKeys: apiKeys.length > 0 ? apiKeys.map((k) => k.key) : [getActiveApiKey()],
      models,
      system,
      messages: [],
      userContent: text,
      temperature: 0.35,
    });
    setAgents(results);
    setLoading(false);
  }

  async function synthesize() {
    if (agents.length === 0 || loading) return;
    setLoading(true);
    const combined = agents
      .filter((a) => a.content)
      .map((a, i) => `--- Agent ${i + 1} (${a.label}) ---\n${a.content}`)
      .join('\n\n');

    const system = `You are a synthesis engine. Combine the following agent responses into one clear, concise answer in ${lang === 'ru' ? 'Russian' : lang === 'uz' ? "Uzbek" : 'English'}. No tables, no citations, just the best combined answer.`;

    try {
      const apiKeys = getApiKeys();
      const models = getModelsForMode(mode.id);
      const key = apiKeys.length > 0 ? apiKeys[0].key : getActiveApiKey();
      const modelId = models.length > 0 ? models[0].modelId : 'nvidia/nemotron-3-ultra-550b-a55b:free';
      const result = await complete({
        apiKey: key,
        model: modelId,
        system,
        messages: [],
        userContent: combined,
        temperature: 0.2,
      });
      setSynthesis(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-ink-900 px-3 py-2">
        <Zap size={13} className="text-emerald-500" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
          {t(lang, 'multiAgent')}
        </span>
        <div className="flex-1" />
        <span className="font-mono text-[9px] text-zinc-600">
          {t(lang, 'parallelResponses')}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {agents.length === 0 && !loading && (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              {t(lang, 'multiAgentHint')}
            </p>
          </div>
        )}

        {loading && agents.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin text-emerald-500" />
          </div>
        )}

        {agents.length > 0 && (
          <div className="space-y-3">
            {agents.map((a, i) => (
              <div key={i} className="border border-zinc-800 bg-ink-900">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-1.5">
                  <Users size={11} className="text-emerald-500" />
                  <span className="font-mono text-[10px] font-bold text-zinc-200">{a.label}</span>
                  <span className="font-mono text-[9px] text-zinc-600">{a.modelId}</span>
                  {a.error && <span className="font-mono text-[9px] text-red-400">ERROR</span>}
                </div>
                <div className="p-3">
                  {a.error ? (
                    <p className="font-mono text-[10px] text-red-400">{a.error}</p>
                  ) : (
                    <Markdown content={a.content} />
                  )}
                </div>
              </div>
            ))}

            {agents.some((a) => a.content) && (
              <button
                onClick={synthesize}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 border border-emerald-800 bg-ink-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:bg-emerald-900/20 disabled:opacity-30"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                {t(lang, 'synthesize')}
              </button>
            )}

            {synthesis && (
              <div className="border border-emerald-800 bg-emerald-950/20">
                <div className="border-b border-emerald-800 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  {t(lang, 'synthesis')}
                </div>
                <div className="p-3">
                  <Markdown content={synthesis} />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="border border-red-900 bg-red-950/20 p-3 font-mono text-[10px] text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 bg-ink-900 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                run();
              }
            }}
            placeholder={t(lang, 'multiAgentInput')}
            rows={2}
            className="min-h-[44px] flex-1 resize-none border border-zinc-700 bg-ink-850 px-3 py-2 font-mono text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-700 focus:outline-none"
          />
          <button
            onClick={run}
            disabled={loading || !input.trim()}
            className="flex h-[44px] w-[44px] items-center justify-center border border-emerald-800 bg-ink-800 text-emerald-500 hover:bg-emerald-900/20 disabled:opacity-30"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
