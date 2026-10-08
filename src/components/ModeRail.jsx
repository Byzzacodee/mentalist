import { Brain, Swords, Crosshair, Shield, MessageSquare, ScanSearch, Flame, HeartPulse, LifeBuoy, Plus } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

export const MODES = [
  { id: 'psych', label: 'PSYCHOLOGY & CBT', short: 'PSYCH', icon: Brain, color: '#10b981', desc: 'Grounding · CBT restructuring · polyvagal state shifts' },
  { id: 'manip', label: 'MANIPULATION & COUNTER', short: 'COUNTER', icon: Swords, color: '#d97706', desc: 'Subtext dissection · verbal counter-scripts' },
  { id: 'strategy', label: 'LONG-TERM CAMPAIGN', short: 'CAMPAIGN', icon: Crosshair, color: '#06b6d4', desc: 'OODA loops · game theory · power balance' },
  { id: 'cyber', label: 'CYBER & OPSEC', short: 'OPSEC', icon: Shield, color: '#f43f5e', desc: 'STRIDE · OSINT defense · PSYOP countermeasures' },
];

export const MODULES = [
  { id: 'chat', label: 'OPERATOR CHAT', icon: MessageSquare },
  { id: 'decon', label: 'MESSAGE DECONSTRUCTOR', icon: ScanSearch },
  { id: 'sim', label: 'CONFLICT SIMULATOR', icon: Flame },
  { id: 'anxiety', label: 'ANXIETY DISSECTOR', icon: HeartPulse },
  { id: 'sos', label: 'SOS CONTROL', icon: LifeBuoy },
];

export function ModeRail({ modeId, onMode, moduleId, onModule, sosButtons, onSos, onAddSos }) {
  const { isTelegram, user } = useTelegram();

  return (
    <aside className="flex w-14 shrink-0 flex-col border-r border-zinc-800 bg-ink-900 sm:w-52">
      {/* Modes */}
      <div className="border-b border-zinc-800 px-1 py-1">
        <div className="mb-1 hidden px-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 sm:block">
          OPERATIONAL MODE
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
              title={m.desc}
            >
              <Icon size={16} style={{ color: active ? m.color : undefined }} />
              <span className="hidden font-mono text-[10px] font-medium tracking-wider sm:block">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modules */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <div className="mb-1 hidden px-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 sm:block">
          MODULES
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
              <span className="hidden font-mono text-[10px] tracking-wider sm:block">{m.label}</span>
            </button>
          );
        })}

        {/* SOS quick triggers */}
        <div className="mb-1 mt-3 hidden px-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 sm:block">
          SOS PRESETS
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
            <span className="hidden font-mono text-[9.5px] uppercase tracking-wider sm:block">Add preset</span>
          </button>
        </div>
      </div>

      {/* Env footer */}
      <div className="border-t border-zinc-800 px-2 py-2">
        <div className="hidden font-mono text-[9px] uppercase tracking-wider text-zinc-600 sm:block">
          ENV
        </div>
        <div className="font-mono text-[9px] text-zinc-500">
          {isTelegram ? (
            <span className="text-emerald-500">TG MINI APP {user ? `· ${user.first_name || 'user'}` : ''}</span>
          ) : (
            <span className="text-zinc-600">BROWSER PREVIEW</span>
          )}
        </div>
      </div>
    </aside>
  );
}
