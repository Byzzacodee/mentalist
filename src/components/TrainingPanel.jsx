import { useState } from 'react';
import { GraduationCap, ChevronRight, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { useOpenRouter } from '../hooks/useOpenRouter';
import { getActiveApiKey, getModel } from '../lib/settings.js';
import { t } from '../lib/i18n.js';
import Markdown from './Markdown.jsx';

const SCENARIOS = {
  psych: [
    { q: 'Паническая атака на работе, коллеги вокруг. Первые 60 секунд.', a: '5-4-3-2-1 grounding + дыхание 4-6' },
    { q: 'Навязчивая мысль: «я всё испортил». Интенсивность 85/100.', a: 'Когнитивная реструктуризация: доказательства за/против' },
    { q: 'Бессонница из-за тревоги о завтрашнем дне.', a: 'Парадоксальная интенция + техника заземления' },
    { q: 'Социальная тревога перед встречей с руководством.', a: 'Сдвиг фокуса на тело + короткий CBT-скрипт' },
  ],
  manip: [
    { q: '«Ты же понимаешь, что это в твоих же интересах?» — что это за приём и как ответить?', a: 'Ложная рамка + давление. Контр-вопрос: «Какие именно интересы?»' },
    { q: 'Собеседник постоянно перебивает и меняет тему. Ваши действия?', a: 'Фиксация рамки: «Давай закончим этот пункт» + пауза' },
    { q: '«Все так делают» — аргумент при подписании договора.', a: 'Социальное доказательство. Ответ: «Мне нужно время на проверку»' },
    { q: 'Ультиматум: «Подпиши сейчас или сделка сгорит».', a: 'Искусственный дефицит. Не поддаваться, запросить письменные условия' },
  ],
  strategy: [
    { q: 'Переговоры с монополистом, у вас слабая BATNA. План на 3 хода.', a: '1) Усилить BATNA 2) Контроль повестки 3) Якорь на процессе' },
    { q: 'Конкурент демпингует. Ваш ответ без ценовой войны.', a: 'Дифференциация + фокус на ценности, не на цене' },
    { q: 'Долгосрочный конфликт с партнёром по бизнесу. Стратегия на 6 месяцев.', a: 'Пересмотр контракта + поэтапное деэскалация + выходная опция' },
    { q: 'Вход на новый рынок с сильным локальным игроком.', a: 'Косвенный подход: ниша → партнёрство → масштабирование' },
  ],
  cyber: [
    { q: 'Подозрительное письмо от «бухгалтерии» с вложением. Действия?', a: 'Не открывать. Проверить отправителя через другой канал. Сообщить в ИБ.' },
    { q: 'Утечка пароля в базу данных. Первые шаги.', a: 'Смена пароля везде, 2FA, проверка сессий, мониторинг карт' },
    { q: 'DDoS на ваш сервер. Приоритеты реагирования.', a: '1) Активировать защиту 2) Коммуникация 3) Сбор логов' },
    { q: 'Фишинг через Telegram-бота. Как распознать?', a: 'Проверка домена, давление на срочность, запрос данных — красные флаги' },
  ],
};

/**
 * TRAINING PANEL — scenario-based training with AI evaluation.
 */
export default function TrainingPanel({ mode, lang }) {
  const { complete, streaming } = useOpenRouter();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const scenarios = SCENARIOS[mode.id] || [];
  const current = scenarios[step];

  async function evaluate() {
    if (!answer.trim() || loading) return;
    setLoading(true);
    setEvaluation('');

    const system = `You are a strict tactical trainer. Evaluate the user's answer to the scenario. Give: 1) Score 0-100 2) What's good 3) What's missing 4) Better approach. Be concise. In ${lang === 'ru' ? 'Russian' : lang === 'uz' ? 'Uzbek' : 'English'}. No tables.`;

    const prompt = `SCENARIO: ${current.q}\n\nUSER ANSWER: ${answer}\n\nREFERENCE APPROACH: ${current.a}`;

    try {
      const result = await complete({
        apiKey: getActiveApiKey(),
        model: getModel(),
        system,
        messages: [],
        userContent: prompt,
        temperature: 0.2,
      });
      setEvaluation(result);
      const match = result.match(/(\d{1,3})\s*[\/\-]?\s*100|score[:\s]*(\d{1,3})/i);
      if (match) setScore(parseInt(match[1] || match[2], 10));
      setHistory((h) => [...h, { q: current.q, a: answer, score: match ? parseInt(match[1] || match[2], 10) : null }]);
    } catch (e) {
      setEvaluation(e.message);
    } finally {
      setLoading(false);
    }
  }

  function next() {
    setStep((s) => (s + 1) % scenarios.length);
    setAnswer('');
    setEvaluation('');
    setScore(null);
  }

  if (scenarios.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="font-mono text-[10px] text-zinc-600">{t(lang, 'noScenarios')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-ink-900 px-3 py-2">
        <GraduationCap size={13} className="text-amber-500" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
          {t(lang, 'training')}
        </span>
        <div className="flex-1" />
        <span className="font-mono text-[9px] text-zinc-600">
          {step + 1}/{scenarios.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* Scenario */}
        <div className="border border-zinc-800 bg-ink-900 p-3">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-amber-500">
            {t(lang, 'scenario')}
          </div>
          <p className="text-[13px] leading-relaxed text-zinc-200">{current.q}</p>
        </div>

        {/* Answer */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t(lang, 'yourAnswer')}
          rows={4}
          className="mt-3 w-full resize-none border border-zinc-700 bg-ink-850 p-3 font-mono text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
        />

        <div className="mt-3 flex gap-2">
          <button
            onClick={evaluate}
            disabled={loading || !answer.trim()}
            className="flex items-center gap-1 border border-amber-800 bg-ink-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:bg-amber-900/20 disabled:opacity-30"
          >
            {t(lang, 'evaluate')}
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1 border border-zinc-700 bg-ink-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200"
          >
            <RotateCcw size={11} /> {t(lang, 'next')}
          </button>
        </div>

        {/* Evaluation */}
        {loading && (
          <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-amber-500">
            <div className="h-3 w-3 animate-spin rounded-full border border-amber-500 border-t-transparent" />
            {t(lang, 'evaluating')}
          </div>
        )}

        {evaluation && (
          <div className="mt-3 border border-zinc-800 bg-ink-900">
            {score !== null && (
              <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
                {score >= 70 ? (
                  <CheckCircle size={14} className="text-emerald-500" />
                ) : (
                  <XCircle size={14} className="text-red-400" />
                )}
                <span className={`font-mono text-[12px] font-bold ${score >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {score}/100
                </span>
              </div>
            )}
            <div className="p-3">
              <Markdown content={evaluation} />
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
              {t(lang, 'history')}
            </div>
            {history.map((h, i) => (
              <div key={i} className="mb-1.5 border border-zinc-800 bg-ink-850 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="truncate font-mono text-[10px] text-zinc-300">{h.q}</span>
                  {h.score !== null && (
                    <span className={`font-mono text-[10px] font-bold ${h.score >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.score}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
