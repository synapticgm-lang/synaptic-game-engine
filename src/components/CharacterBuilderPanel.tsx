import { useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Attributes } from '@/game/types';
import {
  ABILITY_KEYS,
  BACKGROUNDS,
  CLASSES,
  CLASS_KITS,
  POINT_BUY_BUDGET,
  SPECIES,
  STANDARD_ARRAY,
  pointBuyCost,
  rollLines,
  scoresForMethod,
  assignByPriority,
  rollTotal,
  type AbilityMethod,
  type TabletopPicks,
} from '@/game/tabletop/characterBuild';
import { sheetLabel, validateSheet, type SavedSheet } from '@/game/tabletop/sheetLibrary';
import { keepSheet } from '@/game/tabletop/sheetLibrarySync';
import { previewSheet } from '@/game/tabletop/sheetPreview';
import { TabletopSheetLayout } from './TabletopSheetLayout';

type ClassId = NonNullable<TabletopPicks['classId']>;
type KitId = NonNullable<TabletopPicks['kitId']>;

interface Draft {
  name: string;
  classId: ClassId;
  speciesId: NonNullable<TabletopPicks['speciesId']>;
  backgroundId: NonNullable<TabletopPicks['backgroundId']>;
  method: AbilityMethod;
  baseScores: Attributes;
  rolls?: number[][];
  kitId: KitId;
  hpMethod: 'fixed' | 'roll';
}

const METHOD_LABEL: Record<AbilityMethod, string> = {
  'point-buy': 'Point buy (27 points)',
  'standard-array': 'Standard array',
  '4d6': 'Roll 4d6, drop the lowest',
};

const mathRng = () => Math.random();

function draftFrom(sheet: SavedSheet | null | undefined, fixedMethod: AbilityMethod | null, rng: () => number): Draft {
  if (sheet) {
    return { name: sheet.name, ...sheet.picks, hpMethod: sheet.hpMethod ?? 'fixed' };
  }
  const classId = CLASSES[0].id;
  const method = fixedMethod ?? 'standard-array';
  return {
    name: '',
    classId,
    speciesId: SPECIES[0].id,
    backgroundId: BACKGROUNDS[0].id,
    method,
    ...scoresForMethod(method, classId, rng),
    kitId: 'A',
    hpMethod: 'fixed',
  };
}

/**
 * The tabletop character builder page. It edits the same SRD picks as the inn-book chips and the saved-sheet
 * library, checks them with the same validator, and shows every number from the engine (sheetPreview). Saving
 * writes a library sheet; "Play this character" hands the sheet to the inn book's confirm page.
 */
export function CharacterBuilderPanel({
  initial,
  fixedMethod = null,
  onUse,
  onSaved,
  onClose,
  saveDice,
}: {
  initial?: SavedSheet | null;
  /** The table's stat method (Settings → Table rules); null lets the player choose. */
  fixedMethod?: AbilityMethod | null;
  onUse?: (sheet: SavedSheet) => void;
  onSaved?: (list: SavedSheet[], sheet: SavedSheet) => void;
  onClose: () => void;
  /** In play: the save's own creation dice, so 4d6 here rolls what the inn book rolls, once. */
  saveDice?: () => number;
}) {
  const [rng] = useState(() => saveDice ?? mathRng);
  const [d, setD] = useState<Draft>(() => draftFrom(initial, fixedMethod, rng));
  const keptRolls = useRef<number[][] | null>(saveDice && d.method === '4d6' ? d.rolls ?? null : null);
  const rolledOnce = !!saveDice && d.method === '4d6';
  const [note, setNote] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  const raw = useMemo(() => ({
    name: d.name.trim() || 'Adventurer',
    hpMethod: d.hpMethod,
    picks: { classId: d.classId, speciesId: d.speciesId, backgroundId: d.backgroundId, method: d.method, baseScores: d.baseScores, kitId: d.kitId, ...(d.rolls ? { rolls: d.rolls } : {}) },
  }), [d]);
  const result = useMemo(() => previewSheet(raw), [raw]);
  const cost = d.method === 'point-buy' ? pointBuyCost(d.baseScores) : null;

  const layOut = (method: AbilityMethod, classId: ClassId = d.classId) => {
    let next = scoresForMethod(method, classId, rng);
    if (saveDice && method === '4d6') {
      const rolls = keptRolls.current ?? next.rolls!;
      keptRolls.current = rolls;
      next = { baseScores: assignByPriority(rolls.map(rollTotal), classId), rolls };
    }
    setD((prev) => ({ ...prev, method, classId, baseScores: next.baseScores, rolls: next.rolls }));
  };
  const setScore = (k: keyof Attributes, v: number) => setD((prev) => ({ ...prev, baseScores: { ...prev.baseScores, [k]: v } }));
  const checked = (): SavedSheet | null => {
    const c = validateSheet({ ...raw, ...(initial?.id ? { id: initial.id } : {}) });
    return c.ok ? c.sheet : null;
  };

  const save = () => {
    const sheet = checked();
    if (!sheet) return;
    const list = keepSheet(sheet);
    setNote(`${sheetLabel(sheet)} saved to your sheets.`);
    onSaved?.(list, sheet);
  };

  const kits = CLASS_KITS[d.classId];
  const kitText = (id: KitId) => {
    const k = kits.find((x) => x.id === id) ?? kits[0];
    return k.gear.length ? `${k.label}: ${k.gear.map((g) => (g.qty ? `${g.name} ×${g.qty}` : g.name)).join(', ')}, ${k.gp} GP` : `${k.gp} GP`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4" data-testid="character-builder">
      <div className="sgm-turn-frame sgm-info-panel relative flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden shadow-2xl sm:h-[90vh] sm:rounded-xl sm:border">
        <div className="sgm-turn-frame-bar h-1 w-full shrink-0" />
        <div className="sgm-frame-header flex shrink-0 items-center justify-between border-b border-slate-800/80 px-4 py-3">
          <h2 className="sgm-info-heading text-lg font-bold">Character builder</h2>
          <button type="button" onClick={onClose} className="sgm-sheet-label rounded p-1.5" title="Close" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[18rem_1fr]">
          <div className="space-y-3 text-xs">
            <Field label="Name">
              <input value={d.name} maxLength={40} onChange={(e) => set('name', e.target.value)} className="sgm-sheet-input w-full px-2 py-1" data-testid="builder-name" />
            </Field>
            <Field label="Class">
              <select value={d.classId} onChange={(e) => { const c = e.target.value as ClassId; setD((p) => ({ ...p, classId: c, kitId: 'A' })); if (d.method === 'standard-array' || rolledOnce) layOut(d.method, c); }} className="sgm-sheet-input w-full px-2 py-1" data-testid="builder-class">
                {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <p className="sgm-sheet-label mt-1">{CLASSES.find((c) => c.id === d.classId)?.blurb}</p>
            </Field>
            <Field label="Species">
              <select value={d.speciesId} onChange={(e) => set('speciesId', e.target.value as Draft['speciesId'])} className="sgm-sheet-input w-full px-2 py-1" data-testid="builder-species">
                {SPECIES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Background">
              <select value={d.backgroundId} onChange={(e) => set('backgroundId', e.target.value as Draft['backgroundId'])} className="sgm-sheet-input w-full px-2 py-1" data-testid="builder-background">
                {BACKGROUNDS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <p className="sgm-sheet-label mt-1">{(() => { const b = BACKGROUNDS.find((x) => x.id === d.backgroundId)!; return `${b.skills.join(' and ')}; ${b.tool}; feat ${b.feat}; +2/+1 among ${b.abilities.join('/')}.`; })()}</p>
            </Field>
            <Field label="Ability scores">
              <select
                value={d.method}
                disabled={!!fixedMethod}
                onChange={(e) => layOut(e.target.value as AbilityMethod)}
                className="sgm-sheet-input w-full px-2 py-1"
                data-testid="builder-method"
              >
                {(Object.keys(METHOD_LABEL) as AbilityMethod[]).map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
              </select>
              {fixedMethod && <p className="sgm-sheet-label mt-1">This table sets abilities by {METHOD_LABEL[fixedMethod].toLowerCase()}.</p>}
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {ABILITY_KEYS.map((k) => (
                  <label key={k} className="flex items-center gap-1">
                    <span className="sgm-sheet-label w-7">{k}</span>
                    <input
                      type="number"
                      min={3}
                      max={18}
                      value={d.baseScores[k]}
                      onChange={(e) => setScore(k, Number(e.target.value))}
                      readOnly={rolledOnce}
                      className="sgm-sheet-input w-full px-1 py-0.5 font-mono"
                      data-testid={`builder-score-${k}`}
                    />
                  </label>
                ))}
              </div>
              <p className="sgm-sheet-label mt-1">
                {d.method === 'point-buy' && `${cost ?? '—'} of ${POINT_BUY_BUDGET} points; each score 8–15.`}
                {d.method === 'standard-array' && `Use ${STANDARD_ARRAY.join(', ')} once each.`}
                {d.method === '4d6' && 'Arrange the rolled totals; the dice stay on the record.'}
                {' '}Your background adds its bonus on top.
              </p>
              <button type="button" onClick={() => layOut(d.method)} disabled={rolledOnce} className="sgm-sheet-btn mt-1 px-2 py-1 disabled:opacity-50" data-testid="builder-layout">
                {d.method === '4d6' ? (rolledOnce ? 'Rolled for this game' : 'Roll 4d6 in the open') : 'Lay out for my class'}
              </button>
              {d.method === '4d6' && d.rolls && (
                <ul className="sgm-sheet-label mt-1 font-mono text-[10px]">{rollLines(d.rolls).map((l) => <li key={l}>{l}</li>)}</ul>
              )}
            </Field>
            <Field label="Starting kit">
              <select value={d.kitId} onChange={(e) => set('kitId', e.target.value as KitId)} className="sgm-sheet-input w-full px-2 py-1" data-testid="builder-kit">
                {kits.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
              <p className="sgm-sheet-label mt-1">{kitText(d.kitId)}</p>
            </Field>
            <Field label="HP at each new level">
              <select value={d.hpMethod} onChange={(e) => set('hpMethod', e.target.value as Draft['hpMethod'])} className="sgm-sheet-input w-full px-2 py-1">
                <option value="fixed">Take the fixed value</option>
                <option value="roll">Roll the Hit Die</option>
              </select>
            </Field>
          </div>

          <div className="min-w-0">
            {result.ok ? (
              <TabletopSheetLayout
                name={raw.name}
                sheet={result.preview.sheet}
                hpMethod={d.hpMethod}
                kit={(result.preview.state.inventory ?? []).filter((i) => i.provenance?.endsWith('starting equipment')).map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name))}
                footer={result.preview.corrections.length ? <ul className="sgm-sheet-label list-disc pl-4 text-[11px]">{result.preview.corrections.map((c) => <li key={c}>{c}</li>)}</ul> : null}
              />
            ) : (
              <ul className="list-disc space-y-1 pl-4 text-xs text-amber-300" data-testid="builder-problems">
                {result.problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-800/80 px-4 py-3 text-xs">
          <button type="button" disabled={!result.ok} onClick={save} className="sgm-sheet-btn px-3 py-1.5" data-testid="builder-save">Save to my sheets</button>
          {onUse && (
            <button type="button" disabled={!result.ok} onClick={() => { const s = checked(); if (s) onUse(s); }} className="sgm-sheet-btn px-3 py-1.5 font-bold" data-testid="builder-use">
              Play this character
            </button>
          )}
          {note && <span className="text-emerald-300">{note}</span>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sgm-sheet-box px-3 py-2">
      <div className="sgm-info-heading mb-1 text-[11px] uppercase tracking-wider">{label}</div>
      {children}
    </div>
  );
}
