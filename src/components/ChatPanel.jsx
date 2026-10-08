import { useEffect, useRef, useState } from 'react';
import { Send, Square } from 'lucide-react';
import db from '../db/dexie.js';
import { useOpenRouter } from '../hooks/useOpenRouter';
import { MODE_SYSTEM_PROMPTS, CORE_DIRECTIVES, KNOWLEDGE_CITE, sosPrompt } from '../config/systemPrompts.js';
import Markdown from './Markdown.jsx';

/**
 * OPERATOR CHAT — primary chat surface for the selected operational mode.
 * Streams OpenRouter completions and persists to Dexie.js.
 */
export default function ChatPanel({ mode, chat, apiKey, model, onRefreshChats, onToast, sosQueue, onSosFired }) {
  const { stream, streaming, abort } = useOpenRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const sendRef = useRef(null);
  const firedRef = useRef(null);
  sendRef.current = send;

  // Load messages when chat changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!chat) {
        setMessages([]);
        return;
      }
      const msgs = await db.messages.where('chatId').equals(chat.id).sortBy('createdAt');
      if (!cancelled) {
        setMessages(msgs.map((m) => ({ id: m.id, role: m.role, content: m.content })));
        setError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chat?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, streaming]);

  // Fire queued SOS preset into this chat
  useEffect(() => {
    if (sosQueue && chat && sosQueue.chatId === chat.id && firedRef.current !== sosQueue.ts) {
      firedRef.current = sosQueue.ts;
      sendRef.current?.(sosQueue.preset.prompt, sosQueue.preset);
      onSosFired?.();
    }
  }, [sosQueue, chat]);

  async function send(userText, sosMeta) {
    const text = (userText || input).trim();
    if (!text || streaming) return;
    setInput('');
    setError(null);

    if (!chat) {
      onToast?.('Create or select a chat first');
      return;
    }

    const userMsg = { chatId: chat.id, role: 'user', content: sosMeta ? sosPrompt(sosMeta.label, text) : text, createdAt: Date.now() };
    const userMsgId = await db.messages.add(userMsg);

    // Auto-title from first exchange
    const existing = await db.chats.get(chat.id);
    if (existing && existing.title === 'NEW OPERATION') {
      const raw = sosMeta ? sosMeta.label : text;
      await db.chats.update(chat.id, {
        title: raw.replace(/\s+/g, ' ').slice(0, 42) + (raw.length > 42 ? '…' : ''),
        updatedAt: Date.now(),
      });
      onRefreshChats?.();
    }

    setMessages((m) => [
      ...m,
      { id: userMsgId, role: 'user', content: userMsg.content },
      { id: 'pending', role: 'assistant', content: '' },
    ]);

    const history = await db.messages.where('chatId').equals(chat.id).sortBy('createdAt');
    const apiHistory = history
      .filter((m) => m.id !== userMsgId)
      .map((m) => ({ role: m.role, content: m.content }));

    const system = [
      MODE_SYSTEM_PROMPTS[mode.id],
      CORE_DIRECTIVES,
      '## KNOWLEDGE CORE LIBRARY (cite from these sources)',
      KNOWLEDGE_CITE,
    ].join('\n\n');

    let full = '';
    await stream({
      apiKey,
      model,
      system,
      messages: apiHistory,
      userContent: userMsg.content,
      temperature: 0.35,
      onDelta: (delta) => {
        full += delta;
        setMessages((m) => [...m.slice(0, -1), { id: 'pending', role: 'assistant', content: full }]);
      },
      onDone: async () => {
        const assistantMsg = { chatId: chat.id, role: 'assistant', content: full, createdAt: Date.now() };
        const assistantId = await db.messages.add(assistantMsg);
        await db.chats.update(chat.id, { updatedAt: Date.now() });
        setMessages((m) => [...m.slice(0, -1), { id: assistantId, role: 'assistant', content: full }]);
        onRefreshChats?.();
      },
      onError: (e) => {
        setError(e.message || String(e));
        setMessages((m) => m.filter((x) => x.id !== 'pending'));
      },
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Chat context bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-ink-900 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          CHAT:
        </span>
        <span className="truncate font-mono text-[10px] text-zinc-200">
          {chat ? chat.title : '—'}
        </span>
        <span
          className="hidden font-mono text-[9px] uppercase sm:block"
          style={{ color: mode.color }}
        >
          [{mode.short}]
        </span>
        <div className="flex-1" />
        <button
          onClick={() => streaming && abort()}
          disabled={!streaming}
          className="flex items-center gap-1 border border-zinc-700 bg-ink-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:border-red-800 hover:text-red-400 disabled:opacity-30"
        >
          <Square size={10} /> ABORT
        </button>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5">
        {!chat && (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-[11px] text-zinc-600">
              NO ACTIVE CHAT — create one from the chat list
            </p>
          </div>
        )}
        {chat && messages.length === 0 && (
          <div className="border border-dashed border-zinc-800 p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              STANDBY // {mode.label}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{mode.desc}</p>
            <p className="mt-2 font-mono text-[10px] text-zinc-600">
              System core loaded: {mode.short.toLowerCase()} doctrine + knowledge library
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 ${
                m.role === 'user'
                  ? 'border border-zinc-700 bg-ink-800'
                  : 'w-full max-w-[95%] border border-zinc-800 bg-ink-900'
              }`}
            >
              <div
                className={`mb-1 font-mono text-[9px] uppercase tracking-widest ${
                  m.role === 'user' ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {m.role === 'user' ? '▸ OPERATOR' : '▸ ANALYST'}
              </div>
              {m.role === 'user' ? (
                <p className="whitespace-pre-wrap text-[13px] text-zinc-200">{m.content}</p>
              ) : (
                <div className={streaming && m.id === 'pending' ? 'caret' : ''}>
                  <Markdown content={m.content} />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Error strip */}
      {error && (
        <div className="border-t border-red-900 bg-red-950/30 px-3 py-2 font-mono text-[10px] text-red-400">
          ERROR: {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-800 bg-ink-900 p-3">
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
            placeholder={`${mode.short} input — Enter to send, Shift+Enter for newline`}
            rows={1}
            className="min-h-[38px] max-h-32 flex-1 resize-none border border-zinc-700 bg-ink-850 px-3 py-2 font-mono text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700 focus:outline-none"
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="flex h-[38px] w-[42px] items-center justify-center border border-amber-800 bg-ink-800 text-amber-500 transition-colors hover:bg-amber-900/20 disabled:opacity-30"
          >
            <Send size={15} />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-zinc-600">
          <span>
            {apiKey ? '● KEY LOADED' : '○ NO KEY — SETTINGS'}{' '}
            <span className="text-zinc-700">|</span> {model}
          </span>
          <span>
            {messages.length} msgs · Dexie/IndexedDB
          </span>
        </div>
      </div>
    </div>
  );
}
