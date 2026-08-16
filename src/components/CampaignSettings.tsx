import { Swords, MessageSquareHeart, Map as MapIcon, Package, EyeOff, Zap, Users } from 'lucide-react';
import type { EngineMode, Settings } from '@/game/types';
import { CustomTabletopRulesField } from './CustomTabletopRulesField';

interface Props {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  engineMode?: EngineMode;
  customTabletopRules?: string;
  onCustomTabletopRulesChange?: (text: string) => void;
  kidMode?: boolean;
}

export function CampaignSettings({
  settings,
  onChange,
  engineMode,
  customTabletopRules,
  onCustomTabletopRulesChange,
  kidMode,
}: Props) {
  return (
    <div className="space-y-8">
      {engineMode === 'dnd' && onCustomTabletopRulesChange && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-crimson-500/40 bg-crimson-950/40">
              <Swords size={15} className="text-crimson-400" />
            </div>
            <h3 className="font-serif text-sm uppercase tracking-wider text-slate-200">Custom tabletop rules</h3>
          </div>
          <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4">
            <CustomTabletopRulesField
              value={customTabletopRules ?? ''}
              onChange={onCustomTabletopRulesChange}
              kidMode={kidMode}
            />
          </div>
        </section>
      )}
      <PillarsSection settings={settings} onChange={onChange} />
      <HouseRulesSection settings={settings} onChange={onChange} />
    </div>
  );
}

function PillarsSection({ settings, onChange }: Props) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-crimson-500/40 bg-crimson-950/40">
          <Swords size={15} className="text-crimson-400" />
        </div>
        <h3 className="font-serif text-sm uppercase tracking-wider text-slate-200">The Three Pillars</h3>
      </div>
      <div className="space-y-5">
        <PillarSlider
          icon={<Swords size={16} />}
          label="Combat Frequency"
          accent="crimson"
          value={settings.combatFrequency}
          onChange={(v) => onChange('combatFrequency', v)}
        />
        <PillarSlider
          icon={<MessageSquareHeart size={16} />}
          label="Social Roleplay"
          accent="emerald"
          value={settings.socialRoleplay}
          onChange={(v) => onChange('socialRoleplay', v)}
        />
        <PillarSlider
          icon={<MapIcon size={16} />}
          label="World Building / Exploration"
          accent="sky"
          value={settings.worldBuilding}
          onChange={(v) => onChange('worldBuilding', v)}
        />
      </div>
    </section>
  );
}

const ACCENTS = {
  crimson: {
    track: 'bg-crimson-950/60',
    fill: 'from-crimson-600 to-crimson-400',
    thumb: 'accent-crimson-500',
    glow: 'shadow-crimson-500/30',
    text: 'text-crimson-300',
    iconBg: 'bg-crimson-950/50 border-crimson-500/30',
    iconColor: 'text-crimson-400',
  },
  emerald: {
    track: 'bg-emerald-950/60',
    fill: 'from-emerald-600 to-emerald-400',
    thumb: 'accent-emerald-500',
    glow: 'shadow-emerald-500/30',
    text: 'text-emerald-300',
    iconBg: 'bg-emerald-950/50 border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  sky: {
    track: 'bg-sky-950/60',
    fill: 'from-sky-600 to-sky-400',
    thumb: 'accent-sky-500',
    glow: 'shadow-sky-500/30',
    text: 'text-sky-300',
    iconBg: 'bg-sky-950/50 border-sky-500/30',
    iconColor: 'text-sky-400',
  },
} as const;

type AccentName = keyof typeof ACCENTS;

function PillarSlider({
  icon,
  label,
  accent,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  accent: AccentName;
  value: number;
  onChange: (v: number) => void;
}) {
  const a = ACCENTS[accent];
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${a.iconBg}`}>
            <span className={a.iconColor}>{icon}</span>
          </div>
          <span className="text-sm font-medium text-slate-200">{label}</span>
        </div>
        <span className={`font-mono text-xs font-bold ${a.text}`}>{pct}%</span>
      </div>
      <div className="relative">
        <div className={`h-2 w-full rounded-full ${a.track}`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${a.fill} transition-all duration-150`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className={`absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent ${a.thumb} [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:${a.glow} [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white`}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

function HouseRulesSection({ settings, onChange }: Props) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-crimson-500/40 bg-crimson-950/40">
          <Swords size={15} className="text-crimson-400" />
        </div>
        <h3 className="font-serif text-sm uppercase tracking-wider text-slate-200">House Rules</h3>
      </div>
      <div className="space-y-3">
        <HouseRuleToggle
          icon={<Package size={16} />}
          label="Strict Encumbrance & Ammo Tracking"
          description="Track weight, inventory slots, and ammunition"
          checked={settings.strictEncumbrance}
          onChange={(v) => onChange('strictEncumbrance', v)}
        />
        <HouseRuleToggle
          icon={<EyeOff size={16} />}
          label="Secret Death Saves"
          description="AI rolls death saves hidden from the player"
          checked={settings.secretDeathSaves}
          onChange={(v) => onChange('secretDeathSaves', v)}
        />
        <HouseRuleToggle
          icon={<Zap size={16} />}
          label="Cleave Mechanics"
          description="Excess damage spills to adjacent enemies"
          checked={settings.cleaveMechanics}
          onChange={(v) => onChange('cleaveMechanics', v)}
        />
        <HouseRuleToggle
          icon={<Users size={16} />}
          label="Flanking Advantage"
          description="Allies on opposite sides grant advantage"
          checked={settings.flankingAdvantage}
          onChange={(v) => onChange('flankingAdvantage', v)}
        />
      </div>
    </section>
  );
}

function HouseRuleToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 text-left transition-all hover:border-slate-600 hover:bg-slate-800/70"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${checked ? 'border-crimson-500/50 bg-crimson-950/50 text-crimson-400' : 'border-slate-700 bg-slate-900/50 text-slate-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-[11px] text-slate-500">{description}</div>
      </div>
      <ToggleSwitch checked={checked} />
    </button>
  );
}

function ToggleSwitch({ checked }: { checked: boolean }) {
  return (
    <div className="relative h-6 w-11 shrink-0">
      <div
        className={`absolute inset-0 rounded-full transition-colors duration-200 ${checked ? 'bg-crimson-500' : 'bg-slate-600'}`}
      />
      <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </div>
  );
}
