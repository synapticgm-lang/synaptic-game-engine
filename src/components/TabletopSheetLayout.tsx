import type { DerivedSheet } from '@/game/tabletop/characterBuild';
import { ABILITY_KEYS, abilityMod, fmtMod } from '@/game/tabletop/characterBuild';

const ABILITY_NAME: Record<string, string> = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};

/**
 * One character sheet laid out like an open 5e-style sheet (SRD 5.2.1 fields, CC-BY-4.0): abilities with saves down
 * the side, the combat strip, skills, then features. Every number comes from the engine's `DerivedSheet`; the
 * equipped theme styles every box. Used by the builder page, saved sheets and the in-game Tabletop Sheet tab.
 */
export function TabletopSheetLayout({
  name,
  sheet,
  hp,
  hpMethod,
  kit,
  concentration,
  footer,
}: {
  name: string;
  sheet: DerivedSheet;
  /** Current HP in play; omitted before play (shows max). */
  hp?: number;
  hpMethod?: 'fixed' | 'roll';
  kit?: string[];
  concentration?: string | null;
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-3 text-sm" data-testid="tabletop-sheet-layout">
      <div className="sgm-sheet-box-strong flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 py-2">
        <div className="sgm-info-heading text-base font-bold">{name}</div>
        <div className="sgm-sheet-label text-xs">{sheet.title}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ABILITY_KEYS.map((k) => {
          const save = sheet.saves.find((s) => s.key === k)!;
          return (
            <div key={k} className="sgm-sheet-box flex flex-col items-center px-1 py-2 text-center" data-testid={`sheet-ability-${k}`}>
              <span className="sgm-sheet-label text-[9px] uppercase tracking-wider">{ABILITY_NAME[k]}</span>
              <span className="sgm-sheet-mod font-mono text-lg font-black leading-tight">{fmtMod(abilityMod(sheet.scores[k]))}</span>
              <span className="sgm-sheet-value font-mono text-xs">{sheet.scores[k]}</span>
              <span className={`mt-1 font-mono text-[10px] ${save.proficient ? 'sgm-sheet-prof' : 'sgm-sheet-label'}`} title="Saving throw">
                {save.proficient ? '●' : '○'} save {fmtMod(save.total)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="Armor Class" value={String(sheet.ac)} title={sheet.acFrom} />
        <Stat label="Hit Points" value={hp != null ? `${hp}/${sheet.maxHp}` : String(sheet.maxHp)} title={sheet.hpLine} />
        <Stat label="Initiative" value={fmtMod(sheet.initiative)} />
        <Stat label="Speed" value={`${sheet.speed} ft`} />
        <Stat label="Proficiency" value={fmtMod(sheet.pb)} />
        <Stat label="Passive Perc." value={String(sheet.passivePerception)} />
      </div>
      <p className="sgm-sheet-label text-[11px]">
        HP {sheet.hpLine}{hpMethod ? ` · ${hpMethod === 'roll' ? 'rolled' : 'fixed'} HP at each new level` : ''} · Hit Die d{sheet.hitDie} · {sheet.size}
        {sheet.darkvision ? ` · Darkvision ${sheet.darkvision} ft` : ''}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sgm-sheet-box px-3 py-2">
          <h4 className="sgm-info-heading mb-1 text-xs uppercase tracking-wider">Skills</h4>
          <ul className="space-y-0.5 text-xs">
            {sheet.skills.map((s) => (
              <li key={s.skill} className="flex justify-between">
                <span className={s.proficient ? 'sgm-sheet-value' : 'sgm-sheet-label'}>{s.expertise ? '◆ ' : s.proficient ? '● ' : '○ '}{s.skill}</span>
                <span className={`font-mono ${s.proficient ? 'sgm-sheet-prof' : 'sgm-sheet-label'}`}>{fmtMod(s.total)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 text-xs">
          <Block title="Class features" lines={sheet.features} />
          {sheet.masteries && <Block title="Weapon Mastery" lines={sheet.masteries.map((m) => `${m.weapon} (${m.mastery})`)} />}
          <Block title="Origin feat" lines={sheet.originFeats} />
          <Block title="Species traits" lines={sheet.traits} />
          <Block title="Languages" lines={[sheet.languages.join(', ')]} />
          {kit && kit.length > 0 && <Block title="Equipment" lines={[kit.join(', ')]} />}
        </div>
      </div>

      {sheet.spellcasting && (
        <div className="sgm-sheet-box space-y-1 px-3 py-2 text-xs" data-testid="sheet-spellcasting">
          <h4 className="sgm-info-heading text-xs uppercase tracking-wider">Spellcasting ({sheet.spellcasting.ability})</h4>
          <p>Spell save DC <b className="sgm-sheet-prof">{sheet.spellcasting.dc}</b> · Spell attack <b className="sgm-sheet-prof">{fmtMod(sheet.spellcasting.attack)}</b></p>
          <p><span className="sgm-sheet-label">Slots: </span>{sheet.spellcasting.slots.map((s) => `level ${s.level} ${s.left}/${s.total}`).join(' · ')}</p>
          <p><span className="sgm-sheet-label">Cantrips: </span>{sheet.spellcasting.cantrips.join(', ')}</p>
          <p><span className="sgm-sheet-label">Prepared: </span>{sheet.spellcasting.prepared.join(', ')}</p>
          {sheet.spellcasting.spellbook.length > 0 && <p><span className="sgm-sheet-label">Spellbook: </span>{sheet.spellcasting.spellbook.join(', ')}</p>}
          {concentration && <p><span className="sgm-sheet-label">Concentrating on: </span>{concentration}</p>}
        </div>
      )}

      {footer}
      <p className="sgm-sheet-label text-[10px]">Rules from the System Reference Document 5.2.1, CC-BY-4.0.</p>
    </div>
  );
}

function Stat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="sgm-sheet-box flex flex-col items-center px-1 py-1.5 text-center" title={title}>
      <span className="sgm-sheet-value font-mono text-base font-bold">{value}</span>
      <span className="sgm-sheet-label text-[9px] uppercase tracking-wider">{label}</span>
    </div>
  );
}

function Block({ title, lines }: { title: string; lines: string[] }) {
  if (!lines.length || lines.every((l) => !l)) return null;
  return (
    <div className="sgm-sheet-box px-3 py-1.5">
      <span className="sgm-sheet-label text-[10px] uppercase tracking-wider">{title}: </span>
      <span className="sgm-sheet-value">{lines.join('; ')}</span>
    </div>
  );
}
