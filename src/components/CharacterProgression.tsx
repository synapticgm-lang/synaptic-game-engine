import { useMemo } from 'react';
import type { GameState, AttributeKey } from '@/game/types';
import { RARITY_COLORS } from '@/game/types';
import { deriveTabletopSheet } from '@/game/tabletop/characterBuild';
import { attunedItems as attunedFromLedger } from '@/game/rules/magicItems';
import { Sparkles, ScrollText, Shield, Zap, Star } from 'lucide-react';

interface Props {
  state: GameState;
}

/** Progress follows the save's mode and only shows the save's own numbers. */
export function CharacterProgression({ state }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4">
      {state.engineMode === 'dnd' ? <DndMode state={state} /> : <StatusMode state={state} />}
    </div>
  );
}

/* ============ TABLETOP FANTASY ============ */

function DndMode({ state }: { state: GameState }) {
  const c = state.character;

  const attunedItems = useMemo(
    () => (c.srd
      ? attunedFromLedger(state.inventory)
      : state.inventory.filter((it) => it.equipped && (it.rarity === 'Rare' || it.rarity === 'Epic' || it.rarity === 'Legendary')).slice(0, 3)),
    [state.inventory, c.srd],
  );
  const sheet = state.engineMode === 'dnd' ? deriveTabletopSheet(state) : null;
  const casting = sheet?.spellcasting;

  return (
    <div className="space-y-5">
      {/* Tabletop: the save's own slots, one source with the sheet and the fight engine. */}
      {casting && <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Sparkles size={13} />
          Spell Slots
        </h3>
        <div className="space-y-1.5">
          {casting.slots.map((slot) => (
            <div key={slot.level} className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2">
              <span className="font-serif text-sm font-bold text-slate-200">L{slot.level}</span>
              <div className="flex gap-1">
                {Array.from({ length: slot.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-full border transition-all ${
                      i < slot.left
                        ? 'border-cyan-400 bg-cyan-500/30 shadow-sm shadow-cyan-500/30'
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-auto font-mono text-xs text-slate-400">{slot.left}/{slot.total}</span>
            </div>
          ))}
          <p className="text-[11px] text-slate-400">Spell save DC {casting.dc} · spell attack {casting.attack >= 0 ? '+' : ''}{casting.attack} · a long rest restores every slot</p>
        </div>
      </section>}


      {/* Attunement */}
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Shield size={13} />
          Attunement ({attunedItems.length}/3)
        </h3>
        <div className="space-y-1.5">
          {attunedItems.length === 0 ? (
            <div className="rounded-md border border-slate-700 bg-slate-800/30 py-3 text-center text-xs italic text-slate-600">
              {c.srd ? 'No items attuned. Type "attune to" an item that requires attunement.' : 'No items attuned. Rare or higher items require attunement.'}
            </div>
          ) : (
            attunedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2">
                <Star size={13} style={{ color: RARITY_COLORS[item.rarity] }} />
                <span className="text-sm text-slate-200">{item.name}</span>
                <span className="ml-auto text-[10px] uppercase text-slate-500">{item.rarity}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Character Class Info */}
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <ScrollText size={13} />
          Class Features
        </h3>
        <div className="rounded-md border border-slate-700 bg-slate-800/40 p-3 text-xs text-slate-300">
          <div className="mb-1 flex justify-between">
            <span className="text-slate-500">Class</span>
            <span className="font-medium text-slate-200">{sheet ? sheet.title : state.campaignArchetype ?? 'Adventurer'}</span>
          </div>
          <div className="mb-1 flex justify-between">
            <span className="text-slate-500">Level</span>
            <span className="font-mono text-slate-200">{c.level}</span>
          </div>
          <div className="mb-1 flex justify-between">
            <span className="text-slate-500">Armor Class</span>
            <span className="font-mono text-slate-200">{sheet ? sheet.ac : c.armorClass ?? 10}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Conditions</span>
            <span className="text-slate-200">{c.conditions.length > 0 ? c.conditions.join(', ') : 'None'}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============ LITRPG / STORY RPG ============ */

const SKILL_LABELS: Record<string, string> = {
  athletics: 'Athletics', perception: 'Perception', investigation: 'Investigation', stealth: 'Stealth',
  thievery: 'Thievery', persuasion: 'Persuasion', arcana: 'Arcana', survival: 'Survival',
};

function StatusMode({ state }: { state: GameState }) {
  const c = state.character;
  const attrs = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AttributeKey[])
    .map((k) => ({ label: k, value: c.attributes?.[k] }))
    .filter((s): s is { label: AttributeKey; value: number } => typeof s.value === 'number');
  const skills = Object.entries(c.skills ?? {}).filter(([, v]) => typeof v === 'number') as [string, number][];

  return (
    <div className="space-y-5">
      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <Zap size={13} />
          Attributes
        </h3>
        {attrs.length === 0 ? (
          <div className="rounded-md border border-slate-700 bg-slate-800/30 py-3 text-center text-xs italic text-slate-500">No attributes on this save yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {attrs.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between rounded-md border border-slate-700 bg-slate-800/40 p-2.5">
                <span className="text-[10px] uppercase text-slate-500">{s.label}</span>
                <span className="font-mono text-sm font-bold text-slate-100">{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {skills.length > 0 && (
        <section>
          <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Sparkles size={13} />
            Skills
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {skills.map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between rounded-md border border-slate-700 bg-slate-800/40 p-2.5">
                <span className="text-[11px] text-slate-400">{SKILL_LABELS[key] ?? key}</span>
                <span className="font-mono text-sm font-bold text-slate-100">{value >= 0 ? '+' : ''}{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="sgm-info-heading mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <ScrollText size={13} />
          Level
        </h3>
        <div className="rounded-md border border-slate-700 bg-slate-800/40 p-3 text-xs text-slate-300">
          <div className="mb-1 flex justify-between"><span className="text-slate-500">Level</span><span className="font-mono text-slate-200">{c.level}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">XP</span><span className="font-mono text-slate-200">{c.xp} / {c.xpToNext}</span></div>
        </div>
      </section>
    </div>
  );
}
