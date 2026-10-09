import { Brain, Swords, Crosshair, Shield, MessageSquare, ScanSearch, Flame, HeartPulse, LifeBuoy, Plus, GraduationCap, Zap } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { t } from '../lib/i18n.js';

export const MODES = [
  { id: 'psych', short: 'PSYCH', icon: Brain, color: '#10b981', labelKey: 'mode_psych', descKey: 'mode_psych_desc' },
  { id: 'manip', short: 'COUNTER', icon: Swords, color: '#d97706', labelKey: 'mode_manip', descKey: 'mode_manip_desc' },
  { id: 'strategy', short: 'CAMPAIGN', icon: Crosshair, color: '#06b6d4', labelKey: 'mode_strategy', descKey: 'mode_strategy_desc' },
  { id: 'cyber', short: 'OPSEC', icon: Shield, color: '#f43f5e', labelKey: 'mode_cyber', descKey: 'mode_cyber_desc' },
];

export const MODULES = [
  { id: 'chat', icon: MessageSquare, labelKey: 'mod_chat' },
  { id: 'decon', icon: ScanSearch, labelKey: 'mod_decon' },
  { id: 'sim', icon: Flame, labelKey: 'mod_sim' },
  { id: 'anxiety', icon: HeartPulse, labelKey: 'mod_anxiety' },
  { id: 'sos', icon: LifeBuoy, labelKey: 'mod_sos' },
  { id: 'training', icon: GraduationCap, labelKey: 'mod_training' },
  { id: 'multiagent', icon: Zap, labelKey: 'mod_multiagent' },
];

export function ModeRail({ modeId, onMode, moduleId, onModule, sosButtons, onSos, onAddSos, lang }) {
  const { isTelegram, user } = useTelegram();

  return (
    <aside className="flex w-14 shrink-0 flex-col border-r border-zinc-800 bg-ink-900 sm:w-52">
      {/* Modes */}
      <div className="border-b border-zinc-800 px-1 py-1">
        <div className="mb-1 hidden px-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 sm:block">
          {t(lang, 'operationalMode')}
        </div>
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = modeId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onMode(m.id)}
              style={active ? { borderLeftColor: m.color } : { borderLeftColor: 'transparent' }}
              className={`group flex w-full items-center gap-2 border-l-2 px-2 py-2 text-left transition-colors ${
                active ? 'bg-ink-800 text-zinc-100' : 'text-zinc-500 hover:bg-ink-850 hover:text-zinc-300'
              }`}
              title={t(lang, m.descKey)}
            >
              <Icon size={16} style={{ color: active ? m.color : undefined }} />
              <span className="hidden font-mono text-[10px] font-medium tracking-wider sm:block">
                {t(lang, m.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modules */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <div className="mb-1 hidden px-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 sm:block">
          {t(lang, 'modules')}
        </div>
        {MODULES.map((m) => {
          const Icon = m.icon;
          const active = moduleId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModule(m.id)}
              className={`flex w-full items-center gap-2 border-l-2 px-2 py-1.5 text-left transition-colors ${
                active
                  ? 'border-amber-700 bg-ink-800 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:bg-ink-850 hover:text-zinc-300'
              }`}
            >
              <Icon size={14} className={active ? 'text-amber-500' : ''} />
              <span className="hidden font-mono text-[10px] tracking-wider sm:block">{t(lang, m.labelKey)}</span>
            </button>
          );
        })}

        {/* SOS quick triggers */}
        <div className="mb-1 mt-3 hidden px-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 sm:block">
          {t(lang, 'sosPresets')}
        </div>
        <div className="space-y-0.5">
          {sosButtons.map((s) => (
            <button
              key={s.id}
              onClick={() => onSos(s)}
              className="flex w-full items-center gap-2 border border-zinc-800 bg-ink-850 px-2 py-1 text-left transition-colors hover:border-red-900 hover:bg-red-950/20"
              style={{ borderLeftWidth: 2, borderLeftColor: s.accent || '#f43f5e' }}
              title={s.prompt}
            >
              <span className="h-1.5 w-1.5 shrink-0" style={{ background: s.accent || '#f43f5e' }} />
              <span className="hidden truncate font-mono text-[9.5px] tracking-wider text-zinc-300 sm:block">
                {s.label}
              </span>
            </button>
          ))}
          <button
            onClick={onAddSos}
            className="flex w-full items-center gap-2 px-2 py-1 text-zinc-600 transition-colors hover:text-amber-500"
          >
            <Plus size={12} />
            <span className="hidden font-mono text-[9.5px] uppercase tracking-wider sm:block">{t(lang, 'addPreset')}</span>
          </button>
        </div>
      </div>

      {/* Env footer */}
      <div className="border-t border-zinc-800 px-2 py-2">
        <div className="hidden font-mono text-[9px] uppercase tracking-wider text-zinc-600 sm:block">
          {t(lang, 'env')}
        </div>
        <div className="font-mono text-[9px] text-zinc-500">
          {isTelegram ? (
            <span className="text-emerald-500">{t(lang, 'tgMiniApp')} {user ? `· ${user.first_name || 'user'}` : ''}</span>
          ) : (
            <span className="text-zinc-600">{t(lang, 'browserPreview')}</span>
          )}
        </div>
      </div>
    </aside>
  );
}
