import { useState } from 'react';
import { HeartPulse, ChevronRight, RotateCcw, Gauge } from 'lucide-react';
import { useOpenRouter } from '../hooks/useOpenRouter';
import { ANXIETY_STEPS, buildAnxietySystem } from '../config/systemPrompts.js';
import Markdown from './Markdown.jsx';
import { t } from '../lib/i18n.js';

/**
 * ANXIETY & PANIC DISSECTOR — staged CBT questionnaire → structured analysis.
 */
export default function AnxietyDissector({ apiKey, model, lang }) {
  const { stream, streaming, abort } = useOpenRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  const cur = ANXIETY_STEPS[step];

  function setAnswer(v) {
    setAnswers((a) => ({ ...a, [cur.id]: v }));
  }

  function next() {
    if (step < ANXIETY_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      runAnalysis();
    }
  }

  async function runAnalysis() {
    if (!apiKey) {
      setError('API key required — open Settings.');
      return;
    }
    setError(null);
    setDone(true);
    setOutput('');

    const transcript = ANXIETY_STEPS.map(
      (s) => `### ${s.title}\n${answers[s.id] || '(no answer)'}`
    ).join('\n\n');

    const system = buildAnxietySystem(lang);

    let full = '';
    await stream({
      apiKey,
      model,
      system,
      messages: [],
      userContent: `PATIENT STAGED INPUTS:\n\n${transcript}`,
      temperature: 0.3,
      onDelta: (d) => {
        full += d;
        setOutput(full);
      },
      onDone: () => {},
      onError: (e) => setError(e.message || String(e)),
    });
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setDone(false);
    setOutput('');
    setError(null);
  }

  const answeredCount = Object.values(answers).filter((v) => v && v.trim()).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4 lg:flex-row lg:overflow-hidden">
      {/* Questionnaire column */}
      <div className="flex min-w-0 flex-1 flex-col border border-zinc-800 bg-ink-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <HeartPulse size={13} className="text-emerald-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
            {t(lang, 'protocol')}
          </span>
          <div className="flex-1" />
          <span className="font-mono text-[9px] text-zinc-600">
            {t(lang, 'step')} {Math.min(step + 1, ANXIETY_STEPS.length)}{t(lang, 'of')}{ANXIETY_STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex h-0.5 w-full bg-ink-850">
          {ANXIETY_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-full ${i < step ? 'bg-emerald-600' : i === step ? 'bg-amber-600' : 'bg-zinc-800'}`}
              style={{ width: `${100 / ANXIETY_STEPS.length}%` }}
            />
          ))}
        </div>

        {!done ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-amber-500">
              {t(lang, `anx_${cur.id}_title`)}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">{t(lang, `anx_${cur.id}_prompt`)}</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-600">{t(lang, `anx_${cur.id}_hint`)}</p>

            <textarea
              value={answers[cur.id] || ''}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              autoFocus
              placeholder={t(lang, 'yourAnswer')}
              className="mt-3 w-full resize-none border border-zinc-700 bg-ink-850 p-3 font-mono text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-700 focus:outline-none"
            />

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => step > 0 && setStep(step - 1)}
                disabled={step === 0}
                className="border border-zinc-700 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              >
                {t(lang, 'back')}
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1 border border-emerald-800 bg-ink-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-500 transition-colors hover:bg-emerald-900/20"
              >
                {step === ANXIETY_STEPS.length - 1 ? t(lang, 'analyze') : t(lang, 'next')}
                <ChevronRight size={12} />
              </button>
              <div className="flex-1" />
              <button
                onClick={reset}
                className="flex items-center gap-1 border border-zinc-700 bg-ink-800 px-2 py-2 font-mono text-[10px] uppercase text-zinc-500 hover:text-zinc-300"
              >
                <RotateCcw size={11} /> {t(lang, 'reset')}
              </button>
            </div>

            {/* Side mini-summary */}
            <div className="mt-4 border border-zinc-800 bg-ink-850 p-3">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                {t(lang, 'captured')} ({answeredCount}/{ANXIETY_STEPS.length})
              </div>
              {ANXIETY_STEPS.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setStep(i)}
                  className={`cursor-pointer truncate font-mono text-[10px] ${
                    i === step ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  <span className="text-zinc-700">{String(i + 1).padStart(2, '0')}</span> {t(lang, `anx_${s.id}_title`)}:{' '}
                  <span className={answers[s.id]?.trim() ? 'text-zinc-400' : 'text-zinc-700'}>
                    {answers[s.id]?.trim() ? answers[s.id].slice(0, 60) + (answers[s.id].length > 60 ? '…' : '') : t(lang, 'noAnswer')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={reset}
                className="flex items-center gap-1 border border-zinc-700 bg-ink-800 px-2 py-1 font-mono text-[10px] uppercase text-zinc-400 hover:text-zinc-200"
              >
                <RotateCcw size={11} /> {t(lang, 'newAnalysis')}
              </button>
              <div className="flex-1" />
              <button
                onClick={abort}
                disabled={!streaming}
                className="border border-zinc-700 bg-ink-800 px-2 py-1 font-mono text-[10px] uppercase text-zinc-400 hover:border-red-800 hover:text-red-400 disabled:opacity-30"
              >
                {t(lang, 'abort')}
              </button>
            </div>
            {error && (
              <div className="border border-red-900 bg-red-950/20 p-3 font-mono text-[10px] text-red-400">
                ERROR: {error}
              </div>
            )}
            {output && <Markdown content={output} className={streaming ? 'caret' : ''} />}
          </div>
        )}
      </div>

      {/* Info rail */}
      <div className="flex w-full flex-col border border-zinc-800 bg-ink-900 lg:w-64">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <Gauge size={13} className="text-zinc-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">{t(lang, 'doctrine')}</span>
        </div>
        <div className="space-y-3 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed text-zinc-500">
          <p>
            <span className="text-emerald-500">{t(lang, 'doctrine_beck')}</span> — {t(lang, 'doctrine_beck_t')}
          </p>
          <p>
            <span className="text-emerald-500">{t(lang, 'doctrine_ellis')}</span> — {t(lang, 'doctrine_ellis_t')}
          </p>
          <p>
            <span className="text-emerald-500">{t(lang, 'doctrine_porges')}</span> — {t(lang, 'doctrine_porges_t')}
          </p>
          <p>
            <span className="text-emerald-500">{t(lang, 'doctrine_ogden')}</span> — {t(lang, 'doctrine_ogden_t')}
          </p>
          <p>
            <span className="text-emerald-500">{t(lang, 'doctrine_linehan')}</span> — {t(lang, 'doctrine_linehan_t')}
          </p>
          <p className="border-t border-zinc-800 pt-2 text-zinc-600">
            {t(lang, 'crisis')}
          </p>
        </div>
      </div>
    </div>
  );
}
