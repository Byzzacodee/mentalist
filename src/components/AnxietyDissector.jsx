import { useState } from 'react';
import { HeartPulse, ChevronRight, RotateCcw, Gauge } from 'lucide-react';
import { useOpenRouter } from '../hooks/useOpenRouter';
import { ANXIETY_STEPS, ANXIETY_FINAL_PROMPT, CORE_DIRECTIVES, KNOWLEDGE_CITE } from '../config/systemPrompts.js';
import Markdown from './Markdown.jsx';

/**
 * ANXIETY & PANIC DISSECTOR — staged CBT questionnaire → structured analysis.
 */
export default function AnxietyDissector({ apiKey, model }) {
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

    const system = [
      ANXIETY_FINAL_PROMPT,
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
            CBT DISSECTION PROTOCOL
          </span>
          <div className="flex-1" />
          <span className="font-mono text-[9px] text-zinc-600">
            STEP {Math.min(step + 1, ANXIETY_STEPS.length)}/{ANXIETY_STEPS.length}
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
              {cur.title}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">{cur.prompt}</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-600">{cur.hint}</p>

            <textarea
              value={answers[cur.id] || ''}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              autoFocus
              placeholder="Your answer…"
              className="mt-3 w-full resize-none border border-zinc-700 bg-ink-850 p-3 font-mono text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-700 focus:outline-none"
            />

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => step > 0 && setStep(step - 1)}
                disabled={step === 0}
                className="border border-zinc-700 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              >
                BACK
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1 border border-emerald-800 bg-ink-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-500 transition-colors hover:bg-emerald-900/20"
              >
                {step === ANXIETY_STEPS.length - 1 ? '▶ ANALYZE' : 'NEXT'}
                <ChevronRight size={12} />
              </button>
              <div className="flex-1" />
              <button
                onClick={reset}
                className="flex items-center gap-1 border border-zinc-700 bg-ink-800 px-2 py-2 font-mono text-[10px] uppercase text-zinc-500 hover:text-zinc-300"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>

            {/* Side mini-summary */}
            <div className="mt-4 border border-zinc-800 bg-ink-850 p-3">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                CAPTURED DATA ({answeredCount}/{ANXIETY_STEPS.length})
              </div>
              {ANXIETY_STEPS.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setStep(i)}
                  className={`cursor-pointer truncate font-mono text-[10px] ${
                    i === step ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  <span className="text-zinc-700">{String(i + 1).padStart(2, '0')}</span> {s.title}:{' '}
                  <span className={answers[s.id]?.trim() ? 'text-zinc-400' : 'text-zinc-700'}>
                    {answers[s.id]?.trim() ? answers[s.id].slice(0, 60) + (answers[s.id].length > 60 ? '…' : '') : '—'}
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
                <RotateCcw size={11} /> New analysis
              </button>
              <div className="flex-1" />
              <button
                onClick={abort}
                disabled={!streaming}
                className="border border-zinc-700 bg-ink-800 px-2 py-1 font-mono text-[10px] uppercase text-zinc-400 hover:border-red-800 hover:text-red-400 disabled:opacity-30"
              >
                ABORT
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
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">DOCTRINE</span>
        </div>
        <div className="space-y-3 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed text-zinc-500">
          <p>
            <span className="text-emerald-500">BECK</span> — cognitive triage: situation → thought → emotion → distortion → balanced thought.
          </p>
          <p>
            <span className="text-emerald-500">ELLIS</span> — REBT disputation: evidence, "so what", where is the catastrophe.
          </p>
          <p>
            <span className="text-emerald-500">PORGES / DANA</span> — autonomic ladder; down-regulation before cognition if intensity &gt; 60.
          </p>
          <p>
            <span className="text-emerald-500">OGDEN / VAN DER KOLK</span> — body-first signals; sensation before narrative.
          </p>
          <p>
            <span className="text-emerald-500">LINEHAN</span> — TIPP / ACCEPTS for acute peaks.
          </p>
          <p className="border-t border-zinc-800 pt-2 text-zinc-600">
            This tool structures thinking. It is not therapy. If you are in immediate danger or crisis, contact local emergency services or a crisis hotline now.
          </p>
        </div>
      </div>
    </div>
  );
}
