import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, MessageSquare } from 'lucide-react';
import db, { seedDefaults } from './db/dexie.js';
import { getApiKey, getModel } from './lib/settings.js';
import { getLang, setLang, t } from './lib/i18n.js';
import { useTelegram } from './hooks/useTelegram';
import { ModeRail, MODES } from './components/ModeRail.jsx';
import TopBar from './components/TopBar.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import MessageDeconstructor from './components/MessageDeconstructor.jsx';
import ConflictSimulator from './components/ConflictSimulator.jsx';
import AnxietyDissector from './components/AnxietyDissector.jsx';
import SOSPanel from './components/SOSPanel.jsx';
import SettingsModal from './components/SettingsModal.jsx';

export default function App() {
  const [modeId, setModeId] = useState('psych');
  const [moduleId, setModuleId] = useState('chat');
  const [lang, setLangState] = useState(getLang());
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sosButtons, setSosButtons] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sosQueue, setSosQueue] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const { height } = useTelegram();

  const apiKey = getApiKey();
  const model = getModel();
  const mode = MODES.find((m) => m.id === modeId) || MODES[0];

  function showToast(msg, type = 'ok') {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  function changeLang(l) {
    setLang(l);
    setLangState(l);
  }

  // ---- Data loaders -------------------------------------------------------
  const refreshSos = useCallback(async () => {
    const list = await db.sos.orderBy('createdAt').toArray();
    setSosButtons(list);
  }, []);

  const refreshChats = useCallback(async () => {
    const list = await db.chats.where('mode').equals(modeId).sortBy('updatedAt');
    setChats(list.reverse());
  }, [modeId]);

  useEffect(() => {
    seedDefaults().then(() => {
      refreshSos();
    });
  }, [refreshSos]);

  useEffect(() => {
    refreshChats().then(async () => {
      const list = await db.chats.where('mode').equals(modeId).sortBy('updatedAt');
      const latest = list[list.length - 1];
      setActiveChatId(latest ? latest.id : null);
    });
  }, [modeId, refreshChats]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  async function newChat() {
    const id = await db.chats.add({
      mode: modeId,
      title: 'NEW OPERATION',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await refreshChats();
    setActiveChatId(id);
  }

  async function deleteChat(id) {
    await db.chats.delete(id);
    await db.messages.where('chatId').equals(id).delete();
    await refreshChats();
    setActiveChatId((cur) => (cur === id ? null : cur));
    showToast(t(lang, 'toastChatDeleted'));
  }

  function onDataChanged() {
    refreshChats();
    refreshSos();
  }

  function onSosTrigger(preset) {
    setModuleId('chat');
    if (!activeChat) {
      newChat().then((id) => setSosQueue({ preset, ts: Date.now(), chatId: id }));
    } else {
      setSosQueue({ preset, ts: Date.now(), chatId: activeChat.id });
    }
  }

  return (
    <div className="tg-viewport flex overflow-hidden bg-ink-950 text-zinc-200">
      <ModeRail
        modeId={modeId}
        onMode={setModeId}
        moduleId={moduleId}
        onModule={setModuleId}
        sosButtons={sosButtons}
        onSos={onSosTrigger}
        onAddSos={() => {
          setModuleId('sos');
        }}
        lang={lang}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar
          mode={mode}
          moduleId={moduleId}
          streaming={false}
          onOpenSettings={() => setSettingsOpen(true)}
          lastSyncTs={null}
          lang={lang}
          onLang={changeLang}
        />

        <div className="min-h-0 flex-1">
          {moduleId === 'chat' && (
            <div className="flex h-full min-h-0">
              {/* Chat history strip */}
              <div className="hidden w-52 shrink-0 flex-col border-r border-zinc-800 bg-ink-900 md:flex">
                <div className="flex items-center justify-between border-b border-zinc-800 px-2.5 py-2">
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                    <MessageSquare size={10} /> {t(lang, 'operations')}
                  </span>
                  <button
                    onClick={newChat}
                    className="border border-zinc-700 bg-ink-800 p-1 text-zinc-400 hover:border-amber-700 hover:text-amber-500"
                    title={t(lang, 'newChat')}
                  >
                    <Plus size={11} />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {chats.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setActiveChatId(c.id)}
                      className={`group flex cursor-pointer items-center gap-1 border-l-2 px-2.5 py-2 ${
                        c.id === activeChatId
                          ? 'border-amber-600 bg-ink-800 text-zinc-100'
                          : 'border-transparent text-zinc-500 hover:bg-ink-850 hover:text-zinc-300'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate font-mono text-[10px]">
                        {c.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(c.id);
                        }}
                        className="hidden p-0.5 text-zinc-600 hover:text-red-400 group-hover:block"
                        title={t(lang, 'abort')}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <p className="p-2.5 font-mono text-[9px] leading-relaxed text-zinc-600">
                      {t(lang, 'noChats')}
                    </p>
                  )}
                </div>
                <div className="border-t border-zinc-800 px-2.5 py-1.5 font-mono text-[9px] text-zinc-700">
                  {t(lang, 'viewport')} {Math.round(height)}px
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <ChatPanel
                  key={activeChatId || 'none'}
                  mode={mode}
                  chat={activeChat}
                  apiKey={apiKey}
                  model={model}
                  onRefreshChats={refreshChats}
                  onToast={showToast}
                  sosQueue={sosQueue}
                  onSosFired={() => setSosQueue(null)}
                  lang={lang}
                />
              </div>
            </div>
          )}

          {moduleId === 'decon' && <MessageDeconstructor apiKey={apiKey} model={model} lang={lang} />}
          {moduleId === 'sim' && <ConflictSimulator apiKey={apiKey} model={model} lang={lang} />}
          {moduleId === 'anxiety' && <AnxietyDissector apiKey={apiKey} model={model} lang={lang} />}
          {moduleId === 'sos' && (
            <SOSPanel
              sosButtons={sosButtons}
              onRefresh={refreshSos}
              onTrigger={onSosTrigger}
              onToast={showToast}
              lang={lang}
            />
          )}
        </div>
      </main>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onToast={showToast}
          onDataChanged={onDataChanged}
          lang={lang}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-3 right-3 z-[60] border px-3 py-2 font-mono text-[10px] ${
            toast.type === 'error'
              ? 'border-red-800 bg-red-950/90 text-red-300'
              : 'border-zinc-700 bg-ink-800 text-zinc-200'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
