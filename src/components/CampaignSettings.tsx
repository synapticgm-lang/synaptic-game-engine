import { Swords, MessageSquareHeart, Map as MapIcon, Package, EyeOff, Zap, Users } from 'lucide-react';
import type { EngineMode, Settings } from '@/game/types';
import { CustomTabletopRulesField } from './CustomTabletopRulesField';
import { settingScope } from '@/game/rules/modeProfile';

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
  const tabletop = settingScope(engineMode, (p) => p.mode === 'dnd');
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
      {tabletop.show && <PillarsSection settings={settings} onChange={onChange} modes={tabletop.modes} />}
      <HouseRulesSection settings={settings} onChange={onChange} engineMode={engineMode} />
    </div>
  );
}

function ModesNote({ modes }: { modes: string }) {
  return modes ? <p className="mb-2 text-[11px] text-slate-500">{modes}</p> : null;
}

function PillarsSection({ settings, onChange, modes }: Props & { modes: string }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-crimson-500/40 bg-crimson-950/40">
          <Swords size={15} className="text-crimson-400" />
        </div>
        <h3 className="font-serif text-sm uppercase tracking-wider text-slate-200">The Three Pillars</h3>
      </div>
      <ModesNote modes={modes} />
      <p className="mb-3 text-[11px] text-slate-500">
        Combat sets how often a quiet stretch turns into a fight and how often road meetings are hostile. Social and Exploration
        weight road meetings toward people to talk to or places and wildlife to find. 50% is the default mix.
      </p>
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

function HouseRulesSection({ settings, onChange, engineMode }: Props) {
  const story = settingScope(engineMode, (p) => p.mode !== 'dnd');
  const table = settingScope(engineMode, (p) => p.mode === 'dnd');
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-crimson-500/40 bg-crimson-950/40">
          <Swords size={15} className="text-crimson-400" />
        </div>
        <h3 className="font-serif text-sm uppercase tracking-wider text-slate-200">House Rules</h3>
      </div>
      <div className="space-y-3">
        {story.show && (
          <>
          <ModesNote modes={story.modes} />
          <HouseRuleToggle
            icon={<Package size={16} />}
            label="Strict Encumbrance"
            description="Inventory slots are a hard limit: a full pack blocks new items"
            checked={settings.strictEncumbrance}
            onChange={(v) => onChange('strictEncumbrance', v)}
          />
          </>
        )}
        {table.show && (
          <>
            <ModesNote modes={table.modes} />
            {TABLE_RULES.map((r) => (
              <TableRuleSelect key={r.key} rule={r} value={tableRuleValue(settings, r)} onChange={(v) => onChange(r.key, r.parse(v) as never)} />
            ))}
            <HouseRuleToggle
              icon={<Zap size={16} />}
              label="Heroic Inspiration"
              description="Earned by Humans after a Long Rest and by finishing a quest; spend it to reroll a missed attack, a failed save or a failed death save (5.1: Advantage on your next attack or save)"
              checked={settings.ttHeroicInspiration !== false}
              onChange={(v) => onChange('ttHeroicInspiration', v)}
            />
            <HouseRuleToggle
              icon={<Users size={16} />}
              label="Solo Scaling"
              description="Fighting alone (no sidekick or ally): one foe at level 1, at most four later, foe HP and damage ×0.75 and no knock-down or poison riders"
              checked={settings.ttSoloScaling === true}
              onChange={(v) => onChange('ttSoloScaling', v)}
            />
            <HouseRuleToggle
              icon={<EyeOff size={16} />}
              label="Secret Death Saves"
              description="Death save rolls stay hidden; you only see when you wake, stabilise or die"
              checked={settings.secretDeathSaves}
              onChange={(v) => onChange('secretDeathSaves', v)}
            />
            <HouseRuleToggle
              icon={<Zap size={16} />}
              label="Cleave Mechanics"
              description="A melee blow that drops a foe carries its leftover damage into the next foe the same roll would hit"
              checked={settings.cleaveMechanics}
              onChange={(v) => onChange('cleaveMechanics', v)}
            />
            <HouseRuleToggle
              icon={<Users size={16} />}
              label="Flanking Advantage"
              description="Melee attacks have advantage with an ally beside you; two or more foes get it against you"
              checked={settings.flankingAdvantage}
              onChange={(v) => onChange('flankingAdvantage', v)}
            />
          </>
        )}
      </div>
    </section>
  );
}

interface TableRule {
  key: keyof Settings;
  label: string;
  description: string;
  options: Array<[string, string]>;
  fallback: string;
  parse: (v: string) => Settings[keyof Settings];
}

const asText = (v: string) => v as Settings[keyof Settings];

/** Tabletop table rules (Settings → House Rules). The engine reads them through rules/houseRules. */
const TABLE_RULES: TableRule[] = [
  { key: 'ttRulesVersion', label: 'Rules version', description: 'Which SRD the table plays (Heroic Inspiration and Human differ)', options: [['srd-5.2.1', 'SRD 5.2.1'], ['srd-5.1', 'SRD 5.1']], fallback: 'srd-5.2.1', parse: asText },
  { key: 'ttStatMethod', label: 'Ability scores', description: 'How a new character sets abilities (also used by quick start and ready-made characters)', options: [['choose', 'Player chooses'], ['point-buy', 'Point buy'], ['standard-array', 'Standard array'], ['4d6', 'Roll 4d6, drop the lowest']], fallback: 'choose', parse: asText },
  { key: 'ttStartingLevel', label: 'Starting level', description: 'A new character starts at this level (fixed HP per level)', options: [['1', 'Level 1'], ['2', 'Level 2'], ['3', 'Level 3'], ['4', 'Level 4'], ['5', 'Level 5']], fallback: '1', parse: (v) => Number(v) as Settings[keyof Settings] },
  { key: 'ttDiceVisibility', label: 'Dice', description: 'Open: every roll on STATUS. Hidden: foe rolls stay behind the screen; you see hits and damage', options: [['open', 'All rolls open'], ['hidden', 'GM rolls hidden']], fallback: 'open', parse: asText },
  { key: 'ttEncounterDifficulty', label: 'Encounter difficulty', description: 'Foe HP and attack bonus; Deadly adds a foe to any group', options: [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard'], ['deadly', 'Deadly']], fallback: 'normal', parse: asText },
  { key: 'ttSidekick', label: 'Sidekick', description: 'A companion who fights beside you, levels with you and takes no XP share (joins when your character is made)', options: [['none', 'None'], ['warrior', 'Warrior'], ['expert', 'Expert'], ['spellcaster', 'Spellcaster']], fallback: 'none', parse: asText },
  { key: 'ttDeathRule', label: 'Death', description: 'SRD: three failed death saves and you die. Revive: Revivify for up to 300 GP of your coin. Mercy: you wake hours later, robbed', options: [['srd', 'SRD (death is final)'], ['revive', 'Revivify for coin'], ['mercy', 'Left for dead']], fallback: 'srd', parse: asText },
  { key: 'ttRestVariant', label: 'Rests', description: 'Standard: 1 hour short, 8 hours long. Gritty: 8 hours and 7 days. Heroic: 5 minutes and 1 hour', options: [['standard', 'Standard'], ['gritty', 'Gritty realism'], ['heroic', 'Epic heroism']], fallback: 'standard', parse: asText },
  { key: 'ttEncumbrance', label: 'Encumbrance', description: 'Capacity: Strength × 15 lb and ammo spent per shot. Variant: also slower over Strength × 5 lb, Disadvantage over × 10', options: [['off', 'Off'], ['capacity', 'Carrying capacity'], ['variant', 'Variant encumbrance']], fallback: 'off', parse: asText },
  { key: 'ttTravelPace', label: 'Travel pace', description: 'Fast: 4 miles an hour, Disadvantage on Perception, Survival and Stealth on the road. Normal: 3, Disadvantage on Stealth. Slow: 2, Advantage on Perception and Survival', options: [['fast', 'Fast'], ['normal', 'Normal'], ['slow', 'Slow']], fallback: 'normal', parse: asText },
  { key: 'ttCritRule', label: 'Critical hits', description: 'Double the damage dice (SRD), max the dice and roll them again, or double the whole total', options: [['double-dice', 'Double dice (SRD)'], ['max-plus-roll', 'Max dice + roll'], ['double-total', 'Double the total']], fallback: 'double-dice', parse: asText },
];

/** The table rules settled at session zero (start level, abilities, danger, death, rests). Same rows as House Rules. */
const SESSION_ZERO_KEYS: Array<keyof Settings> = ['ttStartingLevel', 'ttStatMethod', 'ttEncounterDifficulty', 'ttDeathRule', 'ttRestVariant'];

export function SessionZeroRules({ settings, onChange }: Pick<Props, 'settings' | 'onChange'>) {
  return (
    <div className="space-y-2">
      {TABLE_RULES.filter((r) => SESSION_ZERO_KEYS.includes(r.key)).map((r) => (
        <TableRuleSelect key={r.key} rule={r} value={tableRuleValue(settings, r)} onChange={(v) => onChange(r.key, r.parse(v) as never)} />
      ))}
    </div>
  );
}

function tableRuleValue(settings: Settings, r: TableRule): string {
  const v = settings[r.key];
  if (r.key === 'ttEncumbrance' && v === undefined) return settings.strictEncumbrance ? 'capacity' : 'off';
  return v === undefined || v === null ? r.fallback : String(v);
}

function TableRuleSelect({ rule, value, onChange }: { rule: TableRule; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex w-full items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 text-left">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200">{rule.label}</div>
        <div className="text-[11px] text-slate-500">{rule.description}</div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="shrink-0 rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
        data-testid={`table-rule-${rule.key}`}
      >
        {rule.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
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
